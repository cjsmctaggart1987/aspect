/**
 * Renders docs/manoeuvres.html: every scenario, its plan, and what the engine
 * makes of it.
 *
 * The outcomes are resolved by the engine rather than read from the scenario
 * file, so this sheet shows what the app will actually say — not what the
 * fixture claims it should. If the two ever diverge, the tests fail and this
 * sheet shows the divergence.
 *
 * Run: node tools/make-manoeuvre-sheet.mjs
 */
import { writeFileSync } from 'node:fs';
import { MANOEUVRE_SCENARIOS, SCENARIO_CATEGORIES } from '../data/manoeuvre-scenarios.js';
import { resolveManoeuvre, CATEGORY_NAMES } from '../src/manoeuvre-engine.js';
import { renderManoeuvre } from '../src/render-manoeuvre.js';

const ROLE_LABEL = {
  'give-way': 'give-way', 'stand-on': 'stand-on', 'both-give-way': 'both give way'
};

const card = s => {
  const o = resolveManoeuvre({
    own: s.own, target: s.target, targetBearing: s.targetBearing,
    ownBearingFromTarget: s.ownBearingFromTarget, inSight: s.inSight,
    standOnStage: s.standOnStage || 'course-and-speed'
  });
  const role = o.notApplicable ? 'not applicable' : (ROLE_LABEL[o.role] || 'none');
  return `
  <figure>
    ${renderManoeuvre(s, { width: 230 })}
    <figcaption>
      <h3>${s.title}</h3>
      <div class="meta">
        <span class="you">you: ${CATEGORY_NAMES[s.own.category]}${s.own.tack ? `, ${s.own.tack} tack` : ''}</span>
        <span class="her">her: ${CATEGORY_NAMES[s.target.category]}${s.target.tack ? `, ${s.target.tack} tack` : ''}</span>
        <span>${s.inSight ? 'in sight' : 'not in sight'}${s.standOnStage ? ` · ${s.standOnStage}` : ''}</span>
      </div>
      <div class="role ${o.notApplicable ? 'na' : o.role}">${role}${o.doubt ? ' · doubt' : ''}</div>
      <div class="rules">${o.rules.join(' · ')}</div>
      <ol>${(o.notApplicable ? [o.notApplicable.reason] : o.obligations)
        .map(x => `<li>${x}</li>`).join('')}</ol>
      <p>${s.explanation}</p>
    </figcaption>
  </figure>`;
};

const groups = SCENARIO_CATEGORIES.map(cat => `
  <section>
    <h2>${cat}</h2>
    <div class="row">${MANOEUVRE_SCENARIOS.filter(s => s.category === cat).map(card).join('')}</div>
  </section>`).join('');

writeFileSync('docs/manoeuvres.html', `<!doctype html><meta charset="utf-8"><title>Manoeuvres</title>
<style>
body{font:14px/1.5 system-ui;margin:0;padding:26px;background:#E7EEF0;color:#10222C}
h1{font-size:21px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 6px}
.lede{max-width:74ch;color:#4A626E;margin:0 0 24px}
.lede b{color:#C3006B}
section{margin:0 0 28px;border-top:1px solid rgba(16,34,44,.2);padding-top:12px}
h2{font-size:12px;letter-spacing:.18em;text-transform:uppercase;margin:0 0 14px;color:#C3006B}
.row{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:18px}
figure{margin:0;background:#fff;border:1px solid rgba(16,34,44,.25);padding:14px;display:flex;gap:14px}
figure svg{flex:0 0 190px;width:190px;height:190px}
figcaption{flex:1}
h3{font-size:15px;margin:0 0 6px;font-weight:500}
.meta{font:10.5px ui-monospace,monospace;color:#4A626E;display:flex;flex-direction:column;gap:1px;margin-bottom:7px}
.meta .her{color:#C3006B}
.role{display:inline-block;font:10px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;
  padding:2px 8px;border-radius:2px;color:#fff;background:#4A626E;margin-bottom:6px}
.role.give-way{background:#C3006B}
.role.stand-on{background:#0E9E4F}
.role.both-give-way{background:#B45309}
.role.na{background:#4A626E}
.rules{font:10.5px ui-monospace,monospace;color:#4A626E;margin-bottom:7px}
ol{margin:0 0 8px;padding-left:18px;font-size:13px}
li{margin-bottom:4px}
figcaption p{font-size:13px;color:#4A626E;font-style:italic;margin:0}
</style>
<h1>Steering and sailing rules — worked situations</h1>
<p class="lede">Rules 11 to 18, International, vessels in sight of one another. Outcomes are
resolved by the engine, not read from the fixture, so this is what the app will actually say.
<b>Rule 19 is deliberately absent</b>: restricted visibility has no stand-on vessel, and folding
it in here would produce an engine that answers "who stands on" where nobody does.
No obligation states a heading, a number of degrees or a speed — Rule 8 sets standards, not values.</p>
${groups}`);

console.log(`docs/manoeuvres.html written — ${MANOEUVRE_SCENARIOS.length} scenarios in ` +
  `${SCENARIO_CATEGORIES.length} categories`);
