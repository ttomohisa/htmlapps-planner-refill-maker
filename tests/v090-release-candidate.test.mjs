import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/index.template.html', import.meta.url), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('../app.config.json', import.meta.url), 'utf8'));

assert.match(source, /yearOffsetX:-\.05/, 'monthly spread year should have its own left offset');
assert.match(source, /const yearCenter=railCenter\+colW\*railMetrics\.yearOffsetX/, 'year should use its own x position');
assert.match(source, /holiday\.name[^\n]*Math\.max\(7\.4,w\*\.0168\)/, 'monthly/weekly holiday label Canvas size should be larger');
assert.match(source, /\.holiday-name \{[^\n]*font-size:clamp\(7px,\.9vw,12\.5px\)/, 'DOM holiday labels should also be enlarged');
console.log('v0.9.0 visual-tuning regression contract: ok');
