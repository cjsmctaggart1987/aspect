/**
 * Renderers. Nothing here is a stored picture: every scene is generated from
 * the vessel state table plus an aspect.
 */

import { visibleLights, visibleShapes, project, norm } from './engine.js';

const LIGHT_HEX = {
  white: '#FFF3D6',
  red: '#FF3B30',
  green: '#00E06B',
  yellow: '#FFD400',
  blue: '#3AA0FF'
};

// Frame the scene inside this box, in user units. Waterline sits at y = 0.
const VIEW = { x: -200, y: -150, w: 400, h: 200 };
const FRAME_W = 350;
const FRAME_H = 132;

// Rough hull dimensions by length band, metres.
const SIZE = {
  '50plus': { long: 32, beam: 9, free: 5.0, house: 0.30 },
  'under50': { long: 13, beam: 5, free: 2.6, house: 0.34 },
  'under12': { long: 5, beam: 2, free: 1.1, house: 0.40 }
};

const dims = s => SIZE[s.length] || SIZE['under50'];

/**
 * Scale is computed per state, not per aspect, so the picture does not zoom
 * in and out while you drag the dial. Relative geometry has to stay stable.
 */
function stateScale(state) {
  const d = dims(state);
  const zs = [...state.lights.map(l => l.z), ...(state.dayShapes || []).map(s => s.z), 6];
  const maxZ = Math.max(...zs);
  const halfWidth = Math.max(d.long, ...state.lights.map(l => Math.hypot(l.x, l.y)));
  const s = Math.min(FRAME_W / (2 * halfWidth), FRAME_H / (maxZ + 3));
  return Math.max(3.2, Math.min(16, s));
}

const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};

