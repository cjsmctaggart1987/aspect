/**
 * Morse code, and its timing.
 *
 * The whole of Morse timing is one number. A dit is the unit; everything else
 * is a multiple of it:
 *
 *   dit                       1
 *   dah                       3
 *   gap inside a character    1
 *   gap between characters    3
 *   gap between words         7
 *
 * So speed is a single parameter. The standard word PARIS is exactly 50 units,
 * which is where words per minute comes from: at w words a minute the dit is
 * 60 / (50 w) seconds, or 1.2 / w. Twelve words a minute gives a dit of 100 ms,
 * which is about as slow as Morse is ever sent and roughly where a learner can
 * still hear the difference between a dit and a dah.
 *
 * SOS is a prosign, not three letters. It is sent as one run-together group
 * with only intra-character gaps throughout, because the three-unit gap that
 * would separate S from O is exactly what would stop it being SOS. It is
 * stored that way here rather than assembled from letters, so it cannot be
 * accidentally spaced by code that does not know the difference.
 */

export const MORSE_UNIT = { dit: 1, dah: 3, gap: 1, charGap: 3, wordGap: 7 };

/** Dit length in seconds for a given words per minute. PARIS is 50 units. */
export const ditSeconds = (wpm = 12) => +(1.2 / wpm).toFixed(4);

export const DEFAULT_WPM = 12;

export const MORSE_ALPHABET = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
  H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
  O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
  V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.'
};

/**
 * Prosigns: sent as one character, with no gap where the letter break would be.
 * SOS is the one that matters here, and it is on the Annex IV list.
 */
export const MORSE_PROSIGNS = {
  SOS: '...---...'
};

/**
 * Single letters the rest of the app already leans on, so a learner meeting
 * "Morse C" in the sound signals or "Mo (A)" in the buoyage can hear what that
 * actually is rather than taking it on trust.
 */
export const MORSE_IN_USE = [
  { char: 'A', where: 'Buoyage: safe water marks may show Mo (A).' },
  { char: 'C', where: 'Rule 34(c)(ii): the answer agreeing to be overtaken.' },
  { char: 'R', where: 'Rule 35(g): the optional whistle warning from a vessel at anchor.' }
];

export const morseFor = char => {
  const key = String(char).toUpperCase();
  return MORSE_PROSIGNS[key] || MORSE_ALPHABET[key] || null;
};

/** Everything drillable: the alphabet, the digits, and the prosigns. */
export const MORSE_CHARACTERS = [
  ...Object.keys(MORSE_ALPHABET).map(c => ({ id: c, char: c, code: MORSE_ALPHABET[c], prosign: false })),
  ...Object.keys(MORSE_PROSIGNS).map(c => ({ id: c, char: c, code: MORSE_PROSIGNS[c], prosign: true }))
];

/**
 * A code string laid out in time, in the same span shape the strip renderer
 * and the audio engine already understand.
 *
 * `spaced` is what separates a prosign from a run of letters: with it false,
 * every gap inside the group is one unit, which is what makes ...---... a
 * single character rather than S O S.
 */
export function morsePattern(code, { wpm = DEFAULT_WPM, spaced = false, chars = null } = {}) {
  const u = ditSeconds(wpm);
  const spans = [];
  const groups = spaced && chars ? chars : [code];

  groups.forEach((group, gi) => {
    if (gi > 0) spans.push({ type: 'gap', seconds: +(MORSE_UNIT.charGap * u).toFixed(4) });
    [...group].forEach((mark, i) => {
      if (i > 0) spans.push({ type: 'gap', seconds: +(MORSE_UNIT.gap * u).toFixed(4) });
      spans.push({
        type: mark === '-' ? 'dah' : 'dit',
        seconds: +((mark === '-' ? MORSE_UNIT.dah : MORSE_UNIT.dit) * u).toFixed(4)
      });
    });
  });
  return spans;
}

/** A character as a signal object, so signalStrip and play() take it unchanged. */
export function morseSignal(char, { wpm = DEFAULT_WPM } = {}) {
  const code = morseFor(char);
  if (!code) return null;
  const pattern = morsePattern(code, { wpm });
  return {
    id: `morse-${char}`,
    name: `${char}  ${code}`,
    code,
    prosign: !!MORSE_PROSIGNS[String(char).toUpperCase()],
    pattern,
    seconds: +pattern.reduce((a, s) => a + s.seconds, 0).toFixed(4),
    repeat: null,
    equipment: ['whistle']
  };
}
