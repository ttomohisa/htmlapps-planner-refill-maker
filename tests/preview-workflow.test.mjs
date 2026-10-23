import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPlanner } from './helpers/planner-harness.mjs';

async function monthlySpread() {
  const h = loadPlanner();
  await h.input('startMonth', '2026-01');
  await h.input('endMonth', '2026-03');
  await h.radio('layout', 'monthly-spread');
  await h.radio('duplexMode', 'long');
  return h;
}
const texts = el => [el.textContent, ...el.children.flatMap(child => texts(child))].join(' ');
async function select(h, id, value) {
  assert.ok(h.get(id), `${id} is available`);
  await h.input(id, value, 'change');
}

test('presentation navigation preserves a generated PDF and current custom input drafts', async () => {
  const h = await monthlySpread();
  await h.run(() => h.app.createPdf());
  const blob = h.app.generatedPdf.blob, signature = h.app.settingsSignature();
  await select(h, 'previewJump', '1');
  await select(h, 'spreadSide', 'right');
  await select(h, 'previewMode', 'sheets');
  assert.ok(h.get('mobilePreview'));
  await h.get('mobilePreview').click();
  await h.get('mobileOutput').click();
  assert.equal(h.app.generatedPdf.blob, blob);
  assert.equal(h.app.settingsSignature(), signature);
  assert.equal(h.get('savePdfButton').disabled, false);
  await h.radio('plannerSize', 'custom');
  await h.input('customWidth', '');
  await h.get('mobilePreview').click();
  await h.get('mobileSettings').click();
  assert.equal(h.get('customWidth').value, '');
});

test('current spread trial captures its selected month, physical padding and saved label', async () => {
  const h = await monthlySpread();
  await select(h, 'previewJump', '1');
  const start = h.app.state.startMonth, end = h.app.state.endMonth;
  await h.input('pdfFilename', 'my planner.pdf');
  await h.run(() => h.app.createPdf({ scope: 'current' }));
  assert.equal(h.app.generatedPdf.pageCount, 4, 'February spread needs leading and trailing blank faces');
  assert.equal(h.app.generatedPdf.scope, 'current');
  assert.match(h.get('pdfResultMeta').textContent, /trial.*Feb|Feb.*trial/i);
  const meta = h.get('pdfResultMeta').textContent;
  await select(h, 'previewJump', '2');
  assert.equal(h.get('pdfResultMeta').textContent, meta);
  h.app.saveGeneratedPdf();
  assert.equal(h.downloads.at(-1).filename, 'my planner-trial-unit-2-both.pdf');
  assert.equal(h.app.state.startMonth, start); assert.equal(h.app.state.endMonth, end);
});

test('single spread side trial outputs only that content page with correct duplex parity', async () => {
  const h = await monthlySpread();
  await select(h, 'previewJump', '1');
  await select(h, 'spreadSide', 'right');
  await h.run(() => h.app.createPdf({ scope: 'current' }));
  assert.equal(h.app.generatedPdf.pageCount, 2);
  assert.match(h.get('pdfResultMeta').textContent, /right/i);
  h.app.saveGeneratedPdf();
  assert.match(h.downloads.at(-1).filename, /-trial-unit-2-right\.pdf$/);
  await h.run(() => h.app.createPdf());
  assert.equal(h.app.generatedPdf.scope, 'full');
  assert.equal(h.app.generatedPdf.pageCount, 8);
  h.app.saveGeneratedPdf();
  assert.doesNotMatch(h.downloads.at(-1).filename, /-trial-unit/);
});

test('navigating during a paused trial cannot change its frozen scope or result label', async () => {
  const h = await monthlySpread();
  await select(h, 'previewJump', '1');
  h.raster.paused = true;
  const pending = h.app.createPdf({ scope: 'current' });
  await h.drain();
  await select(h, 'previewJump', '2');
  await select(h, 'spreadSide', 'left');
  h.raster.paused = false; h.raster.pending.splice(0).forEach(finish => finish());
  await h.run(() => pending);
  assert.equal(h.app.generatedPdf.pageCount, 4);
  assert.match(h.get('pdfResultMeta').textContent, /Feb/);
  assert.doesNotMatch(h.get('pdfResultMeta').textContent, /Mar/);
});

