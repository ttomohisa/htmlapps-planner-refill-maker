import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/index.template.html', import.meta.url), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('../app.config.json', import.meta.url), 'utf8'));
const readme = fs.readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const readmeJa = fs.readFileSync(new URL('../README.ja.md', import.meta.url), 'utf8');

assert.match(config.version, /^1\.0\.(?:0|[1-9]\d*)$/, 'stable release must report a canonical v1.0.x version');
assert.doesNotMatch(source, /<span class="step-badge">v[^<]+<\/span>/, 'settings-card version badge must be removed');
assert.ok(source.includes(`id="versionBadge">v${config.version}</span>`), 'header version fallback must match canonical metadata');
assert.match(source, /outputFilename=\$\('#pdfFilename'\)/, 'template filename control should use the required outputFilename behavior marker');
assert.doesNotMatch(source, /\bpdfFilename=\$\('#pdfFilename'\)/, 'legacy pdfFilename binding should not remain');
assert.match(readme, /## 🚀 Live demo/, 'English README should follow the reference README structure');
assert.match(readme, /## Features/, 'English README should include a Features section');
assert.match(readme, /## Quick start/, 'English README should include a Quick start section');
assert.match(readme, /## Privacy and runtime network protection/, 'English README should explain local processing and runtime network protection');
assert.match(readme, /## Limitations/, 'English README should include limitations');
assert.match(readmeJa, /## 🚀 デモ/, 'Japanese README should follow the reference README structure');
assert.match(readmeJa, /## 主な機能/, 'Japanese README should include a main features section');
assert.match(readmeJa, /## すぐに使う/, 'Japanese README should include a quick start section');
assert.match(readmeJa, /## プライバシーと通信防止/, 'Japanese README should explain local processing and runtime network protection');
assert.match(readmeJa, /## 制限事項/, 'Japanese README should include limitations');

console.log('v1.0.0 release contract: ok');
