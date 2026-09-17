import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const source = fs.readFileSync('src/index.template.html','utf8');
const config = JSON.parse(fs.readFileSync('app.config.json','utf8'));
const faviconBytes = fs.readFileSync('assets/favicon.svg');
const favicon = faviconBytes.toString('utf8').trim();
const faviconSha256 = crypto.createHash('sha256').update(faviconBytes).digest('hex');

assert.match(config.version, /^(?:0\.8\.[1-9]|0\.9\.\d+|[1-9]\d*\.\d+\.\d+)$/, 'version should include the v0.8.1 feature set or later');
assert.equal(faviconSha256, '7b58c79e147c39125d4c304d7eec53a514735cbb4f5fcae9bb3580534ce4b80b', 'favicon should exactly match the supplied SVG');

for (const id of ['saturdayColor','sundayColor','holidayColor']) {
  assert.match(source, new RegExp(`id="${id}"[^>]*type="color"|type="color"[^>]*id="${id}"`), `${id} color input should exist`);
}
assert.match(source, /id="showHolidayNames"[^>]*type="checkbox"|type="checkbox"[^>]*id="showHolidayNames"/, 'holiday-name toggle should exist');

for (const key of ['saturdayColor','sundayColor','holidayColor','showHolidayNames']) {
  assert.match(source, new RegExp(`\\b${key}\\b`), `${key} should participate in app state`);
}

assert.match(source, /function\s+dateAccentColor\s*\(/, 'dateAccentColor helper should exist');
assert.match(source, /holiday[^\n]{0,240}showHolidayNames|showHolidayNames[^\n]{0,240}holiday/i, 'holiday names should be conditionally rendered');
const sigStart = source.indexOf('function settingsSignature()');
const sigBlock = source.slice(sigStart, sigStart + 1800);
for (const key of ['saturdayColor','sundayColor','holidayColor','showHolidayNames']) assert.match(sigBlock, new RegExp(key), `${key} should invalidate generated PDFs`);
const persistStart = source.indexOf('function persistSettings()');
const persistBlock = source.slice(persistStart, persistStart + 1500);
for (const key of ['saturdayColor','sundayColor','holidayColor','showHolidayNames']) assert.match(persistBlock, new RegExp(key), `${key} should be persisted`);
assert.match(source, /--saturday-color/, 'Saturday color should be applied through page style variables');
assert.match(source, /--sunday-color/, 'Sunday color should be applied through page style variables');
assert.match(source, /--holiday-color/, 'Holiday color should be applied through page style variables');

console.log('v0.8.1 feature contract passed');
