/**
 * Runs every suite and exits non-zero if anything failed.
 *
 * These import the real modules straight out of the repo, which only became
 * possible once package.json stopped claiming the ES modules were CommonJS.
 * src/scheduler.js is the one thing not covered here: it needs localStorage,
 * so it is exercised in a browser instead.
 */
import { reporter } from './harness.js';
import engine from './engine.test.js';
import silhouette from './silhouette.test.js';
import buoyage from './buoyage.test.js';

const suites = [
  ['engine — arcs, and lights on the hull', engine],
  ['silhouette — profiles and projection', silhouette],
  ['buoyage — patterns, strips and the night lamp', buoyage]
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
