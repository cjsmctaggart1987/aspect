/**
 * Sound signals, Rules 32 to 35. International only.
 *
 * Rule 32 fixes the primitives: a short blast is about one second, a prolonged
 * blast four to six. Five is used here as the middle of that band.
 *
 * A pattern is the whole signal laid out in time, gaps included, so it can be
 * played and drawn from one description. Durations are seconds. `seconds` is
 * the declared total and the tests check the pattern sums to it, which catches
 * a gap quietly going missing when a signal is edited.
 *
 * `inland` is null throughout. The Inland Rules differ materially on Rule 34 —
 * they are signals of intent answered by agreement, not statements of action
 * already taken — and mixing the two would teach the wrong thing. That is a
 * later fork, not a field to fill in casually.
 *
 * Source of truth: 33 CFR Subchapter E, a US Government work.
 */

// --- Rule 32 primitives ---------------------------------------------------

export const BLAST = {
  short: 1,        // "about one second"
  prolonged: 5     // "from four to six seconds"
};

export const GAP = 1;

/**
 * Rule 34(d) asks for blasts "short and rapid", which one-second spacing is
 * not. This is the only place the gap primitive is departed from, and it is
 * departed from because the rule says so.
 */
const RAPID_GAP = 0.4;

const DURATION = {
  short: BLAST.short,
  prolonged: BLAST.prolonged,
  stroke: 1,        // one distinct stroke of the bell
  bell: 5,          // rapid ringing, about five seconds
  gong: 5           // rapid sounding, about five seconds
};

/** Lay a list of blast types out in time, putting a gap between each. */
const seq = (types, gap = GAP) =>
  types.flatMap((type, i) => {
    const blast = { type, seconds: DURATION[type] };
    return i === 0 ? [blast] : [{ type: 'gap', seconds: gap }, blast];
  });

const total = pattern => +pattern.reduce((sum, p) => sum + p.seconds, 0).toFixed(2);

const signal = s => ({ ...s, seconds: total(s.pattern), inland: null });

// --- Rule 33, equipment thresholds ----------------------------------------

export const EQUIPMENT_THRESHOLDS = [
  { equipment: 'whistle', from: 12, note: 'A vessel of 12 m or more in length shall be provided with a whistle.' },
  { equipment: 'bell', from: 20, note: 'A vessel of 20 m or more shall also be provided with a bell.' },
  { equipment: 'gong', from: 100, note: 'A vessel of 100 m or more shall also carry a gong, of a tone and sound that cannot be confused with the bell.' }
];

/**
 * Annex III whistle fundamental frequency bands, by vessel length. A big ship
 * sounds low and a small one sounds high, and it is audible information about
 * her size before you can see her — which is why there is a drill question on it.
 */
export const WHISTLE_BANDS = [
  { id: '200plus', label: '200 m or more', min: 200, max: null, hz: [70, 200] },
  { id: '75to200', label: '75 m up to 200 m', min: 75, max: 200, hz: [130, 350] },
  { id: '20to75', label: '20 m up to 75 m', min: 20, max: 75, hz: [250, 525] },
  { id: 'under20', label: 'under 20 m', min: 0, max: 20, hz: [250, 700] }
];

export const DEFAULT_BAND = '20to75';

export const bandFor = id => WHISTLE_BANDS.find(b => b.id === id) || WHISTLE_BANDS.find(b => b.id === DEFAULT_BAND);

// --- the signals ----------------------------------------------------------

