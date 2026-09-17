import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/index.template.html', import.meta.url), 'utf8');

// Text-size setting must affect normal refill content, not only top-level titles.
for (const cls of ['day-number','weekday','holiday-name','weekly-block-head','weekly-list-day','vertical-head','daily-holiday']) {
  assert.match(source, new RegExp(`data-font-size="(?:small|large)"[^\\n]*\\.${cls}|\\.${cls}[^\\n]*data-font-size`, 'i'), `${cls} should have a font-size override`);
}

// Compact label should explain the actual behavior to the user.
assert.match(source, /styleCompact:'余白狭め'/, 'Japanese compact label should describe narrower margins');
assert.match(source, /styleCompact:'Tight Margins'/, 'English compact label should describe narrower margins');

// Monthly-spread information rail should center its contents.
assert.match(source, /\.calendar-info-rail[^}]*align-items:center[^}]*text-align:center/s, 'info rail contents should be centered');
assert.match(source, /calendar-info-month-number/, 'Japanese month number should be separately styled');
assert.match(source, /calendar-info-month-suffix/, 'Japanese month suffix should be separately styled');
assert.match(source, /\.calendar-info-month-number[^}]*font-size:[^;}]*(?:2\.0|2\.1|2\.2|2\.3|2\.4|2\.5)/, 'month number should be distinctly larger');
assert.match(source, /\.calendar-info-month-suffix[^}]*font-size:[^;}]*(?:0\.7|0\.8|0\.9|1\.0|1\.1|1\.2)/, 'month suffix should be smaller than month number');

// Holiday labels should be visibly larger than v0.8.2 values.
assert.match(source, /\.holiday-name[^}]*font-size:clamp\([^)]*(?:4(?:\.\d+)?px|5(?:\.\d+)?px)/, 'monthly holiday names should be larger');
assert.match(source, /holiday\.name[^\n]*Math\.max\([^\n]*(?:\.009|\.010|\.011|\.012)/, 'PDF holiday labels should be larger');

console.log('v0.8.3 typography/spread contract: ok');
