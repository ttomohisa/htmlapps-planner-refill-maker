import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

export function prepareRelease(root, version) {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'app.config.json'), 'utf8'));
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version) || version !== config.version) {
    throw new Error('Enter the exact stable version from app.config.json (without v).');
  }
  const readable = fs.readFileSync(path.join(root, 'dist/index.html'));
  const wrapper = fs.readFileSync(path.join(root, 'dist/index.self-extract.html'));
  const embeddedConfig = readable.toString('utf8').match(/const APP_CONFIG = (\{[^;]+\});/);
  if (!embeddedConfig || JSON.parse(embeddedConfig[1]).version !== version) {
    throw new Error('The readable build version does not match the release version.');
  }
  const payload = wrapper.toString('utf8').match(/<script\s+id="self-extract-payload"\s+type="application\/octet-stream">([A-Za-z0-9+/=\r\n]+)<\/script>/);
  if (!payload || !gunzipSync(Buffer.from(payload[1], 'base64')).equals(readable)) {
    throw new Error('The self-extract payload does not match the readable build.');
  }
  const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  const heading = `## [${version}]`;
  const start = changelog.indexOf(heading);
  if (start < 0) throw new Error('The release needs a matching CHANGELOG.md section.');
  const end = changelog.indexOf('\n## ', start + heading.length);
  const notes = changelog.slice(start, end < 0 ? undefined : end).trim() + '\n';
  const stem = `${config.slug}-v${version}`;
  const assets = [[`${stem}.html`, readable], [`${stem}.self-extract.html`, wrapper]];
  const checksums = assets.map(([name, bytes]) => `${createHash('sha256').update(bytes).digest('hex')}  ${name}`).join('\n') + '\n';
  const directory = path.join(root, 'dist/release');
  // All validations precede writes; failed preparation leaves existing files intact.
  fs.mkdirSync(directory, { recursive: true });
  for (const [name, bytes] of assets) fs.writeFileSync(path.join(directory, name), bytes);
  fs.writeFileSync(path.join(directory, 'SHA256SUMS.txt'), checksums);
  fs.writeFileSync(path.join(directory, 'release-notes.md'), notes);
  return { tag: `v${version}`, stem, directory };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = prepareRelease(process.cwd(), process.argv[2] || '');
    console.log(`Prepared ${result.tag}: ${result.directory}`);
  } catch (error) {
    console.error(error.message); process.exitCode = 1;
  }
}
