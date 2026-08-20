/**
 * Questions on the rule text.
 *
 * TWO OF THE THREE TYPES SHIP EMPTY, ON PURPOSE
 *
 * text-which-rule works today, because it asks which rule an obligation comes
 * from and the obligations are the app's own paraphrases — nothing here needs
 * the verbatim text.
 *
 * text-complete-list and text-cloze both need the actual wording, and the text
 * is pending. They are built and wired and produce no cards until paragraphs
 * carry text. That is better than approximating: a completion question whose
 * list is half-remembered teaches a half-remembered list.
 */

import { RULE_TEXT, paragraphById, citationToId, CLOZE_POLICY } from '../data/rule-text.js';
import { DEFINITIONS } from '../data/definitions.js';
import { SOUND_SIGNALS } from '../data/sound-signals.js';
import { DISTRESS_SIGNALS } from '../data/distress-signals.js';

export const RULE_TEXT_QUESTION_TYPES = ['text-which-rule', 'text-complete-list', 'text-cloze'];

const rtShuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);

/**
 * Obligations paired with the rule they come from, harvested from the app's own
 * paraphrases. Nothing is invented for this and nothing is quoted.
 */
export function whichRuleSources() {
  const out = [];
  const add = (id, statement, citation) => {
    const target = citationToId(citation);
    if (!statement || !target || !paragraphById(target)) return;
    out.push({ id, statement, citation, paragraphId: target });
  };
  for (const d of DEFINITIONS) add(`def-${d.id}`, d.definition, d.rule.split(',')[0].trim());
  for (const s of SOUND_SIGNALS) add(`snd-${s.id}`, s.meaning, s.rule);
  for (const s of DISTRESS_SIGNALS) add(`dis-${s.id}`, s.description, s.rule.split(',')[0].trim());
  // One statement per citation, so a question cannot have two right answers.
  const seen = new Set();
  return out.filter(o => (seen.has(o.citation) ? false : seen.add(o.citation)));
}

const SOURCES = whichRuleSources();

/** Paragraphs that could carry a completion question once text exists. */
export const completableParagraphs = () =>
  RULE_TEXT.filter(p => p.text && Array.isArray(p.listItems) && p.listItems.length >= 3
    && p.listClosed === true);

/** Paragraphs with authored blanks. Empty until a human writes some. */
export const clozeParagraphs = () => RULE_TEXT.filter(p => (p.blanks || []).length > 0);

export const ruleTextUniverse = () => [
  ...SOURCES.map(s => ({ stateId: s.id, aspect: 'plain', questionType: 'text-which-rule' })),
  ...completableParagraphs().map(p => ({
    stateId: p.id, aspect: 'plain', questionType: 'text-complete-list'
  })),
  ...clozeParagraphs().flatMap(p => p.blanks.map((_, i) => ({
    stateId: p.id, aspect: `blank-${i}`, questionType: 'text-cloze'
  })))
];

export function ruleTextQuestionFor({ stateId, aspect, questionType }) {
  if (questionType === 'text-which-rule') {
    const src = SOURCES.find(s => s.id === stateId);
    if (!src) return null;
    const right = paragraphById(src.paragraphId);
    // Distractors from the same part where possible: confusing Rule 26 with
    // Rule 27 is a real mistake; confusing it with Annex II is not.
    const pool = RULE_TEXT.filter(p => p.id !== right.id && p.citation !== right.citation);
    const near = pool.filter(p => p.part === right.part && p.path.length === right.path.length);
    const wrong = rtShuffle(near.length >= 3 ? near : pool).slice(0, 3);
    return {
      type: 'text-which-rule',
      paragraph: right, source: src,
      prompt: `${src.statement} Which rule is that?`,
      options: rtShuffle([right, ...wrong]).map(p => ({
        id: p.id, text: p.heading ? `${p.citation} — ${p.heading}` : p.citation
      })),
      answerId: right.id,
      explain: `${right.citation}${right.heading ? ` — ${right.heading}` : ''}.`
             + (right.text ? ` ${right.text}` : ' The text of this paragraph has not been supplied yet.')
    };
  }

  if (questionType === 'text-complete-list') {
    const p = paragraphById(stateId);
    if (!p || !p.text || !Array.isArray(p.listItems)) return null;
    const missing = p.listItems[p.listItems.length - 1];
    const shown = p.listItems.slice(0, -1);
    const wrong = rtShuffle(RULE_TEXT.filter(q => Array.isArray(q.listItems) && q.id !== p.id)
      .flatMap(q => q.listItems)).slice(0, 3);
    return {
      type: 'text-complete-list',
      paragraph: p,
      prompt: `${p.citation} lists: ${shown.join('; ')}. What completes the list?`,
      options: rtShuffle([missing, ...wrong]).map((t, i) => ({ id: `o${i}`, text: t })),
      answerId: null,   // set below, once shuffled ids are known
      explain: `${p.citation}. ${p.text}`,
      _answerText: missing
    };
  }

  if (questionType === 'text-cloze') {
    const p = paragraphById(stateId);
    const i = Number(String(aspect).replace('blank-', ''));
    const blank = p && (p.blanks || [])[i];
    if (!blank || !p.text) return null;
    const before = p.text.slice(0, blank.start);
    const after = p.text.slice(blank.end);
    const wrong = rtShuffle(RULE_TEXT.flatMap(q => (q.blanks || []).map(b => b.answer))
      .filter(a => a !== blank.answer)).slice(0, 3);
    return {
      type: 'text-cloze',
      paragraph: p, blank,
      prompt: `${before}______${after}`,
      options: rtShuffle([blank.answer, ...wrong]).map((t, n) => ({ id: `c${n}`, text: t })),
      answerId: null,
      explain: `${p.citation}. ${blank.note || ''}`.trim(),
      _answerText: blank.answer
    };
  }

  return null;
}

/**
 * The two text-dependent types return options keyed by position, so the answer
 * id has to be resolved after shuffling. Done here rather than in the drill, so
 * every consumer gets it right.
 */
export function resolveAnswerId(question) {
  if (!question || question.answerId !== null || !question._answerText) return question;
  const match = question.options.find(o => o.text === question._answerText);
  return { ...question, answerId: match ? match.id : question.options[0].id };
}

export const ruleTextSpace = () => ({
  paragraphs: RULE_TEXT.length,
  whichRule: SOURCES.length,
  completable: completableParagraphs().length,
  cloze: clozeParagraphs().length,
  cards: ruleTextUniverse().length,
  clozePolicy: CLOZE_POLICY
});
