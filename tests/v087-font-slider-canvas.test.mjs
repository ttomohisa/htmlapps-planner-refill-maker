import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/index.template.html', import.meta.url), 'utf8');
assert.match(source, /id="fontSizeSlider"[^>]*type="range"[^>]*min="1"[^>]*max="5"/, 'text size should be a 5-step range slider');
assert.match(source, /FONT_SIZE_STEPS=\['small','standard','large','xlarge','xxlarge'\]/, 'five text-size states should exist');
assert.match(source, /xlarge:1\.24,xxlarge:1\.36/, 'new sizes must be larger than the previous Large level');
assert.match(source, /createMonthlySpreadCanvasPreview/, 'monthly spread preview should have a shared-canvas preview path');
assert.match(source, /renderPageSpecCanvas\(\{kind:'monthly-spread'/, 'monthly spread preview should use the PDF page renderer');
assert.match(source, /pdfMonthScale:1\.42/, 'monthly spread month should be enlarged');
assert.match(source, /pdfYearScale:1\.78/, 'monthly spread year should be enlarged');
assert.match(source, /holiday\.name[^\n]*Math\.max\(7\.4,w\*\.0168\)/, 'monthly/weekly holiday labels should retain the enlarged Canvas output or larger');
console.log('v0.8.7 font slider/shared Canvas contract: ok');
