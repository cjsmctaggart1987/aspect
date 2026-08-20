/**
 * Buoyage: the light pattern data, the rhythm strip drawn from it, and the
 * night lamp.
 *
 * The flash counts are checked off the rendered SVG rather than off the data,
 * because the data being right and the strip being right are two different
 * claims and only the second is what a learner sees.
 */
import { MARKS } from '../data/buoyage.js';
import { renderBuoy } from '../src/render-buoy.js';
import { buoyUniverse, buoyageQuestionFor, buoyDistractors, buoySimilarity, isRegional,
  BUOY_QUESTION_TYPES, BUOY_MODES } from '../src/buoyage-questions.js';

// Lit spans are the only strip rects whose fill wraps onto its own line, which
// distinguishes them from the strip's background and its outline.
const LIT = 'height="10"\n      fill="#';
const litCount = (m, mode = 'day') => renderBuoy(m, mode).split(LIT).length - 1;

export default function run(t) {
  t.section('the pattern data itself');
  t.ok('every mark has a pattern', MARKS.every(m => m.pattern && Array.isArray(m.pattern.on)));
  t.ok('no lit span overruns its period',
    MARKS.every(m => Math.max(...m.pattern.on.map(o => o[1])) <= m.pattern.period));
  t.ok('no overlapping spans',
    MARKS.every(m => m.pattern.on.every((o, i, a) => i === 0 || o[0] >= a[i - 1][1])));
  const example = MARKS.filter(m => m.pattern.example).map(m => m.id);
  t.ok('5 marks have no prescribed rhythm (4 lateral, 1 special)',
    example.length === 5, example.join(', '));

  t.section('all marks render in both modes and both motion settings');
  const bad = [];
  for (const m of MARKS) for (const mode of ['day', 'night']) for (const motion of [true, false]) {
    const svg = renderBuoy(m, mode, motion);
    if (!/<svg/.test(svg) || /NaN|undefined/.test(svg)) bad.push(`${m.id}/${mode}/${motion}`);
  }
  t.ok('16 marks x 2 modes x 2 motion settings', bad.length === 0, bad.slice(0, 3).join(', ') || '64 renders');

  t.section('the rhythm strip, counted off the rendered SVG');
  t.ok('the counter actually matches something', litCount(MARKS[0]) > 0, `${litCount(MARKS[0])} on a lateral`);
  const n = Object.fromEntries(MARKS.map(m => [m.id, litCount(m)]));
  t.ok('north 6, east 3, south 6 plus a long flash, west 9',
    n['card-n'] === 6 && n['card-e'] === 3 && n['card-s'] === 7 && n['card-w'] === 9,
    `N${n['card-n']} E${n['card-e']} S${n['card-s']} W${n['card-w']}`);
  t.ok('isolated danger 2, preferred channel 2+1',
    n['isolated'] === 2 && n['pref-stbd-a'] === 3, `iso${n['isolated']} pref${n['pref-stbd-a']}`);
  t.ok('strip is drawn at night too', litCount(MARKS.find(m => m.id === 'card-w'), 'night') === 9);
  t.ok('period is labelled', renderBuoy(MARKS.find(m => m.id === 'card-w')).includes('>10s<'));
  t.ok('marks with no prescribed rhythm say so',
    renderBuoy(MARKS.find(m => m.id === 'lat-port-b')).includes('example · 3s'));

  t.section('the night lamp');
  const w = MARKS.find(m => m.id === 'card-w');
  const night = renderBuoy(w, 'night', true);
  const day = renderBuoy(w, 'day', true);
  const still = renderBuoy(w, 'night', false);
  t.ok('animates at night only', night.includes('repeatCount="indefinite"') && !day.includes('repeatCount'));
  t.ok('reduced motion leaves the light lit and steady, not absent',
    !still.includes('repeatCount') && still.includes('cy="-74" r="4"'));
  t.ok('body faint at night, solid by day',
    night.includes('opacity="0.14"') && day.includes('opacity="1"'));
  t.ok('an alternating mark animates its colour as well',
    renderBuoy(MARKS.find(m => m.id === 'ewmb'), 'night', true).includes('attributeName="fill"'));

  t.section('SMIL timing is well formed');
  let valid = true, seen = 0;
  for (const m of MARKS) {
    for (const k of renderBuoy(m, 'night', true).matchAll(/keyTimes="([^"]+)"/g)) {
      seen++;
      const v = k[1].split(';').map(Number);
      if (v[0] !== 0 || v[v.length - 1] !== 1 || v.some((x, i) => i && x < v[i - 1])) valid = false;
    }
  }
  t.ok('keyTimes monotonic and normalised 0 to 1', valid && seen >= 16, `${seen} animations`);
  t.section('the drill');
  t.ok('every mark says what to do about it, not only what it is',
    MARKS.every(m => m.action && m.action !== m.meaning));
  const universe = buoyUniverse();
  const keys = universe.map(c => `${c.stateId}:${c.aspect}:${c.questionType}`);
  t.ok('all card keys unique', new Set(keys).size === keys.length, `${keys.length} cards`);
  t.ok('keys keep the three-part shape', keys.every(k => k.split(':').length === 3));
  // Unlike the sound and distress sections, the middle slot carries meaning
  // here: by day you have the paint, by night only a light and a rhythm.
  t.ok('the middle slot is a real mode, not a placeholder',
    universe.every(c => BUOY_MODES.includes(c.aspect)) &&
    new Set(universe.map(c => c.aspect)).size === 2);
  t.ok('every mark is drilled in both day and night',
    MARKS.every(m => BUOY_MODES.every(mode =>
      universe.some(c => c.stateId === m.id && c.aspect === mode))));
  t.ok('region questions exist only for marks whose colours change by region',
    universe.filter(c => c.questionType === 'buoy-region')
      .every(c => isRegional(MARKS.find(m => m.id === c.stateId))),
    `${new Set(universe.filter(c => c.questionType === 'buoy-region').map(c => c.stateId)).size} marks`);
  t.ok('cardinals are never asked which region they belong to',
    !universe.some(c => c.questionType === 'buoy-region' && c.stateId.startsWith('card-')));

  t.section('questions are answerable');
  let malformed = 0, duplicated = 0;
  // Repeated because distractors are randomised: a duplicate option that
  // appears one draw in twenty is still a broken question.
  for (let pass = 0; pass < 40; pass++) {
    for (const card of universe) {
      const q = buoyageQuestionFor(card);
      if (!q || q.options.length !== 4 || !q.options.some(o => o.id === q.answerId)) malformed++;
      else if (new Set(q.options.map(o => o.text)).size !== 4) duplicated++;
    }
  }
  t.ok('no malformed questions across 40 passes', malformed === 0, `${universe.length * 40} drawn`);
  t.ok('no two options ever read the same', duplicated === 0,
    'several marks share an action, so distractors dedupe by text not by mark');

  t.section('distractors are confusable');
  t.ok('a cardinal draws other cardinals',
    buoyDistractors(MARKS.find(m => m.id === 'card-n'), 3).every(m => m.type === 'Cardinal'),
    buoyDistractors(MARKS.find(m => m.id === 'card-n'), 3).map(m => m.id).join(', '));
  t.ok('a mark is more like itself than like anything else',
    MARKS.every(m => MARKS.filter(o => o.id !== m.id)
      .every(o => buoySimilarity(m, o) <= buoySimilarity(m, m))));
  t.ok('three question types declared', BUOY_QUESTION_TYPES.length === 3);
}
