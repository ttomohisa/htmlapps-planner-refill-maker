const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { gunzipSync } = require('node:zlib');

const rejected = [
  "ダイアログを開いている間は背景のスクロールが止まります。内容はダイアログ内でスクロールできます。",
  "Background scrolling is paused while a dialog is open. Scroll inside the dialog to read its contents.",
  "v1.0.3正式版です。月間・年間・週間・日間・メモを作成し、実寸またはA4 / US LetterのPDFとして保存できます。",
  "v1.0.3 is the stable release. Monthly spread preview and PDF share the same Canvas renderer, with five text-size levels and larger holiday/month/year labels."
];

test('help contains user guidance rather than implementation or layout audit prose', () => {
  const root = path.join(__dirname, '..');
  const files = ['src/index.template.html', 'dist/index.html', 'dist/index.self-extract.html',
    ...fs.readdirSync(root).filter(name => name.endsWith('.html'))];
  for (const file of files) {
    const filename = path.join(root, file);
    if (!fs.existsSync(filename)) continue;
    let html = fs.readFileSync(filename, 'utf8');
    const payload = html.match(/<script id="self-extract-payload"[^>]*>([\s\S]*?)<\/script>/);
    if (payload) html = gunzipSync(Buffer.from(payload[1].replace(/\s/g, ''), 'base64')).toString('utf8');
    for (const copy of rejected) assert.ok(!html.includes(copy), `${file}: remove internal-facing help copy: ${copy}`);
  }
});
