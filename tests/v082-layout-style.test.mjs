import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/index.template.html','utf8');
const config = JSON.parse(fs.readFileSync('app.config.json','utf8'));

assert.ok(/^(?:0\.8\.[2-9]|0\.9\.\d+|[1-9]\d*\.\d+\.\d+)$/.test(config.version), 'version should retain the v0.8.2 layout/style contract or later');

// Monthly spread must use a dedicated equal-column layout: left info rail + 3 days, right 4 days.
assert.match(source, /function\s+createMonthlySpreadPage\s*\(/, 'monthly spread should have a dedicated renderer');
assert.match(source, /calendar-info-rail/, 'left spread page should have an information rail');
assert.match(source, /spread-calendar-layout/, 'spread should use the dedicated equal-column layout');
assert.match(source, /grid-template-columns:\s*repeat\(4,minmax\(0,1fr\)\)/, 'each spread page should be split into four equal columns');
assert.match(source, /miniMonth\([^\n]*previous|previous[^\n]*miniMonth/i, 'left info rail should include previous month mini calendar');
assert.match(source, /miniMonth\([^\n]*next|next[^\n]*miniMonth/i, 'left info rail should include next month mini calendar');

const previewBlock = source.slice(source.indexOf('function pageHoldersForItemRaw'), source.indexOf('function pageHoldersForItem('));
assert.match(previewBlock, /createMonthlySpreadCanvasPreview/, 'monthly spread preview should use the shared Canvas renderer');
assert.doesNotMatch(previewBlock, /createCalendarPage\(item\.year,item\.month,\[0,1,2,3\].*createCalendarPage\(item\.year,item\.month,\[4,5,6\]/s, 'old 4+3 unequal spread should be removed');

const specBlock = source.slice(source.indexOf('function pageSpecsForItem'), source.indexOf('function renderPageSpecCanvas'));
assert.match(specBlock, /kind:'monthly-spread'/, 'PDF specs should distinguish monthly spread pages');
assert.match(source, /function\s+drawMonthlySpreadCanvas\s*\(/, 'PDF should have a matching spread renderer');

// The three presets need visibly different typography, not only spacing changes.
for (const style of ['minimal','classic','compact']) {
  assert.match(source, new RegExp(`data-refill-style="${style}"[^\\n]{0,500}font-family|data-refill-style="${style}"[^\\n]*\\{[^}]*font-family`, 'i'), `${style} should define its own font family`);
}
assert.match(source, /serif/i, 'Classic should use a serif/mincho-like typeface');
assert.match(source, /Arial Narrow|Roboto Condensed|sans-serif/i, 'Compact should use a narrow/condensed-friendly typeface');

console.log('v0.8.x layout/style contract passed');