test('cancellation stops before another page, leaves no result and is expected control flow', async () => {
  const h = loadPlanner(); await h.radio('refillType', 'notes'); await h.input('notesCount', '30');
  assert.ok(h.get('cancelPdfButton'));
  h.raster.paused = true;
  const pending = h.app.createPdf(); await h.drain();
  assert.equal(h.raster.pending.length, 1);
  await h.get('cancelPdfButton').click();
  h.raster.paused = false; h.raster.pending.splice(0).forEach(finish => finish());
  const before = h.canvases.length; await h.run(() => pending);
  assert.equal(h.canvases.length, before);
  assert.equal(h.app.generatedPdf.blob, null);
  assert.equal(h.get('savePdfButton').disabled, true);
  assert.match(h.get('pdfError').textContent, /cancel/i);
  assert.equal(h.errors.length, 0);
});

test('A-B-A edits stop imposed generation inside the first sheet and never log stale work', async () => {
  const h = loadPlanner(); await h.radio('refillType', 'notes'); await h.input('notesCount', '30');
  await h.radio('printMode', 'a4');
  const pending = h.app.createPdf();
  await h.input('notesCount', '29'); await h.input('notesCount', '30');
  await h.run(() => pending);
  assert.equal(h.app.generatedPdf.blob, null);
  assert.match(h.get('pdfError').textContent, /changed|again/i);
  assert.equal(h.errors.length, 0);
});

test('size test shares cancellation and stops before producing another raster or download', async () => {
  const h = loadPlanner(); await h.radio('duplexMode', 'long');
  assert.ok(h.get('cancelPdfButton'));
  h.raster.paused = true;
  const pending = h.app.createSizeTestPdf(); await h.drain();
  await h.get('cancelPdfButton').click();
  h.raster.paused = false; h.raster.pending.splice(0).forEach(finish => finish());
  const before = h.canvases.length; await h.run(() => pending);
  assert.equal(h.canvases.length, before); assert.equal(h.downloads.length, 0); assert.equal(h.errors.length, 0);
});

test('sheet backs use physical PDF rotation while bound spreads show readable facing content', async () => {
  const h = await monthlySpread(); await h.radio('duplexMode', 'short');
  h.canvases.splice(0); await select(h, 'previewMode', 'sheets');
  assert.match(texts(h.get('previewPages')), /blank/i);
  assert.match(texts(h.get('previewPages')), /Jan/);
  assert.ok(h.canvases.some(canvas => canvas.getContext('2d').calls.some(call => call[0] === 'rotate' && call[1] === Math.PI)));
  h.canvases.splice(0); await select(h, 'previewMode', 'bound');
  const labels = texts(h.get('previewPages'));
  assert.match(labels, /left/i); assert.match(labels, /right/i); assert.match(labels, /Jan/);
  assert.equal(h.canvases.some(canvas => canvas.getContext('2d').calls.some(call => call[0] === 'rotate' && call[1] === Math.PI)), false);
  await h.radio('duplexMode', 'off');
  assert.equal(h.get('previewBoundOption').disabled, true);
  assert.notEqual(h.get('previewMode').value, 'bound');
});

test('margin presets repair invalid drafts while Custom preserves the typed value and hidden errors stay reachable', async () => {
  const h = loadPlanner(); await h.radio('printMode', 'a4');
  await select(h, 'printMarginPreset', 'custom');
  await h.input('printMarginMm', '');
  assert.equal(h.get('generatePdfButton').disabled, true);
  assert.equal(h.get('outputValidationNotice').hidden, false);
  await h.get('reviewSettingsButton').click();
  assert.equal(h.get('mobileOutput').attributes['aria-current'], 'page', 'the margin error is on the output panel');
  assert.equal(h.get('printMarginMm').value, '');
  await select(h, 'printMarginPreset', '5');
  assert.equal(h.app.state.printMarginMm, 5); assert.equal(h.get('printMarginMm').value, '5');
  assert.equal(h.get('generatePdfButton').disabled, false);
  await h.radio('plannerSize', 'custom'); await h.input('customWidth', '');
  await h.get('mobileOutput').click(); await h.get('reviewSettingsButton').click();
  assert.equal(h.get('mobileSettings').attributes['aria-current'], 'page', 'hidden settings errors are reachable from output');
  assert.equal(h.context.document.activeElement, h.get('customWidth'));
});

