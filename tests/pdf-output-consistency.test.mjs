import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPlanner } from './helpers/planner-harness.mjs';

async function monthly() {
  const h = loadPlanner();
  await h.input('startMonth', '2026-10'); await h.input('endMonth', '2026-11');
  await h.run(() => h.app.createPdf());
  assert.equal(h.app.generatedPdf.pageCount, 2);
  return h;
}

test('blank date drafts invalidate generated output and block create/save until repaired', async () => {
  const h = await monthly();
  await h.input('pdfFilename', 'October-planner');
  await h.input('startMonth', '');
  assert.equal(h.app.state.startMonth, '2026-10', 'last valid preview state is retained');
  assert.equal(h.get('generatePdfButton').disabled, true);
  assert.equal(h.get('savePdfButton').disabled, true);
  assert.equal(h.app.generatedPdf.blob, null);
  await h.run(() => h.app.createPdf()); h.app.saveGeneratedPdf();
  assert.equal(h.app.generatedPdf.blob, null); assert.equal(h.downloads.length, 0);
  await h.input('startMonth', '2026-10');
  assert.equal(h.get('generatePdfButton').disabled, false);
  await h.run(() => h.app.createPdf()); h.app.saveGeneratedPdf();
  assert.equal(h.downloads.at(-1).filename, 'October-planner.pdf');
});

test('custom blank dimension blocks PDF and size test while preset ignores hidden custom draft', async () => {
  const h = await monthly();
  await h.radio('plannerSize', 'custom'); await h.input('customWidth', '100.5'); await h.input('customHeight', '160');
  await h.run(() => h.app.createPdf());
  await h.input('customWidth', '');
  assert.equal(h.app.state.baseWidth, 100.5);
  assert.equal(h.get('generatePdfButton').disabled, true);
  assert.equal(h.get('saveSizeTestButton').disabled, true);
  await h.run(() => h.app.createSizeTestPdf()); assert.equal(h.downloads.length, 0);
  await h.radio('plannerSize', 'a5');
  assert.equal(h.get('generatePdfButton').disabled, false);
  assert.equal(h.get('saveSizeTestButton').disabled, false);
  await h.radio('plannerSize', 'custom'); assert.equal(h.get('generatePdfButton').disabled, true);
  await h.input('customWidth', '100.5'); await h.run(() => h.app.createPdf());
  const pdf = await h.app.generatedPdf.blob.text();
  assert.match(pdf, /\/MediaBox \[0 0 284\.8819 453\.5433\]/);
});

test('hidden date, note, hour, and manual-margin drafts only block applicable controls', async () => {
  const h = loadPlanner();
  await h.input('startMonth', ''); await h.radio('refillType', 'notes');
  assert.equal(h.get('generatePdfButton').disabled, false);
  await h.input('notesCount', ''); assert.equal(h.get('generatePdfButton').disabled, true);
  await h.radio('refillType', 'daily'); await h.input('startMonth', '2026-02'); await h.input('endMonth', '2026-02');
  assert.equal(h.get('generatePdfButton').disabled, false);
  await h.input('startHour', ''); assert.equal(h.get('generatePdfButton').disabled, true);
  await h.radio('refillType', 'monthly'); assert.equal(h.get('generatePdfButton').disabled, false);
  await h.radio('ringMarginMode', 'manual'); await h.input('ringMarginValue', '');
  assert.equal(h.get('generatePdfButton').disabled, true);
  await h.radio('ringMarginMode', 'auto'); assert.equal(h.get('generatePdfButton').disabled, false);
});

test('execution guards reject invalid actual fields even without input events', async () => {
  const h = await monthly();
  h.get('startMonth').value = '';
  h.app.saveGeneratedPdf(); assert.equal(h.downloads.length, 0);
  await h.run(() => h.app.createPdf()); assert.equal(h.app.generatedPdf.blob, null);
  await h.radio('plannerSize', 'custom'); h.get('customWidth').value = '';
  await h.run(() => h.app.createSizeTestPdf()); assert.equal(h.downloads.length, 0);
});

test('invalid draft arriving during PDF generation cannot publish stale output', async () => {
  const h = loadPlanner(); await h.input('startMonth', '2026-10'); await h.input('endMonth', '2026-11');
  const pending = h.app.createPdf(); await h.input('startMonth', '');
  await h.run(() => pending);
  assert.equal(h.app.generatedPdf.blob, null);
  assert.equal(h.get('generatePdfButton').disabled, true);
});

test('calendar, duplex and unscaled imposition calculations stay intact', async () => {
  const h = loadPlanner();
  await h.radio('refillType', 'daily'); await h.input('startMonth', '2024-02'); await h.input('endMonth', '2024-02');
  assert.equal(h.app.allPageSpecs().length, 29);
  await h.radio('refillType', 'weekly'); await h.input('startMonth', '2026-02'); await h.input('endMonth', '2026-02');
  assert.equal(h.app.allPageSpecs().length, 5);
  await h.radio('weekStart', 'sunday'); assert.equal(h.app.allPageSpecs().length, 4);
  await h.radio('refillType', 'notes'); await h.input('notesCount', '3'); await h.radio('duplexMode', 'long');
  await h.run(() => h.app.createPdf()); assert.equal(h.app.generatedPdf.pageCount, 4);
  await h.radio('printMode', 'a4'); assert.equal(h.app.impositionPlan().slots, 2); assert.equal(h.app.sheetCountForPlan(h.app.impositionPlan()), 1);
  await h.run(() => h.app.createPdf()); assert.equal(h.app.generatedPdf.pageCount, 2);
  await h.radio('plannerSize', 'custom'); await h.input('customWidth', '300'); await h.input('customHeight', '400');
  assert.equal(h.get('generatePdfButton').disabled, true); assert.equal(h.get('printFitError').hidden, false);
});

