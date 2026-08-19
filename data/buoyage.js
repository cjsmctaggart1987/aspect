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
 * bands: painted top to bottom.
 * topmark: null, or { form, color, count }.
 */

export const REGION_A = 'A';
export const REGION_B = 'B';

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
    meaning: 'Leave to port when proceeding in the conventional direction of buoyage.',
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
    meaning: 'Leave to starboard when proceeding in the conventional direction of buoyage.',
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
    meaning: 'Leave to port when proceeding in the conventional direction of buoyage.',
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
    meaning: 'Leave to starboard when proceeding in the conventional direction of buoyage.',
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
    meaning: 'A port hand mark with a green band. The main channel lies to starboard of the mark.',
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
    meaning: 'A starboard hand mark with a red band. The main channel lies to port of the mark.',
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
    meaning: 'A port hand mark with a red band. The main channel lies to starboard of the mark.',
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
    meaning: 'A starboard hand mark with a green band. The main channel lies to port of the mark.',
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
    meaning: 'Safe water lies to the north of the mark.',
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
    meaning: 'Safe water lies to the east of the mark.',
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
    meaning: 'Safe water lies to the south of the mark.',
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
    meaning: 'Safe water lies to the west of the mark.',
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
    meaning: 'Stationed on or moored above an isolated danger with navigable water all round it.',
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
    meaning: 'Navigable water all round the mark. Often a landfall or mid-channel mark.',
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
    meaning: 'Indicates a special area or feature. Not primarily a navigational mark.',
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
    meaning: 'Marks a new danger, normally a wreck, until the danger is charted and permanently marked.',
    memory: 'Blue and yellow vertical stripes, alternating blue and yellow light. Nothing else looks like it.'
  }
];

export const REGIONS = [REGION_A, REGION_B];
