/**
 * Part A: definitions, and the links that hold the app together.
 *
 * The link checks are the ones that matter. Everything else in this file
 * verifies text; the links verify that six sections built separately actually
 * refer to the same things. A relatedStates id that does not resolve is a dead
 * cross-reference the reader hits, and an orphaned vessel state is a gap
 * nobody would otherwise notice.
 */
import { DEFINITIONS, DEFINITION_BOUNDARIES, DEFINITION_RULES, ORPHAN_EXCEPTIONS,
  definitionsForState, definitionById } from '../data/definitions.js';
import { VESSEL_STATES } from '../data/vessel-states.js';
import { definitionUniverse, definitionQuestionFor, DEFINITION_QUESTION_TYPES }
  from '../src/definition-questions.js';

const STATE_IDS = new Set(VESSEL_STATES.map(s => s.id));

export default function run(t) {
  t.section('coverage of Part A');
  t.ok('Rules 1, 2 and 3 are all represented',
    ['Rule 1', 'Rule 2(a)', 'Rule 2(b)'].every(r => DEFINITIONS.some(d => d.rule.startsWith(r))),
    DEFINITION_RULES.join(', '));
  t.ok('every entry has a rule, a definition, key points and a common error',
    DEFINITIONS.every(d => d.rule && d.definition && d.keyPoints.length && d.commonError));
  t.ok('ids and terms are unique',
    new Set(DEFINITIONS.map(d => d.id)).size === DEFINITIONS.length &&
    new Set(DEFINITIONS.map(d => d.term)).size === DEFINITIONS.length);
  const required = ['vessel', 'power-driven', 'sailing', 'fishing', 'seaplane', 'nuc', 'ram',
    'cbd', 'underway', 'making-way', 'in-sight', 'restricted-visibility', 'wig', 'length-breadth'];
  t.ok('every Rule 3 term asked for is present',
    required.every(id => definitionById(id)),
    required.filter(id => !definitionById(id)).join(', ') || `${required.length} terms`);

  t.section('the distinctions people miss are stated');
  t.ok('underway and making way are separate entries and say they differ',
    definitionById('underway') && definitionById('making-way') &&
    /not the same thing/i.test(definitionById('making-way').definition));
  t.ok('underway is defined by attachment, not by movement',
    /says nothing about movement|not.*at anchor/i.test(
      definitionById('underway').definition + definitionById('underway').keyPoints.join(' ')));
  t.ok('fishing excludes trolling lines explicitly',
    /trolling/i.test(definitionById('fishing').definition));
  t.ok('fishing turns on restricted manoeuvrability, not on catching fish',
    /restrict/i.test(definitionById('fishing').definition));
  t.ok('sailing carries the proviso about machinery',
    /machinery.*not being used/i.test(definitionById('sailing').definition));
  t.ok('Rule 3(g) lists its examples',
    definitionById('ram').keyPoints.join(' ').includes('cable') &&
    definitionById('ram').keyPoints.join(' ').includes('mine clearance'));
  t.ok('constrained by draught must be power-driven, and is not restricted in ability to manoeuvre',
    /power-driven/i.test(definitionById('cbd').keyPoints.join(' ')) &&
    /not/i.test(definitionById('cbd').commonError));
  t.ok('in sight of one another means visually, and radar is called out',
    /visual/i.test(definitionById('in-sight').definition) &&
    /radar/i.test(definitionById('in-sight').keyPoints.join(' ')));
  t.ok('darkness is distinguished from restricted visibility',
    /darkness is not/i.test(definitionById('restricted-visibility').keyPoints.join(' ')));
  t.ok('Rule 1 states where the rules apply',
    /high seas/i.test(definitionById('application').definition));

  t.section('Rule 2 is a standard, and is treated as one');
  const r2a = definitionById('responsibility');
  const r2b = definitionById('departure');
  t.ok('2(a) covers the ordinary practice of seamen and the special circumstances of the case',
    /ordinary practice of seamen/i.test(r2a.definition) &&
    /special circumstances/i.test(r2a.definition));
  t.ok('2(b) is limited to what is necessary to avoid immediate danger',
    /immediate danger/i.test(r2b.definition));
  t.ok('2(b) says the threshold is danger, not preference',
    /not inconvenience|not preference/i.test(r2b.keyPoints.join(' ')));
  // The important one: no card asks what Rule 2 requires in a situation,
  // because that answer is a judgement rather than a lookup.
  const universe = definitionUniverse();
  t.ok('Rule 2 never appears in a situational question type',
    !universe.some(c => ['definition-applies', 'definition-boundary'].includes(c.questionType)
      && ['responsibility', 'departure'].includes(c.stateId)),
    'it is asked what it says, never what it requires here');
  t.ok('no boundary case is built on Rule 2',
    !DEFINITION_BOUNDARIES.some(b => ['responsibility', 'departure'].includes(b.term)));

  t.section('the links resolve, both ways');
  const broken = DEFINITIONS.flatMap(d =>
    (d.relatedStates || []).filter(s => !STATE_IDS.has(s)).map(s => `${d.id} -> ${s}`));
  t.ok('every relatedStates id names a real vessel state', broken.length === 0,
    broken.slice(0, 3).join(', ') || `${[...new Set(DEFINITIONS.flatMap(d => d.relatedStates || []))].length} links`);
  // The reverse: nothing built earlier is left unreferenced by Part A.
  const claimed = new Set(DEFINITIONS.flatMap(d => d.relatedStates || []));
  const orphans = VESSEL_STATES.map(s => s.id)
    .filter(id => !claimed.has(id) && !ORPHAN_EXCEPTIONS.some(e => e.id === id));
  t.ok('every vessel state is reachable from at least one definition', orphans.length === 0,
    orphans.join(', ') || `${VESSEL_STATES.length} states covered`);
  t.ok('any exception carries a reason rather than being a bare id',
    ORPHAN_EXCEPTIONS.every(e => e.id && e.reason));
  t.ok('the reverse lookup agrees with the forward one',
    VESSEL_STATES.every(s =>
      definitionsForState(s.id).every(d => d.relatedStates.includes(s.id))));
  t.ok('a state governed by several terms returns all of them',
    definitionsForState('trawling-making-way').length >= 2,
    definitionsForState('trawling-making-way').map(d => d.term).join(', '));

  t.section('boundary cases');
  t.ok('every boundary names a term that exists',
    DEFINITION_BOUNDARIES.every(b => definitionById(b.term)),
    DEFINITION_BOUNDARIES.filter(b => !definitionById(b.term)).map(b => b.term).join(', '));
  t.ok('each states a situation, a verdict and a reason',
    DEFINITION_BOUNDARIES.every(b => b.situation && typeof b.meets === 'boolean' && b.because.length > 40));
  t.ok('both verdicts occur, so the answer is not always the same',
    DEFINITION_BOUNDARIES.some(b => b.meets) && DEFINITION_BOUNDARIES.some(b => !b.meets));
  // The four the brief singled out.
  const has = id => DEFINITION_BOUNDARIES.some(b => b.id === id);
  t.ok('trolling versus trawling is covered both ways',
    has('trolling-not-fishing') && has('trawling-is-fishing'));
  t.ok('underway versus making way is covered both ways',
    has('drifting-is-underway') && has('drifting-not-making-way'));
  t.ok('aground versus not under command is covered',
    has('aground-not-nuc') && has('breakdown-is-nuc'));
  t.ok('the trolling case explains why, not just that',
    /restrict/i.test(DEFINITION_BOUNDARIES.find(b => b.id === 'trolling-not-fishing').because));

  t.section('cards and questions');
  const keys = universe.map(c => `${c.stateId}:${c.aspect}:${c.questionType}`);
  t.ok('all card keys unique', new Set(keys).size === keys.length, `${keys.length} cards`);
  t.ok('keys keep the three-part shape', keys.every(k => k.split(':').length === 3));
  t.ok('four question types', DEFINITION_QUESTION_TYPES.length === 4);
  let malformed = 0, duplicated = 0;
  for (let pass = 0; pass < 20; pass++) {
    for (const card of universe) {
      const q = definitionQuestionFor(card);
      if (!q || q.options.length !== 4 || !q.options.some(o => o.id === q.answerId)) malformed++;
      else if (new Set(q.options.map(o => o.text)).size !== 4) duplicated++;
    }
  }
  t.ok('no malformed questions over 20 passes', malformed === 0, `${universe.length * 20} drawn`);
  t.ok('no two options ever read the same', duplicated === 0);
  t.ok('definition-applies never offers a term that does apply as a wrong answer',
    universe.filter(c => c.questionType === 'definition-applies').every(c => {
      const q = definitionQuestionFor(c);
      const applying = definitionsForState(c.stateId).map(d => d.id);
      return q.options.filter(o => applying.includes(o.id)).length === 1;
    }));

  t.section('the drill does not show its own answer');
  const leaks = [];
  for (const card of universe) {
    const q = definitionQuestionFor(card);
    const right = q.options.find(o => o.id === q.answerId);
    // definition-meaning gives the term on purpose: that is the question.
    if (q.type !== 'definition-meaning' && q.definition && q.prompt.includes(q.definition.term)) {
      leaks.push(`${card.stateId}/${card.questionType}: term in prompt`);
    }
    if (right && right.text.length > 3 && q.prompt.includes(right.text)) {
      leaks.push(`${card.stateId}/${card.questionType}: answer in prompt`);
    }
  }
  t.ok('no definition question leaks its answer', leaks.length === 0,
    [...new Set(leaks)].slice(0, 3).join(' | ') || `${universe.length} checked`);
}
