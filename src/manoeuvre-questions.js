/**
 * Drill questions on the steering and sailing rules.
 *
 * Every answer comes from the engine rather than from the scenario file, so a
 * question can never assert something the engine would not. The scenarios
 * supply the situations and the explanations; the engine supplies the truth.
 *
 * No option anywhere offers an alteration. The four types ask who gives way,
 * what the obligation is, which category yields to which, and which Rule 17
 * state applies — because those are the things the rules actually decide.
 */

import { MANOEUVRE_SCENARIOS } from '../data/manoeuvre-scenarios.js';
import { resolveManoeuvre, CATEGORY_NAMES, rankOf, STAND_ON_STAGES } from './manoeuvre-engine.js';

export const MANOEUVRE_QUESTION_TYPES = [
  'manoeuvre-role', 'manoeuvre-obligation', 'manoeuvre-hierarchy', 'manoeuvre-standon-stage'
];

const mvPick = a => a[Math.floor(Math.random() * a.length)];
const mvShuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);

const solve = s => resolveManoeuvre({
  own: s.own, target: s.target,
  targetBearing: s.targetBearing, ownBearingFromTarget: s.ownBearingFromTarget,
  inSight: s.inSight, standOnStage: s.standOnStage || 'course-and-speed'
});

const ROLE_TEXT = {
  'give-way': 'You are the give-way vessel.',
  'stand-on': 'You are the stand-on vessel.',
  'both-give-way': 'Neither stands on. Both of you give way.',
  none: 'Neither. No steering and sailing rule assigns a role here.'
};

const STAGE_TEXT = {
  'course-and-speed': 'Keep your course and speed. (Rule 17(a)(i))',
  'may-act': 'You may take action by your manoeuvre alone. (Rule 17(a)(ii))',
  'must-act': 'You shall take such action as will best aid to avoid collision. (Rule 17(b))'
};

/** Category pairs that Rule 18 actually resolves. */
const HIERARCHY_PAIRS = (() => {
  const ranked = ['power-driven', 'sailing', 'fishing', 'ram', 'nuc'];
  const pairs = [];
  for (const a of ranked) {
    for (const b of ranked) {
      if (a !== b && rankOf(a) !== rankOf(b)) pairs.push([a, b]);
    }
  }
  return pairs;
})();

export const manoeuvreUniverse = () => [
  ...MANOEUVRE_SCENARIOS.flatMap(s => [
    { stateId: s.id, aspect: 'plain', questionType: 'manoeuvre-role' },
    { stateId: s.id, aspect: 'plain', questionType: 'manoeuvre-obligation' }
  ]),
  ...HIERARCHY_PAIRS.map(([a, b]) => ({
    stateId: `${a}-v-${b}`, aspect: 'plain', questionType: 'manoeuvre-hierarchy'
  })),
  ...MANOEUVRE_SCENARIOS
    .filter(s => solve(s).role === 'stand-on')
    .flatMap(s => STAND_ON_STAGES.map(stage => ({
      stateId: s.id, aspect: stage, questionType: 'manoeuvre-standon-stage'
    })))
];

export function manoeuvreQuestionFor({ stateId, aspect, questionType }) {
  if (questionType === 'manoeuvre-hierarchy') {
    const [a, b] = stateId.split('-v-');
    if (!CATEGORY_NAMES[a] || !CATEGORY_NAMES[b]) return null;
    const giver = rankOf(a) < rankOf(b) ? a : b;
    const options = [
      { id: 'a', text: `The ${CATEGORY_NAMES[a]} keeps out of the way.` },
      { id: 'b', text: `The ${CATEGORY_NAMES[b]} keeps out of the way.` },
      { id: 'both', text: 'Both give way; neither stands on.' },
      { id: 'neither', text: 'Rule 18 does not decide between them.' }
    ];
    return {
      type: 'manoeuvre-hierarchy',
      scenario: null, showPlan: false,
      prompt: `A ${CATEGORY_NAMES[a]} and a ${CATEGORY_NAMES[b]} are in sight of one another `
            + 'and neither is overtaking. Which keeps out of the way?',
      options: mvShuffle(options),
      answerId: giver === a ? 'a' : 'b',
      explain: `Rule 18. A ${CATEGORY_NAMES[giver]} keeps out of the way of a `
             + `${CATEGORY_NAMES[giver === a ? b : a]}. Rule 18 is a hierarchy between vessels, `
             + 'not a right belonging to either of them.'
    };
  }

  const scenario = MANOEUVRE_SCENARIOS.find(s => s.id === stateId);
  if (!scenario) return null;

  if (questionType === 'manoeuvre-standon-stage') {
    const stage = STAND_ON_STAGES.includes(aspect) ? aspect : 'course-and-speed';
    const cue = {
      'course-and-speed': 'She is giving way and the range is opening as it should.',
      'may-act': 'The range is closing and it has become apparent that she is not taking '
               + 'appropriate action.',
      'must-act': 'You are now so close that collision cannot be avoided by her action alone.'
    }[stage];
    return {
      type: 'manoeuvre-standon-stage',
      scenario, stage, showPlan: true,
      prompt: `You are the stand-on vessel. ${cue} What does Rule 17 require of you now?`,
      options: mvShuffle([
        ...STAND_ON_STAGES.map(st => ({ id: st, text: STAGE_TEXT[st] })),
        { id: 'giveway', text: 'You become the give-way vessel and must keep out of her way.' }
      ]),
      answerId: stage,
      explain: `${STAGE_TEXT[stage]} Rule 17 is three states, and the transition between them `
             + 'is what the rule is really about. You never become the give-way vessel: the '
             + 'obligation changes, the roles do not.'
    };
  }

  const solved = solve(scenario);

  if (questionType === 'manoeuvre-obligation') {
    const right = solved.notApplicable
      ? solved.notApplicable.reason
      : solved.obligations[0];
    const others = MANOEUVRE_SCENARIOS
      .filter(s => s.id !== scenario.id)
      .map(s => solve(s))
      .map(o => (o.notApplicable ? o.notApplicable.reason : o.obligations[0]))
      .filter(t => t && t !== right);
    return {
      type: 'manoeuvre-obligation',
      scenario, showPlan: true,
      prompt: 'What does this require of you?',
      options: mvShuffle([right, ...[...new Set(others)].slice(0, 3)].map((t, i) => ({
        id: i === 0 ? 'right' : `w${i}`, text: t
      })).map((o, i, all) => all[i])),
      answerId: 'right',
      explain: `${solved.rules.join(', ')}. ${scenario.explanation}`
    };
  }

  const roleKey = solved.notApplicable ? 'none' : solved.role;
  return {
    type: 'manoeuvre-role',
    scenario, showPlan: true,
    prompt: 'In sight of one another. What are you here?',
    options: mvShuffle(['give-way', 'stand-on', 'both-give-way', 'none']
      .map(k => ({ id: k, text: ROLE_TEXT[k] }))),
    answerId: roleKey || 'none',
    explain: `${solved.rules.join(', ')}. ${scenario.explanation}`
  };
}

export const manoeuvreSpace = () => ({
  scenarios: MANOEUVRE_SCENARIOS.length,
  pairs: HIERARCHY_PAIRS.length,
  cards: manoeuvreUniverse().length
});
