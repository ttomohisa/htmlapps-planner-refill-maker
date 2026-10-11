import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
const hash = value => createHash('sha256').update(value).digest('hex');
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

test('Help describes background locking and internal scrolling in Japanese and English', () => {
  assert.ok(html.includes(`<p data-i18n="helpModalScroll">${jaHelp}</p>`));
  assert.ok(html.includes(`helpModalScroll:'${jaHelp}'`));
  assert.ok(html.includes(`helpModalScroll:'${enHelp}'`));
  const help = html.match(/<!-- APP:HELP:BEGIN -->([\s\S]*?)<!-- APP:HELP:END -->/)[1];
  assert.match(help, /data-i18n="helpModalScroll"/);
  assert.match(help, /data-i18n="helpOffline"/);
});

test('modal-only patch preserves all existing styles and dialog shells', () => {
  // Baseline: main 533d245 (v1.0.2). Strip only this patch's approved additions.
  // Rebaseline deliberately if a future task intentionally changes these shells.
  const existingCss = css.replace(/    html:has\(dialog:modal\),\s*body:has\(dialog:modal\)\s*\{\s*overflow:\s*hidden;?\s*\}\n/, '');
  assert.equal(hash(existingCss), '3e64eb743c9df411df5bda8f7b1df0ca579d8c051ae5f5dea3862234840ba01a');
  const shells = [...html.matchAll(/<dialog\b[^>]*>[\s\S]*?<\/dialog>/g)].map(match => match[0]).join('\n')
    .replace(/        <p data-i18n="helpModalScroll">[^<]*<\/p>\n/, '')
    .replace(/v1\.0\.[23]/g, 'vPATCH');
  assert.equal(hash(shells), '8943bc70d14c1fd76768bbe3c027c9b8b36db893d439d9e5cf17dd95cf42bb45');
});

test('modal-only patch preserves runtime, settings, PDF export and dialog handlers', () => {
  let script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  for (const [name, token] of [['APP_CONFIG', '__APP_CONFIG_JSON__'], ['BUILD_MANIFEST', '__BUILD_MANIFEST_JSON__'], ['assetBundle', '__EMBEDDED_ASSET_BUNDLE_JSON__']]) {
    script = script.replace(new RegExp(`(const ${name} = )[\\s\\S]*?;\\n`), `$1${token};\n`);
  }
  script = script.replace(/helpModalScroll:'[^']*',/g, '').replace(/v1\.0\.[23]/g, 'vPATCH');
  assert.equal(hash(script), 'beea4a67e59a2fd54cb1e8d79fc92be8c9ad74403ccfe016117765737f8ba676');
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
