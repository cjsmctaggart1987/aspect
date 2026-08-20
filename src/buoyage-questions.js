/**
 * Drill questions about buoyage.
 *
 * The card key uses its middle slot for something real here, unlike the sound
 * and distress sections where it is a placeholder: `markId:day:buoy-identify`
 * and `markId:night:buoy-identify` are genuinely different questions. By day
 * you have the shape and the paint; by night you have a coloured light and a
 * rhythm and nothing else, and a candidate who can only do the first has not
 * learned buoyage.
 *
 * Distractors work the way the light-signature ones in engine.js do: pick the
 * marks that are actually confusable. Same category first, then the same body,
 * topmark or light colour. A cardinal offered against a cardinal teaches the
 * flash count; a cardinal offered against a special mark teaches nothing.
 */

import { MARKS } from '../data/buoyage.js';

export const BUOY_QUESTION_TYPES = ['buoy-identify', 'buoy-action', 'buoy-region'];
export const BUOY_MODES = ['day', 'night'];

const someOf = arr => arr[Math.floor(Math.random() * arr.length)];
const jumbled = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);

/** Marks whose colours depend on which region you are in. */
export const isRegional = mark => mark.region === 'A' || mark.region === 'B';

/** How confusable two marks are. Higher is more confusable. */
export function buoySimilarity(a, b) {
  let score = 0;
  if (a.type === b.type) score += 3;
  if (a.body === b.body) score += 1.5;
  if (a.topmark && b.topmark && a.topmark.form === b.topmark.form) score += 1.5;
  if (a.lightColor === b.lightColor) score += 1;
  // Marks painted the same way are the ones you actually mistake at a distance.
  if (a.bands.join() === b.bands.join()) score += 2;
  return score;
}

export function buoyDistractors(mark, n = 3, pool = MARKS) {
  return pool
    .filter(m => m.id !== mark.id)
    .map(m => ({ m, score: buoySimilarity(mark, m) + Math.random() * 0.8 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(x => x.m);
}

/**
 * The card space.
 *
 * buoy-region only exists for the marks whose colours actually change between
 * Region A and Region B. Asking which region a cardinal belongs to would be a
 * trick question: the answer is both, and the point of cardinals is that they
 * are the same everywhere.
 */
export const buoyUniverse = () => MARKS.flatMap(mark =>
  BUOY_MODES.flatMap(mode => BUOY_QUESTION_TYPES
    .filter(type => type !== 'buoy-region' || isRegional(mark))
    .map(type => ({ stateId: mark.id, aspect: mode, questionType: type }))));

export function buoyageQuestionFor({ stateId, aspect: mode, questionType }, pool = MARKS) {
  const mark = pool.find(m => m.id === stateId);
  if (!mark) return null;

  const night = mode === 'night';
  const seen = night
    ? 'You see this light at night.'
    : 'You see this mark by day.';

  if (questionType === 'buoy-action') {
    // Several marks share an action — both port hand marks are "leave it to
    // port" — so distractors have to be distinct by action text, not by mark.
    // Filtering only against the answer leaves two identical wrong options,
    // which makes the question unanswerable rather than merely easy.
    const used = new Set([mark.action]);
    const wrong = [];
    for (const candidate of buoyDistractors(mark, pool.length, pool)) {
      if (used.has(candidate.action)) continue;
      used.add(candidate.action);
      wrong.push(candidate);
      if (wrong.length === 3) break;
    }
    return {
      type: 'buoy-action',
      mark, mode, night,
      prompt: `${seen} Proceeding in the conventional direction of buoyage, what do you do?`,
      options: jumbled([mark, ...wrong]).map(m => ({ id: m.id, text: m.action })),
      answerId: mark.id,
      explain: `${mark.name}. ${mark.meaning} ${mark.memory}`
    };
  }

  if (questionType === 'buoy-region') {
    const other = mark.region === 'A' ? 'B' : 'A';
    const options = [
      { id: 'A', text: 'Region A' },
      { id: 'B', text: 'Region B' },
      { id: 'both', text: 'Either — this mark is the same in both regions' },
      { id: 'neither', text: 'Neither — it is not a lateral or preferred channel mark' }
    ];
    return {
      type: 'buoy-region',
      mark, mode, night,
      prompt: `${seen} Which buoyage region are you in?`,
      options: jumbled(options),
      answerId: mark.region,
      explain: `${mark.name}. ${mark.memory} In Region ${other} the lateral colours are the other way round.`
    };
  }

  const wrong = buoyDistractors(mark, 3, pool);
  return {
    type: 'buoy-identify',
    mark, mode, night,
    prompt: `${seen} What is it?`,
    options: jumbled([mark, ...wrong]).map(m => ({ id: m.id, text: m.name })),
    answerId: mark.id,
    explain: `${mark.rhythm ? `${mark.lightColor} · ${mark.rhythm}. ` : ''}${mark.meaning} ${mark.memory}`
  };
}

export const buoySpace = () => ({
  marks: MARKS.length,
  modes: BUOY_MODES.length,
  cards: buoyUniverse().length
});
