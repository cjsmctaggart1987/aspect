/**
 * Arc visibility, and the invariant that no light is ever drawn off the hull.
 *
 * The sweep is the expensive one and it earns its place: hull width is derived
 * per state from the plan and the outboard lights, so a change to either can
 * put a light in the sea without anything else failing.
 */
import { VESSEL_STATES } from '../data/vessel-states.js';
import { MARKS } from '../data/buoyage.js';
import { visibleLights } from '../src/engine.js';
import { renderScene } from '../src/render-lights.js';
import { renderBuoy } from '../src/render-buoy.js';

const HULL = /<path d="\s*M (-?[\d.]+) (-?[\d.]+)\s*L (-?[\d.]+)/;
const BULB = /<circle cx="(-?[\d.]+)" cy="-?[\d.]+" r="4\.2"/g;

export default function run(t) {
  t.section('sternlight alone at 135, and the arc boundary either side of 112.5');
  const pd = VESSEL_STATES.find(s => s.id === 'pd-50plus');
  const at = a => visibleLights(pd, a, true).map(l => `${l.color} ${l.name}`);
  t.ok('135 shows exactly one white sternlight',
    at(135).length === 1 && at(135)[0] === 'white Sternlight', JSON.stringify(at(135)));
  t.ok('112 still shows the masthead and sidelight set', at(112).length === 3, `${at(112).length} lights`);
  t.ok('113 has flipped to the sternlight alone',
    at(113).length === 1 && at(113)[0] === 'white Sternlight');

  t.section('no visible light falls outside the hull, 30 states x 360 aspects');
  const over = [];
  for (const st of VESSEL_STATES) {
    for (let a = 0; a < 360; a++) {
      const svg = renderScene(st, a, true, 'night');
      const h = svg.match(HULL);
      const left = parseFloat(h[1]), right = parseFloat(h[3]);
      for (const m of svg.matchAll(BULB)) {
        const x = parseFloat(m[1]);
        if (x < left - 0.05 || x > right + 0.05) { over.push(`${st.id}@${a}`); break; }
      }
    }
  }
  t.ok('zero overhangs', over.length === 0, over.slice(0, 3).join(', ') || '10800 scenes');

  t.section('buoy clip ids — the regression this renderer shipped with once');
  const ids = MARKS.map(m => (renderBuoy(m).match(/clipPath id="([^"]+)"/) || [])[1]);
  t.ok('every mark emits a clipPath id', ids.every(Boolean));
  t.ok('all clip ids unique', new Set(ids).size === ids.length, `${new Set(ids).size}/${ids.length}`);
  t.ok('none named bodyClip', !ids.includes('bodyClip'));
  t.ok('safe water body clips to a circle',
    /<clipPath id="[^"]+"><circle/.test(renderBuoy(MARKS.find(m => m.id === 'safe-water'))));
  t.ok('starboard hand mark clips to a cone path',
    /<clipPath id="[^"]+"><path d="M 0 -10 L 23 52/.test(renderBuoy(MARKS.find(m => m.id === 'lat-stbd-b'))));
}