export const SOUND_SIGNALS = [
  // --- Rule 34, manoeuvring and warning signals, vessels in sight ---------
  signal({
    id: 'r34-starboard',
    rule: 'Rule 34(a)',
    group: 'Manoeuvring and warning',
    name: 'One short blast',
    pattern: seq(['short']),
    equipment: ['whistle'],
    repeat: null,
    meaning: 'I am altering my course to starboard.',
    memory: 'One blast, one word: starboard. Two blasts, two words: to port.'
  }),
  signal({
    id: 'r34-port',
    rule: 'Rule 34(a)',
    group: 'Manoeuvring and warning',
    name: 'Two short blasts',
    pattern: seq(['short', 'short']),
    equipment: ['whistle'],
    repeat: null,
    meaning: 'I am altering my course to port.',
    memory: 'International signals state what you are doing, not what you propose. She has already put the wheel over.'
  }),
  signal({
    id: 'r34-astern',
    rule: 'Rule 34(a)',
    group: 'Manoeuvring and warning',
    name: 'Three short blasts',
    pattern: seq(['short', 'short', 'short']),
    equipment: ['whistle'],
    repeat: null,
    meaning: 'I am operating astern propulsion.',
    memory: 'Astern propulsion, not "going astern". Her engines are astern; she may still be moving ahead through the water.'
  }),
  signal({
    id: 'r34-doubt',
    rule: 'Rule 34(d)',
    group: 'Manoeuvring and warning',
    name: 'Five or more short and rapid blasts',
    pattern: seq(['short', 'short', 'short', 'short', 'short'], RAPID_GAP),
    equipment: ['whistle'],
    repeat: null,
    meaning: 'I doubt whether you are taking sufficient action to avoid collision, or I fail to understand your intentions.',
    memory: 'At least five. There is no upper limit, and no obligation to stop at five if the doubt persists.'
  }),
  signal({
    id: 'r34-overtake-stbd',
    rule: 'Rule 34(c)(i)',
    group: 'Manoeuvring and warning',
    name: 'Two prolonged, one short',
    pattern: seq(['prolonged', 'prolonged', 'short']),
    equipment: ['whistle'],
    repeat: null,
    meaning: 'I intend to overtake you on your starboard side. Narrow channel or fairway.',
    memory: 'The short blasts at the end carry the side, the same way they do in Rule 34(a): one for starboard, two for port.'
  }),
  signal({
    id: 'r34-overtake-port',
    rule: 'Rule 34(c)(i)',
    group: 'Manoeuvring and warning',
    name: 'Two prolonged, two short',
    pattern: seq(['prolonged', 'prolonged', 'short', 'short']),
    equipment: ['whistle'],
    repeat: null,
    meaning: 'I intend to overtake you on your port side. Narrow channel or fairway.',
    memory: 'Two prolonged is the request to overtake. What follows says which side.'
  }),
  signal({
    id: 'r34-agree',
    rule: 'Rule 34(c)(ii)',
    group: 'Manoeuvring and warning',
    name: 'Prolonged, short, prolonged, short',
    pattern: seq(['prolonged', 'short', 'prolonged', 'short']),
    equipment: ['whistle'],
    repeat: null,
    meaning: 'I agree to be overtaken. Sounded by the vessel about to be overtaken.',
    memory: 'Morse C, for consent. Only the vessel being overtaken sounds it, and only in a narrow channel.'
  }),
  signal({
    id: 'r34-bend',
    rule: 'Rule 34(e)',
    group: 'Manoeuvring and warning',
    name: 'One prolonged blast',
    pattern: seq(['prolonged']),
    equipment: ['whistle'],
    repeat: null,
    meaning: 'Approaching a bend or an area where other vessels may be obscured. Answered by one prolonged blast from any vessel within hearing round the bend.',
    memory: 'Identical to the Rule 35(a) fog signal. The difference is the circumstance, not the sound: this one is answered.'
  }),

  // --- Rule 35, restricted visibility -------------------------------------
  signal({
    id: 'r35-making-way',
    rule: 'Rule 35(a)',
    group: 'Restricted visibility',
    name: 'One prolonged blast',
    pattern: seq(['prolonged']),
    equipment: ['whistle'],
    repeat: 120,
    meaning: 'Power-driven vessel making way through the water.',
    memory: 'One prolonged, making way. The same sound as the Rule 34(e) bend signal, told apart by the fact that it repeats.'
  }),
  signal({
    id: 'r35-stopped',
    rule: 'Rule 35(b)',
    group: 'Restricted visibility',
    name: 'Two prolonged blasts',
    pattern: seq(['prolonged', 'prolonged'], 2),
    equipment: ['whistle'],
    repeat: 120,
    meaning: 'Power-driven vessel underway but stopped and making no way through the water.',
    memory: 'Two prolonged, dead in the water. The gap between them is two seconds, longer than the one-second gap inside every other group.'
  }),
  signal({
    id: 'r35-hampered',
    rule: 'Rule 35(c)',
    group: 'Restricted visibility',
    name: 'One prolonged, two short',
    pattern: seq(['prolonged', 'short', 'short']),
    equipment: ['whistle'],
    repeat: 120,
    meaning: 'Not under command, restricted in ability to manoeuvre, constrained by draught, sailing, fishing, or towing or pushing another vessel.',
    memory: 'One long and two short covers every vessel that cannot simply get out of your way. It does not tell you which of them she is.'
  }),
  signal({
    id: 'r35-towed',
    rule: 'Rule 35(e)',
    group: 'Restricted visibility',
    name: 'One prolonged, three short',
    pattern: seq(['prolonged', 'short', 'short', 'short']),
    equipment: ['whistle'],
    repeat: 120,
    meaning: 'Vessel being towed, or the last vessel of the tow if manned. Sounded immediately after the towing vessel\'s signal.',
    memory: 'One prolonged and three short answers one prolonged and two short. Hearing the pair tells you there is a tow and roughly how long it is.'
  }),
  signal({
    id: 'r35-anchored',
    rule: 'Rule 35(g)',
    group: 'Restricted visibility',
    name: 'Rapid ringing of the bell, five seconds',
    pattern: [{ type: 'bell', seconds: DURATION.bell }],
    equipment: ['bell'],
    repeat: 60,
    meaning: 'Vessel at anchor, under 100 m in length.',
    memory: 'Every minute, not every two. An anchored vessel is a fixed hazard and says so more often.'
  }),
  signal({
    id: 'r35-anchored-100',
    rule: 'Rule 35(g)',
    group: 'Restricted visibility',
    name: 'Bell forward, then gong aft',
    pattern: [
      { type: 'bell', seconds: DURATION.bell },
      { type: 'gap', seconds: GAP },
      { type: 'gong', seconds: DURATION.gong }
    ],
    equipment: ['bell', 'gong'],
    repeat: 60,
    meaning: 'Vessel at anchor, 100 m or more in length. Bell rung in the fore part, gong sounded in the after part.',
    memory: 'Two sounds from two ends of her tells you she is long. The gong must be of a tone that cannot be confused with the bell.'
  }),
  signal({
    id: 'r35-anchored-warning',
    rule: 'Rule 35(g)',
    group: 'Restricted visibility',
    name: 'Short, prolonged, short',
    pattern: seq(['short', 'prolonged', 'short']),
    equipment: ['whistle'],
    repeat: null,
    meaning: 'Optional whistle signal from a vessel at anchor, warning an approaching vessel of her position and the possibility of collision.',
    memory: 'Morse R. Not obligatory, and it is in addition to the bell rather than instead of it.'
  }),
  signal({
    id: 'r35-aground',
    rule: 'Rule 35(h)',
    group: 'Restricted visibility',
    name: 'Three strokes, rapid ringing, three strokes',
    pattern: [
      ...seq(['stroke', 'stroke', 'stroke']),
      { type: 'gap', seconds: GAP },
      { type: 'bell', seconds: DURATION.bell },
      { type: 'gap', seconds: GAP },
      ...seq(['stroke', 'stroke', 'stroke'])
    ],
    equipment: ['bell'],
    repeat: 60,
    meaning: 'Vessel aground. The anchor signal, with three separate and distinct strokes immediately before and after the rapid ringing.',
    memory: 'Three, ring, three. The strokes are what separate aground from merely anchored, and they come at both ends.'
  }),
  signal({
    id: 'r35-under12',
    rule: 'Rule 35(i)',
    group: 'Restricted visibility',
    name: 'Some efficient sound signal',
    pattern: seq(['short', 'short', 'short']),
    equipment: ['whistle'],
    repeat: 120,
    meaning: 'A vessel of less than 12 m is not obliged to give the signals above, but if she does not she shall make some other efficient sound signal at intervals of not more than two minutes.',
    memory: 'The rule prescribes no pattern here, only that something audible happens every two minutes. The pattern shown is one plausible example.'
  }),
  signal({
    id: 'r35-pilot',
    rule: 'Rule 35(j)',
    group: 'Restricted visibility',
    name: 'Four short blasts',
    pattern: seq(['short', 'short', 'short', 'short']),
    equipment: ['whistle'],
    repeat: 120,
    meaning: 'Identity signal of a pilot vessel engaged on pilotage duty. Sounded in addition to her signal under Rule 35(a), (b) or (g).',
    memory: 'Four short is the only signal that identifies a trade rather than a state. It is additional, never a substitute.'
  })
];

/** Signals whose pattern the rule does not actually prescribe. */
export const UNPRESCRIBED = ['r35-under12'];

export const SIGNAL_GROUPS = [...new Set(SOUND_SIGNALS.map(s => s.group))];
