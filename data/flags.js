/**
 * International Code of Signals: alphabet flags, numeral pennants, substitutes
 * and the answering pennant.
 *
 * Meanings are paraphrased from Pub 102 (NGA), a US Government work. Designs
 * are encoded as geometry rather than traced, the same discipline as the buoys:
 * a flag here is a description a renderer executes, so a wrong description
 * draws a visibly wrong flag rather than a quietly wrong one.
 *
 * DESIGN VOCABULARY
 *
 * The closed set: vertical, horizontal, quarters, cross, saltire, border,
 * diamond, circle — plus a swallowtail or triangular cut carried on `shape`.
 *
 * Four primitives are added beyond that set, deliberately, because four flags
 * cannot be expressed without them:
 *
 *   checker    N is a four by four chequer. Nothing else in the set repeats.
 *   diagonal   O is divided corner to corner, which is not a band or a saltire.
 *   diagbands  Y is a run of diagonal stripes.
 *   triangles  Z is four triangles meeting at the centre, cut by both diagonals.
 *
 * `border` takes layers rather than a single ring, so W — blue outside, white,
 * red centre — is one primitive rather than two nested ones.
 *
 * VERIFICATION
 *
 * `verify: true` marks an entry whose design I could not confirm against Pub
 * 102 in this environment. It is not a guess presented as fact: it is a flag on
 * the record that the geometry needs eyes on it before anyone learns from it.
 * docs/flags.html exists to make that review possible. Clear the field only
 * after checking against the publication.
 */

import { morseFor } from './morse.js';

export const FLAG_SHAPES = ['rectangle', 'pennant', 'triangle', 'swallowtail'];

export const FLAG_PRIMITIVES = [
  'vertical', 'horizontal', 'quarters', 'cross', 'saltire',
  'border', 'diamond', 'circle',
  'checker', 'diagonal', 'diagbands', 'triangles'
];

export const FLAG_HEX = {
  red: '#D0231C',
  blue: '#0B4EA2',
  yellow: '#F2C200',
  black: '#141A1E',
  white: '#F6F4EE'
};

const flag = f => ({ variants: [], soundSignal: null, verify: false, ...f });

// --- the alphabet ---------------------------------------------------------

