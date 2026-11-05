import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { prepareRelease } from '../scripts/prepare-release.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'planner-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'dist'));
  fs.writeFileSync(path.join(root, 'app.config.json'), JSON.stringify({ slug:'planner-refill-maker', version:'1.2.0' }));
  fs.writeFileSync(path.join(root, 'CHANGELOG.md'), '# Changelog\n\n## [1.2.0]\n\n- This release.\n\n## [1.1.0]\n\n- Old release.\n');
  const readable = Buffer.from('<script>const APP_CONFIG = {"version":"1.2.0"};</script>');
  const wrapper = Buffer.from(`<script id="self-extract-payload" type="application/octet-stream">${gzipSync(readable).toString('base64')}</script>`);
  fs.writeFileSync(path.join(root, 'dist/index.html'), readable);
  fs.writeFileSync(path.join(root, 'dist/index.self-extract.html'), wrapper);
  return { root, readable, wrapper };
}

test('release preparation preserves both verified HTML files and checksums their published names', t => {
  const { root, readable, wrapper } = fixture(t);
  const result = prepareRelease(root, '1.2.0');
  assert.equal(result.tag, 'v1.2.0');
  const files = [['planner-refill-maker-v1.2.0.html', readable], ['planner-refill-maker-v1.2.0.self-extract.html', wrapper]];
  for (const [name, bytes] of files) assert.deepEqual(fs.readFileSync(path.join(result.directory, name)), bytes);
  assert.equal(fs.readFileSync(path.join(result.directory, 'SHA256SUMS.txt'), 'utf8'), files.map(([name, bytes]) => `${createHash('sha256').update(bytes).digest('hex')}  ${name}\n`).join(''));
  const notes = fs.readFileSync(path.join(result.directory, 'release-notes.md'), 'utf8');
  assert.match(notes, /This release/); assert.doesNotMatch(notes, /Old release/);
});

test('release preparation rejects mismatched versions, unsafe tags, stale builds and missing notes before writing', t => {
  for (const version of ['1.1.0', 'v1.2.0', '../1.2.0', '1.2.0;echo bad', '01.2.0', '1.2.0-beta']) {
    const { root } = fixture(t);
    assert.throws(() => prepareRelease(root, version));
    assert.equal(fs.existsSync(path.join(root, 'dist/release')), false);
  }
  for (const corrupt of ['readable', 'wrapper', 'notes']) {
    const { root } = fixture(t);
    if (corrupt === 'readable') fs.writeFileSync(path.join(root, 'dist/index.html'), 'const APP_CONFIG = {"version":"1.1.0"};');
    if (corrupt === 'wrapper') fs.writeFileSync(path.join(root, 'dist/index.self-extract.html'), '<html>stale</html>');
    if (corrupt === 'notes') fs.writeFileSync(path.join(root, 'CHANGELOG.md'), '## [1.1.0]\nOld release');
    assert.throws(() => prepareRelease(root, '1.2.0'));
    assert.equal(fs.existsSync(path.join(root, 'dist/release')), false);
  }
});
