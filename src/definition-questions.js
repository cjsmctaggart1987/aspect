/**
 * Drill questions on Part A.
 *
 * RULE 2 IS TREATED DIFFERENTLY, ON PURPOSE
 *
 * Rule 2 is a standard, not a test. "What does Rule 2 require of you here" has
 * no lookup answer: it asks what an ordinary prudent mariner would have done in
 * these circumstances, and that is a judgement. A multiple-choice card that
 * pretended otherwise would teach that judgement can be memorised, which is the
 * opposite of what Rule 2 exists to say.
 *
 * So Rule 2 appears only in definition-term and definition-meaning — what it
 * says and what it means — and is excluded from definition-applies and from
 * every boundary case. A test enforces the exclusion.
 */

import { DEFINITIONS, DEFINITION_BOUNDARIES, definitionsForState, definitionById }
  from '../data/definitions.js';
import { VESSEL_STATES } from '../data/vessel-states.js';

export const DEFINITION_QUESTION_TYPES = [
  'definition-term', 'definition-meaning', 'definition-applies', 'definition-boundary'
];

/** Rule 2 states a standard; it does not classify a vessel. */
const JUDGEMENT_ONLY = ['responsibility', 'departure', 'application'];

const isJudgement = id => JUDGEMENT_ONLY.includes(id);

const defShuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);

/** States worth asking "which terms apply" about: those with more than one. */
const RICH_STATES = VESSEL_STATES.filter(s => definitionsForState(s.id).length >= 2);

export const definitionUniverse = () => [
  ...DEFINITIONS.flatMap(d => [
    { stateId: d.id, aspect: 'plain', questionType: 'definition-term' },
    { stateId: d.id, aspect: 'plain', questionType: 'definition-meaning' }
  ]),
  ...RICH_STATES.map(s => ({
    stateId: s.id, aspect: 'plain', questionType: 'definition-applies'
  })),
  ...DEFINITION_BOUNDARIES.map(b => ({
    stateId: b.id, aspect: 'plain', questionType: 'definition-boundary'
  }))
];

export function definitionQuestionFor({ stateId, questionType }) {
  if (questionType === 'definition-boundary') {
    const edge = DEFINITION_BOUNDARIES.find(b => b.id === stateId);
    if (!edge) return null;
    const def = definitionById(edge.term);
    return {
      type: 'definition-boundary',
      definition: def, edge, showTerm: false,
      prompt: `${edge.situation} Is she a ${def.term.toLowerCase()} within the meaning of ${def.rule}?`,
      options: defShuffle([
        { id: 'yes', text: 'Yes, she meets the definition.' },
        { id: 'no', text: 'No, she does not meet the definition.' },
        { id: 'sometimes', text: 'Only while she is displaying the corresponding lights.' },
        { id: 'unknowable', text: 'It cannot be decided without knowing her length.' }
      ]),
      answerId: edge.meets ? 'yes' : 'no',
      explain: `${def.rule}. ${edge.because}`
    };
  }

  if (questionType === 'definition-applies') {
    const state = VESSEL_STATES.find(s => s.id === stateId);
    if (!state) return null;
    const applying = definitionsForState(stateId).filter(d => !isJudgement(d.id));
    if (!applying.length) return null;
    const right = applying[Math.floor(Math.random() * applying.length)];
    const wrong = DEFINITIONS
      .filter(d => !isJudgement(d.id) && !applying.some(a => a.id === d.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return {
      type: 'definition-applies',
      definition: right, state, showTerm: false,
      // Her name would answer the question: "Power-driven vessel underway,
      // under 50m" contains the term. Describe her by what she shows instead,
      // which is both leak-free and a better question.
      prompt: `A vessel showing: ${state.summary} Which of these defined terms applies to her?`,
      options: defShuffle([right, ...wrong]).map(d => ({ id: d.id, text: `${d.term} (${d.rule})` })),
      answerId: right.id,
      explain: `${right.rule}. ${right.definition} `
             + `Terms that apply to her: ${definitionsForState(stateId).map(d => d.term).join(', ')}.`
    };
  }

  const def = DEFINITIONS.find(d => d.id === stateId);
  if (!def) return null;
  const others = DEFINITIONS.filter(d => d.id !== def.id).sort(() => Math.random() - 0.5).slice(0, 3);

  if (questionType === 'definition-meaning') {
    return {
      type: 'definition-meaning',
      definition: def, showTerm: true,
      prompt: `${def.term} (${def.rule}). Which is the definition?`,
      options: defShuffle([def, ...others]).map(d => ({ id: d.id, text: d.definition })),
      answerId: def.id,
      explain: `${def.rule}. ${def.commonError}`
    };
  }

  return {
    type: 'definition-term',
    definition: def, showTerm: false,
    prompt: `${def.definition} Which term is being defined?`,
    options: defShuffle([def, ...others]).map(d => ({ id: d.id, text: `${d.term} (${d.rule})` })),
    answerId: def.id,
    explain: `${def.rule}. ${def.commonError}`
  };
}

export const definitionSpace = () => ({
  terms: DEFINITIONS.length,
  boundaries: DEFINITION_BOUNDARIES.length,
  cards: definitionUniverse().length
});
