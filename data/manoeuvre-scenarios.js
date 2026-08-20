/**
 * Worked situations under Rules 11 to 18. Drill content and test fixtures at
 * once, deliberately: a scenario that stops matching the engine is either a
 * broken scenario or a broken engine, and either way somebody should know.
 *
 * Bearings are relative and in degrees: 0 dead ahead, 90 the starboard beam,
 * 180 astern, 270 the port beam. `targetBearing` is where she bears from you,
 * `ownBearingFromTarget` is where you bear from her. Both are needed, because
 * overtaking is defined by the second and not the first.
 *
 * `expect` states the outcome in the terms the engine returns. It never states
 * an alteration, for the same reason the engine does not.
 */

export const MANOEUVRE_SCENARIOS = [
  // --- Rule 11: the gate --------------------------------------------------
  {
    id: 'fog-no-standon',
    title: 'A contact in fog',
    category: 'Rule 11',
    own: { category: 'power-driven' }, target: { category: 'power-driven' },
    targetBearing: 40, ownBearingFromTarget: 320, inSight: false,
    expect: { situation: 'none', role: null, notApplicable: 'Rule 11' },
    explanation: 'You have her on radar but you cannot see her. Rules 11 to 18 apply only to '
      + 'vessels in sight of one another, so none of them governs here. Rule 19 does, and it '
      + 'gives neither of you the right to stand on. There is no stand-on vessel in fog.'
  },

  // --- Rule 13: overtaking, and its precedence ----------------------------
  {
    id: 'overtaking-plain',
    title: 'Coming up on her from astern',
    category: 'Rule 13',
    own: { category: 'power-driven' }, target: { category: 'power-driven' },
    targetBearing: 5, ownBearingFromTarget: 180, inSight: true,
    expect: { situation: 'overtaking', role: 'give-way', rules: ['Rule 13'] },
    explanation: 'You are coming up on her from right astern. At night you would see her '
      + 'sternlight and neither sidelight. You keep out of the way until finally past and clear.'
  },
  {
    id: 'overtaking-boundary',
    title: 'On the boundary of the overtaking sector',
    category: 'Rule 13',
    own: { category: 'power-driven' }, target: { category: 'power-driven' },
    targetBearing: 20, ownBearingFromTarget: 112.5, inSight: true,
    expect: { situation: 'overtaking', role: 'give-way', doubt: true, rules: ['Rule 13(c)'] },
    explanation: 'You are exactly 22.5 degrees abaft her beam, on the line where her sidelight '
      + 'would just come into view. Rule 13(c) settles it: where there is any doubt whether you '
      + 'are overtaking, assume that you are and act accordingly.'
  },
  {
    id: 'overtaking-beats-nuc',
    title: 'Overtaking a vessel not under command',
    category: 'Rule 13',
    own: { category: 'power-driven' }, target: { category: 'nuc' },
    targetBearing: 8, ownBearingFromTarget: 175, inSight: true,
    expect: { situation: 'overtaking', role: 'give-way', rules: ['Rule 13'] },
    explanation: 'Rule 18 would have you keep out of her way in any case, so this looks easy. '
      + 'The point is the reverse case: Rule 13 applies notwithstanding anything in Sections I '
      + 'and II, so it decides overtaking regardless of what either vessel is.'
  },
  {
    id: 'overtaking-nuc-overtakes',
    title: 'A vessel not under command overtaking you',
    category: 'Rule 13',
    own: { category: 'nuc' }, target: { category: 'power-driven' },
    targetBearing: 178, ownBearingFromTarget: 6, inSight: true,
    expect: { situation: 'overtaking', role: 'stand-on', rules: ['Rule 13'] },
    explanation: 'This is the case that catches people. She is not under command, so Rule 18 '
      + 'would have you keep clear of her — but she is overtaking you, and Rule 13 overrides '
      + 'Rule 18. She keeps out of your way until finally past and clear.'
  },
  {
    id: 'overtaking-stays-overtaking',
    title: 'The bearing opens while overtaking',
    category: 'Rule 13',
    own: { category: 'power-driven' }, target: { category: 'power-driven' },
    targetBearing: 30, ownBearingFromTarget: 150, inSight: true,
    expect: { situation: 'overtaking', role: 'give-way', rules: ['Rule 13'] },
    explanation: 'You began well abaft her beam and the bearing has drawn out as you came up. '
      + 'It changes nothing. No subsequent alteration of the bearing between you makes you a '
      + 'crossing vessel or relieves you of the duty to keep clear until finally past and clear.'
  },

  // --- Rule 14: head-on ---------------------------------------------------
  {
    id: 'head-on',
    title: 'Meeting end on',
    category: 'Rule 14',
    own: { category: 'power-driven' }, target: { category: 'power-driven' },
    targetBearing: 0, ownBearingFromTarget: 0, inSight: true,
    expect: { situation: 'head-on', role: 'both-give-way', rules: ['Rule 14'] },
    explanation: 'Two power-driven vessels meeting on reciprocal courses. Neither stands on. '
      + 'Each alters course to starboard so that each passes on the port side of the other.'
  },
  {
    id: 'head-on-doubt',
    title: 'Nearly end on, and you are not sure',
    category: 'Rule 14',
    own: { category: 'power-driven' }, target: { category: 'power-driven' },
    targetBearing: 4, ownBearingFromTarget: 356, inSight: true,
    expect: { situation: 'head-on', role: 'both-give-way', rules: ['Rule 14(c)'] },
    explanation: 'She is nearly ahead and you cannot tell whether this is truly head-on or a '
      + 'fine crossing. Rule 14(c) removes the choice: where there is any doubt, assume a '
      + 'head-on situation exists and act accordingly.'
  },

  // --- Rule 15: crossing --------------------------------------------------
  {
    id: 'crossing-give-way',
    title: 'She is on your starboard bow',
    category: 'Rule 15',
    own: { category: 'power-driven' }, target: { category: 'power-driven' },
    targetBearing: 50, ownBearingFromTarget: 300, inSight: true,
    expect: { situation: 'crossing', role: 'give-way', rules: ['Rule 15'] },
    explanation: 'Two power-driven vessels crossing. She is on your own starboard side, so you '
      + 'keep out of the way, and if the circumstances admit you avoid crossing ahead of her.'
  },
  {
    id: 'crossing-stand-on',
    title: 'She is on your port bow',
    category: 'Rule 15',
    own: { category: 'power-driven' }, target: { category: 'power-driven' },
    targetBearing: 310, ownBearingFromTarget: 55, inSight: true,
    standOnStage: 'course-and-speed',
    expect: { situation: 'crossing', role: 'stand-on', rules: ['Rule 17(a)(i)'] },
    explanation: 'You are on her starboard side, so she keeps out of your way. You keep your '
      + 'course and speed — which is an obligation, not a permission.'
  },
  {
    id: 'crossing-may-act',
    title: 'She is not giving way',
    category: 'Rule 17',
    own: { category: 'power-driven' }, target: { category: 'power-driven' },
    targetBearing: 310, ownBearingFromTarget: 55, inSight: true,
    standOnStage: 'may-act',
    expect: { situation: 'crossing', role: 'stand-on', rules: ['Rule 17(a)(ii)'] },
    explanation: 'The range is closing and she has done nothing. You may now take action by '
      + 'your manoeuvre alone. Note Rule 17(c): she is on your port side, so if the '
      + 'circumstances admit you do not alter to port.'
  },
  {
    id: 'crossing-must-act',
    title: 'Too close for her action alone',
    category: 'Rule 17',
    own: { category: 'power-driven' }, target: { category: 'power-driven' },
    targetBearing: 310, ownBearingFromTarget: 55, inSight: true,
    standOnStage: 'must-act',
    expect: { situation: 'crossing', role: 'stand-on', rules: ['Rule 17(b)'] },
    explanation: 'You are now so close that collision cannot be avoided by her action alone. '
      + 'The obligation has changed from may to shall: take such action as will best aid to '
      + 'avoid collision.'
  },

  // --- Rule 18: the hierarchy ---------------------------------------------
  {
    id: 'power-gives-way-sail',
    title: 'Power-driven meeting a sailing vessel',
    category: 'Rule 18',
    own: { category: 'power-driven' }, target: { category: 'sailing', tack: 'starboard' },
    targetBearing: 300, ownBearingFromTarget: 60, inSight: true,
    expect: { situation: 'crossing', role: 'give-way', rules: ['Rule 18'] },
    explanation: 'She is on your port side, which under Rule 15 would make you the stand-on '
      + 'vessel — but Rule 15 is for two power-driven vessels. She is under sail, so Rule 18 '
      + 'governs and you keep out of her way.'
  },
  {
    id: 'sail-gives-way-fishing',
    title: 'Sailing vessel meeting a vessel fishing',
    category: 'Rule 18',
    own: { category: 'sailing', tack: 'starboard' }, target: { category: 'fishing' },
    targetBearing: 40, ownBearingFromTarget: 310, inSight: true,
    expect: { situation: 'crossing', role: 'give-way', rules: ['Rule 18'] },
    explanation: 'Being under sail does not put you at the top of the list. A sailing vessel '
      + 'keeps out of the way of a vessel engaged in fishing.'
  },
  {
    id: 'fishing-gives-way-ram',
    title: 'Fishing vessel meeting a vessel restricted in her ability to manoeuvre',
    category: 'Rule 18',
    own: { category: 'fishing' }, target: { category: 'ram' },
    targetBearing: 60, ownBearingFromTarget: 290, inSight: true,
    expect: { situation: 'crossing', role: 'give-way', rules: ['Rule 18'] },
    explanation: 'The hierarchy continues: a vessel engaged in fishing keeps out of the way of '
      + 'a vessel restricted in her ability to manoeuvre, and of one not under command.'
  },
  {
    id: 'ram-stands-on',
    title: 'Restricted in ability to manoeuvre, with power-driven crossing',
    category: 'Rule 18',
    own: { category: 'ram' }, target: { category: 'power-driven' },
    targetBearing: 70, ownBearingFromTarget: 290, inSight: true,
    standOnStage: 'course-and-speed',
    expect: { situation: 'crossing', role: 'stand-on', rules: ['Rule 18'] },
    explanation: 'She is on your starboard side, which under Rule 15 would make you give way. '
      + 'Rule 15 does not apply: you are restricted in your ability to manoeuvre, so she keeps '
      + 'out of your way.'
  },
  {
    id: 'cbd-avoid-impeding',
    title: 'Meeting a vessel constrained by her draught',
    category: 'Rule 18(d)',
    own: { category: 'power-driven' }, target: { category: 'cbd' },
    targetBearing: 300, ownBearingFromTarget: 60, inSight: true,
    expect: { situation: 'crossing', role: 'give-way', rules: ['Rule 18(d)'] },
    explanation: 'You avoid impeding her safe passage, navigating with caution and having full '
      + 'regard to her condition. That is a lesser and different obligation from keeping out of '
      + 'the way: it does not make her a stand-on vessel, and the ordinary rules still run '
      + 'between you.'
  },
  {
    id: 'wig-keeps-clear',
    title: 'A WIG craft in flight near the surface',
    category: 'Rule 18(f)',
    own: { category: 'wig' }, target: { category: 'power-driven' },
    targetBearing: 45, ownBearingFromTarget: 315, inSight: true,
    expect: { situation: 'crossing', role: 'give-way', rules: ['Rule 18(f)'] },
    explanation: 'When taking off, landing or in flight near the surface a WIG craft keeps well '
      + 'clear of all other vessels. On the water surface she is simply a power-driven vessel.'
  },

  // --- Rule 12: sailing vessels -------------------------------------------
  {
    id: 'sail-different-tacks',
    title: 'Two sailing vessels on different tacks',
    category: 'Rule 12',
    own: { category: 'sailing', tack: 'port' }, target: { category: 'sailing', tack: 'starboard' },
    targetBearing: 50, ownBearingFromTarget: 300, inSight: true,
    expect: { situation: 'crossing', role: 'give-way', rules: ['Rule 12(a)(i)'] },
    explanation: 'You have the wind on your port side and she has it on her starboard side. '
      + 'You keep out of her way.'
  },
  {
    id: 'sail-same-tack-windward',
    title: 'Same tack, and you are to windward',
    category: 'Rule 12',
    own: { category: 'sailing', tack: 'starboard', windward: true },
    target: { category: 'sailing', tack: 'starboard' },
    targetBearing: 40, ownBearingFromTarget: 320, inSight: true,
    expect: { situation: 'crossing', role: 'give-way', rules: ['Rule 12(a)(ii)'] },
    explanation: 'Both have the wind on the same side, so tack does not separate you. The '
      + 'windward vessel keeps out of the way, and the windward side is the side opposite that '
      + 'on which the mainsail is carried.'
  },
  {
    id: 'sail-same-tack-leeward',
    title: 'Same tack, and you are to leeward',
    category: 'Rule 12',
    own: { category: 'sailing', tack: 'port', windward: false },
    target: { category: 'sailing', tack: 'port' },
    targetBearing: 320, ownBearingFromTarget: 40, inSight: true,
    standOnStage: 'course-and-speed',
    expect: { situation: 'crossing', role: 'stand-on', rules: ['Rule 12(a)(ii)'] },
    explanation: 'Same tack again, and you are the leeward vessel. She keeps out of your way, '
      + 'and Rule 17 governs what you do while she does it.'
  },
  {
    id: 'sail-doubt-to-windward',
    title: 'Port tack, a vessel to windward, her tack unknown',
    category: 'Rule 12',
    own: { category: 'sailing', tack: 'port', targetToWindward: true },
    target: { category: 'sailing' },
    targetBearing: 55, ownBearingFromTarget: 305, inSight: true,
    expect: { situation: 'crossing', role: 'give-way', doubt: true, rules: ['Rule 12(a)(iii)'] },
    explanation: 'You have the wind on your port side and you cannot make out whether she is on '
      + 'port or starboard. Doubt resolves against you: keep out of her way.'
  }
];

export const SCENARIO_CATEGORIES = [...new Set(MANOEUVRE_SCENARIOS.map(s => s.category))];
