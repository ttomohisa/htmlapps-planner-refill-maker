import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function parts(version) {
  if (typeof version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error('Release versions must use stable MAJOR.MINOR.PATCH without a v prefix.');
  }
  return version.split('.').map(BigInt);
}

export function decideRelease({ eventName, currentVersion, previousVersion, requestedVersion, tagExists = false }) {
  const current = parts(currentVersion);
  if (eventName === 'workflow_dispatch') {
    parts(requestedVersion);
    if (requestedVersion !== currentVersion) {
      throw new Error('The requested version must exactly match app.config.json.');
    }
    if (tagExists) throw new Error('The requested tag already exists; do not overwrite a release.');
    return { publish: true, version: currentVersion, reason: 'Manual release requested.' };
  }
  if (eventName !== 'push') throw new Error('Unexpected release event.');
  const previous = parts(previousVersion);
  if (currentVersion === previousVersion) {
    return { publish: false, version: currentVersion, reason: 'The app version has not changed.' };
  }
  const comparison = current.findIndex((component, index) => component !== previous[index]);
  if (comparison < 0 || current[comparison] < previous[comparison]) {
    throw new Error('The app version must increase before an automatic release.');
  }
  if (tagExists) {
    return { publish: false, version: currentVersion, reason: 'The version tag already exists; inspect the existing release.' };
  }
  return { publish: true, version: currentVersion, reason: 'The main-branch app version increased.' };
}

function run() {
  const eventName = process.env.RELEASE_EVENT;
  const currentVersion = JSON.parse(readFileSync('app.config.json', 'utf8')).version;
  let previousVersion;
  if (eventName === 'push') {
    const before = process.env.RELEASE_BEFORE || '';
    if (!/^[0-9a-f]{40}$/i.test(before) || /^0{40}$/.test(before)) {
      throw new Error('Could not identify the previous main-branch commit.');
    }
    // An unshallow checkout is required: a push can contain multiple commits.
    const oldConfig = execFileSync('git', ['show', `${before}:app.config.json`], { encoding: 'utf8' });
    previousVersion = JSON.parse(oldConfig).version;
  }
  const requestedVersion = process.env.RELEASE_INPUT || '';
  const tentative = decideRelease({ eventName, currentVersion, previousVersion, requestedVersion });
  let tagExists = false;
  if (tentative.publish) {
    const tag = `refs/tags/v${currentVersion}`;
    tagExists = Boolean(execFileSync('git', ['ls-remote', '--tags', 'origin', tag], { encoding: 'utf8' }).trim());
  }
  const result = decideRelease({ eventName, currentVersion, previousVersion, requestedVersion, tagExists });
  console.log(`Release: ${result.publish ? 'publish' : 'skip'} v${result.version} — ${result.reason}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `publish=${result.publish}\nversion=${result.version}\n`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Release decision\n${result.publish ? 'Publish' : 'Skip'} v${result.version}: ${result.reason}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { run(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
