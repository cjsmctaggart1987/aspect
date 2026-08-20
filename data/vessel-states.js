/**
 * COLREGs Part C vessel states (Rules 20 to 31, International).
 *
 * Ship coordinate system, metres:
 *   x  positive forward, negative aft
 *   y  positive to starboard, negative to port
 *   z  height above waterline
 *
 * Every light carries an arc name. The engine turns arc + observer aspect
 * into a visibility test, so nothing here is drawn by hand.
 *
 * makingWayOnly: light is shown only when making way through the water.
 * Source of truth for rule text: 33 CFR Subchapter E (US Government work).
 */

export const ARC = {
  MASTHEAD: 'masthead',        // 225 deg, ahead to 22.5 abaft the beam both sides
  STBD: 'sidelight-stbd',      // 112.5 deg, ahead to 22.5 abaft the starboard beam
  PORT: 'sidelight-port',      // 112.5 deg, ahead to 22.5 abaft the port beam
  STERN: 'stern',              // 135 deg, 67.5 from right aft each side
  TOWING: 'towing',            // as sternlight, yellow
  ALLROUND: 'allround',        // 360 deg
  SPECIAL_FLASH: 'special-flashing' // Inland only, 180 to 225 deg forward
};

// --- light builders -------------------------------------------------------

export const masthead = (x, z, name = 'Masthead light') =>
  ({ color: 'white', arc: ARC.MASTHEAD, x, y: 0, z, name });

export const sidelights = (x, z, beam = 6, makingWayOnly = false) => ([
  { color: 'green', arc: ARC.STBD, x, y: beam, z, name: 'Starboard sidelight', makingWayOnly },
  { color: 'red', arc: ARC.PORT, x, y: -beam, z, name: 'Port sidelight', makingWayOnly }
]);

export const stern = (x, z, makingWayOnly = false) =>
  ({ color: 'white', arc: ARC.STERN, x, y: 0, z, name: 'Sternlight', makingWayOnly });

export const towingLight = (x, z) =>
  ({ color: 'yellow', arc: ARC.TOWING, x, y: 0, z, name: 'Towing light' });

export const allRound = (color, x, z, name, extra = {}) =>
  ({ color, arc: ARC.ALLROUND, x, y: 0, z, name, ...extra });

export const shape = (form, x, z, y = 0) => ({ form, x, y, z });

// --- standard fits --------------------------------------------------------

// Under 50m: single masthead permitted, second optional.
export const SMALL = {
  mast: [6, 11],
  side: [2, 5],
  stern: [-9, 4],
  beam: 4
};

// 50m and over: two masthead lights, after one higher.
export const LARGE = {
  fwdMast: [18, 15],
  aftMast: [-12, 23],
  side: [9, 8],
  stern: [-24, 6],
  beam: 7
};

export const powerSmall = () => [
  masthead(...SMALL.mast),
  ...sidelights(SMALL.side[0], SMALL.side[1], SMALL.beam),
  stern(...SMALL.stern)
];

export const powerLarge = () => [
  masthead(LARGE.fwdMast[0], LARGE.fwdMast[1], 'Forward masthead light'),
  masthead(LARGE.aftMast[0], LARGE.aftMast[1], 'After masthead light'),
  ...sidelights(LARGE.side[0], LARGE.side[1], LARGE.beam),
  stern(...LARGE.stern)
];

// --- the states -----------------------------------------------------------