export const ALPHABET_FLAGS = [
  flag({ id: 'A', letter: 'A', phonetic: 'Alfa', shape: 'swallowtail',
    design: { type: 'vertical', bands: ['white', 'blue'] },
    meaning: 'I have a diver down; keep well clear at slow speed.', morse: 'A' }),
  flag({ id: 'B', letter: 'B', phonetic: 'Bravo', shape: 'swallowtail',
    design: { type: 'vertical', bands: ['red'] },
    meaning: 'I am taking in, discharging, or carrying dangerous goods.', morse: 'B' }),
  flag({ id: 'C', letter: 'C', phonetic: 'Charlie', shape: 'rectangle',
    design: { type: 'horizontal', bands: ['blue', 'white', 'red', 'white', 'blue'] },
    meaning: 'Yes. Affirmative.', morse: 'C' }),
  flag({ id: 'D', letter: 'D', phonetic: 'Delta', shape: 'rectangle',
    design: { type: 'horizontal', bands: ['yellow', 'blue', 'yellow'], weights: [1, 2, 1] },
    meaning: 'Keep clear of me; I am manoeuvring with difficulty.', morse: 'D' }),
  flag({ id: 'E', letter: 'E', phonetic: 'Echo', shape: 'rectangle',
    design: { type: 'horizontal', bands: ['blue', 'red'] },
    meaning: 'I am altering my course to starboard.', morse: 'E',
    soundSignal: 'r34-starboard' }),
  flag({ id: 'F', letter: 'F', phonetic: 'Foxtrot', shape: 'rectangle',
    design: { type: 'diamond', field: 'white', figure: 'red' },
    meaning: 'I am disabled; communicate with me.', morse: 'F' }),
  flag({ id: 'G', letter: 'G', phonetic: 'Golf', shape: 'rectangle',
    design: { type: 'vertical', bands: ['yellow', 'blue', 'yellow', 'blue', 'yellow', 'blue'] },
    meaning: 'I require a pilot.', morse: 'G',
    variants: [{ when: 'fishing', meaning: 'I am hauling nets.' }] }),
  flag({ id: 'H', letter: 'H', phonetic: 'Hotel', shape: 'rectangle',
    design: { type: 'vertical', bands: ['white', 'red'] },
    meaning: 'I have a pilot on board.', morse: 'H' }),
  flag({ id: 'I', letter: 'I', phonetic: 'India', shape: 'rectangle',
    design: { type: 'circle', field: 'yellow', figure: 'black' },
    meaning: 'I am altering my course to port.', morse: 'I',
    soundSignal: 'r34-port' }),
  flag({ id: 'J', letter: 'J', phonetic: 'Juliett', shape: 'rectangle',
    design: { type: 'horizontal', bands: ['blue', 'white', 'blue'] },
    meaning: 'I am on fire and have dangerous cargo aboard; keep well clear.', morse: 'J' }),
  flag({ id: 'K', letter: 'K', phonetic: 'Kilo', shape: 'rectangle',
    design: { type: 'vertical', bands: ['yellow', 'blue'] },
    meaning: 'I wish to communicate with you.', morse: 'K' }),
  flag({ id: 'L', letter: 'L', phonetic: 'Lima', shape: 'rectangle',
    design: { type: 'quarters', colours: ['yellow', 'black', 'black', 'yellow'] },
    meaning: 'Stop your vessel instantly.', morse: 'L' }),
  flag({ id: 'M', letter: 'M', phonetic: 'Mike', shape: 'rectangle',
    design: { type: 'saltire', field: 'blue', figure: 'white' },
    meaning: 'My vessel is stopped and making no way through the water.', morse: 'M' }),
  flag({ id: 'N', letter: 'N', phonetic: 'November', shape: 'rectangle',
    design: { type: 'checker', colours: ['blue', 'white'], rows: 4, cols: 4 },
    meaning: 'No. Negative.', morse: 'N' }),
  flag({ id: 'O', letter: 'O', phonetic: 'Oscar', shape: 'rectangle',
    design: { type: 'diagonal', colours: ['red', 'yellow'] },
    meaning: 'Man overboard.', morse: 'O' }),
  flag({ id: 'P', letter: 'P', phonetic: 'Papa', shape: 'rectangle',
    design: { type: 'border', layers: ['blue', 'white'] },
    meaning: 'The Blue Peter.',
    variants: [
      { when: 'in harbour', meaning: 'All persons are to report on board; the vessel is about to proceed to sea.' },
      { when: 'at sea', meaning: 'Used by fishing vessels: my nets have come fast upon an obstruction.' }
    ],
    morse: 'P' }),
  flag({ id: 'Q', letter: 'Q', phonetic: 'Quebec', shape: 'rectangle',
    design: { type: 'vertical', bands: ['yellow'] },
    meaning: 'My vessel is healthy and I request free pratique.', morse: 'Q' }),
  flag({ id: 'R', letter: 'R', phonetic: 'Romeo', shape: 'rectangle',
    design: { type: 'cross', field: 'red', figure: 'yellow' },
    // Recorded as a fact, not an omission: the current code assigns R no
    // single-letter meaning. NOT verified against Pub 102 in this environment.
    meaning: null,
    noMeaning: 'No single-letter meaning is assigned to R in the current code. '
             + 'It carries meaning only in combination with other flags.',
    verify: true, morse: 'R' }),
  flag({ id: 'S', letter: 'S', phonetic: 'Sierra', shape: 'rectangle',
    design: { type: 'border', layers: ['white', 'blue'] },
    meaning: 'I am operating astern propulsion.', morse: 'S',
    soundSignal: 'r34-astern' }),
  flag({ id: 'T', letter: 'T', phonetic: 'Tango', shape: 'rectangle',
    design: { type: 'vertical', bands: ['red', 'white', 'blue'] },
    meaning: 'Keep clear of me; I am engaged in pair trawling.', morse: 'T',
    variants: [{ when: 'fishing', meaning: 'Keep clear of me; I am engaged in pair trawling.' }] }),
  flag({ id: 'U', letter: 'U', phonetic: 'Uniform', shape: 'rectangle',
    design: { type: 'quarters', colours: ['red', 'white', 'white', 'red'] },
    meaning: 'You are running into danger.', morse: 'U' }),
  flag({ id: 'V', letter: 'V', phonetic: 'Victor', shape: 'rectangle',
    design: { type: 'saltire', field: 'white', figure: 'red' },
    meaning: 'I require assistance.', morse: 'V' }),
  flag({ id: 'W', letter: 'W', phonetic: 'Whiskey', shape: 'rectangle',
    design: { type: 'border', layers: ['blue', 'white', 'red'] },
    meaning: 'I require medical assistance.', morse: 'W' }),
  flag({ id: 'X', letter: 'X', phonetic: 'Xray', shape: 'rectangle',
    design: { type: 'cross', field: 'white', figure: 'blue' },
    meaning: 'Stop carrying out your intentions and watch for my signals.', morse: 'X' }),
  flag({ id: 'Y', letter: 'Y', phonetic: 'Yankee', shape: 'rectangle',
    design: { type: 'diagbands', colours: ['yellow', 'red'], count: 10 },
    meaning: 'I am dragging my anchor.', morse: 'Y' }),
  flag({ id: 'Z', letter: 'Z', phonetic: 'Zulu', shape: 'rectangle',
    design: { type: 'triangles', colours: ['black', 'yellow', 'blue', 'red'] },
    meaning: 'I require a tug.', morse: 'Z',
    variants: [{ when: 'fishing', meaning: 'I am shooting nets.' }] })
];

