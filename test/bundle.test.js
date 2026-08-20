/**
 * Does the built page actually run?
 *
 * This suite exists because two releases shipped a bundle that threw the moment
 * a browser loaded it, and every other check was green both times. Parsing a
 * file proves it is well formed; it proves nothing about whether the app comes
 * up. So this one starts the bundle behind a DOM stub and watches for a throw.
 *
 * The parse check is done with vm.Script rather than `node --check`. That is
 * not fussiness: Node auto-detects ES modules, so `node --check bundle.js`
 * cheerfully accepted a bundle containing a bare `import` statement — which is
 * precisely the fault that broke the page. A browser evaluating a classic
 * <script> has no such fallback, and vm.Script models that exactly.
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const HTML = () => readFileSync('aspect-standalone.html', 'utf8');

/**
 * The app's script block, found by what is in it rather than by position.
 *
 * "The first <script> in the file" was true until the head gained a four line
 * script that sets the theme before first paint. From that commit until this
 * one, every check below was reading those four lines instead of the app —
 * parsing them, running them, finding no module syntax in them, and passing.
 * A whole suite went quietly vacuous, which is the exact failure it exists to
 * prevent.
 *
 * So it now searches for the block carrying the first module banner, and
 * bundleSanity() below refuses to let a wrong or empty extraction pass as a
 * green run.
 */
const BANNER = '/* ===== vendor/ts-fsrs.js ===== */';

function bundleScript() {
  const html = HTML();
  const at = html.lastIndexOf('<script>', html.indexOf(BANNER));
  if (at < 0) return '';
  const open = at + '<script>'.length;
  return html.slice(open, html.indexOf('\n</script>', open));
}

/** Just enough DOM to get through startup. */
function stubDocument(declaredIds, missing) {
  const cache = new Map();
  const el = id => ({
    id, _t: '', _h: '', dataset: {}, style: {}, children: [], options: [],
    value: '', checked: false, disabled: false, selectedIndex: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    get selectedOptions() { return [{ textContent: '' }]; },
    get textContent() { return this._t; }, set textContent(v) { this._t = String(v); },
    get innerHTML() { return this._h; }, set innerHTML(v) { this._h = String(v); },
    addEventListener() {}, removeEventListener() {},
    appendChild(c) { this.children.push(c); return c; },
    setAttribute() {}, getAttribute: () => null,
    querySelector: () => null, querySelectorAll: () => [], closest: () => null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    scrollIntoView() {}
  });
  return {
    getElementById(id) {
      if (!declaredIds.has(id)) missing.add(id);
      if (!cache.has(id)) cache.set(id, el(id));
      return cache.get(id);
    },
    createElement: () => el('created'),
    querySelectorAll: () => [], querySelector: () => null,
    documentElement: el('html'), body: el('body'), addEventListener() {}
  };
}

export default function run(t) {
  const html = HTML();
  const code = bundleScript();

  t.section('the suite is looking at the app');
  // Every check below is worthless if the wrong block was extracted, and a
  // wrong block passes them all cheerfully. This is the check on the checks.
  t.ok('the extracted block is the bundle, not another script on the page',
    code.includes(BANNER) && code.includes("/* ===== app ===== */"),
    `${Math.round(code.length / 1024)} KB extracted from ` +
    `${(html.match(/<script[ >]/g) || []).length} script tags`);
  t.ok('and it is the whole of it', code.length > 200_000 &&
    code.includes('/* ===== src/scheduler.js ===== */'),
    `${code.split('\n').length} lines`);

  t.section('no module syntax survives into a classic script');
  const stray = code.split('\n')
    .map((l, i) => ({ l, n: i + 1 }))
    .filter(({ l }) => /^import\b/.test(l) || /^export\b/.test(l) || /^\s*from\s+['"]/.test(l));
  // Multi-line imports are the ones that get through a naive stripper.
  t.ok('no import or export statement reaches the bundle', stray.length === 0,
    stray.slice(0, 3).map(s => `line ${s.n}: ${s.l.trim().slice(0, 46)}`).join(' | ')
    || `${code.split('\n').length} lines`);

  t.section('the bundle parses as a classic script');
  // vm.Script, not node --check: Node's module auto-detection accepted a
  // bundle with a bare import in it and reported success.
  let parseError = null;
  try {
    new vm.Script(code, { filename: 'aspect-standalone.html' });
  } catch (err) {
    parseError = err;
  }
  t.ok('parses with no ESM fallback available', parseError === null,
    parseError ? parseError.message : `${Math.round(code.length / 1024)} KB`);

  t.section('the app starts without throwing');
  const declared = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  const missing = new Set();
  const store = new Map();
  const doc = stubDocument(declared, missing);
  const sandbox = {
    document: doc, console: { log() {}, warn() {}, error() {} },
    Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, RegExp, Error,
    isNaN, parseInt, parseFloat, Float32Array, Promise, Intl,
    localStorage: {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k)
    },
    window: {
      matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
      addEventListener() {}, AudioContext: undefined
    },
    navigator: { userAgent: 'node' }, requestAnimationFrame: () => 0
  };
  sandbox.window.document = doc;
  sandbox.window.localStorage = sandbox.localStorage;
  sandbox.globalThis = sandbox;

  let runError = null;
  try {
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { filename: 'aspect-standalone.html', timeout: 30000 });
  } catch (err) {
    runError = err;
  }
  t.ok('startup completes with no exception', runError === null,
    runError ? `${runError.message}` : 'all nine tabs built');

  // A missing id is not fatal on its own — the stub invents one — but it means
  // the app is reaching for something the markup does not have.
  t.ok('the app asks for no element the markup does not declare',
    missing.size === 0,
    [...missing].slice(0, 4).join(', ') || `${declared.size} ids declared`);

  t.section('the offline file is self-contained');
  t.ok('no script or style is loaded from elsewhere',
    !/<script[^>]+src=/.test(html) && !/@import/.test(html));
  // The canonical link is the one non-font URL, and it is not a resource: it
  // tells a crawler which copy is the real one, and the page never fetches it.
  // Anything else pointing off-machine would break the offline promise.
  const links = html.match(/<link[^>]+href="https?:\/\/[^"]+"/g) || [];
  t.ok('nothing is fetched from off-machine except the fonts',
    links.every(l => /fonts\.g/.test(l) || /rel="canonical"/.test(l)),
    links.filter(l => !/fonts\.g|canonical/.test(l)).join(' ') || 'fonts, and one canonical');
}