export const VESSEL_STATES = [
  {
    id: 'pd-under50',
    name: 'Power-driven vessel underway, under 50m',
    rule: 'Rule 23(a)',
    group: 'Power-driven',
    length: 'under50',
    lights: powerSmall(),
    dayShapes: [],
    summary: 'Masthead light, sidelights, sternlight. A second masthead light is optional under 50m.',
    dutyHint: 'Ordinary power-driven vessel. Rules 13 to 15 apply on their normal terms.'
  },
  {
    id: 'pd-50plus',
    name: 'Power-driven vessel underway, 50m or more',
    rule: 'Rule 23(a)',
    group: 'Power-driven',
    length: '50plus',
    lights: powerLarge(),
    dayShapes: [],
    summary: 'Two masthead lights in a fore and aft line, the after one higher. Sidelights and sternlight.',
    dutyHint: 'The range between the masthead lights is your best aspect cue at a distance.'
  },
  {
    id: 'pd-under12',
    name: 'Power-driven vessel underway, under 12m',
    rule: 'Rule 23(c)',
    group: 'Power-driven',
    length: 'under12',
    lights: [
      allRound('white', 1, 7, 'All-round white light'),
      ...sidelights(1.5, 3, 2)
    ],
    dayShapes: [],
    summary: 'May show an all-round white light and sidelights in place of the Rule 23(a) fit.',
    dutyHint: 'Easily mistaken for a vessel at anchor until you pick up the sidelights.'
  },
  {
    id: 'pd-under7',
    name: 'Power-driven vessel under 7m, max speed under 7 knots',
    rule: 'Rule 23(c)(ii)',
    group: 'Power-driven',
    length: 'under12',
    lights: [allRound('white', 0, 5, 'All-round white light')],
    dayShapes: [],
    summary: 'All-round white light. Sidelights if practicable.',
    dutyHint: 'Gives you no aspect information at all. Assume nothing about her heading.'
  },
  {
    id: 'tow-astern-short',
    name: 'Towing astern, length of tow 200m or less',
    rule: 'Rule 24(a)',
    group: 'Towing',
    length: 'under50',
    lights: [
      masthead(6, 11, 'Masthead light, lower'),
      masthead(6, 15, 'Masthead light, upper'),
      ...sidelights(SMALL.side[0], SMALL.side[1], SMALL.beam),
      stern(-9, 4),
      towingLight(-9, 7)
    ],
    dayShapes: [],
    summary: 'Two masthead lights in a vertical line, sidelights, sternlight, and a yellow towing light above the sternlight.',
    dutyHint: 'The yellow over white astern is the giveaway. There is something behind her.'
  },
  {
    id: 'tow-astern-long',
    name: 'Towing astern, length of tow more than 200m',
    rule: 'Rule 24(a)(i)',
    group: 'Towing',
    length: 'under50',
    lights: [
      masthead(6, 11, 'Masthead light, lower'),
      masthead(6, 15, 'Masthead light, middle'),
      masthead(6, 19, 'Masthead light, upper'),
      ...sidelights(SMALL.side[0], SMALL.side[1], SMALL.beam),
      stern(-9, 4),
      towingLight(-9, 7)
    ],
    dayShapes: [shape('diamond', 0, 20)],
    summary: 'Three masthead lights in a vertical line. By day, a diamond shape where it can best be seen.',
    dutyHint: 'Three in a vertical line means a tow over 200m. Do not attempt to pass between.'
  },
  {
    id: 'towed',
    name: 'Vessel being towed',
    rule: 'Rule 24(e)',
    group: 'Towing',
    length: 'under50',
    lights: [
      ...sidelights(SMALL.side[0], 4, SMALL.beam),
      stern(-9, 3)
    ],
    dayShapes: [shape('diamond', 0, 12)],
    summary: 'Sidelights and sternlight only. Diamond shape by day if the tow exceeds 200m.',
    dutyHint: 'No masthead light. If you see sidelights with no masthead light, look ahead of her.'
  },
  {
    id: 'pushing-alongside',
    name: 'Pushing ahead or towing alongside',
    rule: 'Rule 24(c)',
    group: 'Towing',
    length: 'under50',
    lights: [
      masthead(6, 11, 'Masthead light, lower'),
      masthead(6, 15, 'Masthead light, upper'),
      ...sidelights(SMALL.side[0], SMALL.side[1], SMALL.beam),
      stern(-9, 4)
    ],
    dayShapes: [],
    summary: 'Two masthead lights in a vertical line, sidelights and sternlight. No yellow towing light.',
    dutyHint: 'Two vertical masthead lights with no yellow astern separates this from towing astern.'
  },
  {
    id: 'sailing',
    name: 'Sailing vessel underway',
    rule: 'Rule 25(a)',
    group: 'Sailing',
    length: 'under50',
    lights: [
      ...sidelights(2, 4, 3),
      stern(-7, 3)
    ],
    dayShapes: [],
    summary: 'Sidelights and sternlight. No masthead light.',
    dutyHint: 'Rule 18: a power-driven vessel keeps out of the way of a sailing vessel.'
  },
  {
    id: 'sailing-rg',
    name: 'Sailing vessel with optional masthead lights',
    rule: 'Rule 25(c)',
    group: 'Sailing',
    length: 'under50',
    lights: [
      ...sidelights(2, 4, 3),
      stern(-7, 3),
      allRound('red', 0, 16, 'All-round red, upper'),
      allRound('green', 0, 13, 'All-round green, lower')
    ],
    dayShapes: [],
    summary: 'Red over green at or near the masthead, in addition to sidelights and sternlight.',
    dutyHint: 'Red over green, sailing machine. Never shown with the Rule 25(b) combined lantern.'
  },
  {
    id: 'sailing-under7',
    name: 'Sailing vessel under 7m or vessel under oars',
    rule: 'Rule 25(d)',
    group: 'Sailing',
    length: 'under12',
    lights: [allRound('white', 0, 3, 'White light or torch shown in time to prevent collision')],
    dayShapes: [],
    summary: 'An electric torch or lighted lantern showing a white light, exhibited in sufficient time to prevent collision.',
    dutyHint: 'Expect it late and expect it low. Nothing about it tells you her aspect.'
  },
  {
    id: 'sailing-and-power',
    name: 'Sailing vessel also propelled by machinery',
    rule: 'Rule 25(e)',
    group: 'Sailing',
    length: 'under50',
    lights: [
      masthead(4, 10),
      ...sidelights(2, 4, 3),
      stern(-7, 3)
    ],
    dayShapes: [shape('cone-down', 3, 9)],
    summary: 'Lit as a power-driven vessel. By day, a cone apex downwards forward.',
    dutyHint: 'She is a power-driven vessel for the purposes of the steering and sailing rules.'
  },
  {
    id: 'trawling-making-way',
    name: 'Vessel trawling, making way',
    rule: 'Rule 26(b)',
    group: 'Fishing',
    length: 'under50',
    lights: [
      allRound('green', 2, 15, 'All-round green, upper'),
      allRound('white', 2, 12, 'All-round white, lower'),
      masthead(-8, 19, 'Masthead light, abaft and higher'),
      ...sidelights(3, 5, 4, true),
      stern(-10, 4, true)
    ],
    dayShapes: [shape('cones-apex', 2, 13.5)],
    summary: 'All-round green over white. Masthead light abaft of and higher than the green, optional under 50m. Sidelights and sternlight when making way.',
    dutyHint: 'Green over white, trawling tonight. Rule 18: keep out of her way.'
  },
  {
    id: 'trawling-stopped',
    name: 'Vessel trawling, not making way',
    rule: 'Rule 26(b)',
    group: 'Fishing',
    length: 'under50',
    lights: [
      allRound('green', 2, 15, 'All-round green, upper'),
      allRound('white', 2, 12, 'All-round white, lower')
    ],
    dayShapes: [shape('cones-apex', 2, 13.5)],
    summary: 'Green over white alone. No sidelights or sternlight because she is not making way.',
    dutyHint: 'Underway but stopped. Still a vessel engaged in fishing under Rule 18.'
  },
  {
    id: 'fishing-other-making-way',
    name: 'Vessel fishing other than trawling, making way',
    rule: 'Rule 26(c)',
    group: 'Fishing',
    length: 'under50',
    lights: [
      allRound('red', 2, 15, 'All-round red, upper'),
      allRound('white', 2, 12, 'All-round white, lower'),
      ...sidelights(3, 5, 4, true),
      stern(-10, 4, true)
    ],
    dayShapes: [shape('cones-apex', 2, 13.5)],
    summary: 'All-round red over white, sidelights and sternlight when making way. No masthead light.',
    dutyHint: 'Red over white, fishing at night.'
  },
  {
    id: 'fishing-gear-150',
    name: 'Vessel fishing with outlying gear over 150m',
    rule: 'Rule 26(c)(ii)',
    group: 'Fishing',
    length: 'under50',
    lights: [
      allRound('red', 2, 15, 'All-round red, upper'),
      allRound('white', 2, 12, 'All-round white, lower'),
      { color: 'white', arc: ARC.ALLROUND, x: 2, y: 12, z: 9, name: 'All-round white in the direction of the gear' },
      ...sidelights(3, 5, 4, true),
      stern(-10, 4, true)
    ],
    dayShapes: [shape('cones-apex', 2, 13.5), shape('cone-up', 2, 9, 12)],
    summary: 'Red over white, plus an all-round white light in the direction of the gear, and by day a cone apex upwards in that direction.',
    dutyHint: 'The offset white light tells you which side her gear extends. Do not pass that side.'
  },
  {
    id: 'nuc-making-way',
    name: 'Vessel not under command, making way',
    rule: 'Rule 27(a)',
    group: 'Restricted',
    length: 'under50',
    lights: [
      allRound('red', 0, 15, 'All-round red, upper'),
      allRound('red', 0, 12, 'All-round red, lower'),
      ...sidelights(SMALL.side[0], SMALL.side[1], SMALL.beam, true),
      stern(-9, 4, true)
    ],
    dayShapes: [shape('ball', 0, 15), shape('ball', 0, 12)],
    summary: 'Two all-round red lights in a vertical line, plus sidelights and sternlight when making way. Two balls by day.',
    dutyHint: 'Two reds in a row, the skipper is below. Never shows a masthead light.'
  },
  {
    id: 'nuc-stopped',
    name: 'Vessel not under command, not making way',
    rule: 'Rule 27(a)',
    group: 'Restricted',
    length: 'under50',
    lights: [
      allRound('red', 0, 15, 'All-round red, upper'),
      allRound('red', 0, 12, 'All-round red, lower')
    ],
    dayShapes: [shape('ball', 0, 15), shape('ball', 0, 12)],
    summary: 'Two all-round red lights only.',
    dutyHint: 'Distinguish from a vessel aground, which also shows anchor lights.'
  },
  {
    id: 'ram-making-way',
    name: 'Vessel restricted in her ability to manoeuvre, making way',
    rule: 'Rule 27(b)',
    group: 'Restricted',
    length: 'under50',
    lights: [
      allRound('red', 0, 18, 'All-round red, upper'),
      allRound('white', 0, 15, 'All-round white, middle'),
      allRound('red', 0, 12, 'All-round red, lower'),
      masthead(6, 22),
      ...sidelights(SMALL.side[0], SMALL.side[1], SMALL.beam, true),
      stern(-9, 4, true)
    ],
    dayShapes: [shape('ball', 0, 18), shape('diamond', 0, 15), shape('ball', 0, 12)],
    summary: 'Red, white, red in a vertical line. Masthead lights, sidelights and sternlight when making way. Ball, diamond, ball by day.',
    dutyHint: 'Red white red, restricted ahead.'
  },
  {
    id: 'ram-anchored',
    name: 'Vessel restricted in her ability to manoeuvre, at anchor',
    rule: 'Rule 27(b)(iv)',
    group: 'Restricted',
    length: 'under50',
    lights: [
      allRound('red', 0, 18, 'All-round red, upper'),
      allRound('white', 0, 15, 'All-round white, middle'),
      allRound('red', 0, 12, 'All-round red, lower'),
      allRound('white', 9, 10, 'Anchor light, forward')
    ],
    dayShapes: [shape('ball', 0, 18), shape('diamond', 0, 15), shape('ball', 0, 12)],
    summary: 'Red, white, red plus the anchor lights of Rule 30. No masthead or sidelights.',
    dutyHint: 'RAM lights with anchor lights and no sidelights means she is anchored, not stopped.'
  },
  {
    id: 'dredging',
    name: 'Vessel engaged in dredging with an obstruction',
    rule: 'Rule 27(d)',
    group: 'Restricted',
    length: 'under50',
    lights: [
      allRound('red', 0, 18, 'All-round red, upper'),
      allRound('white', 0, 15, 'All-round white, middle'),
      allRound('red', 0, 12, 'All-round red, lower'),
      { color: 'red', arc: ARC.ALLROUND, x: 1, y: -8, z: 11, name: 'All-round red, obstruction side' },
      { color: 'red', arc: ARC.ALLROUND, x: 1, y: -8, z: 8, name: 'All-round red, obstruction side' },
      { color: 'green', arc: ARC.ALLROUND, x: 1, y: 8, z: 11, name: 'All-round green, clear side' },
      { color: 'green', arc: ARC.ALLROUND, x: 1, y: 8, z: 8, name: 'All-round green, clear side' }
    ],
    dayShapes: [
      shape('ball', 0, 18), shape('diamond', 0, 15), shape('ball', 0, 12),
      shape('ball', 1, 11, -8), shape('ball', 1, 8, -8),
      shape('diamond', 1, 11, 8), shape('diamond', 1, 8, 8)
    ],
    summary: 'RAM lights plus two all-round reds on the obstructed side and two all-round greens on the side you may pass.',
    dutyHint: 'Pass on the green side. Two reds means the obstruction is there.'
  },
  {
    id: 'mine-clearance',
    name: 'Vessel engaged in mine clearance',
    rule: 'Rule 27(f)',
    group: 'Restricted',
    length: 'under50',
    lights: [
      masthead(6, 11),
      ...sidelights(SMALL.side[0], SMALL.side[1], SMALL.beam),
      stern(-9, 4),
      { color: 'green', arc: ARC.ALLROUND, x: 6, y: 0, z: 18, name: 'All-round green, foremast head' },
      { color: 'green', arc: ARC.ALLROUND, x: 5, y: -7, z: 14, name: 'All-round green, port fore yard' },
      { color: 'green', arc: ARC.ALLROUND, x: 5, y: 7, z: 14, name: 'All-round green, starboard fore yard' }
    ],
    dayShapes: [shape('ball', 6, 18), shape('ball', 5, 14, -7), shape('ball', 5, 14, 7)],
    summary: 'Three all-round green lights in a triangle, plus the ordinary power-driven lights.',
    dutyHint: 'Keep 1000 metres clear. That distance is in the rule itself.'
  },
  {
    id: 'cbd',
    name: 'Vessel constrained by her draught',
    rule: 'Rule 28',
    group: 'Restricted',
    length: '50plus',
    lights: [
      ...powerLarge(),
      allRound('red', 2, 26, 'All-round red, upper'),
      allRound('red', 2, 23, 'All-round red, middle'),
      allRound('red', 2, 20, 'All-round red, lower')
    ],
    dayShapes: [shape('cylinder', 2, 22)],
    summary: 'Three all-round red lights in a vertical line, in addition to the lights for a power-driven vessel. A cylinder by day.',
    dutyHint: 'International only. There is no equivalent in the Inland Rules.'
  },
  {
    id: 'pilot-underway',
    name: 'Pilot vessel on duty, underway',
    rule: 'Rule 29(a)',
    group: 'Special',
    length: 'under50',
    lights: [
      allRound('white', 5, 15, 'All-round white, upper'),
      allRound('red', 5, 12, 'All-round red, lower'),
      ...sidelights(SMALL.side[0], SMALL.side[1], SMALL.beam),
      stern(-9, 4)
    ],
    dayShapes: [],
    summary: 'All-round white over red at or near the masthead, plus sidelights and sternlight when underway.',
    dutyHint: 'White over red, pilot ahead. No masthead light.'
  },
  {
    id: 'pilot-anchored',
    name: 'Pilot vessel on duty, at anchor',
    rule: 'Rule 29(a)(ii)',
    group: 'Special',
    length: 'under50',
    lights: [
      allRound('white', 5, 15, 'All-round white, upper'),
      allRound('red', 5, 12, 'All-round red, lower'),
      allRound('white', -6, 7, 'Anchor light')
    ],
    dayShapes: [shape('ball', 8, 9)],
    summary: 'White over red plus the anchor lights of Rule 30.',
    dutyHint: 'The extra low white with no sidelights is the anchor light.'
  },
  {
    id: 'anchored-under50',
    name: 'Vessel at anchor, under 50m',
    rule: 'Rule 30(a)',
    group: 'Anchored',
    length: 'under50',
    lights: [allRound('white', 0, 9, 'All-round white anchor light')],
    dayShapes: [shape('ball', 6, 9)],
    summary: 'One all-round white light where it can best be seen. One ball forward by day.',
    dutyHint: 'A single all-round white can also be a small power-driven vessel. Watch for sidelights.'
  },
  {
    id: 'anchored-50plus',
    name: 'Vessel at anchor, 50m or more',
    rule: 'Rule 30(a)',
    group: 'Anchored',
    length: '50plus',
    lights: [
      allRound('white', 20, 14, 'Forward anchor light'),
      allRound('white', -20, 7, 'After anchor light, lower')
    ],
    dayShapes: [shape('ball', 22, 12)],
    summary: 'An all-round white forward and another aft, the after light lower. Vessels of 100m and over must also light their decks.',
    dutyHint: 'Two whites at different heights with no sidelights. The high one is forward.'
  },
  {
    id: 'aground',
    name: 'Vessel aground',
    rule: 'Rule 30(d)',
    group: 'Anchored',
    length: '50plus',
    lights: [
      allRound('white', 20, 14, 'Forward anchor light'),
      allRound('white', -20, 7, 'After anchor light, lower'),
      allRound('red', 2, 20, 'All-round red, upper'),
      allRound('red', 2, 17, 'All-round red, lower')
    ],
    dayShapes: [shape('ball', 2, 20), shape('ball', 2, 17), shape('ball', 2, 14)],
    summary: 'Anchor lights plus two all-round red lights in a vertical line. Three balls by day.',
    dutyHint: 'Two reds plus anchor lights is aground. Two reds alone is not under command.'
  },
  {
    id: 'air-cushion',
    name: 'Air-cushion vessel in non-displacement mode',
    rule: 'Rule 23(b)',
    group: 'Special',
    length: 'under50',
    lights: [
      ...powerSmall(),
      allRound('yellow', 4, 14, 'All-round flashing yellow', { flash: 'fast' })
    ],
    dayShapes: [],
    summary: 'Power-driven lights plus an all-round flashing yellow light.',
    dutyHint: 'Treat her as a power-driven vessel. The yellow flash only warns you of her speed.'
  },
  {
    id: 'wig',
    name: 'WIG craft taking off, landing or in flight near the surface',
    rule: 'Rule 23(c)',
    group: 'Special',
    length: 'under50',
    lights: [
      ...powerSmall(),
      allRound('red', 4, 14, 'High intensity all-round flashing red', { flash: 'fast' })
    ],
    dayShapes: [],
    summary: 'Power-driven lights plus a high intensity all-round flashing red light.',
    dutyHint: 'Rule 18(f): a WIG craft keeps well clear of all other vessels when taking off, landing or in flight.'
  }
];

export const ASPECT_BANDS = [
  { deg: 0, label: 'Head-on' },
  { deg: 45, label: 'Fine on your port bow, her starboard bow to you' },
  { deg: 90, label: 'Her starboard beam' },
  { deg: 135, label: 'Her starboard quarter' },
  { deg: 180, label: 'Dead astern of her' },
  { deg: 225, label: 'Her port quarter' },
  { deg: 270, label: 'Her port beam' },
  { deg: 315, label: 'Her port bow' }
];
