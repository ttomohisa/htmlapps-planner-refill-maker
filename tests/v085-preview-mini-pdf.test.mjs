import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/index.template.html', import.meta.url), 'utf8');

assert.match(source, /html\[data-line-weight="light"\][^{]*\.calendar-grid[^{]*\{[^}]*border-color\s*:\s*#f0f2f1/s, 'light rules should be visibly lighter in browser preview');

assert.match(source,
  /html\[data-line-weight="light"\][^\{]*\.calendar-grid[^\{]*\{[^}]*border-(?:left|top)-width\s*:\s*\.5px/s,
  'light line weight should reduce browser calendar grid border width');
assert.match(source,
  /html\[data-line-weight="light"\][^\{]*\.day-cell[^\{]*\{[^}]*border-(?:right|bottom)-width\s*:\s*\.5px/s,
  'light line weight should reduce browser day-cell border width');

assert.match(source,
  /\.mini-day\.blank\.saturday\s*,\s*\.mini-day\.blank\.sunday\s*\{[^}]*color\s*:\s*transparent/s,
  'adjacent mini-calendar weekend cells must stay hidden');

assert.match(source,
  /pdfRailOffsetX\s*:\s*-?\.0[4-9]/,
  'monthly spread PDF rail should define a left offset');
assert.match(source,
  /pdfMonthScale\s*:\s*1\.[1-9]/,
  'monthly spread PDF month should be enlarged');
assert.match(source,
  /pdfYearScale\s*:\s*1\.[1-9]/,
  'monthly spread PDF year should be enlarged');
assert.match(source,
  /railCenter\s*=\s*mx\+colW\*\(\.5\+railMetrics\.pdfRailOffsetX\)/,
  'PDF rail content should use the shared left offset');
assert.match(source,
  /numberSize=Math\.max\(18,w\*\.054\)\*railMetrics\.pdfMonthScale/,
  'PDF Japanese month number should use the enlargement scale');
assert.match(source,
  /Math\.max\(6,w\*\.013\)\*railMetrics\.pdfYearScale/,
  'PDF year should use the enlargement scale');

console.log('v0.8.5 preview/mini/PDF regression contract: ok');
