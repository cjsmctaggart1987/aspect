/**
 * Distress signals and Morse.
 *
 * The Morse timing checks are the strict ones. Morse is defined entirely by
 * ratios, so a bug there is a bug in every character at once, and the ratios
 * are exact integers rather than tolerances — if a dah is not precisely three
 * dits, it is wrong, not close.
 */
import { DISTRESS_SIGNALS, DISTRESS_MODALITIES, ANNEX_IV_PROHIBITION }
  from '../data/distress-signals.js';
import { MORSE_ALPHABET, MORSE_PROSIGNS, MORSE_CHARACTERS, MORSE_UNIT, MORSE_IN_USE,
  ditSeconds, morseFor, morseSignal, morsePattern, DEFAULT_WPM } from '../data/morse.js';
import { signalStrip, lightSignal, describe } from '../src/render-signal.js';
import { readFileSync } from 'node:fs';
import { renderFlagNC, renderSquareAndBall, renderArmSignal, renderDistress, DRAWN_DISTRESS }
  from '../src/render-distress.js';
import { distressUniverse, distressQuestionFor, morseDistractors, morseDistance }
  from '../src/distress-questions.js';

export default function run(t) {
  t.section('Annex IV coverage');
  t.ok('every distress signal carries an Annex IV reference',
    DISTRESS_SIGNALS.every(s => /^Annex IV/.test(s.rule)),
    DISTRESS_SIGNALS.filter(s => !/^Annex IV/.test(s.rule)).map(s => s.id).join(', '));
  t.ok('every signal has a modality from the fixed set',
    DISTRESS_SIGNALS.every(s => DISTRESS_MODALITIES.includes(s.modality)));
  t.ok('all four modalities are represented',
    new Set(DISTRESS_SIGNALS.map(s => s.modality)).size === 4,
    [...new Set(DISTRESS_SIGNALS.map(s => s.modality))].join(', '));
  t.ok('ids unique', new Set(DISTRESS_SIGNALS.map(s => s.id)).size === DISTRESS_SIGNALS.length);
  t.ok('every signal has a description and a memory line',
    DISTRESS_SIGNALS.every(s => s.description && s.memory && s.name));
  t.ok('the Annex IV(2) prohibition is recorded, both halves of it',
    /except to indicate distress/.test(ANNEX_IV_PROHIBITION.text) &&
    /confused with/.test(ANNEX_IV_PROHIBITION.text));
  t.ok('audible signals carry a pattern, SOS carries Morse instead',
    DISTRESS_SIGNALS.filter(s => s.pattern).every(s => s.seconds > 0) &&
    DISTRESS_SIGNALS.find(s => s.id === 'sos').morse === 'SOS' &&
    DISTRESS_SIGNALS.find(s => s.id === 'sos').pattern === null);

  t.section('Morse timing ratios are exact');
  t.ok('dit 1, dah 3, gap 1, char gap 3, word gap 7',
    MORSE_UNIT.dit === 1 && MORSE_UNIT.dah === 3 && MORSE_UNIT.gap === 1 &&
    MORSE_UNIT.charGap === 3 && MORSE_UNIT.wordGap === 7,
    JSON.stringify(MORSE_UNIT));
  t.ok('a dah is exactly three dits, not approximately',
    MORSE_UNIT.dah / MORSE_UNIT.dit === 3);
  t.ok('PARIS at 12 wpm gives a 100 ms dit', ditSeconds(12) === 0.1, `${ditSeconds(12)}s`);
  t.ok('the default is 12 words per minute', DEFAULT_WPM === 12);
  t.ok('dit length scales inversely with speed',
    ditSeconds(24) === +(ditSeconds(12) / 2).toFixed(4), `24 wpm -> ${ditSeconds(24)}s`);
  // Measured off a generated pattern rather than the constants, so the
  // generator is checked and not merely the table it reads from.
  const w = morseSignal('W');                       // .-- : dit dah dah
  const marks = w.pattern.filter(p => p.type !== 'gap');
  const gaps = w.pattern.filter(p => p.type === 'gap');
  const u = ditSeconds(DEFAULT_WPM);
  t.ok('generated dits and dahs measure 1 and 3 units',
    marks[0].seconds === u && marks[1].seconds === +(3 * u).toFixed(4), `${marks.map(m => m.seconds).join('/')}`);
  t.ok('generated intra-character gaps measure 1 unit', gaps.every(g => g.seconds === u));
  t.ok('W totals 9 units: 1 + 3 + 3 marks and two 1-unit gaps',
    w.seconds === +(9 * u).toFixed(4), `${w.seconds}s`);

  t.section('SOS is one prosign, not three letters');
  const sos = morseSignal('SOS');
  t.ok('code is ...---... unbroken', sos.code === '...---...' && MORSE_PROSIGNS.SOS === '...---...');
  t.ok('flagged as a prosign', sos.prosign === true);
  t.ok('EVERY gap inside it is one unit, so no letter break exists',
    sos.pattern.filter(p => p.type === 'gap').every(p => p.seconds === u),
    [...new Set(sos.pattern.filter(p => p.type === 'gap').map(p => p.seconds))].join('/'));
  t.ok('no gap anywhere in it is the three-unit character gap',
    !sos.pattern.some(p => p.type === 'gap' && p.seconds === +(MORSE_UNIT.charGap * u).toFixed(4)));
  t.ok('it is shorter than S O S sent as three spaced letters',
    sos.seconds < +(morsePattern('...---...', { spaced: true, chars: ['...', '---', '...'] })
      .reduce((a, s) => a + s.seconds, 0)).toFixed(4),
    `${sos.seconds}s prosign`);
  t.ok('9 elements: three dits, three dahs, three dits',
    sos.pattern.filter(p => p.type !== 'gap').map(p => p.type).join(',') ===
    'dit,dit,dit,dah,dah,dah,dit,dit,dit');

  t.section('the alphabet');
  t.ok('26 letters and 10 digits', Object.keys(MORSE_ALPHABET).length === 36);
  t.ok('every code uses only dots and dashes',
    Object.values(MORSE_ALPHABET).every(c => /^[.-]+$/.test(c)));
  t.ok('no two characters share a code',
    new Set(Object.values(MORSE_ALPHABET)).size === Object.keys(MORSE_ALPHABET).length);
  t.ok('E is one dit and T is one dah', MORSE_ALPHABET.E === '.' && MORSE_ALPHABET.T === '-');
  t.ok('lookup is case-insensitive and returns null for the unknown',
    morseFor('a') === '.-' && morseFor('#') === null);
  t.ok('the three letters used elsewhere in the app are covered',
    MORSE_IN_USE.every(m => morseFor(m.char)), MORSE_IN_USE.map(m => m.char).join(', '));

  t.section('everything renders');
  t.ok('all 37 characters draw a strip',
    MORSE_CHARACTERS.every(c => {
      const svg = signalStrip(morseSignal(c.char));
      return /<svg/.test(svg) && !/NaN|undefined/.test(svg);
    }));
  t.ok('the lamp animates, and holds steady when motion is reduced',
    /repeatCount="indefinite"/.test(lightSignal(sos)) &&
    !/repeatCount/.test(lightSignal(sos, { motion: false })));
  t.ok('the three drawn distress signals render clean',
    DRAWN_DISTRESS.every(id => {
      const svg = renderDistress(id);
      return /<svg/.test(svg) && !/NaN|undefined/.test(svg);
    }));
  // NC is now drawn from data/flags.js rather than from geometry hardcoded
  // here, so these check the halyard rather than a rect count.
  const nc = renderFlagNC();
  t.ok('flag N draws its chequer, sixteen squares of blue and white',
    (nc.match(/<rect/g) || []).length >= 16 && nc.includes('#0B4EA2'));
  t.ok('flag C draws its red centre band', nc.includes('#D0231C'));
  t.ok('N is hoisted above C, and both are lettered',
    nc.includes('>N<') && nc.includes('>C<') && nc.indexOf('>N<') < nc.indexOf('>C<'));
  t.ok('the halyard draws from the flag data, not from a second copy',
    !readFileSync('src/render-distress.js', 'utf8').includes('function flagN'));
  t.ok('the square and ball shows the permitted alternative too',
    /or below/.test(renderSquareAndBall()));
  t.ok('the arm signal shows two positions, not one',
    (renderArmSignal().match(/raised|lowered/g) || []).length === 2);
  t.ok('signals with no drawing return nothing rather than a blank SVG',
    renderDistress('mayday') === '' && renderDistress('epirb') === '');

  t.section('cards and questions');
  const universe = distressUniverse();
  const keys = universe.map(c => `${c.stateId}:${c.aspect}:${c.questionType}`);
  t.ok('all card keys unique', new Set(keys).size === keys.length, `${keys.length} cards`);
  t.ok('keys keep the three-part shape', keys.every(k => k.split(':').length === 3));
  const bad = universe.filter(c => {
    const q = distressQuestionFor(c);
    return !q || q.options.length !== 4 || new Set(q.options.map(o => o.id)).size !== 4 ||
      !q.options.some(o => o.id === q.answerId) || !q.prompt || !q.explain;
  });
  t.ok('every card yields four distinct options, one correct', bad.length === 0,
    bad.slice(0, 3).map(c => `${c.stateId}/${c.questionType}`).join(', '));
  t.ok('morse-see questions are flagged to render as light',
    distressQuestionFor({ stateId: 'morse-A', aspect: 'na', questionType: 'morse-see' }).asLight === true);

  t.section('Morse distractors are one element away');
  for (const ch of ['E', 'A', 'N']) {
    const near = morseDistractors(ch, 3);
    t.ok(`${ch} (${morseFor(ch)}) draws near neighbours`,
      near.every(c => morseDistance(morseFor(ch), c.code) <= 2),
      near.map(c => `${c.char} ${c.code}`).join('  '));
  }
  t.ok('distance is symmetric and zero against itself',
    morseDistance('.-', '-.') === morseDistance('-.', '.-') && morseDistance('...', '...') === 0);
}
