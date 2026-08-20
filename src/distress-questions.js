/**
 * Drill questions about distress signals and Morse.
 *
 * Card keys keep the three-part shape scheduler.js stores, with 'na' in the
 * aspect slot, exactly as the sound signals do. Nothing in the scheduler
 * changes.
 *
 * Morse distractors are chosen by element distance, so a character one dit
 * away is the wrong answer offered. E and I, or A and W, are the confusions a
 * learner actually makes, and offering Q against E teaches nothing.
 */

import { DISTRESS_SIGNALS, DISTRESS_MODALITIES } from '../data/distress-signals.js';
import { MORSE_CHARACTERS, morseSignal, morseFor, DEFAULT_WPM } from '../data/morse.js';

export const DISTRESS_QUESTION_TYPES = ['distress-identify', 'distress-select'];
export const MORSE_QUESTION_TYPES = ['morse-hear', 'morse-see'];

const NA = 'na';

const anyOf = arr => arr[Math.floor(Math.random() * arr.length)];
const mixed = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);

/**
 * Distance between two Morse characters, counted in elements.
 *
 * Levenshtein over the dot-dash string. One substitution, insertion or deletion
 * is one step, which matches how the mistakes actually happen: hearing a dit as
 * a dah, or losing the last element of a longer character.
 */
export function morseDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

export function morseDistractors(char, n = 3) {
  const code = morseFor(char);
  return MORSE_CHARACTERS
    .filter(c => c.char !== char)
    .map(c => ({ c, d: morseDistance(code, c.code) + Math.random() * 0.5 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map(x => x.c);
}

/** Distress distractors: same modality first, since that is the real confusion. */
export function distressDistractors(signal, n = 3) {
  return DISTRESS_SIGNALS
    .filter(s => s.id !== signal.id)
    .map(s => ({ s, score: (s.modality === signal.modality ? 2 : 0) + Math.random() }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(x => x.s);
}

/** The full card space for both sections, in the shape selectCard expects. */
export const distressUniverse = () => [
  ...DISTRESS_SIGNALS.flatMap(s =>
    DISTRESS_QUESTION_TYPES.map(t => ({ stateId: s.id, aspect: NA, questionType: t }))),
  ...MORSE_CHARACTERS.flatMap(c =>
    MORSE_QUESTION_TYPES.map(t => ({ stateId: `morse-${c.id}`, aspect: NA, questionType: t })))
];

export function distressQuestionFor({ stateId, questionType }) {
  if (questionType === 'morse-hear' || questionType === 'morse-see') {
    const char = stateId.replace(/^morse-/, '');
    const entry = MORSE_CHARACTERS.find(c => c.id === char);
    if (!entry) return null;
    const wrong = morseDistractors(char, 3);
    return {
      type: questionType,
      signal: morseSignal(char),
      char,
      asLight: questionType === 'morse-see',
      prompt: questionType === 'morse-see'
        ? 'A lamp is flashing this. What character is it?'
        : 'Listen. What character is this?',
      options: mixed([entry, ...wrong]).map(c => ({ id: c.id, text: c.char })),
      answerId: char,
      explain: `${char} is ${entry.code}.` + (entry.prosign
        ? ' Sent as one run-together group, never as three spaced letters.'
        : '')
    };
  }

  const signal = DISTRESS_SIGNALS.find(s => s.id === stateId);
  if (!signal) return null;

  if (questionType === 'distress-select') {
    // The wrong answers here are other genuine distress signals, so the
    // question is "which of these fits this situation", not "spot the fake".
    const wrong = distressDistractors(signal, 3);
    return {
      type: 'distress-select',
      signal,
      // Not the description: for several entries it is the name verbatim, so
      // using it would print the answer above the options. The memory line is
      // the surrounding fact rather than a restatement of the signal.
      prompt: `${signal.memory} Which Annex IV signal is being described?`,
      options: mixed([signal, ...wrong]).map(s => ({ id: s.id, text: s.name })),
      answerId: signal.id,
      explain: `${signal.rule}. ${signal.memory}`
    };
  }

  const wrong = distressDistractors(signal, 3);
  return {
    type: 'distress-identify',
    signal,
    prompt: `${signal.name}. What does it mean, and how does it reach you?`,
    options: mixed([signal, ...wrong]).map(s => ({
      id: s.id,
      text: `Distress — ${s.modality}: ${s.description}`
    })),
    answerId: signal.id,
    explain: `${signal.rule}. ${signal.memory}`
  };
}

/**
 * What can actually be played for a distress signal.
 *
 * Audible entries carry their own pattern. SOS carries a morse field instead,
 * because its timing belongs to Morse, so it is assembled here at the current
 * speed. Everything else is silent and returns null rather than a pattern of
 * nothing: a flare has no sound and pretending otherwise would be a lie the
 * play button tells.
 */
export function audibleFor(signal, { wpm = DEFAULT_WPM } = {}) {
  if (!signal) return null;
  if (signal.pattern) return signal;
  if (signal.morse) return morseSignal(signal.morse, { wpm });
  return null;
}

/**
 * How a question should be delivered, given whether motion is allowed.
 *
 * morse-see flashes a lamp, and the lamp is SMIL. prefers-reduced-motion does
 * not stop SMIL by itself, so the app suppresses it by hand — which would leave
 * a morse-see question showing a lamp that never flashes and asking what
 * character it is. That is unanswerable, and showing nothing while pretending
 * the question still works is worse than not asking it.
 *
 * So the delivery is substituted: the same character, sent as sound, with the
 * substitution stated on screen rather than done quietly behind the reader.
 */
export function deliveryFor(question, { motion = true } = {}) {
  const wantsLight = question && question.asLight;
  if (wantsLight && !motion) {
    return {
      mode: 'sound',
      substituted: true,
      note: 'Your system asks for reduced motion, so the lamp is not flashed. '
          + 'The same character is sent as sound instead.'
    };
  }
  return { mode: wantsLight ? 'light' : 'sound', substituted: false, note: '' };
}

export const distressSpace = () => ({
  distress: DISTRESS_SIGNALS.length,
  morse: MORSE_CHARACTERS.length,
  cards: distressUniverse().length,
  modalities: DISTRESS_MODALITIES.length
});