const arcPath = (cx, cy, r, from, to) => {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const large = norm(to - from) > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

/** Hull plan outline, projected, so she foreshortens as the aspect closes. */
function hullExtent(state, aspect, k) {
  const d = dims(state);
  // A few states carry lights well outboard of the class beam: the obstruction
  // and clear-side lights when dredging, the fore yard lights in mine
  // clearance, the gear light on a fishing vessel. Head-on the projection
  // collapses to screen_x = -y, so lateral offset is the whole picture and a
  // class-constant beam leaves those lights hanging off the hull. Widen the
  // plan to cover them.
  const outboard = Math.max(0, ...state.lights.map(l => Math.abs(l.y)));
  const beam = Math.max(d.beam, outboard + 1);
  const plan = [
    { x: d.long, y: 0 }, { x: d.long * 0.72, y: beam }, { x: -d.long * 0.9, y: beam },
    { x: -d.long, y: beam * 0.55 }, { x: -d.long, y: -beam * 0.55 },
    { x: -d.long * 0.9, y: -beam }, { x: d.long * 0.72, y: -beam }
  ];
  const xs = plan.map(p => project({ x: p.x, y: p.y, z: 0 }, aspect).sx * k);
  return { left: Math.min(...xs), right: Math.max(...xs), deck: -d.free * k };
}

/**
 * Vessel profiles.
 *
 * Each hull type is a sheer style plus a handful of structures. Positions are
 * given as `u`, a fraction of the half length, so a profile fits a 32 m ship
 * and a 5 m one without a second table; `dy` and heights are metres.
 *
 * Nothing here is drawn in a fixed pose. Every structure is a box or a plate in
 * ship coordinates, put through the same project() the lights use, so a
 * profile foreshortens as she turns bow-on and a sail goes edge-on head-on
 * because that is what actually happens. The silhouette can never disagree
 * with the lights standing on it.
 */
const HULLS = {
  cargo: {
    sheer: 'box',
    house: { u: -0.62, du: 0.16, dy: 0.85, h: 6.5 },
    funnel: { u: -0.80, du: 0.05, dy: 0.35, h: 4.5 },
    masts: [{ u: 0.52, h: 11 }, { u: -0.20, h: 8 }]
  },
  'small-power': {
    sheer: 'work',
    house: { u: -0.05, du: 0.22, dy: 0.7, h: 2.6 },
    masts: [{ u: 0.0, h: 4.5 }]
  },
  sail: {
    sheer: 'fine',
    masts: [{ u: 0.10, h: 15 }],
    sail: { u: 0.10, head: 14.5, clewU: -0.55, boom: 2.2 }
  },
  fishing: {
    sheer: 'work',
    house: { u: -0.42, du: 0.20, dy: 0.75, h: 3.4 },
    masts: [{ u: -0.18, h: 9 }],
    gantry: { u: -0.88, du: 0.10, h: 5.5 }
  },
  tug: {
    sheer: 'work',
    house: { u: 0.10, du: 0.22, dy: 0.8, h: 3.8 },
    funnel: { u: -0.22, du: 0.07, dy: 0.4, h: 2.8 },
    masts: [{ u: 0.22, h: 8 }]
  },
  barge: {
    sheer: 'box'
  },
  pilot: {
    sheer: 'work',
    house: { u: 0.02, du: 0.26, dy: 0.8, h: 3.0 },
    masts: [{ u: -0.14, h: 7 }]
  },
  dredger: {
    sheer: 'box',
    house: { u: -0.62, du: 0.16, dy: 0.8, h: 4.2 },
    gantry: { u: 0.42, du: 0.14, h: 9 }
  },
  hovercraft: {
    sheer: 'skirt',
    house: { u: 0.05, du: 0.30, dy: 0.85, h: 3.0 },
    fans: [{ u: -0.62, du: 0.10, h: 4.8 }]
  },
  wig: {
    sheer: 'fine',
    house: { u: 0.22, du: 0.16, dy: 0.6, h: 2.2 },
    wing: { u: -0.10, du: 0.26, dy: 2.2, h: 2.2 },
    tail: { u: -0.86, du: 0.07, h: 5.5 }
  }
};

const hullOf = s => HULLS[s.hull] || HULLS['small-power'];

/**
 * Screen extent of a box in ship coordinates. All four corners go through the
 * projection, so the box shows its length broadside and its beam head-on
 * rather than collapsing to nothing.
 */
function boxSpan(aspect, k, long, u, du, dy) {
  const xs = [];
  for (const ux of [u - du, u + du]) {
    for (const y of [-dy, dy]) {
      xs.push(project({ x: ux * long, y, z: 0 }, aspect).sx * k);
    }
  }
  return { a: Math.min(...xs), b: Math.max(...xs) };
}

/** Screen x of a point on the centreline at fore-aft station u. */
const stationX = (aspect, k, long, u) => project({ x: u * long, y: 0, z: 0 }, aspect).sx * k;

function hullPath(sheer, left, right, deck, fill) {
  const w = Math.max(12, right - left);
  const n = v => v.toFixed(1);
  // Deck line always runs left to right at deck height; only the underbody
  // and the ends change with the sheer style.
  switch (sheer) {
    case 'box':      // cargo, barge, dredger: full ends, flat bottom
      return `<path d="M ${n(left)} ${n(deck)} L ${n(right)} ${n(deck)}
        L ${n(right - w * 0.02)} ${n(-deck * 0.5)} L ${n(left + w * 0.02)} ${n(-deck * 0.5)} Z" fill="${fill}"/>`;
    case 'fine':     // sail, WIG: fine ends, deep curve
      return `<path d="M ${n(left)} ${n(deck)} L ${n(right)} ${n(deck)}
        Q ${n(left + w / 2)} ${n(-deck * 1.15)} ${n(left)} ${n(deck)} Z" fill="${fill}"/>`;
    case 'skirt':    // hovercraft: sits on a wide flat skirt
      return `<path d="M ${n(left)} ${n(deck)} L ${n(right)} ${n(deck)}
        L ${n(right)} ${n(-deck * 0.35)} L ${n(right - w * 0.06)} ${n(-deck * 0.7)}
        L ${n(left + w * 0.06)} ${n(-deck * 0.7)} L ${n(left)} ${n(-deck * 0.35)} Z" fill="${fill}"/>`;
    default:         // work: everything else
      return `<path d="M ${n(left)} ${n(deck)} L ${n(right)} ${n(deck)}
        L ${n(right - w * 0.06)} ${n(deck * 0.1)}
        Q ${n(left + w / 2)} ${n(-deck * 0.55)} ${n(left + w * 0.06)} ${n(deck * 0.1)} Z" fill="${fill}"/>`;
  }
}

/** Hull, structures and masts. Drawn in both day and night. */
function silhouette(state, aspect, k, mode, lights, shapes) {
  const { left, right, deck } = hullExtent(state, aspect, k);
  const d = dims(state);
  const h = hullOf(state);
  const fill = mode === 'day' ? '#16242C' : '#0D141C';
  const line = mode === 'day' ? '#16242C' : '#111A23';
  const n = v => v.toFixed(1);
  const L = d.long;

  const hull = hullPath(h.sheer, left, right, deck, fill);

  // A box structure standing on deck, e.g. the deckhouse or a funnel.
  const box = (f, minW = 3) => {
    const { a, b } = boxSpan(aspect, k, L, f.u, f.du, f.dy);
    const w = Math.max(minW, b - a);
    const top = deck - f.h * k;
    return `<rect x="${n(a)}" y="${n(top)}" width="${n(w)}" height="${n(deck - top)}" fill="${fill}"/>`;
  };

  const parts = [];
  if (h.house) parts.push(box(h.house, 4));
  if (h.funnel) parts.push(box(h.funnel, 3));
  if (h.wing) parts.push(box(h.wing, 4));

  // Fixed masts belonging to the vessel, distinct from the stalks that keep
  // lights from floating.
  for (const m of h.masts || []) {
    const x = stationX(aspect, k, L, m.u);
    parts.push(`<line x1="${n(x)}" y1="${n(deck)}" x2="${n(x)}" y2="${n(deck - m.h * k)}"
      stroke="${line}" stroke-width="1.6"/>`);
  }

  // Gantry: two legs and a head, over the working end.
  if (h.gantry) {
    const { a, b } = boxSpan(aspect, k, L, h.gantry.u, h.gantry.du, 0.8);
    const top = deck - h.gantry.h * k;
    parts.push(`<path d="M ${n(a)} ${n(deck)} L ${n(a)} ${n(top)} L ${n(b)} ${n(top)} L ${n(b)} ${n(deck)}"
      fill="none" stroke="${line}" stroke-width="1.8"/>`);
  }

  // Hovercraft lift fans: a duct standing proud aft.
  for (const f of h.fans || []) parts.push(box({ ...f, dy: 0.6 }, 4));

  // WIG tailplane.
  if (h.tail) {
    const x = stationX(aspect, k, L, h.tail.u);
    const { a, b } = boxSpan(aspect, k, L, h.tail.u, h.tail.du, 1.4);
    const top = deck - h.tail.h * k;
    parts.push(`<line x1="${n(x)}" y1="${n(deck)}" x2="${n(x)}" y2="${n(top)}" stroke="${line}" stroke-width="1.8"/>`);
    parts.push(`<rect x="${n(a)}" y="${n(top)}" width="${n(Math.max(4, b - a))}" height="2.4" fill="${fill}"/>`);
  }

  // Sail: a plate in the fore and aft plane, so it goes edge-on head-on.
  if (h.sail) {
    const tack = stationX(aspect, k, L, h.sail.u);
    const clew = stationX(aspect, k, L, h.sail.clewU);
    const head = deck - h.sail.head * k;
    const boom = deck - h.sail.boom * k;
    parts.push(`<path d="M ${n(tack)} ${n(head)} L ${n(clew)} ${n(boom)} L ${n(tack)} ${n(boom)} Z" fill="${fill}"/>`);
    parts.push(`<line x1="${n(tack)}" y1="${n(boom)}" x2="${n(clew)}" y2="${n(boom)}" stroke="${line}" stroke-width="1.6"/>`);
  }

  // A stalk under every raised light or shape, so nothing floats. This is a
  // correctness property, not decoration: it must hold whatever the profile.
  const pts = [...lights, ...shapes];
  const cols = [...new Set(pts.filter(p => -p.sy * k < deck - 3).map(p => (p.sx * k).toFixed(1)))];
  const stalks = cols.map(x => {
    const top = Math.min(...pts.filter(p => (p.sx * k).toFixed(1) === x).map(p => -p.sy * k));
    return `<line x1="${x}" y1="${n(deck)}" x2="${x}" y2="${n(top + 3)}"
      stroke="${line}" stroke-width="1.6"/>`;
  }).join('');

  return `${stalks}${hull}${parts.join('')}`;
}

/**
 * Nominal day shape diameter, metres.
 *
 * Annex I puts the minimum at 0.6 m for a vessel of 20 m or more, and gives a
 * cone a height equal to its diameter. Real fits are larger than the minimum,
 * and 0.6 m would be two or three pixels here, so the figure below is
 * representative rather than minimal and SHAPE_FLOOR_PX keeps it readable when
 * the whole ship has been scaled down to fit the frame.
 */
const SHAPE_D_M = 1.5;
const SHAPE_FLOOR_PX = 14;

/** Shape diameter in user units: metres through the state scale, floored. */
const shapeSize = k => Math.max(SHAPE_FLOOR_PX, SHAPE_D_M * k);

function dayShape(form, sx, sy, k) {
  const f = '#0B1116';
  const d = shapeSize(k);            // diameter, and a cone's height
  const r = d / 2;
  const x = +sx.toFixed(1), y = +sy.toFixed(1);
  const n = v => v.toFixed(1);
  switch (form) {
    case 'ball':
    case 'sphere':
      return `<circle cx="${x}" cy="${y}" r="${n(r)}" fill="${f}"/>`;
    case 'diamond':
      return `<path d="M ${x} ${n(y - d * 0.67)} L ${n(x + r)} ${y} L ${x} ${n(y + d * 0.67)} L ${n(x - r)} ${y} Z" fill="${f}"/>`;
    case 'cone-up':
      return `<path d="M ${x} ${n(y - d * 0.61)} L ${n(x + r)} ${n(y + d * 0.39)} L ${n(x - r)} ${n(y + d * 0.39)} Z" fill="${f}"/>`;
    case 'cone-down':
      return `<path d="M ${x} ${n(y + d * 0.61)} L ${n(x + r)} ${n(y - d * 0.39)} L ${n(x - r)} ${n(y - d * 0.39)} Z" fill="${f}"/>`;
    case 'cones-apex':
      // One mounting height, two cones meeting exactly on it: the lower cone
      // apex up, the upper cone apex down, both apexes on y. Rule 26(b) and
      // 26(c) day signal, and the reason the pair is a single shape rather
      // than two that have to be positioned to touch.
      return `<path d="M ${x} ${y} L ${n(x + r)} ${n(y + d)} L ${n(x - r)} ${n(y + d)} Z" fill="${f}"/>`
           + `<path d="M ${x} ${y} L ${n(x + r)} ${n(y - d)} L ${n(x - r)} ${n(y - d)} Z" fill="${f}"/>`;
    case 'cylinder':
      return `<rect x="${n(x - d * 0.39)}" y="${n(y - d * 0.61)}" width="${n(d * 0.78)}" height="${n(d * 1.22)}" fill="${f}"/>`;
    default:
      return '';
  }
}

/**
 * `motion` is threaded in rather than assumed, for the same reason the buoy
 * lamp threads it: the page's prefers-reduced-motion rule suppresses CSS
 * animation only, and SMIL ignores it entirely. A flashing light left running
 * under that setting is exactly the sort of thing the setting exists to stop.
 *
 * When motion is off the light is drawn lit and steady rather than dropped,
 * because a light that never comes on reads as no light at all, which would
 * change what the picture says.
 */
/**
 * `anonymous` strips the vessel's name and her aspect out of the accessible
 * label. A drill asks you to read the picture; leaving the answer in an
 * aria-label hands it to a screen reader and to anyone who opens the DOM.
 * Default off, so the explore view is unchanged.
 */
export function renderScene(state, aspect, makingWay = true, mode = 'night', motion = true, { anonymous = false } = {}) {
  const k = stateScale(state);
  const lights = visibleLights(state, aspect, makingWay);
  const shapes = mode === 'day' ? visibleShapes(state, aspect) : [];
  const sky = mode === 'day' ? '#AFC4CE' : '#04070C';
  const sea = mode === 'day' ? '#718996' : '#070C13';
  const horizon = mode === 'day' ? '#56707D' : '#101922';

  const sil = silhouette(state, aspect, k, mode, lights, shapes);

  const glow = mode === 'night' ? lights.map((l, i) => `
    <radialGradient id="g${i}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${LIGHT_HEX[l.color]}" stop-opacity=".9"/>
      <stop offset="100%" stop-color="${LIGHT_HEX[l.color]}" stop-opacity="0"/>
    </radialGradient>`).join('') : '';

  const bulbs = lights.map((l, i) => {
    const x = (l.sx * k).toFixed(1), y = (-l.sy * k).toFixed(1);
    const flash = l.flash && motion
      ? `<animate attributeName="opacity" values="1;1;0;0" dur="0.7s" repeatCount="indefinite"/>` : '';
    return mode === 'night'
      ? `<g><circle cx="${x}" cy="${y}" r="24" fill="url(#g${i})"/>
         <circle cx="${x}" cy="${y}" r="4.2" fill="${LIGHT_HEX[l.color]}">${flash}</circle></g>`
      : `<circle cx="${x}" cy="${y}" r="3.4" fill="${LIGHT_HEX[l.color]}" opacity=".3"/>`;
  }).join('');

  const daySigns = shapes
    .map(s => dayShape(s.form, s.sx * k, -s.sy * k, k))
    .join('');

  return `<svg viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="${anonymous ? `An unidentified vessel, ${mode}` : `${state.name} viewed from ${Math.round(aspect)} degrees aspect, ${mode}`}">
    <defs>${glow}</defs>
    <rect x="${VIEW.x}" y="${VIEW.y}" width="${VIEW.w}" height="${VIEW.h}" fill="${sky}"/>
    <rect x="${VIEW.x}" y="0" width="${VIEW.w}" height="${VIEW.y + VIEW.h}" fill="${sea}"/>
    <line x1="${VIEW.x}" y1="0" x2="${VIEW.x + VIEW.w}" y2="0" stroke="${horizon}" stroke-width="1"/>
    ${sil}
    ${daySigns}
    ${bulbs}
  </svg>`;
}

/**
 * The aspect dial. The arcs are the rule: dragging the observer round shows
 * you why the picture changes.
 */
export function renderDial(aspect, { anonymous = false } = {}) {
  const rings = [
    { r: 78, from: -112.5, to: 112.5, stroke: '#FFF3D6' },
    { r: 64, from: 0, to: 112.5, stroke: '#00E06B' },
    { r: 64, from: -112.5, to: 0, stroke: '#FF3B30' },
    { r: 50, from: 112.5, to: 247.5, stroke: '#FFF3D6' }
  ];
  const arcs = rings.map(g =>
    `<path d="${arcPath(0, 0, g.r, g.from, g.to)}" fill="none" stroke="${g.stroke}"
       stroke-width="7" stroke-linecap="butt" opacity=".82"/>`).join('');

  const ticks = [0, 45, 90, 135, 180, 225, 270, 315].map(d => {
    const [x1, y1] = polar(0, 0, 86, d);
    const [x2, y2] = polar(0, 0, 92, d);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
      stroke="#10222C" stroke-width="1" opacity=".5"/>`;
  }).join('');

  const [ox, oy] = polar(0, 0, 98, aspect);
  return `<svg viewBox="-115 -115 230 230" xmlns="http://www.w3.org/2000/svg" id="dialSvg"
    role="img" aria-label="${anonymous ? 'Aspect dial' : `Aspect dial, observer at ${Math.round(aspect)} degrees`}">
    <circle cx="0" cy="0" r="98" fill="none" stroke="#10222C" stroke-width="1" opacity=".25"/>
    ${ticks}${arcs}
    <path d="M 0 -34 L 13 22 L 0 15 L -13 22 Z" fill="#10222C"/>
    <line x1="0" y1="0" x2="${ox.toFixed(1)}" y2="${oy.toFixed(1)}" stroke="#C3006B" stroke-width="1" stroke-dasharray="3 3"/>
    <circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="8" fill="#C3006B"/>
    <circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="13" fill="none" stroke="#C3006B" stroke-width="1" opacity=".45"/>
  </svg>`;
}

export const SHAPE_NAMES = {
  ball: 'Black ball',
  sphere: 'Black sphere',
  diamond: 'Diamond',
  'cone-up': 'Cone, apex up',
  'cone-down': 'Cone, apex down',
  'cones-apex': 'Two cones, apexes together',
  cylinder: 'Cylinder'
};

export { LIGHT_HEX };
