/**
 * IALA Maritime Buoyage System, Regions A and B.
 *
 * Region is a single field on lateral and preferred-channel marks. Everything
 * else is identical between regions, which is exactly the teaching point.
 *
 * The system is described here as fact. Do not copy IALA's own diagrams or
 * publication text: IALA is a non-governmental association and R1001/G1001 are
 * its copyright. The US description at 33 CFR Part 62 is a US Government work
 * and is safe to draw from.
 *
 * `action` is what you actually do about the mark, which is the thing a drill
 * should ask. `meaning` explains the mark; `action` is the decision it forces,
 * and the two are separated because a candidate can recite one without being
 * able to act on the other.
 *
 * bands: painted top to bottom.
 * topmark: null, or { form, color, count }.
 */

export const REGION_A = 'A';
export const REGION_B = 'B';

/**
 * Light characteristics, as timings rather than prose.
 *
 * `rhythm` above stays the authoritative human-readable form; this is what the
 * strip is drawn from. Times are seconds within one period, each entry a span
 * the light is lit, optionally with its own colour where a mark alternates.
 *
 * Rates are the standard ones described at 33 CFR Part 62: very quick is 100 to
 * 120 flashes a minute, quick is 50 to 60. The fast end of each is used here so
 * the count stays legible in a short strip.
 *
 * example: true marks a rhythm the rule does not prescribe. The lateral marks
 * and the special mark may use almost any rhythm, so the strip shows one
 * plausible character and the card says so.
 */
const VQ = 0.5;                       // very quick, 120 a minute
const LONG = 2.0;                     // a long flash is two seconds or more

/** n flashes at one every `rate` seconds, lit for a short part of each cycle. */
const group = (n, rate = VQ, t0 = 0) =>
  Array.from({ length: n }, (_, i) => [+(t0 + i * rate).toFixed(2), +(t0 + i * rate + rate * 0.4).toFixed(2)]);

const flashes = (period, on, extra = {}) => ({ period, on, ...extra });

