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
  'data/sound-signals.js',
  'data/morse.js',
  'data/distress-signals.js',
  'data/flags.js',            // imports morseFor from data/morse.js
  'src/manoeuvre-engine.js',  // no imports; Rules 11 to 18
  'data/manoeuvre-scenarios.js',
  'data/definitions.js',      // links to data/vessel-states.js by id
  'data/rule-text.js',        // structure only; the text is pending a source
  'src/engine.js',
  'src/render-lights.js',
  'src/render-buoy.js',
  'src/render-signal.js',      // draws sound, Morse and audible distress patterns
  'src/render-manoeuvre.js',  // needs manoeuvre-engine
  'src/render-flag.js',       // render-distress draws the NC halyard from it
  'src/render-distress.js',
  'src/audio.js',              // reads the Annex III bands from data/sound-signals.js
  'src/buoyage-questions.js',  // needs data/buoyage.js only
  'src/sound-questions.js',    // needs the data, and describe() from render-signal.js
  'src/distress-questions.js', // needs data/distress-signals.js and data/morse.js
  'src/flag-questions.js',     // needs data/flags.js, sound-signals and render-flag
  'src/manoeuvre-questions.js',
  'src/definition-questions.js',
  'src/rule-text-questions.js', // reads definitions, sound and distress for its stems
  'src/scheduler.js'
];

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/**
 * Strip module syntax, preserving the line count.
 *
 * A statement can span lines. This one is real and it shipped a broken bundle:
 *
 *   import { DEFINITIONS, DEFINITION_BOUNDARIES, definitionsForState }
 *     from '../data/definitions.js';
 *
 * A line-at-a-time matcher that wants a semicolon on the same line skips it,
 * and a bare `import` in a classic script is a SyntaxError that kills the whole
 * page. So the stripper carries state: once a module statement opens, every
 * line is blanked until it closes.
 */
function debundle(source) {
  let open = false;                       // inside an unterminated module statement
  return source
    .split('\n')
    .map(line => {
      if (open) {
        // A statement ends at the first semicolon, or at the specifier that
        // follows `from` when the semicolon is omitted.
        if (/;\s*$/.test(line) || /\bfrom\s+['"][^'"]+['"]\s*;?\s*$/.test(line)) open = false;
        return '';
      }
      if (/^import\b/.test(line) || /^export\s*\{/.test(line)) {
        const terminated = /;\s*$/.test(line) || /^export\s*\{[^}]*\}\s*$/.test(line);
        if (!terminated) open = true;
        return '';
      }
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

// Exported so the test suite can check the list the build actually uses,
// rather than a copy of it that can drift out of step.
module.exports = { MODULES, build };

if (require.main === module) {
  const bundle = build();
  console.log(
    `aspect-standalone.html  ${bundle.split('\n').length - 1} lines, ` +
    `${Buffer.byteLength(bundle)} bytes, ${MODULES.length + 1} sections`
  );
}
