/**
 * Vessel profiles.
 *
 * The load-bearing property is that a silhouette is projected rather than posed:
 * it must foreshorten with aspect and it must not wander off the hull. The sail
 * is the sharpest test of that, because a plate in the fore-and-aft plane has to
 * collapse to nothing head-on and mirror between the two beams.
 *
 * What is deliberately NOT tested: whether a cargo ship looks like a cargo ship.
 * The proportions in HULLS are judgement and no assertion can settle them.
 */
import { VESSEL_STATES } from '../data/vessel-states.js';
import { renderScene } from '../src/render-lights.js';

const N = '(-?[0-9.]+)';
const HULL_LINE = new RegExp(`<path d="M ${N} ${N} L ${N} `);
// Only silhouette structures carry these two fills; sky and sea use their own.
const SIL_RECT = new RegExp(`<rect x="${N}" y="${N}" width="([0-9.]+)" height="([0-9.-]+)" fill="#(16242C|0D141C)"`, 'g');
const TRI = new RegExp(`<path d="M ${N} ${N} L ${N} ${N} L ${N} ${N} Z" fill="#`, 'g');

export default function run(t) {
  t.section('every state renders, every hull type exercised');
  const used = new Set();
  const broke = [];
  for (const st of VESSEL_STATES) {
    used.add(st.hull);
    for (let a = 0; a < 360; a += 15) for (const mode of ['day', 'night']) {
      const svg = renderScene(st, a, true, mode);
      if (!/<svg/.test(svg) || /NaN|undefined/.test(svg)) broke.push(`${st.id}@${a}/${mode}`);
    }
  }
  t.ok('30 states x 48 aspect and mode combinations, no NaN or undefined',
    broke.length === 0, broke.slice(0, 3).join(', ') || '1440 scenes');
  t.ok('all 30 states carry a hull field', VESSEL_STATES.every(s => typeof s.hull === 'string'));
  t.ok('10 distinct hull types in use', used.size === 10, [...used].sort().join(', '));

  t.section('the sail is a plate in the fore-and-aft plane');
  const boat = VESSEL_STATES.find(s => s.hull === 'sail');
  const tri = a => [...renderScene(boat, a, true, 'day').matchAll(TRI)]
    .map(x => x.slice(1).map(Number)).pop();
  const width = p => Math.max(p[0], p[2], p[4]) - Math.min(p[0], p[2], p[4]);
  const s0 = tri(0), s90 = tri(90), s270 = tri(270);
  t.ok('edge-on head-on', width(s0) < 0.15, `width ${width(s0).toFixed(2)}`);
  t.ok('full width on her beam', width(s90) > 20, `width ${width(s90).toFixed(1)}`);
  t.ok('mirrors between her two beams',
    Math.abs(width(s90) - width(s270)) < 0.2 &&
    Math.sign(s90[2] - s90[0]) === -Math.sign(s270[2] - s270[0]));

  t.section('deck structures stay on the hull');
  let examined = 0;
  const off = [];
  for (const st of VESSEL_STATES) {
    for (let a = 0; a < 360; a += 5) {
      const svg = renderScene(st, a, true, 'day');
      const h = svg.match(HULL_LINE);
      const left = parseFloat(h[1]), right = parseFloat(h[3]);
      for (const r of svg.matchAll(SIL_RECT)) {
        examined++;
        const x = parseFloat(r[1]), w = parseFloat(r[3]);
        if (x < left - 1.5 || x + w > right + 1.5) { off.push(`${st.id}@${a} (${st.hull})`); break; }
      }
    }
  }
  // Guards the guard: a matcher that silently stops matching would pass forever.
  t.ok('the matcher actually found structures', examined > 500, `${examined} examined`);
  t.ok('none overhang the hull', off.length === 0, [...new Set(off)].slice(0, 4).join(', '));

  t.section('reduced motion suppresses SMIL on flashing lights');
  // The air-cushion vessel and the WIG craft are the only two carrying a
  // flashing light, so they are the only states where this can be observed.
  const flashing = VESSEL_STATES.filter(s => s.lights.some(l => l.flash));
  t.ok('two states carry a flashing light', flashing.length === 2,
    flashing.map(s => s.id).join(', '));
  const moving = flashing.map(s => renderScene(s, 20, true, 'night', true));
  const stillLit = flashing.map(s => renderScene(s, 20, true, 'night', false));
  t.ok('animates when motion is allowed',
    moving.every(svg => svg.includes('repeatCount="indefinite"')));
  t.ok('no SMIL at all when motion is reduced',
    stillLit.every(svg => !svg.includes('<animate') && !svg.includes('repeatCount')));
  t.ok('the light is still drawn, lit and steady',
    stillLit.every(svg => (svg.match(/r="4\.2"/g) || []).length ===
                          (moving[stillLit.indexOf(svg)].match(/r="4\.2"/g) || []).length));
  t.ok('states with no flashing light are unaffected by the flag',
    renderScene(VESSEL_STATES.find(s => s.id === 'pd-50plus'), 20, true, 'night', true) ===
    renderScene(VESSEL_STATES.find(s => s.id === 'pd-50plus'), 20, true, 'night', false));
}
