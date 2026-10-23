import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { gunzipSync } from 'node:zlib';

// Structural contracts complement native browser wheel/geometry checks. Point
// PLANNER_HTML at source, readable HTML, or the self-extract wrapper to reuse them.
const file = process.env.PLANNER_HTML || 'src/index.template.html';
let html = fs.readFileSync(file, 'utf8');
const payload = html.match(/<script id="self-extract-payload"[^>]*>([\s\S]*?)<\/script>/);
if (payload) html = gunzipSync(Buffer.from(payload[1].replace(/\s/g, ''), 'base64')).toString('utf8');
html = html.replace(/\r\n/g, '\n');
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
const jaHelp = 'ダイアログを開いている間は背景のスクロールが止まります。内容はダイアログ内でスクロールできます。';
const enHelp = 'Background scrolling is paused while a dialog is open. Scroll inside the dialog to read its contents.';

for (const element of ['html', 'body']) {
  test(`${element} locks only while a native modal is active`, () => {
    const selector = `${element}:has(dialog:modal)`;
    const rule = rules.find(([, selectors]) => selectors.split(',').some(value => value.trim() === selector));
    assert.ok(rule, `${selector} must lock the background scroll container`);
    assert.match(rule[2], /(?:^|;)\s*overflow\s*:\s*hidden\s*(?:;|$)/);
    for (const [, selectors, declarations] of rules) {
      if (selectors.split(',').some(value => value.trim() === element)) {
        assert.doesNotMatch(declarations, /(?:^|;)\s*overflow(?:-y)?\s*:\s*(?:hidden|clip)\b/, 'Normal page scrolling remains available');
      }
    }
  });
}

test('Help omits layout audit prose in Japanese and English', () => {
  assert.ok(!html.includes(`<p data-i18n="helpModalScroll">${jaHelp}</p>`));
  assert.ok(!html.includes(`helpModalScroll:'${jaHelp}'`));
  assert.ok(!html.includes(`helpModalScroll:'${enHelp}'`));
  const help = html.match(/<!-- APP:HELP:BEGIN -->([\s\S]*?)<!-- APP:HELP:END -->/)[1];
  assert.doesNotMatch(help, /data-i18n="helpModalScroll"/);
  assert.match(help, /data-i18n="helpOffline"/);
});

test('Help and confirmation keep labelled native dialogs with reachable controls', () => {
  // Assert the reusable modal contract, not a hash of unrelated application code.
  // Native scrolling, focus restoration and dismissal are also checked in browser QA.
  for (const [id, title, bodyClass, controls] of [
    ['helpDialog', 'helpTitle', 'dialog-body', ['closeHelpButton']],
    ['appConfirmDialog', 'appConfirmTitle', 'app-confirm-body', ['appConfirmClose', 'appConfirmCancel', 'appConfirmOk']],
  ]) {
    const dialog = [...html.matchAll(/<dialog\b[^>]*>[\s\S]*?<\/dialog>/g)]
      .map(match => match[0]).find(value => value.includes(`id="${id}"`));
    assert.ok(dialog, `${id} remains a native dialog`);
    assert.match(dialog, new RegExp(`aria-labelledby="${title}"`));
    assert.match(dialog, new RegExp(`class="[^"]*\\b${bodyClass}\\b`));
    for (const control of controls) assert.ok(dialog.includes(`id="${control}"`), `${id} retains ${control}`);
  }
  for (const selector of ['.dialog-body', '.app-confirm-body']) {
    const declarations = rules.filter(([, selectors]) => selectors.split(',').some(value => value.trim() === selector))
      .map(([, , value]) => value).join(';');
    assert.match(declarations, /overflow\s*:\s*auto\b/, `${selector} has internal scrolling`);
    assert.match(declarations, /safe-area-inset-bottom/, `${selector} protects bottom controls`);
  }
  assert.match(css, /\.dialog-shell\s*\{[^}]*max-height\s*:[^}]*100dvh/);
  assert.match(css, /\.app-confirm-dialog\s*\{[^}]*max-height\s*:[^}]*100dvh/);
});

test('local-processing badge retains its existing decorative shield and check', () => {
  const badge = html.match(/<div class="local-badge">([\s\S]*?)<\/div>/)[1];
  assert.match(badge, /<svg[^>]*aria-hidden="true"/);
  assert.match(badge, /<path d="M12 3 5 6v5c0 4\.6 2\.8 8 7 10 4\.2-2 7-5\.4 7-10V6z"\/>/);
  assert.match(badge, /<path d="m9 12 2 2 4-5"\/>/);
  assert.match(badge, /data-i18n="localBadge"/);
});

test('canonical repository and distributed-entry-point checks include modal contracts', () => {
  const check = fs.readFileSync('scripts/check-repository.ps1', 'utf8');
  assert.match(check, /Get-ChildItem[^\r\n]+-Filter "\*\.test\.mjs"/);
  assert.match(check, /node --test @testFiles/);
  assert.match(check, /node scripts\/check-planner-runtime\.mjs/);
  const runtime = fs.readFileSync('scripts/check-planner-runtime.mjs', 'utf8');
  assert.match(runtime, /'tests\/modal-scroll\.test\.mjs'/);
  assert.match(runtime, /assert\.deepEqual\(expanded, fs\.readFileSync/);
  assert.match(runtime, /\['planner-refill-maker\.html', 'dist\/index\.html', unpacked\]/);
});
