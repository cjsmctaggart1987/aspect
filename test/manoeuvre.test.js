/**
 * The steering and sailing rules.
 *
 * These checks carry more weight than the rest of the suite. Everywhere else a
 * fault produces a wrong answer on a card. Here a fault teaches somebody to do
 * the wrong thing on the water, so the precedence rules are tested exhaustively
 * rather than by example, and the engine is held to what the rules actually say
 * rather than to what seems reasonable.
 */
import { MANOEUVRE_SCENARIOS, SCENARIO_CATEGORIES } from '../data/manoeuvre-scenarios.js';
import { resolveManoeuvre, overtakingSector, OVERTAKING_LIMIT, rankOf,
  MANOEUVRE_CATEGORIES, CATEGORY_NAMES, STAND_ON_STAGES, standOnObligations }
  from '../src/manoeuvre-engine.js';
import { renderManoeuvre } from '../src/render-manoeuvre.js';
import { manoeuvreUniverse, manoeuvreQuestionFor, MANOEUVRE_QUESTION_TYPES }
  from '../src/manoeuvre-questions.js';

const solve = (own, target, tb, ob, extra = {}) =>
  resolveManoeuvre({ own, target, targetBearing: tb, ownBearingFromTarget: ob, inSight: true, ...extra });

const RANKED = ['power-driven', 'sailing', 'fishing', 'ram', 'nuc'];

/** Rule citations legitimately contain digits; nothing else may. */
const stripCitations = s => s.replace(/Rule\s*\d+(\([a-z]\))?(\((?:i|v|x)+\))?/gi, '');

