/**
 * Distress signals, Annex IV. International.
 *
 * Annex IV is a list of things that mean one thing only: this vessel is in
 * distress and needs assistance. It is not a set of rules about giving way, so
 * these entries carry no aspect and no arcs. What they carry is recognition —
 * you either know a square flag with a ball above it or you do not.
 *
 * `modality` is how the signal reaches you, because that determines whether you
 * will ever see it: a radio alert is invisible from the bridge wing and a hand
 * flare is inaudible.
 *
 * Audible signals carry a pattern in the same shape as the sound signals, so
 * the same strip renderer draws them. SOS is the exception: it carries a morse
 * field instead and its pattern is generated from data/morse.js, because the
 * timing belongs to Morse rather than to Annex IV, and duplicating it here
 * would let the two drift apart.
 *
 * Source of truth: 33 CFR Subchapter E, a US Government work.
 */

export const DISTRESS_MODALITIES = ['sound', 'visual', 'radio', 'physical'];

// Audible primitives. A gun is a report, not a blast; fog apparatus sounded
// continuously is one unbroken span rather than a pattern.
const REPORT = 0.7;
const CONTINUOUS = 8;

const distressTotal = p => (p ? +p.reduce((a, s) => a + s.seconds, 0).toFixed(2) : null);

const entry = d => ({ ...d, seconds: distressTotal(d.pattern) });

export const DISTRESS_SIGNALS = [
  entry({
    id: 'gun',
    rule: 'Annex IV(1)(a)',
    modality: 'sound',
    name: 'A gun or other explosive signal at intervals of about a minute',
    pattern: [{ type: 'report', seconds: REPORT }],
    repeat: 60,
    description: 'A single report, repeated at intervals of about one minute.',
    memory: 'The interval is the signal. A single bang is an accident; one a minute is a distress signal.'
  }),
  entry({
    id: 'fog-continuous',
    rule: 'Annex IV(1)(b)',
    modality: 'sound',
    name: 'Continuous sounding of any fog-signalling apparatus',
    pattern: [{ type: 'continuous', seconds: CONTINUOUS }],
    repeat: null,
    description: 'Any fog-signalling apparatus sounded continuously, rather than in the pattern of Rule 35.',
    memory: 'Rule 35 fog signals are short groups with long silences. Distress is the whistle simply held down.'
  }),
  entry({
    id: 'red-stars',
    rule: 'Annex IV(1)(c)',
    modality: 'visual',
    name: 'Rockets or shells throwing red stars, fired one at a time at short intervals',
    pattern: null,
    repeat: null,
    description: 'Rockets or shells throwing red stars, fired one at a time at short intervals.',
    memory: 'One at a time and repeated. A single red star could be almost anything; a succession of them cannot.'
  }),
  entry({
    id: 'sos',
    rule: 'Annex IV(1)(d)',
    modality: 'sound',
    morse: 'SOS',
    name: 'SOS in Morse code, by any signalling method',
    pattern: null,                 // generated from data/morse.js
    repeat: null,
    description: 'The group ...---... made by radiotelegraphy or by any other signalling method: sound, light, or anything else that can be interrupted.',
    memory: 'Sent as one run-together group, never as three spaced letters. The gap that would separate S from O is exactly what would stop it being SOS.'
  }),
  entry({
    id: 'mayday',
    rule: 'Annex IV(1)(e)',
    modality: 'radio',
    name: 'The spoken word Mayday',
    pattern: null,
    repeat: null,
    description: 'A signal sent by radiotelephony consisting of the spoken word "Mayday".',
    memory: 'From the French m\'aidez. Spoken three times at the start of the call, and reserved absolutely for grave and imminent danger.'
  }),
  entry({
    id: 'flag-nc',
    rule: 'Annex IV(1)(f)',
    modality: 'visual',
    name: 'The code flag signal NC',
    pattern: null,
    repeat: null,
    description: 'The International Code signal of distress, flag N hoisted above flag C.',
    memory: 'N over C, in that order and no other. Two flags that mean nothing apart and distress together.'
  }),
  entry({
    id: 'square-ball',
    rule: 'Annex IV(1)(g)',
    modality: 'visual',
    name: 'A square flag with a ball above or below it',
    pattern: null,
    repeat: null,
    description: 'A signal consisting of a square flag having above or below it a ball, or anything resembling a ball.',
    memory: 'Anything resembling a ball. The rule is deliberately loose because it is meant to be improvised from whatever is aboard.'
  }),
  entry({
    id: 'flames',
    rule: 'Annex IV(1)(h)',
    modality: 'visual',
    name: 'Flames on the vessel',
    pattern: null,
    repeat: null,
    description: 'Flames on the vessel, as from a burning tar barrel or oil barrel.',
    memory: 'Deliberate fire, not accidental. It is on the list because it is what you can do with no equipment at all.'
  }),
  entry({
    id: 'red-flare',
    rule: 'Annex IV(1)(i)',
    modality: 'visual',
    name: 'A rocket parachute flare or a hand flare showing a red light',
    pattern: null,
    repeat: null,
    description: 'A rocket parachute flare or a hand flare showing a red light.',
    memory: 'Red means distress. A white flare is a warning that you are standing into danger, and means the opposite thing about who needs help.'
  }),
  entry({
    id: 'orange-smoke',
    rule: 'Annex IV(1)(j)',
    modality: 'visual',
    name: 'A smoke signal giving off orange-coloured smoke',
    pattern: null,
    repeat: null,
    description: 'A smoke signal giving off orange-coloured smoke.',
    memory: 'A daylight signal. Orange smoke is visible against sea and sky in a way a flare in sunlight is not.'
  }),
  entry({
    id: 'arms',
    rule: 'Annex IV(1)(k)',
    modality: 'physical',
    name: 'Arms outstretched to each side, raised and lowered slowly and repeatedly',
    pattern: null,
    repeat: null,
    description: 'Slowly and repeatedly raising and lowering arms outstretched to each side.',
    memory: 'Slowly and repeatedly. Waving one arm is greeting; both arms rising and falling together is not.'
  }),
  entry({
    id: 'epirb',
    rule: 'Annex IV(1)(n)',
    modality: 'radio',
    name: 'Signals transmitted by an emergency position-indicating radio beacon',
    pattern: null,
    repeat: null,
    description: 'Signals transmitted by emergency position-indicating radio beacons (EPIRB).',
    memory: 'It carries your identity and position to a satellite whether or not anyone is left aboard to send it.'
  }),
  entry({
    id: 'radio-alert',
    rule: 'Annex IV(1)(l), (m) and (o)',
    modality: 'radio',
    name: 'Approved radiocommunication distress alerts',
    pattern: null,
    repeat: null,
    description: 'A distress alert by digital selective calling on VHF channel 70 or MF/HF, a ship-to-shore alert by satellite, and other approved signals transmitted by radiocommunication systems including survival craft radar transponders.',
    memory: 'The three that reach beyond the horizon. Nobody on watch sees any of them; they arrive on somebody\'s screen.'
  })
];

/**
 * Annex IV(2). Worth carrying as data rather than prose in a card, because it
 * is the half of the annex people forget: the list is not a menu of attention-
 * getting devices.
 */
export const ANNEX_IV_PROHIBITION = {
  rule: 'Annex IV(2)',
  text: 'The use or exhibition of any of these signals except to indicate distress and need of assistance is prohibited, as is the use of any signal that may be confused with them.',
  memory: 'Both halves matter. Not only must you not fire a red flare for fun, you must not invent a signal that looks like one.'
};

export const DISTRESS_BY_MODALITY = modality => DISTRESS_SIGNALS.filter(s => s.modality === modality);
