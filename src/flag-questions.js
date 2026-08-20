/**
 * Drill questions about the code flags.
 *
 * The third type is the one worth having. E, I and S are single-letter signals
 * that mean exactly what three Rule 34 whistle signals mean, so the same
 * message exists as a flag, as Morse, and as a sound. flag-signal asks for all
 * three at once, which is the connection a candidate is least likely to make
 * on their own and most likely to need.
 *
 * Card keys keep the three-part shape. The middle slot carries the circumstance
 * where a flag has variant meanings — G, P, T and Z mean different things to a
 * fishing vessel or in harbour — and 'plain' otherwise. That is a real second
 * dimension, like day and night in the buoyage section, not a placeholder.
 */

import { FLAGS, ALPHABET_FLAGS, MANOEUVRING_FLAGS, flagMeaning, flagMorse } from '../data/flags.js';
import { SOUND_SIGNALS } from '../data/sound-signals.js';
import { designSimilarity } from './render-flag.js';

export const FLAG_QUESTION_TYPES = ['flag-identify', 'flag-select', 'flag-signal'];

/** "E — one short blast": a flag paired with a whistle signal. */
const pairText = (flag, sound) =>
  `${flag.letter} — ${sound ? sound.name.toLowerCase() : 'no whistle signal'}`;

const shuffleFlags = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);

/** Flags with something to say. A flag with no assigned meaning cannot be drilled on meaning. */
const meaningful = FLAGS.filter(f => f.meaning);

/** The circumstances a flag can be asked about. */
export function circumstancesFor(f) {
  return ['plain', ...(f.variants || []).map(v => v.when)];
}

export function flagDistractors(f, n = 3, pool = meaningful) {
  return pool
    .filter(o => o.id !== f.id)
    .map(o => ({ o, score: designSimilarity(f, o) + Math.random() * 0.9 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(x => x.o);
}

export const flagUniverse = () => [
  ...meaningful.flatMap(f => circumstancesFor(f).flatMap(when => [
    { stateId: f.id, aspect: when, questionType: 'flag-identify' },
    { stateId: f.id, aspect: when, questionType: 'flag-select' }
  ])),
  ...MANOEUVRING_FLAGS.map(f => ({ stateId: f.id, aspect: 'plain', questionType: 'flag-signal' }))
];

export function flagQuestionFor({ stateId, aspect: when, questionType }) {
  const f = FLAGS.find(x => x.id === stateId);
  if (!f) return null;
  const circumstance = when === 'plain' ? null : when;
  const meaning = flagMeaning(f, circumstance);
  const wrong = flagDistractors(f, 3);

  if (questionType === 'flag-select') {
    return {
      type: 'flag-select',
      flag: f, when: circumstance, showFlag: false,
      prompt: circumstance
        ? `${meaning} Which flag is flown${circumstance === 'fishing' ? ' by a fishing vessel' : ` ${circumstance}`}?`
        : `${meaning} Which flag is flown?`,
      options: shuffleFlags([f, ...wrong]).map(o => ({ id: o.id, text: `${o.letter || o.numeral} — ${o.phonetic}` })),
      answerId: f.id,
      explain: `${f.letter || f.numeral}, ${f.phonetic}. ${meaning}`
    };
  }

  if (questionType === 'flag-signal') {
    const sound = SOUND_SIGNALS.find(s => s.id === f.soundSignal);
    return {
      type: 'flag-signal',
      flag: f, when: null, showFlag: false, sound,
      prompt: `${f.meaning} Which flag, and what do you sound?`,
      // The wrong answers are mismatched pairings, not flags without a sound.
      // Offering "C — no whistle signal" would answer the question by
      // elimination: only one option would have a whistle signal at all.
      options: shuffleFlags([
        { id: f.id, text: pairText(f, sound) },
        ...MANOEUVRING_FLAGS
          .filter(o => o.id !== f.id)
          .map(o => ({ id: `${o.id}-${f.soundSignal}`, text: pairText(o, sound) }))
          .slice(0, 2),
        {
          id: `${f.id}-wrong`,
          text: pairText(f, SOUND_SIGNALS.find(x =>
            x.id !== f.soundSignal && MANOEUVRING_FLAGS.some(m => m.soundSignal === x.id)))
        }
      ]),
      answerId: f.id,
      // The three-way link, spelled out: this is the point of the question.
      explain: `${f.letter}, ${f.phonetic}. ${f.meaning} `
             + `In Morse that is ${flagMorse(f)}, and on the whistle ${sound ? `${sound.name.toLowerCase()} (${sound.rule})` : 'nothing'}.`
    };
  }

  return {
    type: 'flag-identify',
    flag: f, when: circumstance, showFlag: true,
    prompt: circumstance
      ? `This flag is flown ${circumstance === 'fishing' ? 'by a fishing vessel' : circumstance}. What does it mean?`
      : 'What does this flag mean?',
    options: shuffleFlags([
      { id: f.id, text: meaning },
      ...wrong.map(o => ({ id: o.id, text: flagMeaning(o) }))
    ]),
    answerId: f.id,
    explain: `${f.letter || f.numeral}, ${f.phonetic}. ${meaning}`
  };
}

export const flagSpace = () => ({
  flags: FLAGS.length,
  drillable: meaningful.length,
  cards: flagUniverse().length
});
