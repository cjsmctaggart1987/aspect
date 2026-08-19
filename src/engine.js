/**
 * Engine: arc visibility, aspect projection, question generation.
 *
 * Aspect convention used throughout:
 *   aspect = the bearing of the observer FROM the target vessel's bow,
 *   measured clockwise (toward the target's starboard side), 0 to 360.
 *
 *   aspect 0   observer dead ahead of her, she is coming at you
 *   aspect 90  observer on her starboard beam
 *   aspect 180 observer dead astern of her, she is going away
 *   aspect 270 observer on her port beam
 */
import { ARC } from '../data/vessel-states.js';
export const norm = d => ((d % 360) + 360) % 360;

/** Signed bearing in the range -180 to +180. */
export const signed = d => {
  const n = norm(d);
  return n > 180 ? n - 360 : n;
};

/** Is a light with this arc visible to an observer at this aspect? */
export function lightVisible(light, aspect) {
  const a = signed(aspect);
  switch (light.arc) {
    case ARC.ALLROUND:
      return true;
    case ARC.MASTHEAD:
    case ARC.SPECIAL_FLASH:
      return Math.abs(a) <= 112.5;
    case ARC.STBD:
      return a >= 0 && a <= 112.5;
    case ARC.PORT:
      return a <= 0 && a >= -112.5;
    case ARC.STERN:
    case ARC.TOWING:
      return Math.abs(a) > 112.5;
    default:
      return true;
  }
}

/**
 * Project a point in ship coordinates onto the observer's screen.
 *
 * Derivation: with x forward and y to starboard, the observer's screen-right
 * unit vector in plan is (sin a, -cos a). So screen_x = x sin a - y cos a.
 * Check: at a = 0 (head-on) her starboard appears on your left, which is what
 * the negative cosine term gives you.
 */
export function project(point, aspect) {
  const r = (aspect * Math.PI) / 180;
  return {
    sx: point.x * Math.sin(r) - point.y * Math.cos(r),
    sy: point.z
  };
}

/** Lights actually seen, sorted for stable rendering (far to near, low to high). */
export function visibleLights(state, aspect, makingWay = true) {
  return state.lights
    .filter(l => (makingWay || !l.makingWayOnly))
    .filter(l => lightVisible(l, aspect))
    .map(l => ({ ...l, ...project(l, aspect) }))
    .sort((a, b) => a.sy - b.sy);
}

export function visibleShapes(state, aspect) {
  return (state.dayShapes || []).map(s => ({ ...s, ...project(s, aspect) }));
}

/** A colour signature used to find plausible distractors. */
export function signature(state) {
  const counts = {};
  state.lights
    .filter(l => l.arc === ARC.ALLROUND)
    .forEach(l => { counts[l.color] = (counts[l.color] || 0) + 1; });
  return counts;
}

export function similarity(a, b) {
  const sa = signature(a), sb = signature(b);
  const keys = new Set([...Object.keys(sa), ...Object.keys(sb)]);
  let score = 0;
  keys.forEach(k => { score -= Math.abs((sa[k] || 0) - (sb[k] || 0)); });
  if (a.group === b.group) score += 2;
  if (a.length === b.length) score += 0.5;
  return score;
}

export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/**
 * Distractors are chosen by light-signature similarity rather than at random.
 * A question whose wrong answers are obviously wrong teaches nothing.
 */
export function distractors(state, pool, n = 3) {
  return pool
    .filter(s => s.id !== state.id)
    .map(s => ({ s, score: similarity(state, s) + Math.random() * 0.4 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(d => d.s);
}

export const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);

/**
 * Question types:
 *   identify  what vessel is this
 *   aspect    which way is she heading relative to you
 *   action    what do you do about it  (dutyHint only for now, see README)
 */
export function makeQuestion(pool, aspectBands, type = 'identify') {
  const state = pick(pool);
  const band = pick(aspectBands);
  const makingWay = state.lights.some(l => l.makingWayOnly) ? Math.random() > 0.35 : true;

  if (type === 'aspect') {
    const wrong = shuffle(aspectBands.filter(b => b.deg !== band.deg)).slice(0, 3);
    return {
      type,
      state, aspect: band.deg, makingWay,
      prompt: 'From what aspect are you viewing her?',
      options: shuffle([band, ...wrong]).map(b => ({ id: String(b.deg), text: b.label })),
      answerId: String(band.deg),
      explain: `${state.name}. ${state.summary}`
    };
  }

  const wrong = distractors(state, pool, 3);
  return {
    type: 'identify',
    state, aspect: band.deg, makingWay,
    prompt: 'What are you looking at?',
    options: shuffle([state, ...wrong]).map(s => ({ id: s.id, text: s.name })),
    answerId: state.id,
    explain: `${state.rule}. ${state.summary} ${state.dutyHint}`
  };
}

/** How large is the question space from the current data? */
export function questionSpace(pool, aspectBands) {
  const pictures = pool.length * aspectBands.length;
  return { states: pool.length, aspects: aspectBands.length, pictures, questions: pictures * 2 };
}
