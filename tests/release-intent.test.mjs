import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { decideRelease } from '../scripts/release-intent.mjs';

const decide = (overrides = {}) => decideRelease({
  eventName: 'push', currentVersion: '1.4.0', previousVersion: '1.3.0', ...overrides
});

test('main push publishes only when the stable version increases', () => {
  assert.deepEqual(decide(), { publish: true, version: '1.4.0', reason: 'The main-branch app version increased.' });
  assert.equal(decide({ previousVersion: '1.4.0' }).publish, false);
  assert.equal(decide({ currentVersion: '1.4.1', previousVersion: '1.4.0' }).publish, true);
  assert.equal(decide({ currentVersion: '2.0.0', previousVersion: '1.99.99' }).publish, true);
  assert.equal(decide({ tagExists: true }).publish, false, 'do not overwrite an existing tag');
});

test('main push fails closed on downgrade, malformed or missing version', () => {
  assert.throws(() => decide({ currentVersion: '1.2.0' }), /must increase/);
  assert.throws(() => decide({ currentVersion: '1.4.0-beta.1' }), /stable/);
  assert.throws(() => decide({ previousVersion: undefined }), /stable/);
  assert.throws(() => decide({ previousVersion: 'v1.3.0' }), /stable/);
});

test('manual release retains exact-match and duplicate-tag protections', () => {
  const manual = { eventName: 'workflow_dispatch', requestedVersion: '1.4.0' };
  assert.equal(decide(manual).publish, true);
  assert.throws(() => decide({ ...manual, requestedVersion: '1.3.0' }), /exactly match/);
  assert.throws(() => decide({ ...manual, requestedVersion: 'v1.4.0' }), /stable/);
  assert.throws(() => decide({ ...manual, tagExists: true }), /already exists/);
  assert.throws(() => decide({ eventName: 'pull_request' }), /Unexpected/);
});

test('release workflow runs for version updates and gates publishing steps', () => {
  const source = fs.readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');
  assert.match(source, /on:\s*\n\s*push:\s*\n\s*branches:\s*\n\s*- main\s*\n\s*paths:\s*\n\s*- app\.config\.json/);
  assert.match(source, /workflow_dispatch:/);
  assert.match(source, /fetch-depth:\s*0/);
  assert.match(source, /node scripts\/release-intent\.mjs/);
  assert.match(source, /if: steps\.intent\.outputs\.publish == 'true'/);
  assert.match(source, /gh release create/);
});
