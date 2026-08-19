/**
 * Renderers. Nothing here is a stored picture: every scene is generated from
 * the vessel state table plus an aspect, which is why adding a state adds
 * eight new pictures for free.
 */
import { norm, project, visibleLights, visibleShapes } from './engine.js';
export const LIGHT_HEX = {
  white: '#FFF3D6',
  red: '#FF3B30',
  green: '#00E06B',
  yellow: '#FFD400',
  blue: '#3AA0FF'
};

export const SCALE = 4.2; // px per metre

export const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};

export const arcPath = (cx, cy, r, from, to) => {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const large = norm(to - from) > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

/** Hull silhouette, projected so she foreshortens as the aspect closes. */
export function hull(state, aspect) {
  const long = state.length === '50plus' ? 30 : state.length === 'under12' ? 5 : 12;
  const beam = state.length === '50plus' ? 8 : state.length === 'under12' ? 2 : 4.5;
  const plan = [
    { x: long, y: 0, z: 0 }, { x: long * 0.6, y: beam, z: 0 },
    { x: -long, y: beam, z: 0 }, { x: -long, y: -beam, z: 0 },
    { x: long * 0.6, y: -beam, z: 0 }
  ];
  const xs = plan.map(p => project(p, aspect).sx * SCALE);
  return { left: Math.min(...xs), right: Math.max(...xs) };
}

export function renderScene(state, aspect, makingWay = true, mode = 'night') {
  const lights = visibleLights(state, aspect, makingWay);
  const shapes = mode === 'day' ? visibleShapes(state, aspect) : [];
  const { left, right } = hull(state, aspect);
  const deck = 0;
  const sky = mode === 'day' ? '#B9CBD3' : '#04070C';
  const sea = mode === 'day' ? '#7E96A2' : '#070C13';
  const hullFill = mode === 'day' ? '#1B2B34' : '#0C1219';

  const glow = lights.map((l, i) => `
    <radialGradient id="g${i}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${LIGHT_HEX[l.color]}" stop-opacity=".85"/>
      <stop offset="100%" stop-color="${LIGHT_HEX[l.color]}" stop-opacity="0"/>
    </radialGradient>`).join('');

  const bulbs = lights.map((l, i) => {
    const x = l.sx * SCALE, y = -l.sy * SCALE;
    const flash = l.flash ? `<animate attributeName="opacity" values="1;1;0;0" dur="0.7s" repeatCount="indefinite"/>` : '';
    return `<g opacity="${mode === 'day' ? 0.15 : 1}">
      ${mode === 'night' ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="19" fill="url(#g${i})"/>` : ''}
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="${LIGHT_HEX[l.color]}">${flash}</circle>
    </g>`;
  }).join('');

  const dayShapes = shapes.map(s => {
    const x = s.sx * SCALE, y = -s.sy * SCALE;
    switch (s.form) {
      case 'ball':
      case 'sphere':
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#0A1116"/>`;
      case 'diamond':
        return `<path d="M ${x} ${y - 8} L ${x + 6} ${y} L ${x} ${y + 8} L ${x - 6} ${y} Z" fill="#0A1116"/>`;
      case 'cone-up':
        return `<path d="M ${x} ${y - 8} L ${x + 6} ${y + 4} L ${x - 6} ${y + 4} Z" fill="#0A1116"/>`;
      case 'cone-down':
        return `<path d="M ${x} ${y + 8} L ${x + 6} ${y - 4} L ${x - 6} ${y - 4} Z" fill="#0A1116"/>`;
      case 'cylinder':
        return `<rect x="${x - 5}" y="${y - 8}" width="10" height="16" fill="#0A1116"/>`;
      default:
        return '';
    }
  }).join('');

  // Masts drawn only as faint verticals so the eye reads height, not structure.
  const masts = mode === 'night' ? lights
    .filter(l => l.sy > 4)
    .map(l => `<line x1="${(l.sx * SCALE).toFixed(1)}" y1="${deck}" x2="${(l.sx * SCALE).toFixed(1)}" y2="${(-l.sy * SCALE).toFixed(1)}" stroke="#0E151D" stroke-width="1.2"/>`)
    .join('') : '';

  return `<svg viewBox="-250 -140 500 210" xmlns="http://www.w3.org/2000/svg" role="img"
    aria-label="Simulated view of ${state.name} at ${Math.round(aspect)} degrees aspect">
    <defs>${glow}</defs>
    <rect x="-250" y="-140" width="500" height="210" fill="${sky}"/>
    <rect x="-250" y="0" width="500" height="70" fill="${sea}"/>
    <line x1="-250" y1="0" x2="250" y2="0" stroke="${mode === 'day' ? '#5E7783' : '#101922'}" stroke-width="1"/>
    ${masts}
    <path d="M ${left - 6} 0 L ${right + 6} 0 L ${right} 9 L ${left} 9 Z" fill="${hullFill}"/>
    ${dayShapes}
    ${bulbs}
  </svg>`;
}

/**
 * The aspect dial. This is the point of the whole tool: the arcs are the rule,
 * and dragging the observer round shows you why the picture changes.
 */
export function renderDial(aspect) {
  const c = 0;
  const rings = [
    { r: 78, from: -112.5, to: 112.5, stroke: '#FFF3D6', label: 'Masthead 225' },
    { r: 64, from: 0, to: 112.5, stroke: '#00E06B', label: 'Starboard 112.5' },
    { r: 64, from: -112.5, to: 0, stroke: '#FF3B30', label: 'Port 112.5' },
    { r: 50, from: 112.5, to: 247.5, stroke: '#FFF3D6', label: 'Stern 135' }
  ];
  const arcs = rings.map(g =>
    `<path d="${arcPath(c, c, g.r, g.from, g.to)}" fill="none" stroke="${g.stroke}"
       stroke-width="7" stroke-linecap="butt" opacity=".82"/>`).join('');

  const ticks = [0, 45, 90, 135, 180, 225, 270, 315].map(d => {
    const [x1, y1] = polar(c, c, 86, d);
    const [x2, y2] = polar(c, c, 92, d);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
      stroke="#10222C" stroke-width="1" opacity=".5"/>`;
  }).join('');

  const [ox, oy] = polar(c, c, 98, aspect);
  return `<svg viewBox="-115 -115 230 230" xmlns="http://www.w3.org/2000/svg" id="dialSvg"
    role="img" aria-label="Aspect dial, observer at ${Math.round(aspect)} degrees">
    <circle cx="0" cy="0" r="98" fill="none" stroke="#10222C" stroke-width="1" opacity=".25"/>
    ${ticks}${arcs}
    <path d="M 0 -34 L 13 22 L 0 15 L -13 22 Z" fill="#10222C"/>
    <line x1="0" y1="0" x2="${ox.toFixed(1)}" y2="${oy.toFixed(1)}" stroke="#C3006B" stroke-width="1" stroke-dasharray="3 3"/>
    <circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="8" fill="#C3006B"/>
    <circle cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="13" fill="none" stroke="#C3006B" stroke-width="1" opacity=".45"/>
  </svg>`;
}