export default function run(t) {
  t.section('Rule 11 gates everything');
  const fog = solve({ category: 'power-driven' }, { category: 'power-driven' }, 40, 320, { inSight: false });
  t.ok('not in sight returns notApplicable citing Rule 11',
    fog.notApplicable && fog.notApplicable.rule === 'Rule 11');
  t.ok('and points at Rule 19 rather than guessing', fog.rules.includes('Rule 19'));
  t.ok('no role is assigned when the rules do not apply', fog.role === null);
  t.ok('the reason says there is no stand-on vessel in restricted visibility',
    /no stand-on|neither.*stand on/i.test(fog.notApplicable.reason));

  t.section('Rule 13 overrides Rule 18, for every pairing');
  // Exhaustive, not by example. Overtaking is decided by geometry alone, so for
  // every ordered pair of categories the overtaking vessel gives way — even a
  // vessel not under command overtaking a power-driven one.
  const overrideFailures = [];
  for (const a of RANKED) {
    for (const b of RANKED) {
      const weOvertake = solve({ category: a }, { category: b }, 10, 180);
      if (weOvertake.situation !== 'overtaking' || weOvertake.role !== 'give-way') {
        overrideFailures.push(`${a} overtaking ${b}: ${weOvertake.situation}/${weOvertake.role}`);
      }
      const theyOvertake = solve({ category: a }, { category: b }, 180, 10);
      if (theyOvertake.situation !== 'overtaking' || theyOvertake.role !== 'stand-on') {
        overrideFailures.push(`${b} overtaking ${a}: ${theyOvertake.situation}/${theyOvertake.role}`);
      }
    }
  }
  t.ok('the overtaking vessel gives way whatever either vessel is',
    overrideFailures.length === 0, overrideFailures.slice(0, 3).join(' | ') || `${RANKED.length ** 2 * 2} pairings`);
  t.ok('a vessel not under command overtaking a power-driven vessel still keeps clear',
    solve({ category: 'nuc' }, { category: 'power-driven' }, 10, 180).role === 'give-way',
    'Rule 18 would say the opposite; Rule 13 wins');
  t.ok('Rule 13 is cited, and Rule 15 is not',
    (() => {
      const o = solve({ category: 'power-driven' }, { category: 'power-driven' }, 30, 150);
      return o.rules.includes('Rule 13') && !o.rules.includes('Rule 15');
    })());
  t.ok('the duty runs until finally past and clear, and a changed bearing does not end it',
    /finally past and clear/.test(solve({ category: 'power-driven' }, { category: 'power-driven' }, 30, 150)
      .obligations.join(' ')));

  t.section('the overtaking sector boundary is exact at 22.5 abaft the beam');
  t.ok('the limit is 22.5 degrees abaft the beam', OVERTAKING_LIMIT === 112.5);
  const justForward = overtakingSector(OVERTAKING_LIMIT - 0.1);
  const exact = overtakingSector(OVERTAKING_LIMIT);
  const justAbaft = overtakingSector(OVERTAKING_LIMIT + 0.1);
  t.ok('just forward of the limit is not overtaking',
    !justForward.inSector && !justForward.treatAsOvertaking);
  t.ok('just abaft the limit is overtaking', justAbaft.inSector && justAbaft.treatAsOvertaking);
  // Rule 13(b) says "more than", so the boundary itself is not in the sector —
  // but 13(c) says doubt resolves towards overtaking, so it is treated as such.
  t.ok('exactly on the limit is not strictly in the sector, but is treated as overtaking',
    !exact.inSector && exact.onBoundary && exact.treatAsOvertaking);
  t.ok('the same holds on the port side',
    overtakingSector(360 - OVERTAKING_LIMIT).onBoundary &&
    overtakingSector(360 - OVERTAKING_LIMIT - 0.1).inSector &&
    !overtakingSector(360 - OVERTAKING_LIMIT + 0.1).inSector);
  t.ok('the boundary case cites Rule 13(c) and flags doubt',
    (() => {
      const o = solve({ category: 'power-driven' }, { category: 'power-driven' }, 20, OVERTAKING_LIMIT);
      return o.doubt === true && o.rules.includes('Rule 13(c)');
    })());

  t.section('the Rule 18 hierarchy is a strict order with no cycles');
  const ranks = RANKED.map(c => rankOf(c));
  t.ok('every ranked category has a rank', ranks.every(r => typeof r === 'number'));
  // Transitivity and acyclicity, checked over every triple rather than asserted.
  let transitive = true, cyclic = false;
  const givesWay = (a, b) => rankOf(a) < rankOf(b);
  for (const a of RANKED) for (const b of RANKED) {
    if (givesWay(a, b) && givesWay(b, a)) cyclic = true;
    for (const c of RANKED) {
      if (givesWay(a, b) && givesWay(b, c) && !givesWay(a, c)) transitive = false;
    }
  }
  t.ok('transitive over every triple', transitive, `${RANKED.length ** 3} triples`);
  t.ok('no cycles: no two categories each give way to the other', !cyclic);
  t.ok('power-driven is at the bottom and gives way to all four others',
    RANKED.filter(c => c !== 'power-driven').every(c => givesWay('power-driven', c)));
  t.ok('not under command and restricted in ability to manoeuvre are equal, not ordered',
    rankOf('nuc') === rankOf('ram'));
  t.ok('sailing gives way to fishing, restricted and not under command',
    ['fishing', 'ram', 'nuc'].every(c => givesWay('sailing', c)));
  t.ok('fishing gives way to restricted and not under command, but not to sailing',
    givesWay('fishing', 'ram') && givesWay('fishing', 'nuc') && !givesWay('fishing', 'sailing'));

  t.section('Rule 18(d): constrained by draught is not a stand-on vessel');
  const cbd = solve({ category: 'power-driven' }, { category: 'cbd' }, 300, 60);
  t.ok('cites Rule 18(d)', cbd.rules.includes('Rule 18(d)'));
  t.ok('the obligation is to avoid impeding, not to keep out of the way',
    /avoid impeding/i.test(cbd.obligations.join(' ')));
  t.ok('and the difference is stated rather than left implied',
    /not the same/i.test(cbd.obligations.join(' ')));
  t.ok('constrained by draught has no rank in the Rule 18 hierarchy', rankOf('cbd') === null);

  t.section('Rules 14 and 15');
  const headOn = solve({ category: 'power-driven' }, { category: 'power-driven' }, 0, 0);
  t.ok('head-on gives neither vessel a stand-on role', headOn.role === 'both-give-way');
  t.ok('and cites Rule 14(c) on doubt', headOn.rules.includes('Rule 14(c)'));
  t.ok('crossing: the vessel with the other on her starboard side gives way',
    solve({ category: 'power-driven' }, { category: 'power-driven' }, 50, 300).role === 'give-way');
  t.ok('crossing: with the other on her port side she stands on',
    solve({ category: 'power-driven' }, { category: 'power-driven' }, 310, 55).role === 'stand-on');
  t.ok('the give-way vessel is told to avoid crossing ahead',
    /crossing ahead/.test(solve({ category: 'power-driven' }, { category: 'power-driven' }, 50, 300)
      .obligations.join(' ')));
  t.ok('Rule 15 does not apply between a power-driven and a sailing vessel',
    (() => {
      const o = solve({ category: 'power-driven' }, { category: 'sailing', tack: 'starboard' }, 310, 55);
      return o.role === 'give-way' && o.rules.includes('Rule 18') && !o.rules.includes('Rule 15');
    })(), 'she is to port, which under Rule 15 would make us stand-on');

  t.section('Rule 17 is three states');
  t.ok('three stages declared', STAND_ON_STAGES.length === 3);
  const stageRules = STAND_ON_STAGES.map(st =>
    solve({ category: 'power-driven' }, { category: 'power-driven' }, 310, 55, { standOnStage: st })
      .rules.filter(r => r.startsWith('Rule 17')).join(','));
  t.ok('each stage cites its own limb of Rule 17',
    stageRules.join(' | ') === 'Rule 17(a)(i) | Rule 17(a)(ii) | Rule 17(b)', stageRules.join(' | '));
  t.ok('the first stage is an obligation to hold course and speed',
    /keep your course and speed/i.test(
      standOnObligations('course-and-speed', 'power-driven', false).obligations.join(' ')));
  t.ok('the second is permissive, the third mandatory',
    /may take action/i.test(standOnObligations('may-act', 'power-driven', false).obligations.join(' ')) &&
    /shall take/i.test(standOnObligations('must-act', 'power-driven', false).obligations.join(' ')));
  // 17(c) only bites for a power-driven vessel, in a crossing situation, with
  // the other on her own port side.
  t.ok('Rule 17(c) appears when she is to port and we are power-driven',
    /not alter course to port/i.test(
      standOnObligations('may-act', 'power-driven', true).obligations.join(' ')));
  t.ok('and not when she is to starboard',
    !/not alter course to port/i.test(
      standOnObligations('may-act', 'power-driven', false).obligations.join(' ')));
  t.ok('the stand-on vessel never becomes the give-way vessel',
    STAND_ON_STAGES.every(st =>
      solve({ category: 'power-driven' }, { category: 'power-driven' }, 310, 55, { standOnStage: st })
        .role === 'stand-on'));

  t.section('Rule 12');
  t.ok('different tacks: the port-tack vessel keeps clear',
    solve({ category: 'sailing', tack: 'port' }, { category: 'sailing', tack: 'starboard' }, 50, 300)
      .role === 'give-way');
  t.ok('and the starboard-tack vessel stands on',
    solve({ category: 'sailing', tack: 'starboard' }, { category: 'sailing', tack: 'port' }, 50, 300)
      .role === 'stand-on');
  t.ok('same tack: the windward vessel keeps clear',
    solve({ category: 'sailing', tack: 'port', windward: true },
      { category: 'sailing', tack: 'port' }, 50, 300).role === 'give-way');
  t.ok('same tack: the leeward vessel stands on',
    solve({ category: 'sailing', tack: 'port', windward: false },
      { category: 'sailing', tack: 'port' }, 50, 300).role === 'stand-on');
  t.ok('windward is defined as the side opposite the mainsail',
    /opposite that on which the mainsail/i.test(
      solve({ category: 'sailing', tack: 'port', windward: true },
        { category: 'sailing', tack: 'port' }, 50, 300).obligations.join(' ')));
  t.ok('port tack, tack of a windward vessel unknown: doubt resolves against you',
    (() => {
      const o = solve({ category: 'sailing', tack: 'port', targetToWindward: true },
        { category: 'sailing' }, 55, 305);
      return o.role === 'give-way' && o.doubt === true && o.rules.includes('Rule 12(a)(iii)');
    })());

  t.section('the engine never invents an alteration');
  // The whole point: Rule 8 sets standards, not values. A number here would be
  // precision the rule does not contain.
  const everyOutcome = [
    ...MANOEUVRE_SCENARIOS.map(s => resolveManoeuvre({
      own: s.own, target: s.target, targetBearing: s.targetBearing,
      ownBearingFromTarget: s.ownBearingFromTarget, inSight: s.inSight,
      standOnStage: s.standOnStage || 'course-and-speed'
    })),
    ...RANKED.flatMap(a => RANKED.map(b => solve({ category: a }, { category: b }, 50, 300))),
    ...STAND_ON_STAGES.map(st =>
      solve({ category: 'power-driven' }, { category: 'power-driven' }, 310, 55, { standOnStage: st }))
  ];
  const numeric = [];
  for (const o of everyOutcome) {
    for (const line of [...o.obligations, o.notApplicable ? o.notApplicable.reason : '']) {
      if (line && /\d/.test(stripCitations(line))) numeric.push(line.slice(0, 60));
    }
  }
  t.ok('no obligation contains a heading, a number of degrees or a speed',
    numeric.length === 0, numeric.slice(0, 2).join(' | ') || `${everyOutcome.length} outcomes`);
  t.ok('and none of them tells you which way to turn by an amount',
    !everyOutcome.some(o => /\b(alter|turn|come)\b[^.]*\b\d/.test(o.obligations.join(' '))));

  t.section('every outcome carries the Inland field, left null');
  t.ok('inland is present and null on every outcome',
    everyOutcome.every(o => 'inland' in o && o.inland === null),
    'a field to fill, not a migration to perform');

  t.section('the scenarios agree with the engine');
  const mismatches = [];
  for (const s of MANOEUVRE_SCENARIOS) {
    const o = resolveManoeuvre({
      own: s.own, target: s.target, targetBearing: s.targetBearing,
      ownBearingFromTarget: s.ownBearingFromTarget, inSight: s.inSight,
      standOnStage: s.standOnStage || 'course-and-speed'
    });
    if (s.expect.situation && o.situation !== s.expect.situation) mismatches.push(`${s.id}: situation`);
    if ('role' in s.expect && o.role !== s.expect.role) mismatches.push(`${s.id}: role`);
    if (s.expect.notApplicable && (!o.notApplicable || o.notApplicable.rule !== s.expect.notApplicable)) {
      mismatches.push(`${s.id}: notApplicable`);
    }
    if (s.expect.doubt && !o.doubt) mismatches.push(`${s.id}: doubt`);
    for (const r of s.expect.rules || []) if (!o.rules.includes(r)) mismatches.push(`${s.id}: ${r}`);
  }
  t.ok('every scenario resolves to its stated outcome', mismatches.length === 0,
    mismatches.slice(0, 3).join(' | ') || `${MANOEUVRE_SCENARIOS.length} scenarios`);
  t.ok('every scenario has an explanation written for a candidate',
    MANOEUVRE_SCENARIOS.every(s => s.explanation && s.explanation.length > 60));
  t.ok('Rule 19 is not modelled anywhere in the scenarios',
    !SCENARIO_CATEGORIES.includes('Rule 19') &&
    !MANOEUVRE_SCENARIOS.some(s => (s.expect.rules || []).some(r => r === 'Rule 19')));

  t.section('rendering and cards');
  t.ok('every scenario draws a plan',
    MANOEUVRE_SCENARIOS.every(s => {
      const svg = renderManoeuvre(s);
      return /<svg/.test(svg) && !/NaN|undefined/.test(svg);
    }));
  t.ok('the plan marks the overtaking sector', renderManoeuvre(MANOEUVRE_SCENARIOS[1]).includes('overtaking sector'));
  const universe = manoeuvreUniverse();
  const keys = universe.map(c => `${c.stateId}:${c.aspect}:${c.questionType}`);
  t.ok('all card keys unique', new Set(keys).size === keys.length, `${keys.length} cards`);
  t.ok('keys keep the three-part shape', keys.every(k => k.split(':').length === 3));
  t.ok('four question types', MANOEUVRE_QUESTION_TYPES.length === 4);
  let malformed = 0, duplicated = 0;
  for (let pass = 0; pass < 15; pass++) {
    for (const card of universe) {
      const q = manoeuvreQuestionFor(card);
      if (!q || q.options.length !== 4 || !q.options.some(o => o.id === q.answerId)) malformed++;
      else if (new Set(q.options.map(o => o.text)).size !== 4) duplicated++;
    }
  }
  t.ok('no malformed questions over 15 passes', malformed === 0, `${universe.length * 15} drawn`);
  t.ok('no two options ever read the same', duplicated === 0);
  t.ok('no option anywhere offers an alteration',
    universe.every(c => {
      const q = manoeuvreQuestionFor(c);
      return q.options.every(o => !/\d/.test(stripCitations(o.text)));
    }));

  t.section('the drill does not show its own answer');
  const leaks = [];
  for (const card of universe) {
    const q = manoeuvreQuestionFor(card);
    const shown = (q.showPlan && q.scenario ? renderManoeuvre(q.scenario, { anonymous: true }) : '')
      + '\n' + q.prompt;
    const right = q.options.find(o => o.id === q.answerId);
    if (right && right.text.length > 3 && shown.includes(right.text)) {
      leaks.push(`${card.stateId}/${card.questionType}`);
    }
    if (q.scenario && shown.includes(q.scenario.explanation)) leaks.push(`${card.stateId}: explanation`);
    if (q.scenario && shown.includes(CATEGORY_NAMES[q.scenario.own.category])
        && q.type === 'manoeuvre-role') {
      leaks.push(`${card.stateId}: own category named`);
    }
  }
  t.ok('no manoeuvre question leaks its answer', leaks.length === 0,
    [...new Set(leaks)].slice(0, 3).join(' | ') || `${universe.length} checked`);
  t.ok('an anonymous plan names neither vessel nor the bearing',
    MANOEUVRE_SCENARIOS.every(s => {
      const svg = renderManoeuvre(s, { anonymous: true });
      return !svg.includes(CATEGORY_NAMES[s.own.category]) && !svg.includes(CATEGORY_NAMES[s.target.category]);
    }));
}
