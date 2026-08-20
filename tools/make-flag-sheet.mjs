/**
 * Renders docs/flags.html: every flag at a size you can actually judge.
 *
 * This exists because no test can tell you a flag design is right. A test can
 * say the SVG is well formed, that the vocabulary is closed, that nothing is
 * NaN — and all of that passes just as happily on a flag drawn wrong. Only eyes
 * settle it, so the sheet is a deliverable rather than a convenience.
 *
 * Entries marked `verify` are called out, because those are the ones that most
 * need looking at against Pub 102.
 *
 * Run: node tools/make-flag-sheet.mjs
 */
import { writeFileSync } from 'node:fs';
import { FLAG_GROUPS, NEEDS_VERIFYING } from '../data/flags.js';
import { renderFlag } from '../src/render-flag.js';

const card = f => `
  <figure class="${f.verify ? 'check' : ''}">
    ${renderFlag(f, { width: 190 })}
    <figcaption>
      <b>${f.letter || f.numeral}</b>
      <span>${f.phonetic}</span>
      <em>${f.design.type}${f.shape !== 'rectangle' ? ` · ${f.shape}` : ''}</em>
      ${f.verify ? '<u>check against Pub 102</u>' : ''}
    </figcaption>
  </figure>`;

const groups = FLAG_GROUPS.map(g => `
  <section>
    <h2>${g.name} <small>${g.flags.length}</small></h2>
    <div class="row">${g.flags.map(card).join('')}</div>
  </section>`).join('');

writeFileSync('docs/flags.html', `<!doctype html><meta charset="utf-8"><title>Code flags</title>
<style>
body{font:14px/1.45 system-ui;margin:0;padding:26px;background:#E7EEF0;color:#10222C}
h1{font-size:21px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 6px}
.lede{max-width:70ch;color:#4A626E;margin:0 0 22px}
.lede b{color:#C3006B}
section{margin:0 0 26px;border-top:1px solid rgba(16,34,44,.2);padding-top:12px}
h2{font-size:12px;letter-spacing:.18em;text-transform:uppercase;margin:0 0 12px;color:#C3006B}
h2 small{color:#4A626E;letter-spacing:0}
.row{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:18px}
figure{margin:0;background:#fff;border:1px solid rgba(16,34,44,.25);padding:12px}
figure.check{border-color:#C3006B;border-width:2px;background:#fff8fb}
figure svg{display:block;width:100%;height:auto}
figcaption{margin-top:8px;display:flex;flex-direction:column;gap:2px}
figcaption b{font-size:17px}
figcaption span{font-size:13px;color:#4A626E}
figcaption em{font:10px ui-monospace,monospace;color:#4A626E;font-style:normal;letter-spacing:.06em}
figcaption u{font:10px ui-monospace,monospace;color:#C3006B;text-decoration:none;letter-spacing:.08em;text-transform:uppercase}
</style>
<h1>International Code of Signals — flags</h1>
<p class="lede">Every design is generated from geometry in <code>data/flags.js</code>, not traced.
No test can tell you a flag is <em>right</em>, only that it is well formed, so this sheet is how
the designs get checked. <b>${NEEDS_VERIFYING.length} entries are marked in magenta</b>: their
geometry was not verified against Pub 102 and needs your eye before anyone learns from it.</p>
${groups}`);

console.log(`docs/flags.html written — ${FLAG_GROUPS.reduce((n, g) => n + g.flags.length, 0)} flags, ` +
  `${NEEDS_VERIFYING.length} flagged for checking`);
