/**
 * Drill questions about sound signals.
 *
 * Card keys keep the three-part `a:b:c` shape the scheduler already stores, so
 * scheduler.js needs no change at all: the aspect slot is simply 'na', because
 * a sound signal has no aspect. That is a small dishonesty in the name of not
 * touching a working module, and it is written down here so nobody later reads
 * `signalId:na:sound-identify` and assumes the key format is broken.
 *
 * Distractors are chosen by pattern similarity rather than at random, the same
 * principle as the light-signature distractors in engine.js. A wrong answer
 * that differs by one blast teaches something; a wrong answer that is obviously
 * absurd teaches nothing and inflates your score.
 */

import { SOUND_SIGNALS, WHISTLE_BANDS, bandFor } from '../data/sound-signals.js';
import { describe } from './render-signal.js';

export const QUESTION_TYPES = ['sound-identify', 'sound-select', 'sound-pitch'];

/** The aspect slot of the card key. Sound signals do not have one. */
export const NO_ASPECT = 'na';

const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffled = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);

/**
 * A signal's shape: how many of each kind of blast, in order.
 *
 * Deliberately ignores the gaps. Two signals that differ only in the spacing
 * between blasts are near-indistinguishable by ear, which makes them excellent
 * distractors, so the similarity measure should treat them as close.
 */
export function shapeOf(signal) {
  return signal.pattern.filter(p => p.type !== 'gap').map(p => p.type);
}

/**
 * How plausible a confusion between two signals is. Higher is more confusable.
 *
 * Edit distance over the blast sequence carries most of it: one blast different
 * is the classic error, and the classic error is exactly what a drill should be
 * offering as the wrong answer. Sharing a rule or a group adds a little, because
 * signals from the same part of the rules get muddled with each other.
 */
export function signalSimilarity(a, b) {
  const x = shapeOf(a), y = shapeOf(b);
  const d = editDistance(x, y);
  let score = -d * 2;
  if (a.group === b.group) score += 1.5;
  if (a.rule.slice(0, 7) === b.rule.slice(0, 7)) score += 1;
  if (a.equipment[0] === b.equipment[0]) score += 0.75;
  if (x.length === y.length) score += 0.5;
  return score;
}

function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return d[a.length][b.length];
}

export function signalDistractors(signal, pool, n = 3) {
  return pool
    .filter(s => s.id !== signal.id)
    .map(s => ({ s, score: signalSimilarity(signal, s) + Math.random() * 0.4 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(d => d.s);
}

/** The full card space, in the shape selectCard expects. */
export const soundUniverse = () =>
  SOUND_SIGNALS.flatMap(s => QUESTION_TYPES
    // A pitch question only makes sense where a whistle is actually sounded.
    .filter(t => t !== 'sound-pitch' || s.equipment.includes('whistle'))
    .map(t => ({ stateId: s.id, aspect: NO_ASPECT, questionType: t })));

/**
 * Build a question for one card.
 *
 * `sound-identify` states the circumstance in the prompt, because it has to:
 * one prolonged blast is Rule 34(e) approaching a bend and Rule 35(a) a
 * power-driven vessel making way in restricted visibility, and no amount of
 * listening will separate them. The group is the disambiguator.
 */
export function soundQuestionFor({ stateId, questionType }, pool = SOUND_SIGNALS) {
  const signal = pool.find(s => s.id === stateId);
  if (!signal) return null;

  if (questionType === 'sound-pitch') {
    const band = pickOne(WHISTLE_BANDS);
    const wrong = shuffled(WHISTLE_BANDS.filter(b => b.id !== band.id)).slice(0, 3);
    return {
      type: 'sound-pitch',
      signal, band: band.id,
      prompt: 'Listen to her whistle. What length of vessel is sounding it?',
      options: shuffled([band, ...wrong]).map(b => ({ id: b.id, text: b.label })),
      answerId: band.id,
      explain: `${band.label}: Annex III gives a fundamental frequency of ${band.hz[0]} to ${band.hz[1]} Hz. `
             + 'The larger the vessel, the lower her whistle.'
    };
  }

  if (questionType === 'sound-select') {
    const wrong = signalDistractors(signal, pool, 3);
    return {
      type: 'sound-select',
      signal,
      prompt: `${signal.meaning} Which signal do you sound?`,
      options: shuffled([signal, ...wrong]).map(s => ({ id: s.id, text: describe(s) })),
      answerId: signal.id,
      explain: `${signal.rule}. ${signal.name}. ${signal.memory}`
    };
  }

  const wrong = signalDistractors(signal, pool, 3);
  return {
    type: 'sound-identify',
    signal,
    prompt: signal.group === 'Restricted visibility'
      ? 'You are in restricted visibility and hear this. What is she?'
      : 'She is in sight of you and sounds this. What does it mean?',
    options: shuffled([signal, ...wrong]).map(s => ({ id: s.id, text: s.meaning })),
    answerId: signal.id,
    explain: `${signal.rule}. ${describe(signal)}. ${signal.memory}`
  };
}

/** How large the sound question space is, for the header readout. */
export const soundSpace = () => ({
  signals: SOUND_SIGNALS.length,
  cards: soundUniverse().length,
  bands: WHISTLE_BANDS.length
});

export { bandFor };
