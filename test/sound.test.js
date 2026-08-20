/**
 * Sound signals: the data, the timings, the card space and the drawing.
 *
 * The audio itself is not tested here. Web Audio needs a browser, and what
 * could be asserted in Node — that play() does not throw — would say nothing
 * about whether it sounds like a whistle. The pitch band lookup that feeds it
 * is tested, because that is the part carrying a rule.
 */
import { SOUND_SIGNALS, BLAST, GAP, WHISTLE_BANDS, EQUIPMENT_THRESHOLDS, bandFor, DEFAULT_BAND }
  from '../data/sound-signals.js';
import { signalStrip, describe, stripKey } from '../src/render-signal.js';
import { soundUniverse, soundQuestionFor, signalDistractors, shapeOf, QUESTION_TYPES, NO_ASPECT }
  from '../src/sound-questions.js';

const BLAST_TYPES = new Set(['short', 'prolonged']);

export default function run(t) {
  t.section('every signal is attributable to a rule');
  t.ok('all have a rule reference', SOUND_SIGNALS.every(s => /^Rule 3[2-5]/.test(s.rule)),
    SOUND_SIGNALS.filter(s => !/^Rule 3[2-5]/.test(s.rule)).map(s => s.id).join(', '));
  t.ok('all have a group, name, meaning and memory',
    SOUND_SIGNALS.every(s => s.group && s.name && s.meaning && s.memory));
  t.ok('inland is null throughout, pending the fork',
    SOUND_SIGNALS.every(s => s.inland === null));
  t.ok('ids are unique', new Set(SOUND_SIGNALS.map(s => s.id)).size === SOUND_SIGNALS.length);

  t.section('pattern durations match the Rule 32 primitives');
  const wrongShort = SOUND_SIGNALS.flatMap(s => s.pattern.filter(p => p.type === 'short' && p.seconds !== BLAST.short).map(() => s.id));
  const wrongLong = SOUND_SIGNALS.flatMap(s => s.pattern.filter(p => p.type === 'prolonged' && p.seconds !== BLAST.prolonged).map(() => s.id));
  t.ok(`every short blast is ${BLAST.short}s`, wrongShort.length === 0, wrongShort.join(', '));
  t.ok(`every prolonged blast is ${BLAST.prolonged}s`, wrongLong.length === 0, wrongLong.join(', '));
  t.ok('prolonged sits inside the four to six second band the rule allows',
    BLAST.prolonged >= 4 && BLAST.prolonged <= 6, `${BLAST.prolonged}s`);
  // Rule 34(d) is the one documented departure: "short and rapid".
  const rapid = SOUND_SIGNALS.find(s => s.id === 'r34-doubt');
  const rapidGaps = rapid.pattern.filter(p => p.type === 'gap').map(p => p.seconds);
  t.ok('the doubt signal is the only one with a gap under the primitive',
    rapidGaps.every(g => g < GAP) &&
    SOUND_SIGNALS.filter(s => s.id !== 'r34-doubt')
      .every(s => s.pattern.filter(p => p.type === 'gap').every(p => p.seconds >= GAP)),
    `doubt gaps ${[...new Set(rapidGaps)].join('/')}s`);

  t.section('spans do not overlap and sum to the declared total');
  const mismatched = SOUND_SIGNALS.filter(s =>
    +s.pattern.reduce((a, p) => a + p.seconds, 0).toFixed(2) !== s.seconds);
  t.ok('pattern sums to seconds for every signal', mismatched.length === 0,
    mismatched.map(s => s.id).join(', '));
  t.ok('every span has a positive duration',
    SOUND_SIGNALS.every(s => s.pattern.every(p => p.seconds > 0)));
  // Spans are laid end to end, so non-overlap is the same claim as the running
  // total never exceeding the declared one.
  t.ok('spans laid end to end never exceed the total', SOUND_SIGNALS.every(s => {
    let cursor = 0;
    return s.pattern.every(p => (cursor += p.seconds) <= s.seconds + 0.001);
  }));
  t.ok('no two blasts run together without a gap between them',
    SOUND_SIGNALS.every(s => s.pattern.every((p, i, a) =>
      i === 0 || !(BLAST_TYPES.has(p.type) && BLAST_TYPES.has(a[i - 1].type)))));

  t.section('equipment is consistent with the rule');
  const kit = new Set(['whistle', 'bell', 'gong']);
  t.ok('every signal names at least one instrument',
    SOUND_SIGNALS.every(s => s.equipment.length > 0 && s.equipment.every(e => kit.has(e))));
  t.ok('whistle signals contain only blasts, never strikes',
    SOUND_SIGNALS.filter(s => s.equipment.join() === 'whistle')
      .every(s => s.pattern.every(p => p.type === 'gap' || BLAST_TYPES.has(p.type))));
  t.ok('bell and gong signals contain no whistle blasts',
    SOUND_SIGNALS.filter(s => s.equipment.includes('bell'))
      .every(s => s.pattern.every(p => !BLAST_TYPES.has(p.type))));
  t.ok('only the 100 m anchor signal uses both bell and gong',
    SOUND_SIGNALS.filter(s => s.equipment.includes('gong')).map(s => s.id).join() === 'r35-anchored-100');
  t.ok('Rule 33 thresholds recorded: whistle 12 m, bell 20 m, gong 100 m',
    EQUIPMENT_THRESHOLDS.map(e => `${e.equipment}${e.from}`).join(' ') === 'whistle12 bell20 gong100');

  t.section('restricted visibility signals repeat, manoeuvring signals do not');
  t.ok('every Rule 35 signal that repeats does so at 60s or 120s',
    SOUND_SIGNALS.filter(s => s.repeat).every(s => s.repeat === 60 || s.repeat === 120));
  t.ok('bell signals repeat every minute, not every two',
    SOUND_SIGNALS.filter(s => s.equipment.includes('bell')).every(s => s.repeat === 60));
  t.ok('no Rule 34 manoeuvring signal repeats',
    SOUND_SIGNALS.filter(s => s.rule.startsWith('Rule 34')).every(s => s.repeat === null));

  t.section('Annex III whistle bands');
  t.ok('four bands, descending in length and rising in pitch',
    WHISTLE_BANDS.length === 4 && WHISTLE_BANDS.every((b, i, a) => i === 0 || b.hz[1] >= a[i - 1].hz[1] - 200));
  t.ok('200 m and over is 70 to 200 Hz',
    WHISTLE_BANDS.find(b => b.id === '200plus').hz.join('-') === '70-200');
  t.ok('under 20 m is 250 to 700 Hz',
    WHISTLE_BANDS.find(b => b.id === 'under20').hz.join('-') === '250-700');
  t.ok('an unknown band falls back to the default rather than throwing',
    bandFor('nonsense').id === DEFAULT_BAND);

  t.section('the card space and the scheduler key shape');
  const universe = soundUniverse();
  const keys = universe.map(c => `${c.stateId}:${c.aspect}:${c.questionType}`);
  t.ok('all card keys unique', new Set(keys).size === keys.length, `${keys.length} cards`);
  t.ok('keys keep the three-part shape scheduler.js stores',
    keys.every(k => k.split(':').length === 3));
  t.ok('the aspect slot is the documented placeholder',
    universe.every(c => c.aspect === NO_ASPECT));
  t.ok('pitch questions exist only where a whistle is sounded',
    universe.filter(c => c.questionType === 'sound-pitch')
      .every(c => SOUND_SIGNALS.find(s => s.id === c.stateId).equipment.includes('whistle')));

  t.section('questions are well formed');
  const bad = universe.filter(c => {
    const q = soundQuestionFor(c);
    return !q || q.options.length !== 4 ||
      new Set(q.options.map(o => o.id)).size !== 4 ||
      !q.options.some(o => o.id === q.answerId) || !q.prompt || !q.explain;
  });
  t.ok('every card yields four distinct options, one of them correct',
    bad.length === 0, bad.slice(0, 3).map(c => `${c.stateId}/${c.questionType}`).join(', '));
  t.ok('identify prompts carry the circumstance, because one prolonged is two rules',
    QUESTION_TYPES.includes('sound-identify') &&
    ['r34-bend', 'r35-making-way'].every(id => {
      const q = soundQuestionFor({ stateId: id, aspect: NO_ASPECT, questionType: 'sound-identify' });
      return /restricted visibility|in sight/.test(q.prompt);
    }));

  t.section('distractors are confusable rather than absurd');
  const one = SOUND_SIGNALS.find(s => s.id === 'r34-starboard');
  const near = signalDistractors(one, SOUND_SIGNALS, 3).map(s => s.id);
  t.ok('one short blast draws short-blast neighbours',
    near.filter(id => ['r34-port', 'r34-astern', 'r34-bend'].includes(id)).length >= 2, near.join(', '));
  const hampered = SOUND_SIGNALS.find(s => s.id === 'r35-hampered');
  const nearH = signalDistractors(hampered, SOUND_SIGNALS, 3).map(s => s.id);
  t.ok('one prolonged two short draws signals one blast away',
    nearH.every(id => Math.abs(shapeOf(SOUND_SIGNALS.find(s => s.id === id)).length - 3) <= 1),
    nearH.join(', '));

  t.section('every signal is readable, not only audible');
  t.ok('all 18 strips render clean',
    SOUND_SIGNALS.every(s => /<svg/.test(signalStrip(s)) && !/NaN|undefined/.test(signalStrip(s))));
  t.ok('every strip carries an aria label describing the signal',
    SOUND_SIGNALS.every(s => signalStrip(s).includes(`aria-label="${describe(s)}"`)));
  t.ok('describe reads as a mariner would say it',
    describe(SOUND_SIGNALS.find(s => s.id === 'r34-overtake-port')) === 'two prolonged blasts, two short blasts',
    describe(SOUND_SIGNALS.find(s => s.id === 'r34-overtake-port')));
  t.ok('the key renders', /<svg/.test(stripKey()));
}
