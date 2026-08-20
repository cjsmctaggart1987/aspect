/**
 * Arc visibility, and the invariant that no light is ever drawn off the hull.
 *
 * The sweep is the expensive one and it earns its place: hull width is derived
 * per state from the plan and the outboard lights, so a change to either can
 * put a light in the sea without anything else failing.
 */
import { VESSEL_STATES } from '../data/vessel-states.js';
import { MARKS } from '../data/buoyage.js';
import { visibleLights, inPrescribedSector, PRACTICAL_CUTOFF } from '../src/engine.js';
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
  // The prescribed sector is Rule 21's and it has not moved. What is new is
  // that lightVisible also models Annex I 9(a)'s practical cut-off, so a fading
  // light is still seen for a degree outside its sector.
  const sector = a => pd.lights.filter(l => inPrescribedSector(l, a)).map(l => `${l.color} ${l.name}`);
  t.ok('the prescribed sector still flips between 112 and 113',
    sector(112).length === 3 && sector(113).length === 1 &&
    sector(113)[0] === 'white Sternlight',
    `${sector(112).length} lights then ${sector(113).length}`);
  t.ok('112 still shows the masthead and sidelight set',
    at(112).filter(l => !/Sternlight/.test(l)).length === 3, `${at(112).length} lights in all`);
  t.ok('the cut-off opens a two degree overlap at the edge and no wider',
    at(112).length === 4 && at(113.5).length === 4 && at(114).length === 1,
    `overlap 111.5 to 113.5, then ${at(114).join(', ')}`);
  t.ok('114 is the sternlight alone',
    at(114).length === 1 && at(114)[0] === 'white Sternlight');

  t.section('both sidelights near head-on, which is what Rule 14(b) turns on');
  // The sidelight arcs used to meet at a point rather than overlap, so both
  // were visible only at exactly 0.000 degrees. The dial sets the aspect from
  // atan2 and is continuous, so dragging to head-on essentially never produced
  // the one picture Rule 14(b) defines a head-on situation by.
  const sides = a => at(a).filter(l => /sidelight/i.test(l)).length;
  t.ok('both sidelights show right ahead', sides(0) === 2, at(0).join(', '));
  t.ok('and both still show a degree either side',
    sides(1) === 2 && sides(359) === 2 && sides(0.4) === 2,
    'a continuous dial can now reach a head-on picture');
  t.ok('two degrees off it is one sidelight again',
    sides(2) === 1 && sides(358) === 1,
    'a narrow band, not a blurred bow');
  t.ok('the prescribed sectors still meet at a point, as Rule 21 states',
    pd.lights.filter(l => inPrescribedSector(l, 1) && /sidelight/i.test(l.name)).length === 1 &&
    pd.lights.filter(l => inPrescribedSector(l, 0) && /sidelight/i.test(l.name)).length === 2,
    'the rule is unchanged; only the glass is modelled');
  t.ok('the cut-off is the smallest Annex I allows, not the widest',
    PRACTICAL_CUTOFF === 1,
    'the Annex permits up to 3 forward and 5 elsewhere, describing a light fading out');

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

/**
 * Bundle safety.
 *
 * Modules keep their own scope; the bundle does not. Every module is
 * concatenated into one classic script, so two modules declaring the same
 * top-level name is a SyntaxError that only appears in the built file and
 * never while developing. sound-questions.js shipped exactly that against
 * engine.js — pick, shuffle, similarity, distractors — and the module app was
 * perfectly happy.
 *
 * Kept in the engine suite rather than a file of its own because it is the same
 * class of mistake as the shared clipPath id above: a namespace assumed to be
 * private that is not.
 */
export function checkBundleNamespace(t, readFile, modules) {
  t.section('no two parts of the bundle declare the same top-level name');
  const DECL = /^(?:export )?(?:const|let|var|function|class|async function) ([A-Za-z0-9_$]+)/gm;

  // The app script shares that scope too. Leaving it out is how QUESTION_TYPES
  // got through after the module-only version of this check went green.
  const html = readFile('index.html');
  const tag = '<script type="module">\n';
  const open = html.indexOf(tag) + tag.length;
  const app = html.slice(open, html.indexOf('\n</script>', open));

  const sources = [...modules.map(f => [f, readFile(f)]), ['index.html (app)', app]];
  const owner = new Map();
  const clashes = [];
  for (const [name, code] of sources) {
    for (const m of code.matchAll(DECL)) {
      if (owner.has(m[1])) clashes.push(`${m[1]} (${owner.get(m[1])} vs ${name})`);
      else owner.set(m[1], name);
    }
  }
  t.ok('the scan covers the app as well as the modules',
    sources.length === modules.length + 1 && app.includes('document.getElementById'),
    `${sources.length} sources`);
  t.ok('the scan found a plausible number of names', owner.size > 100, `${owner.size} names`);
  t.ok('no collisions', clashes.length === 0, clashes.slice(0, 4).join('; '));

  // build.cjs blanks import lines rather than rewriting them, so an alias
  // introduced at the import site simply does not exist in the bundle: the
  // module app works and the offline file throws ReferenceError. Rename the
  // export instead.
  const aliased = sources
    .filter(([, code]) => /^import\s*\{[^}]*\sas\s/m.test(code))
    .map(([name]) => name);
  t.ok('no aliased imports, which the bundle cannot express', aliased.length === 0, aliased.join(', '));
}