test('note preview uses the PDF renderer at physically correct 4/5/7 mm spacing', async () => {
  const h = loadPlanner(); await h.radio('refillType', 'notes');
  for (const style of ['minimal', 'classic', 'compact']) for (const orientation of ['portrait', 'landscape']) for (const side of ['left', 'right']) {
    await h.radio('stylePreset', style); await h.radio('orientation', orientation); await h.radio('ringMarginMode', 'manual'); await h.input('ringMarginValue', '30');
    for (const [layout, spacing] of [['notes-grid', 4], ['notes-grid', 5], ['notes-dot', 4], ['notes-dot', 5], ['notes-lined', 7]]) {
      await h.radio('layout', layout); if (spacing !== 7) await h.radio('noteSpacing', String(spacing));
      const holder = h.app.createPatternPage(1, 'page', side), sheet = holder.querySelector('.sheet'), canvas = sheet.querySelector('canvas');
      assert.ok(canvas, `${layout} preview must use shared physical Canvas drawing`);
      const width = Number(sheet.dataset.pageWidth), height = Number(sheet.dataset.pageHeight);
      const calls = canvas.getContext('2d').calls;
      const points = calls.filter(call => call[0] === (layout === 'notes-dot' ? 'arc' : 'moveTo'));
      const xs = [...new Set(points.map(call => call[1]))].sort((a, b) => a - b);
      const ys = [...new Set(points.map(call => call[2]))].sort((a, b) => a - b);
      if (layout !== 'notes-lined') assert.ok(Math.abs((xs[1] - xs[0]) / canvas.width * width - spacing) < 1e-8);
      assert.ok(Math.abs((ys[1] - ys[0]) / canvas.height * height - spacing) < 1e-8);
    }
  }
});

test('size test cannot download after the dimension draft becomes invalid mid-generation', async () => {
  const h = loadPlanner(); await h.radio('plannerSize', 'custom');
  const pending = h.app.createSizeTestPdf(); await h.input('customWidth', '');
  await h.run(() => pending);
  assert.equal(h.downloads.length, 0);
  assert.equal(h.get('saveSizeTestButton').disabled, true);
});

test('blank numeric drafts stay invalid after blur and recover without losing preview values', async () => {
  const h = loadPlanner(); await h.radio('refillType', 'daily');
  await h.input('startHour', '', 'blur'); assert.equal(h.get('generatePdfButton').disabled, true); assert.equal(h.app.state.startHour, 6);
  await h.input('startHour', '8', 'change'); assert.equal(h.get('generatePdfButton').disabled, false);
  await h.radio('refillType', 'notes'); await h.input('notesCount', '', 'blur'); assert.equal(h.get('generatePdfButton').disabled, true);
  await h.input('notesCount', '3', 'change'); assert.equal(h.get('generatePdfButton').disabled, false);
  await h.radio('ringMarginMode', 'manual'); await h.input('ringMarginValue', '', 'blur'); assert.equal(h.get('generatePdfButton').disabled, true);
  await h.input('ringMarginValue', '20', 'change'); assert.equal(h.get('generatePdfButton').disabled, false);
});


test('size-test generation stays busy through unrelated renders and repeated clicks', async () => {
  const h = loadPlanner(); h.raster.paused = true;
  const first = h.app.createSizeTestPdf();
  await h.radio('refillType', 'notes');
  assert.equal(h.get('saveSizeTestButton').disabled, true);
  const repeated = h.app.createSizeTestPdf();
  assert.equal(h.raster.pending.length, 1, 'a repeated request cannot start another raster');
  h.raster.paused = false; h.raster.pending.splice(0).forEach(complete => complete());
  await h.run(() => Promise.all([first, repeated]));
  assert.equal(h.downloads.length, 0, 'changed settings reject the earlier size test');
  assert.equal(h.get('saveSizeTestButton').disabled, false);
  await h.run(() => h.app.createSizeTestPdf()); assert.equal(h.downloads.length, 1);
});

test('changing settings A to B to A cannot publish a mixed-page PDF', async () => {
  const h = loadPlanner(); await h.radio('refillType', 'notes'); await h.radio('layout', 'notes-grid');
  await h.input('notesCount', '3'); await h.radio('noteSpacing', '4');
  h.raster.paused = true;
  const pending = h.app.createPdf();
  assert.equal(h.raster.pending.length, 1);
  await h.radio('noteSpacing', '5'); h.raster.pending.shift()(); await h.drain();
  assert.equal(h.raster.pending.length, 1, 'second page is now waiting');
  await h.radio('noteSpacing', '4'); h.raster.pending.shift()(); await h.drain();
  h.raster.paused = false; h.raster.pending.splice(0).forEach(complete => complete());
  await h.run(() => pending);
  assert.equal(h.app.generatedPdf.blob, null, 'matching final values cannot restore an obsolete generation');
  await h.run(() => h.app.createPdf()); assert.equal(h.app.generatedPdf.pageCount, 3);
});
