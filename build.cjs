#!/usr/bin/env node
/**
 * Regenerates aspect-standalone.html from index.html plus the ES modules.
 *
 * The bundle is a single classic <script>, so module boundaries have to
 * survive as comments and the module syntax has to go. Two rules do it:
 *
 *   1. `export ` is stripped from the front of a top-level declaration.
 *   2. An import statement is blanked, not deleted. Keeping the line means
 *      line numbers in the bundle still match line numbers in the source,
 *      which is the difference between a readable stack trace and a useless
 *      one. It is also what makes the build reproducible byte for byte.
 *
 * Everything else is copied verbatim: the modules are concatenated in
 * dependency order behind their banner comments, and index.html supplies the
 * head, CSS and markup unchanged.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'aspect-standalone.html');

// Dependency order. Nothing here may reference anything below it.
const MODULES = [
  'vendor/ts-fsrs.js',
  'data/vessel-states.js',
  'data/buoyage.js',
  'src/engine.js',
  'src/render-lights.js',
  'src/render-buoy.js',
  'src/scheduler.js'
];

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/** Strip module syntax, preserving the line count. */
function debundle(source) {
  return source
    .split('\n')
    .map(line => {
      if (/^import\b[^;]*;\s*$/.test(line)) return '';        // blank, do not delete
      if (/^export\s*\{[^}]*\}\s*;?\s*$/.test(line)) return ''; // `export { LIGHT_HEX };`
      return line.replace(/^export (?=(const|let|var|function|class|async)\b)/, '');
    })
    .join('\n')
    .replace(/\n+$/, '');                                     // no trailing blank lines
}

const section = (name, source) => `/* ===== ${name} ===== */\n${debundle(source)}`;

function build() {
  const html = read('index.html');

  const openTag = '<script type="module">\n';
  const closeTag = '\n</script>';
  const open = html.indexOf(openTag);
  const close = html.indexOf(closeTag, open);
  if (open < 0 || close < 0) {
    throw new Error('index.html: could not find the <script type="module"> block');
  }

  const app = html.slice(open + openTag.length, close + 1);
  const sections = [
    ...MODULES.map(f => section(f, read(f))),
    section('app', app)
  ];

  const bundle =
    html.slice(0, open) +
    '<script>\n\n' +
    sections.join('\n\n\n') +
    '\n' +
    html.slice(close + 1);

  fs.writeFileSync(OUT, bundle);
  return bundle;
}

const bundle = build();
console.log(
  `aspect-standalone.html  ${bundle.split('\n').length - 1} lines, ` +
  `${Buffer.byteLength(bundle)} bytes, ${MODULES.length + 1} sections`
);
