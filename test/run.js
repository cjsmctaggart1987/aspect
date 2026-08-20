/**
 * Runs every suite and exits non-zero if anything failed.
 *
 * These import the real modules straight out of the repo, which only became
 * possible once package.json stopped claiming the ES modules were CommonJS.
 * src/scheduler.js is the one thing not covered here: it needs localStorage,
 * so it is exercised in a browser instead.
 */
import { reporter } from './harness.js';
import engine, { checkBundleNamespace } from './engine.test.js';
import { readFileSync } from 'node:fs';
import { MODULES } from '../build.cjs';
import silhouette from './silhouette.test.js';
import buoyage from './buoyage.test.js';
import sound from './sound.test.js';
import distress from './distress.test.js';
import flags from './flags.test.js';
import ui from './ui.test.js';

const suites = [
  ['engine — arcs, and lights on the hull', engine],
  ['silhouette — profiles and projection', silhouette],
  ['buoyage — patterns, strips and the night lamp', buoyage],
  ['sound — signals, timings, cards and strips', sound],
  ['distress — Annex IV, Morse timing and prosigns', distress],
  ['flags — code flags, designs and cross-links', flags],
  ['ui — every section reachable, nothing stranded', ui],
  // Reads build.cjs's own module list, so adding a module to the bundle
  // automatically brings it under this check.
  ['bundle — one shared scope', t => checkBundleNamespace(t, f => readFileSync(f, 'utf8'), MODULES)]
];

let failures = 0;
let checks = 0;

for (const [title, run] of suites) {
  const t = reporter(title);
  try {
    await run(t);
  } catch (err) {
    t.ok(`suite threw: ${err.message}`, false);
  }
  failures += t.failures;
  checks += t.checks;
}

console.log(failures
  ? `\n${failures} of ${checks} checks FAILED`
  : `\nall green — ${checks} checks`);
process.exit(failures ? 1 : 0);
