import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';

// Execute the same real application scripts for every distributed entry point.
// This is a DOM/Canvas-adapter regression, not a substitute for browser/print QA.
const root = path.resolve(import.meta.dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'planner-runtime-'));
try {
  const wrapper = fs.readFileSync(path.join(root, 'dist/index.self-extract.html'), 'utf8');
  const payload = wrapper.match(/<script id="self-extract-payload"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(payload, 'Self-extract payload exists');
  const expanded = gunzipSync(Buffer.from(payload[1].replace(/\s/g, ''), 'base64'));
  assert.deepEqual(expanded, fs.readFileSync(path.join(root, 'dist/index.html')), 'Self-extract bytes match the readable build');
  const unpacked = path.join(temp, 'unpacked.html');
  fs.writeFileSync(unpacked, expanded);
  for (const html of ['planner-refill-maker.html', 'dist/index.html', unpacked]) {
    console.log(`Planner runtime checks: ${html === unpacked ? 'self-extract payload' : html}`);
    const result = spawnSync(process.execPath, ['--test', 'tests/pdf-output-consistency.test.mjs', 'tests/settings-files.test.mjs'], {
      cwd: root, env: { ...process.env, PLANNER_HTML: html }, stdio: 'inherit',
    });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, `Runtime regressions passed: ${html}`);
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
