/**
 * A reporter, not a framework.
 *
 * The checks here are almost all "render the thing and measure what came out",
 * so what matters is that a failure says which state, which aspect and what the
 * number actually was. Anything that only tells you a boolean was false costs
 * an hour of bisecting later.
 */
export function reporter(title) {
  let failures = 0;
  let checks = 0;
  console.log(`\n${title}`);
  return {
    section(text) {
      console.log(`  ${text}`);
    },
    ok(label, condition, detail = '') {
      checks++;
      if (!condition) failures++;
      console.log(`    ${condition ? 'pass' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
    },
    get failures() { return failures; },
    get checks() { return checks; }
  };
}
