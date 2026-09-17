import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/index.template.html', import.meta.url), 'utf8');

assert.match(source, /appearanceSettingsTitle:'見た目'/, 'Japanese appearance section should be labeled 見た目 only');
assert.match(source, /appearanceSettingsTitle:'Appearance'/, 'English appearance section should be labeled Appearance only');

assert.match(source, /const\s+MONTHLY_SPREAD_RAIL\s*=\s*Object\.freeze\(/, 'monthly spread rail should have shared layout metrics');
const previewStart = source.indexOf('function createMonthlySpreadPage');
const previewEnd = source.indexOf('function createCalendarPage', previewStart);
const previewBlock = source.slice(previewStart, previewEnd);
assert.match(previewBlock, /MONTHLY_SPREAD_RAIL/, 'browser monthly spread should use shared rail metrics');

const pdfStart = source.indexOf('function drawMonthlySpreadCanvas');
const pdfEnd = source.indexOf('function drawMiniMonthCanvas', pdfStart);
const pdfBlock = source.slice(pdfStart, pdfEnd);
assert.match(pdfBlock, /MONTHLY_SPREAD_RAIL/, 'PDF monthly spread should use the same shared rail metrics');

const renderStart = source.indexOf('function renderPageSpecCanvas');
const renderEnd = source.indexOf('function jpegBytes', renderStart);
const renderBlock = source.slice(renderStart, renderEnd);
assert.doesNotMatch(renderBlock, /drawPageLabel\s*\(/, 'preview-only left/right page labels must not be drawn into PDF output');

console.log('v0.8.4 preview/PDF parity contract: ok');
