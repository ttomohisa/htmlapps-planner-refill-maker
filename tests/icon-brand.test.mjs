import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const svg = readFileSync(new URL('assets/favicon.svg', root), 'utf8');
const attrs = s => Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
test('canonical icon has the exact brand color and quarter-axis corner radii', () => {
  const rect = attrs(svg.match(/<rect\b[^>]*>/)[0]);
  const rootAttrs = attrs(svg.match(/<svg\b[^>]*>/)[0]);
  assert.equal((rect.fill || rootAttrs.fill).toLowerCase(), '#16624f');
  assert.equal(Number(rect.rx), Number(rect.width) / 4);
  assert.equal(Number(rect.ry || rect.rx), Number(rect.height) / 4);
  assert.ok(!svg.toLowerCase().includes('#10634f'));
});
test('icon artwork and updated framing are preserved', () => {
  const stable = svg.replace(/#16624f/gi, '#BRAND').replace(/<rect\b[^>]*>/, s => s.replace(/\s+r[xy]="[^"]*"/g, ''));
  assert.equal(createHash('sha256').update(stable).digest('hex'), '617c9a50e3fb3bc20b44232588c9bd37c14f110b5201c67cacc09dba72e6aee0');
});
test('runtime header and favicon embed the exact canonical SVG', () => {
  const uri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  for (const path of ['planner-refill-maker.html', 'dist/index.html']) {
    if (!existsSync(new URL(path, root))) continue;
    const html = readFileSync(new URL(path, root), 'utf8');
    const icons = [...html.matchAll(/(?:href|src)="(data:image\/svg\+xml;base64,[^"]+)"/g)].map(m => m[1]);
    assert.ok(icons.filter(value => value === uri).length >= 2, `${path}: header and favicon match`);
  }
});
