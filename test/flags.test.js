/**
 * Code flags.
 *
 * What these checks can and cannot do is worth being clear about. They can
 * prove the vocabulary is closed, that every flag renders well formed SVG, that
 * clip ids do not collide across a page of forty, that the Rule 34 cross-links
 * point at real sound signals, and that a drill does not print its own answer.
 *
 * They cannot tell you a flag is the right flag. Only docs/flags.html and a
 * pair of eyes can do that, which is why fifteen entries carry `verify: true`
 * and why the contact sheet is a deliverable rather than a convenience.
 */
import { FLAGS, ALPHABET_FLAGS, NUMERAL_PENNANTS, SUBSTITUTE_FLAGS, FLAG_PRIMITIVES,
  FLAG_SHAPES, FLAG_GROUPS, NEEDS_VERIFYING, MANOEUVRING_FLAGS,
  flagMeaning, flagMorse } from '../data/flags.js';
import { SOUND_SIGNALS } from '../data/sound-signals.js';
import { morseFor } from '../data/morse.js';
import { renderFlag, renderHoist, designSimilarity } from '../src/render-flag.js';
import { flagUniverse, flagQuestionFor, flagDistractors, circumstancesFor,
  FLAG_QUESTION_TYPES } from '../src/flag-questions.js';

export default function run(t) {
  t.section('the set');
  t.ok('26 alphabet, 10 numerals, 3 substitutes and the answering pennant',
    ALPHABET_FLAGS.length === 26 && NUMERAL_PENNANTS.length === 10 &&
    SUBSTITUTE_FLAGS.length === 4 && FLAGS.length === 40,
    `${FLAGS.length} total`);
  t.ok('ids unique', new Set(FLAGS.map(f => f.id)).size === FLAGS.length);
  t.ok('every flag has a phonetic name and a shape',
    FLAGS.every(f => f.phonetic && FLAG_SHAPES.includes(f.shape)));
  t.ok('the alphabet covers A to Z exactly once',
    ALPHABET_FLAGS.map(f => f.letter).join('') === 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  t.ok('the three groups partition the set',
    FLAG_GROUPS.reduce((n, g) => n + g.flags.length, 0) === FLAGS.length);

  t.section('the design vocabulary is closed');
  const used = [...new Set(FLAGS.map(f => f.design.type))];
  t.ok('every design uses a declared primitive',
    used.every(p => FLAG_PRIMITIVES.includes(p)),
    used.filter(p => !FLAG_PRIMITIVES.includes(p)).join(', ') || `${used.length} in use`);
  // The four beyond the original set are deliberate and documented; this holds
  // the line so a fifth cannot appear by accident.
  const extras = ['checker', 'diagonal', 'diagbands', 'triangles'];
  t.ok('exactly four primitives beyond the original vocabulary',
    extras.every(p => FLAG_PRIMITIVES.includes(p)) && FLAG_PRIMITIVES.length === 12,
    extras.join(', '));
  t.ok('each added primitive earns its place by being used',
    extras.every(p => used.includes(p)));

  t.section('meanings, variants, and what is not claimed');
  t.ok('every flag but R has a meaning',
    FLAGS.filter(f => !f.meaning).map(f => f.id).join(',') === 'R');
  // Recorded as a fact, not left blank: R carries no single-letter meaning.
  const R = ALPHABET_FLAGS.find(f => f.id === 'R');
  t.ok('R records the absence explicitly, with a note',
    R.meaning === null && /No single-letter meaning/.test(R.noMeaning));
  t.ok('R is marked unverified rather than asserted',
    R.verify === true);
  t.ok('the fishing variants are recorded for G, P, T and Z',
    ['G', 'P', 'T', 'Z'].every(id => (ALPHABET_FLAGS.find(f => f.id === id).variants || []).length > 0));
  t.ok('P records both in-harbour and at-sea meanings',
    circumstancesFor(ALPHABET_FLAGS.find(f => f.id === 'P')).join(',') === 'plain,in harbour,at sea');
  t.ok('flagMeaning returns the variant when asked, the plain one otherwise',
    flagMeaning(ALPHABET_FLAGS.find(f => f.id === 'G'), 'fishing') !== flagMeaning(ALPHABET_FLAGS.find(f => f.id === 'G')));
  t.ok('entries that could not be verified say so, and are counted',
    NEEDS_VERIFYING.length === 15 && NEEDS_VERIFYING.every(f => f.verify === true),
    `${NEEDS_VERIFYING.length} awaiting a check against Pub 102`);

  t.section('Morse is referenced, not restated');
  t.ok('flagMorse defers to morse.js',
    ALPHABET_FLAGS.every(f => flagMorse(f) === morseFor(f.letter)));
  t.ok('no flag stores a dot-dash string of its own',
    FLAGS.every(f => !/^[.-]+$/.test(String(f.morse || ''))));

  t.section('the Rule 34 cross-link');
  t.ok('E, I and S are linked to sound signals',
    MANOEUVRING_FLAGS.map(f => f.id).join(',') === 'E,I,S');
  t.ok('each link points at a sound signal that exists',
    MANOEUVRING_FLAGS.every(f => SOUND_SIGNALS.some(s => s.id === f.soundSignal)),
    MANOEUVRING_FLAGS.map(f => `${f.id}->${f.soundSignal}`).join(' '));
  // The link is only worth anything if both sides say the same thing.
  t.ok('the flag meaning matches the sound signal meaning',
    MANOEUVRING_FLAGS.every(f => {
      const s = SOUND_SIGNALS.find(x => x.id === f.soundSignal);
      return s && s.meaning.toLowerCase().includes(f.meaning.toLowerCase().replace(/\.$/, '').slice(0, 24));
    }),
    'E/starboard, I/port, S/astern');

  t.section('rendering');
  t.ok('all 40 render clean',
    FLAGS.every(f => { const s = renderFlag(f); return /<svg/.test(s) && !/NaN|undefined/.test(s); }));
  // Forty flags on one page, and the buoy renderer already shipped this bug
  // once with a single shared clip id.
  const page = FLAGS.map(f => renderFlag(f)).join('');
  const ids = [...page.matchAll(/clipPath id="([^"]+)"/g)].map(m => m[1]);
  t.ok('clip ids are unique across a whole page of flags',
    new Set(ids).size === ids.length, `${ids.length} clips`);
  t.ok('the hoist draws N above C and letters both',
    (() => {
      const h = renderHoist([ALPHABET_FLAGS.find(f => f.id === 'N'), ALPHABET_FLAGS.find(f => f.id === 'C')]);
      return h.includes('>N<') && h.includes('>C<') && h.indexOf('>N<') < h.indexOf('>C<');
    })());
  t.ok('shapes actually cut the flag: A is swallowtail, the answering pennant tapers',
    renderFlag(ALPHABET_FLAGS[0]).includes('L 0 80 Z') &&
    SUBSTITUTE_FLAGS.find(f => f.id === 'ANS').shape === 'pennant');
  t.ok('similar designs score higher than dissimilar ones',
    designSimilarity(ALPHABET_FLAGS.find(f => f.id === 'M'), ALPHABET_FLAGS.find(f => f.id === 'V')) >
    designSimilarity(ALPHABET_FLAGS.find(f => f.id === 'M'), ALPHABET_FLAGS.find(f => f.id === 'N')),
    'M and V are both saltires');

  t.section('cards and questions');
  const universe = flagUniverse();
  const keys = universe.map(c => `${c.stateId}:${c.aspect}:${c.questionType}`);
  t.ok('all card keys unique', new Set(keys).size === keys.length, `${keys.length} cards`);
  t.ok('keys keep the three-part shape', keys.every(k => k.split(':').length === 3));
  t.ok('the middle slot carries the circumstance, not a placeholder',
    new Set(universe.map(c => c.aspect)).size === 4,
    [...new Set(universe.map(c => c.aspect))].join(', '));
  t.ok('R is not drilled on a meaning it does not have',
    !universe.some(c => c.stateId === 'R'));
  t.ok('three question types', FLAG_QUESTION_TYPES.length === 3);

  let malformed = 0, duplicated = 0;
  for (let pass = 0; pass < 20; pass++) {
    for (const card of universe) {
      const q = flagQuestionFor(card);
      if (!q || q.options.length !== 4 || !q.options.some(o => o.id === q.answerId)) malformed++;
      else if (new Set(q.options.map(o => o.text)).size !== 4) duplicated++;
    }
  }
  t.ok('no malformed questions over 20 passes', malformed === 0, `${universe.length * 20} drawn`);
  t.ok('no two options ever read the same', duplicated === 0);
  // flag-signal offers mismatched flag-and-sound pairings. If the wrong answers
  // were flags with no sound at all, the question would answer itself.
  t.ok('flag-signal wrong answers all name a whistle signal',
    MANOEUVRING_FLAGS.every(f => flagQuestionFor({ stateId: f.id, aspect: 'plain', questionType: 'flag-signal' })
      .options.every(o => !/no whistle signal/.test(o.text))));
  t.ok('flag-signal explains flag, Morse and whistle together',
    (() => {
      const q = flagQuestionFor({ stateId: 'E', aspect: 'plain', questionType: 'flag-signal' });
      return /Morse/.test(q.explain) && /whistle/.test(q.explain) && /Echo/.test(q.explain);
    })());

  t.section('the drill does not show its own answer');
  const leaks = [];
  for (const card of universe) {
    const q = flagQuestionFor(card);
    // What the drill puts on screen before the user commits: the flag, drawn
    // anonymously, and the prompt. Options are excluded — they must contain it.
    const shown = (q.showFlag ? renderFlag(q.flag, { anonymous: true }) : '') + '\n' + q.prompt;
    const answers = [q.flag.phonetic, q.explain].filter(a => a && a.length > 3);
    if (q.showFlag && q.flag.meaning) answers.push(q.flag.meaning);
    for (const a of answers) if (shown.includes(a)) leaks.push(`${card.stateId}/${card.questionType}`);
    const right = q.options.find(o => o.id === q.answerId);
    if (right && right.text.length > 3 && q.prompt.includes(right.text)) {
      leaks.push(`${card.stateId}/${card.questionType}: answer in the prompt`);
    }
  }
  t.ok('no flag question leaks its answer', leaks.length === 0,
    [...new Set(leaks)].slice(0, 3).join(' | ') || `${universe.length} checked`);
  t.ok('an anonymous flag names neither its letter nor its phonetic',
    FLAGS.every(f => {
      const s = renderFlag(f, { anonymous: true });
      return !s.includes(f.phonetic) && !s.includes(`Code flag ${f.letter || f.numeral}`);
    }));
}
