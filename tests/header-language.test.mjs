import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { loadPlanner } from './helpers/planner-harness.mjs';

const config = JSON.parse(fs.readFileSync('app.config.json', 'utf8'));
for (const initial of ['ja', 'en']) {
  test(`${initial}: header language targets, Help labels and canonical version preserve settings through a loaded roundtrip`, async () => {
    const h = loadPlanner(undefined, { language: initial, savedSettings: { sizeKey: 'a5', refillType: 'notes', notesCount: 2 } });
    await h.input('pdfFilename', 'qa-header');
    await h.run(() => h.app.createPdf());
    const settings = JSON.stringify(h.app.state), pdf = h.app.generatedPdf.blob;
    assert.ok(pdf, 'a generated PDF is available before switching language');
    for (const [index, language] of [initial, initial === 'ja' ? 'en' : 'ja', initial].entries()) {
      const target = language === 'ja' ? '英語に切り替え' : 'Switch to Japanese';
      assert.equal(h.get('languageButton').textContent, language === 'ja' ? 'EN' : 'JA');
      assert.equal(h.get('languageButton').attributes['aria-label'], target);
      assert.equal(h.get('languageButton').title, target);
      assert.equal(h.get('versionBadge').textContent, `v${config.version}`);
      assert.match(h.get('versionBadge').textContent, /^v\d+\.\d+\.\d+$/);
      assert.equal(h.get('buildVersion').textContent, config.version);
      for (const [id, label] of [['helpButton', language === 'ja' ? '使い方と注意事項' : 'How to use & notes'], ['closeHelpButton', language === 'ja' ? '閉じる' : 'Close']]) {
        assert.equal(h.get(id).attributes['aria-label'], label);
        assert.equal(h.get(id).title, label);
      }
      await h.get('helpButton').click(); assert.equal(h.get('helpDialog').open, true);
      await h.get('closeHelpButton').click(); assert.equal(h.get('helpDialog').open, false);
      assert.equal(JSON.stringify(h.app.state), settings);
      assert.equal(h.app.generatedPdf.blob, index === 0 ? pdf : null, 'a language change invalidates localized PDF output');
      assert.equal(h.get('pdfFilename').value, 'qa-header');
      assert.equal(h.get('savePdfButton').disabled, index > 0);
      if (index > 0) {
        assert.equal(h.get('pdfError').hidden, false);
        assert.equal(h.get('pdfError').textContent, language === 'ja' ? '設定が変更されました。PDFを作り直してください。' : 'Settings changed. Create the PDF again.');
      }
      await h.get('languageButton').click(); await h.drain();
    }
    assert.deepEqual(h.errors, []);
  });
}

for (const initial of ['ja', 'en']) {
  test(`${initial}: a later rendering error is not replaced by the stale-output translation`, async () => {
    const h = loadPlanner(undefined, { language: initial, savedSettings: { sizeKey: 'a5', refillType: 'notes', notesCount: 2 } });
    await h.run(() => h.app.createPdf());
    await h.get('languageButton').click(); await h.drain();
    const originalCreate = h.context.document.createElement;
    h.context.document.createElement = tag => {
      if (tag === 'canvas') throw vm.runInContext("new Error('Synthetic rendering error')", h.context);
      return originalCreate(tag);
    };
    await h.run(() => h.app.createSizeTestPdf());
    h.context.document.createElement = originalCreate;
    assert.equal(h.get('pdfError').textContent, 'Synthetic rendering error');
    await h.get('languageButton').click(); await h.drain();
    assert.equal(h.get('pdfError').textContent, 'Synthetic rendering error');
    assert.equal(h.get('pdfError').hidden, false);
  });
}