test('enlarged preview renders canvases and restores trigger focus on dismissal', async () => {
  const h = loadPlanner(); await h.radio('refillType', 'notes');
  assert.ok(h.get('enlargePreviewButton'));
  h.get('enlargePreviewButton').focus(); await h.get('enlargePreviewButton').click();
  assert.equal(h.get('enlargedPreviewDialog').open, true);
  assert.ok(h.get('enlargedPreviewPages').querySelectorAll('canvas').length > 0);
  await h.get('closeEnlargedPreview').click();
  assert.equal(h.get('enlargedPreviewDialog').open, false);
  assert.equal(h.context.document.activeElement, h.get('enlargePreviewButton'));
});


test('presentation controls leave a pending settings confirmation intact', async () => {
  const h = await monthlySpread();
  await h.get('saveSettingsButton').click();
  const value = await h.urls.get(h.downloads.at(-1).url).text();
  const input = h.get('settingsFileInput');
  input.files = [{ size: new TextEncoder().encode(value).length, text: async () => value }];
  const pending = input.emit('change'); await h.drain();
  assert.equal(h.get('appConfirmDialog').open, true);
  await select(h, 'previewJump', '1'); await select(h, 'previewMode', 'sheets');
  await h.get('mobilePreview').click();
  assert.equal(h.get('appConfirmDialog').open, true, 'view controls must not cancel an import');
  await h.get('appConfirmCancel').click(); await pending;
  assert.equal(h.app.state.startMonth, '2026-01');
});

test('trial A4 output uses full-size margin planning and duplex padding without changing the period', async () => {
  const h = await monthlySpread();
  await h.radio('printMode', 'a4'); await select(h, 'printMarginPreset', '5');
  await select(h, 'previewJump', '1');
  await h.run(() => h.app.createPdf({ scope: 'current' }));
  assert.equal(h.app.generatedPdf.pageCount, 4, 'one-slot A4 needs two duplex sheets for the padded spread');
  assert.match(await h.app.generatedPdf.blob.text(), /\/MediaBox \[0 0 595\.2756 841\.8898\]/);
  assert.equal(h.app.state.startMonth, '2026-01'); assert.equal(h.app.state.endMonth, '2026-03');
  assert.equal(h.app.state.printMarginMm, 5);
});


test('mobile tabs restore the last field after native focus moves to each tab before click', async () => {
  const h = loadPlanner(); h.context.innerWidth = 393;
  await h.radio('plannerSize', 'custom');
  // The small adapter flattens parsed HTML; connect the real field/panels used here.
  h.get('settingsPage').append(h.get('customFields'));
  h.get('customFields').append(h.get('customWidth'));
  const field = h.get('customWidth'); field.focus();
  h.get('mobilePreview').focus(); await h.get('mobilePreview').click();
  h.get('mobileSettings').focus(); await h.get('mobileSettings').click();
  assert.equal(h.context.document.activeElement, field);
  assert.equal(field.value, '95');
});

test('mobile return leaves focus on its tab when the remembered field becomes hidden or disconnected', async () => {
  for (const stale of ['hidden', 'disconnected', 'disabled']) {
    const h = loadPlanner(); h.context.innerWidth = 393;
    await h.radio('plannerSize', 'custom');
    h.get('settingsPage').append(h.get('customFields'));
    h.get('customFields').append(h.get('customWidth'));
    const field = h.get('customWidth'); field.focus();
    h.get('mobilePreview').focus(); await h.get('mobilePreview').click();
    if (stale === 'hidden') await h.radio('plannerSize', 'a5');
    if (stale === 'disconnected') Object.defineProperty(field, 'isConnected', { value: false });
    if (stale === 'disabled') field.disabled = true;
    h.get('mobileSettings').focus(); await h.get('mobileSettings').click();
    assert.equal(h.context.document.activeElement, h.get('mobileSettings'), stale);
  }
});