export const MARKS = [
  {
    id: 'lat-port-a',
    region: REGION_A,
    type: 'Lateral',
    name: 'Port hand mark, Region A',
    body: 'can',
    bands: ['red'],
    topmark: { form: 'can', color: 'red', count: 1 },
    lightColor: 'red',
    rhythm: 'Any, other than the composite group flashing (2+1)',
    pattern: flashes(3, [[0, 0.5]], { example: true }),
    meaning: 'Leave to port when proceeding in the conventional direction of buoyage.',
    action: "Leave it to port.",
    memory: 'Red can, port hand, going upstream in Region A.'
  },
  {
    id: 'lat-stbd-a',
    region: REGION_A,
    type: 'Lateral',
    name: 'Starboard hand mark, Region A',
    body: 'cone',
    bands: ['green'],
    topmark: { form: 'cone-up', color: 'green', count: 1 },
    lightColor: 'green',
    rhythm: 'Any, other than the composite group flashing (2+1)',
    pattern: flashes(3, [[0, 0.5]], { example: true }),
    meaning: 'Leave to starboard when proceeding in the conventional direction of buoyage.',
    action: "Leave it to starboard.",
    memory: 'Green cone, starboard hand.'
  },
  {
    id: 'lat-port-b',
    region: REGION_B,
    type: 'Lateral',
    name: 'Port hand mark, Region B',
    body: 'can',
    bands: ['green'],
    topmark: { form: 'can', color: 'green', count: 1 },
    lightColor: 'green',
    rhythm: 'Any, other than the composite group flashing (2+1)',
    pattern: flashes(3, [[0, 0.5]], { example: true }),
    meaning: 'Leave to port when proceeding in the conventional direction of buoyage.',
    action: "Leave it to port.",
    memory: 'Region B inverts the lateral colours. Red right returning.'
  },
  {
    id: 'lat-stbd-b',
    region: REGION_B,
    type: 'Lateral',
    name: 'Starboard hand mark, Region B',
    body: 'cone',
    bands: ['red'],
    topmark: { form: 'cone-up', color: 'red', count: 1 },
    lightColor: 'red',
    rhythm: 'Any, other than the composite group flashing (2+1)',
    pattern: flashes(3, [[0, 0.5]], { example: true }),
    meaning: 'Leave to starboard when proceeding in the conventional direction of buoyage.',
    action: "Leave it to starboard.",
    memory: 'Red right returning. Cayman, the Americas and Japan are Region B.'
  },
  {
    id: 'pref-stbd-a',
    region: REGION_A,
    type: 'Preferred channel',
    name: 'Preferred channel to starboard, Region A',
    body: 'can',
    bands: ['red', 'green', 'red'],
    topmark: { form: 'can', color: 'red', count: 1 },
    lightColor: 'red',
    rhythm: 'Fl (2+1) R',
    pattern: flashes(6, [[0, 0.5], [1.2, 1.7], [3, 3.5]]),
    meaning: 'A port hand mark with a green band. The main channel lies to starboard of the mark.',
    action: "The main channel lies to starboard, so leave it to port.",
    memory: 'The body colour tells you which lateral mark it primarily is. The band tells you the secondary channel.'
  },
  {
    id: 'pref-port-a',
    region: REGION_A,
    type: 'Preferred channel',
    name: 'Preferred channel to port, Region A',
    body: 'cone',
    bands: ['green', 'red', 'green'],
    topmark: { form: 'cone-up', color: 'green', count: 1 },
    lightColor: 'green',
    rhythm: 'Fl (2+1) G',
    pattern: flashes(6, [[0, 0.5], [1.2, 1.7], [3, 3.5]]),
    meaning: 'A starboard hand mark with a red band. The main channel lies to port of the mark.',
    action: "The main channel lies to port, so leave it to starboard.",
    memory: 'Composite group flashing (2+1) always means a channel divides here.'
  },
  {
    id: 'pref-stbd-b',
    region: REGION_B,
    type: 'Preferred channel',
    name: 'Preferred channel to starboard, Region B',
    body: 'can',
    bands: ['green', 'red', 'green'],
    topmark: { form: 'can', color: 'green', count: 1 },
    lightColor: 'green',
    rhythm: 'Fl (2+1) G',
    pattern: flashes(6, [[0, 0.5], [1.2, 1.7], [3, 3.5]]),
    meaning: 'A port hand mark with a red band. The main channel lies to starboard of the mark.',
    action: "The main channel lies to starboard, so leave it to port.",
    memory: 'Same logic as Region A with the lateral colours swapped.'
  },
  {
    id: 'pref-port-b',
    region: REGION_B,
    type: 'Preferred channel',
    name: 'Preferred channel to port, Region B',
    body: 'cone',
    bands: ['red', 'green', 'red'],
    topmark: { form: 'cone-up', color: 'red', count: 1 },
    lightColor: 'red',
    rhythm: 'Fl (2+1) R',
    pattern: flashes(6, [[0, 0.5], [1.2, 1.7], [3, 3.5]]),
    meaning: 'A starboard hand mark with a green band. The main channel lies to port of the mark.',
    action: "The main channel lies to port, so leave it to starboard.",
    memory: 'Body colour first, band second.'
  },
  {
    id: 'card-n',
    region: 'both',
    type: 'Cardinal',
    name: 'North cardinal mark',
    body: 'pillar',
    bands: ['black', 'yellow'],
    topmark: { form: 'cones-up', color: 'black', count: 2 },
    lightColor: 'white',
    rhythm: 'VQ or Q, continuous',
    pattern: flashes(3, group(6)),
    meaning: 'Safe water lies to the north of the mark.',
    action: "Pass to the north of it.",
    memory: 'Both cones point up, and the black band is up. Continuous quick flashing, like twelve o clock.'
  },
  {
    id: 'card-e',
    region: 'both',
    type: 'Cardinal',
    name: 'East cardinal mark',
    body: 'pillar',
    bands: ['black', 'yellow', 'black'],
    topmark: { form: 'cones-base', color: 'black', count: 2 },
    lightColor: 'white',
    rhythm: 'VQ (3) 5s or Q (3) 10s',
    pattern: flashes(5, group(3)),
    meaning: 'Safe water lies to the east of the mark.',
    action: "Pass to the east of it.",
    memory: 'Topmark is egg shaped. Three flashes, like three o clock.'
  },
  {
    id: 'card-s',
    region: 'both',
    type: 'Cardinal',
    name: 'South cardinal mark',
    body: 'pillar',
    bands: ['yellow', 'black'],
    topmark: { form: 'cones-down', color: 'black', count: 2 },
    lightColor: 'white',
    rhythm: 'VQ (6) + LFl 10s or Q (6) + LFl 15s',
    pattern: flashes(10, [...group(6), [3.4, 3.4 + LONG]]),
    meaning: 'Safe water lies to the south of the mark.',
    action: "Pass to the south of it.",
    memory: 'Both cones point down, black band down. Six flashes, like six o clock, and the long flash confirms you counted six not nine.'
  },
  {
    id: 'card-w',
    region: 'both',
    type: 'Cardinal',
    name: 'West cardinal mark',
    body: 'pillar',
    bands: ['yellow', 'black', 'yellow'],
    topmark: { form: 'cones-point', color: 'black', count: 2 },
    lightColor: 'white',
    rhythm: 'VQ (9) 10s or Q (9) 15s',
    pattern: flashes(10, group(9)),
    meaning: 'Safe water lies to the west of the mark.',
    action: "Pass to the west of it.",
    memory: 'Topmark is wine glass shaped. West is a wine glass. Nine flashes, like nine o clock.'
  },
  {
    id: 'isolated',
    region: 'both',
    type: 'Isolated danger',
    name: 'Isolated danger mark',
    body: 'pillar',
    bands: ['black', 'red', 'black'],
    topmark: { form: 'spheres', color: 'black', count: 2 },
    lightColor: 'white',
    rhythm: 'Fl (2)',
    pattern: flashes(5, [[0, 0.5], [1.2, 1.7]]),
    meaning: 'Stationed on or moored above an isolated danger with navigable water all round it.',
    action: "Do not pass close. There is navigable water all round, but the danger is beneath it.",
    memory: 'Two black balls, two white flashes.'
  },
  {
    id: 'safe-water',
    region: 'both',
    type: 'Safe water',
    name: 'Safe water mark',
    body: 'sphere',
    bands: ['red-white-vertical'],
    topmark: { form: 'sphere', color: 'red', count: 1 },
    lightColor: 'white',
    rhythm: 'Iso, Occ, LFl 10s or Mo (A)',
    pattern: flashes(4, [[0, 2]]),
    meaning: 'Navigable water all round the mark. Often a landfall or mid-channel mark.',
    action: "Pass either side. There is navigable water all round.",
    memory: 'Red and white vertical stripes. The only mark with a single red sphere topmark.'
  },
  {
    id: 'special',
    region: 'both',
    type: 'Special',
    name: 'Special mark',
    body: 'pillar',
    bands: ['yellow'],
    topmark: { form: 'cross', color: 'yellow', count: 1 },
    lightColor: 'yellow',
    rhythm: 'Any rhythm not used for white lights',
    pattern: flashes(4, [[0, 0.5]], { example: true }),
    meaning: 'Indicates a special area or feature. Not primarily a navigational mark.',
    action: "Not a navigational mark. Consult the chart for what it marks.",
    memory: 'All yellow, yellow X, yellow light. Spoil grounds, cables, recreation zones.'
  },
  {
    id: 'ewmb',
    region: 'both',
    type: 'Emergency wreck',
    name: 'Emergency wreck marking buoy',
    body: 'pillar',
    bands: ['blue-yellow-vertical'],
    topmark: { form: 'cross', color: 'yellow', count: 1 },
    lightColor: 'blue and yellow',
    rhythm: 'Al Oc Bu Y 3s',
    pattern: flashes(3, [[0, 1.4, 'blue'], [1.5, 2.9, 'yellow']]),
    meaning: 'Marks a new danger, normally a wreck, until the danger is charted and permanently marked.',
    action: "A new and uncharted danger. Give it a wide berth on either side.",
    memory: 'Blue and yellow vertical stripes, alternating blue and yellow light. Nothing else looks like it.'
  }
];

export const REGIONS = [REGION_A, REGION_B];
