import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { loadPlanner } from './helpers/planner-harness.mjs';

const source = fs.readFileSync(new URL('../src/index.template.html', import.meta.url), 'utf8');

function assertPreviewMatchesPdfRaster(h, label) {
  const item = h.app.viewItems()[h.app.state.viewIndex];
  const specs = h.app.pageSpecsForItem(item, h.app.state.viewIndex);
  const holders = h.get('previewPages').querySelectorAll('.sheet-holder');
  assert.equal(holders.length, specs.length, `${label}: expected physical page count`);
  holders.forEach((holder, index) => {
    const canvas = holder.querySelector('canvas');
    assert.ok(canvas, `${label}: every page uses a raster canvas`);
    assert.equal(canvas.className, 'spread-preview-canvas');
    assert.equal(canvas.attributes.role, 'img');
    assert.ok(canvas.attributes['aria-label'].includes(h.get('navMonthLabel').textContent), `${label}: accessible label identifies selected period`);
    const widthMm = Number(holder.querySelector('.sheet').dataset.pageWidth);
    const heightMm = Number(holder.querySelector('.sheet').dataset.pageHeight);
    const pdfCanvas = h.app.renderPageSpecCanvas(specs[index], widthMm, heightMm, 180);
    assert.equal(canvas.width, pdfCanvas.width, `${label}: PDF-resolution preview width`);
    assert.equal(canvas.height, pdfCanvas.height, `${label}: PDF-resolution preview height`);
    assert.deepEqual(JSON.parse(JSON.stringify(canvas.getContext('2d').calls)),
      JSON.parse(JSON.stringify(pdfCanvas.getContext('2d').calls)),
      `${label}: preview and PDF have identical drawing operations`);
  });
}

test('all dated and undated layouts preview the exact PDF artwork', async () => {
  for (const language of ['ja', 'en']) {
    const h = loadPlanner(undefined, { language });
    for (const [type, layout] of [
      ['monthly', 'monthly-single'], ['monthly', 'monthly-spread'],
      ['yearly', 'year-single'], ['yearly', 'year-spread'],
      ['weekly', 'weekly-block'], ['weekly', 'weekly-notes'],
      ['weekly', 'weekly-vertical'], ['daily', 'daily'],
      ['notes', 'notes-lined'], ['notes', 'notes-grid'], ['notes', 'notes-dot']
    ]) {
      await h.radio('refillType', type);
      if (type !== 'daily') await h.radio('layout', layout);
      assertPreviewMatchesPdfRaster(h, `${language}/${layout}/dated`);
      if (['monthly', 'weekly', 'daily'].includes(type)) {
        await h.radio('dateMode', 'undated');
        assertPreviewMatchesPdfRaster(h, `${language}/${layout}/undated`);
        await h.radio('dateMode', 'dated');
      }
    }
    assert.equal(h.errors.length, 0, `${language}: no preview errors`);
  }
});

function fontSize(call) {
  const result = /([0-9.]+)px/.exec(call?.font || '');
  assert.ok(result, 'font size is recorded with draw operation');
  return Number(result[1]);
}

test('yearly month names, weekdays and numbers fit their rows at maximum text size', () => {
  for (const size of ['micro5', 'mini6', 'bible', 'a5']) for (const orientation of ['portrait', 'landscape']) for (const language of ['ja', 'en']) {
    const h = loadPlanner(undefined, { language });
    h.app.setPreset(size);
    h.app.state.fontSize = 'xxlarge';
    h.app.state.orientation = orientation;
    const { baseWidth, baseHeight } = h.app.state;
    const [width, height] = orientation === 'portrait' ? [baseWidth, baseHeight] : [baseHeight, baseWidth];
    for (const months of [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [1, 2, 3, 4, 5, 6]]) {
      const canvas = h.app.renderPageSpecCanvas({ kind: 'yearly', year: 2027, months, side: 'left' }, width, height, 180);
      const calls = canvas.getContext('2d').calls.filter(call => call[0] === 'fillText');
      const title = language === 'ja' ? '1月' : 'Jan';
      const index = calls.findIndex(call => call[1] === title);
      const label = `${size}/${orientation}/${language}/${months.length}`;
      assert.ok(index >= 0, `${label}: January month title exists`);
      const titleCall = calls[index], weekdayCall = calls[index + 1], dayCall = calls[index + 8];
      const pxWidth = canvas.width, pxHeight = canvas.height;
      const margin = h.app.state.stylePreset === 'compact' ? .04 : h.app.state.stylePreset === 'minimal' ? .055 : .052;
      const innerHeight = pxHeight * (1 - 2 * margin);
      const titleLine = pxHeight * margin + innerHeight * .078;
      const top = titleLine + innerHeight * .035, bottom = pxHeight * margin + innerHeight;
      const rows = months.length === 6 ? 3 : 4;
      const gapY = (bottom - top) * .028, boxHeight = (bottom - top - gapY * (rows - 1)) / rows;
      const rowHeight = boxHeight * .78 / 6;
      const titleSize = fontSize(titleCall), weekdaySize = fontSize(weekdayCall), daySize = fontSize(dayCall);
      assert.ok(titleSize <= boxHeight * .09 + .02, `${label}: month title fits header`);
      assert.ok(weekdaySize <= boxHeight * .07 + .02, `${label}: weekday fits header`);
      assert.ok(daySize <= rowHeight * .56 + .02, `${label}: day number fits calendar row`);
      assert.ok(titleCall[3] + titleSize < weekdayCall[3] - weekdaySize / 2,
        `${label}: month title and weekday label do not overlap`);
      assert.ok(weekdayCall[3] + weekdaySize / 2 < top + boxHeight * .22,
        `${label}: weekday label does not run into the calendar grid`);
    }
  }
});

test('preview stage has a definite height at all breakpoints to prevent resize feedback', () => {
  assert.match(source, /\.preview-stage\s*\{\s*height:590px;min-height:0;/);
  assert.match(source, /@media\s*\(max-width:900px\)[\s\S]*?\.preview-stage\s*\{\s*height:420px;min-height:0;/);
  assert.match(source, /\.preview-stage\s*\{\s*height:clamp\(350px,42vh,420px\);min-height:0;max-height:none;/);
  assert.match(source, /\.preview-stage\s*\{\s*max-height:none;min-height:0;/);
  assert.match(source, /const page = renderPageSpecCanvas\(spec, dimensions.width, dimensions.height, 180\);/,
    'print-sheet previews retain PDF typography even when the composite canvas is low resolution');
});
