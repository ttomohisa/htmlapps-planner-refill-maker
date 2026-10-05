import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

function editableTemplate(html) {
  for (const [name, token] of [['APP_CONFIG', '__APP_CONFIG_JSON__'], ['BUILD_MANIFEST', '__BUILD_MANIFEST_JSON__'], ['assetBundle', '__EMBEDDED_ASSET_BUNDLE_JSON__']]) {
    html = html.replace(new RegExp(`(const ${name} = )[\\s\\S]*?;\\r?\\n`), `$1${token};\n`);
  }
  return html.replace(/data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+/g, '__APP_ICON_DATA_URI__').replace(/\r\n/g, '\n');
}

test('checked-in standalone contains the current source and built release stays in sync', () => {
  const source = fs.readFileSync('src/index.template.html', 'utf8').replace(/\r\n/g, '\n');
  const root = fs.readFileSync('planner-refill-maker.html', 'utf8');
  assert.equal(editableTemplate(root), source, 'Rebuild and copy dist/index.html to planner-refill-maker.html before publishing');
  if (fs.existsSync('dist/index.html')) assert.equal(editableTemplate(fs.readFileSync('dist/index.html', 'utf8')), source);
});