// --- numeral pennants -----------------------------------------------------
//
// Every one of these carries verify: true. The alphabet designs I am confident
// of; these I am not, and a drill that teaches a wrong pennant is worse than no
// drill. Check them against Pub 102 using docs/flags.html before clearing.

const numeral = (n, phonetic, design) => flag({
  id: `N${n}`, numeral: String(n), phonetic, shape: 'pennant', design,
  meaning: `Numeral ${n}.`, morse: String(n), verify: true
});

export const NUMERAL_PENNANTS = [
  numeral(0, 'Nadazero', { type: 'horizontal', bands: ['red', 'yellow', 'red'] }),
  numeral(1, 'Unaone', { type: 'circle', field: 'white', figure: 'red' }),
  numeral(2, 'Bissotwo', { type: 'circle', field: 'blue', figure: 'white' }),
  numeral(3, 'Terrathree', { type: 'vertical', bands: ['red', 'white', 'blue'] }),
  numeral(4, 'Kartefour', { type: 'quarters', colours: ['red', 'white', 'white', 'red'] }),
  numeral(5, 'Pantafive', { type: 'diagonal', colours: ['yellow', 'blue'] }),
  numeral(6, 'Soxisix', { type: 'horizontal', bands: ['black', 'white'] }),
  numeral(7, 'Setteseven', { type: 'horizontal', bands: ['yellow', 'red'] }),
  numeral(8, 'Oktoeight', { type: 'saltire', field: 'white', figure: 'red' }),
  numeral(9, 'Novenine', { type: 'quarters', colours: ['white', 'black', 'black', 'white'] })
];

// --- substitutes and the answering pennant --------------------------------

export const SUBSTITUTE_FLAGS = [
  flag({ id: 'SUB1', letter: '1st sub', phonetic: 'First substitute', shape: 'triangle',
    design: { type: 'horizontal', bands: ['yellow', 'blue'] },
    meaning: 'Repeats the first flag of the same class in the hoist.',
    morse: null, verify: true }),
  flag({ id: 'SUB2', letter: '2nd sub', phonetic: 'Second substitute', shape: 'triangle',
    design: { type: 'horizontal', bands: ['blue', 'white'] },
    meaning: 'Repeats the second flag of the same class in the hoist.',
    morse: null, verify: true }),
  flag({ id: 'SUB3', letter: '3rd sub', phonetic: 'Third substitute', shape: 'triangle',
    design: { type: 'horizontal', bands: ['black', 'white'] },
    meaning: 'Repeats the third flag of the same class in the hoist.',
    morse: null, verify: true }),
  flag({ id: 'ANS', letter: 'Answering', phonetic: 'Answering pennant', shape: 'pennant',
    design: { type: 'vertical', bands: ['red', 'white', 'red', 'white', 'red'] },
    meaning: 'Hoisted at the dip to show a signal is seen but not understood, '
           + 'close up when it is understood. Also used as the decimal point.',
    morse: null, verify: true })
];

export const FLAGS = [...ALPHABET_FLAGS, ...NUMERAL_PENNANTS, ...SUBSTITUTE_FLAGS];

export const FLAG_GROUPS = [
  { id: 'alphabet', name: 'Alphabet', flags: ALPHABET_FLAGS },
  { id: 'numerals', name: 'Numeral pennants', flags: NUMERAL_PENNANTS },
  { id: 'substitutes', name: 'Substitutes and answering pennant', flags: SUBSTITUTE_FLAGS }
];

/** The Morse for a flag, looked up rather than restated. */
export const flagMorse = f => (f.morse ? morseFor(f.morse) : null);

/** Flags that also correspond to a Rule 34 manoeuvring signal. */
export const MANOEUVRING_FLAGS = ALPHABET_FLAGS.filter(f => f.soundSignal);

/** What a flag actually means, given the circumstance. */
export function flagMeaning(f, when = null) {
  if (when) {
    const v = (f.variants || []).find(x => x.when === when);
    if (v) return v.meaning;
  }
  return f.meaning || f.noMeaning;
}

/** Entries whose geometry still needs checking against the publication. */
export const NEEDS_VERIFYING = FLAGS.filter(f => f.verify);
