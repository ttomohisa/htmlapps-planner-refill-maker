import fs from 'node:fs';
import vm from 'node:vm';

// A small DOM/Canvas adapter: the production script, event handlers, validators,
// page calculations, and PDF writer all run unchanged. Canvas calls are recorded
// because Node has no browser renderer; browser QA covers the actual raster output.
export function loadPlanner(file = process.env.PLANNER_HTML || 'src/index.template.html', { savedSettings, savedRaw, storageFailures = {}, language = 'en' } = {}) {
  const html = fs.readFileSync(file, 'utf8');
  const elements = [], downloads = [], revoked = [], errors = [], frames = [];
  const raster = { paused: false, pending: [] };
  const storage = new Map(), storageCalls = [];
  if (savedRaw !== undefined || savedSettings !== undefined) storage.set('planner-refill-maker:settings:v1', savedRaw ?? JSON.stringify(savedSettings));
  const windowListeners = {};
  class Element {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase(); this.children = []; this.dataset = {};
      this.attributes = {}; this.listeners = {}; this.value = ''; this.checked = false;
      this.disabled = false; this.hidden = false; this.textContent = ''; this.className = '';
      this.style = { setProperty(key, value) { this[key] = value; } };
      this.classList = {
        add: name => { this.className += ` ${name}`; },
        remove: name => { this.className = this.className.split(/\s+/).filter(x => x !== name).join(' '); },
        toggle: (name, on) => on ? this.classList.add(name) : this.classList.remove(name),
      };
    }
    setAttribute(key, value) { this.attributes[key] = String(value); if (key === 'id') this.id = value; }
    addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
    async emit(type, extra = {}) { for (const handler of this.listeners[type] || []) await handler({ currentTarget: this, target: this, preventDefault() {}, ...extra }); }
    append(...items) { for (const item of items) { item.parent = this; this.children.push(item); } }
    replaceChildren(...items) { this.children = []; this.append(...items); }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
    querySelectorAll(selector) { return descendants(this).filter(el => matches(el, selector)); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    getBoundingClientRect() { return { width: 640, height: 720, left: 0, top: 0, right: 640, bottom: 720 }; }
    click() { if (this.tagName === 'A') downloads.push({ filename: this.download, url: this.href }); else return this.emit('click'); }
    focus() { document.activeElement = this; }
    get isConnected() { return true; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    getContext() {
      if (this.ctx) return this.ctx;
      const calls = [];
      this.ctx = new Proxy({ calls, measureText: text => ({ width: String(text).length * 6 }) }, {
        get(target, key) { return key in target ? target[key] : (...args) => calls.push([key, ...args]); },
      });
      return this.ctx;
    }
    toBlob(callback) { const complete = () => callback(new Blob([new Uint8Array([255, 216, 255, 217])], { type: 'image/jpeg' })); if (raster.paused) raster.pending.push(complete); else complete(); }
  }
  function descendants(el) { return el.children.flatMap(child => [child, ...descendants(child)]); }
  function matches(el, selectors) {
    return selectors.split(',').some(raw => {
      const selector = raw.trim();
      if (selector.startsWith('#')) return el.id === selector.slice(1);
      if (selector.startsWith('.')) return el.className.split(/\s+/).includes(selector.slice(1));
      const tag = selector.match(/^[a-z]+/i)?.[0];
      if (tag && el.tagName !== tag.toUpperCase()) return false;
      return [...selector.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)].every(([, key, val]) => {
        const actual = key.startsWith('data-') ? el.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] : el[key] ?? el.attributes[key];
        return val === undefined ? actual !== undefined : String(actual) === val;
      });
    });
  }
  for (const [, tag, attrs] of html.matchAll(/<(\w+)\b([^<>]*)>/g)) {
    const el = new Element(tag);
    for (const [, name, quoted, bare] of attrs.matchAll(/([^\s=]+)(?:=(?:"([^"]*)"|([^\s>]+)))?/g)) {
      const value = quoted ?? bare ?? '';
      if (name.startsWith('data-')) el.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      else if (name === 'class') el.className = value;
      else if (['checked', 'disabled', 'hidden'].includes(name)) el[name] = true;
      else { el[name] = value; el.attributes[name] = value; }
    }
    elements.push(el);
  }
  const document = {
    documentElement: new Element('html'), body: new Element('body'),
    querySelector: selector => elements.find(el => matches(el, selector)) || null,
    querySelectorAll: selector => elements.filter(el => matches(el, selector)),
    createElement: tag => new Element(tag), addEventListener() {},
  };
  const urls = new Map();
  const context = vm.createContext({
    document, navigator: { language }, HTMLInputElement: Element, HTMLElement: Element,
    localStorage: { getItem(key) { storageCalls.push(['get', key]); if (storageFailures.get) throw new Error('Storage unavailable'); return storage.get(key) ?? null; }, setItem(key, value) { storageCalls.push(['set', key, value]); if (storageFailures.set) throw new Error('Storage quota'); storage.set(key, value); }, removeItem(key) { storageCalls.push(['remove', key]); if (storageFailures.remove) throw new Error('Storage unavailable'); storage.delete(key); } },
    Blob, TextEncoder, TextDecoder, Uint8Array, Response, DecompressionStream, atob,
    console: { error: error => errors.push(error) },
    URL: { createObjectURL: blob => { const url = `blob:test-${urls.size}`; urls.set(url, blob); return url; }, revokeObjectURL: url => revoked.push(url) },
    setTimeout: () => 1, clearTimeout() {},
    requestAnimationFrame: callback => { frames.push(callback); return frames.length; },
    innerWidth: 1360, addEventListener(type, handler) { (windowListeners[type] ||= []).push(handler); }, confirm: () => true,
  });
  context.window = context;
  let script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1]
    .replace('__APP_CONFIG_JSON__', fs.readFileSync('app.config.json', 'utf8'))
    .replace('__BUILD_MANIFEST_JSON__', '{}').replace('__EMBEDDED_ASSET_BUNDLE_JSON__', '{}');
  script = script.replace(/\}\)\(\);\s*$/, `globalThis.app = { state, generatedPdf, render, createPdf, saveGeneratedPdf, createSizeTestPdf, settingsSignature, setPreset, setRefillType, createPatternPage, drawPatternCanvas, renderPageSpecCanvas, allPageSpecs, impositionPlan, sheetCountForPlan, paddedPageCount }; })();`);
  vm.runInContext(script, context, { filename: file });
  async function drain() { for (let n = 0; n < 100; n++) { const jobs = frames.splice(0); jobs.forEach(job => job()); await new Promise(resolve => setImmediate(resolve)); if (!frames.length) break; } }
  async function run(action) { let done = false; const task = action().finally(() => { done = true; }); while (!done) await drain(); return task; }
  async function input(id, value, type = 'input') { const el = document.querySelector(`#${id}`); el.value = value; await el.emit(type); await drain(); return el; }
  async function radio(name, value) { const el = document.querySelector(`input[name="${name}"][value="${value}"]`); if (!el) throw new Error(`Missing radio ${name}=${value}`); document.querySelectorAll(`input[name="${name}"]`).forEach(item => { item.checked = item === el; }); await el.emit('change'); await drain(); }
  async function windowEvent(type) { for (const handler of windowListeners[type] || []) await handler(); }
  return { storage, storageCalls, windowEvent, app: context.app, get: id => document.querySelector(`#${id}`), input, radio, run, drain, urls, downloads, revoked, errors, context, raster };
}
