/**
 * Spaced repetition over the drill, scheduled by FSRS.
 *
 * A card is one question about one picture: a vessel state, seen from one
 * aspect, asked one way. The key is `stateId:aspect:questionType`, so the
 * 30 states across 8 aspects and 2 question types give 480 cards. They are
 * created lazily, on first exposure, because a learner who never sees a
 * picture should not be carrying a review obligation for it.
 *
 * Everything lives in one versioned localStorage key. No account, no backend,
 * no cookie. If the schema changes, bump SCHEMA_VERSION and the old record is
 * discarded rather than migrated by guesswork.
 *
 * This module owns scheduling only. It knows nothing about how a question is
 * built or drawn.
 */

import { createEmptyCard, fsrs, generatorParameters, Rating } from '../vendor/ts-fsrs.js';

const STORE_KEY = 'aspect.review.v1';
const SCHEMA_VERSION = 1;

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

/** The three grades the drill can award. Hard is deliberately not offered. */
export const GRADE = { AGAIN: Rating.Again, GOOD: Rating.Good, EASY: Rating.Easy };

export const cardKey = (stateId, aspect, questionType) => `${stateId}:${aspect}:${questionType}`;

// --- storage --------------------------------------------------------------

const emptyStore = () => ({ version: SCHEMA_VERSION, cards: {}, streak: { count: 0, lastDay: null } });

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SCHEMA_VERSION) return emptyStore();
    return { ...emptyStore(), ...parsed };
  } catch {
    return emptyStore();               // private mode, corrupt JSON, disabled storage
  }
}

function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Out of quota or storage disabled. The drill still works for this
    // session; it just will not be remembered.
  }
}

let store = load();

/** Dates survive JSON as strings, so they have to be put back. */
const revive = c => ({ ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined });
const freeze = c => ({ ...c, due: c.due.toISOString(), last_review: c.last_review ? c.last_review.toISOString() : null });

// --- days and streak ------------------------------------------------------

const dayStamp = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const yesterdayOf = now => {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return dayStamp(d);
};

function touchStreak(now) {
  const today = dayStamp(now);
  if (store.streak.lastDay === today) return;
  store.streak.count = store.streak.lastDay === yesterdayOf(now) ? store.streak.count + 1 : 1;
  store.streak.lastDay = today;
}

// --- reviewing ------------------------------------------------------------

export const isSeen = key => Object.prototype.hasOwnProperty.call(store.cards, key);

const cardFor = (key, now) => (isSeen(key) ? revive(store.cards[key]) : createEmptyCard(now));

// Snapshot of the card as it stood before the last grade, so an "easy" click
// can replace that grade instead of stacking a second review on top of it.
let lastGrade = null;

export function grade(key, rating, now = new Date()) {
  lastGrade = { key, before: isSeen(key) ? store.cards[key] : null };
  const { card } = scheduler.next(cardFor(key, now), now, rating);
  store.cards[key] = freeze(card);
  touchStreak(now);
  persist();
  return card;
}

/**
 * Replace the grade just given. Used by the "that was easy" control: the
 * answer was already recorded as Good, and this re-runs it as Easy from the
 * card's previous state rather than reviewing it twice.
 */
export function regradeLast(rating, now = new Date()) {
  if (!lastGrade) return null;
  const { key, before } = lastGrade;
  if (before) store.cards[key] = before;
  else delete store.cards[key];
  const card = grade(key, rating, now);
  lastGrade = null;                    // one correction per answer
  return card;
}

export const canRegrade = () => lastGrade !== null;

// --- selection ------------------------------------------------------------

/**
 * Pick what to ask next.
 *
 * Most overdue first, because the card you are closest to forgetting is worth
 * more than a random one. Nothing due means show something new. If the whole
 * deck has been seen and none of it is due, fall back to whatever comes due
 * soonest so the drill always has a question rather than refusing to run.
 *
 * `universe` is the full card space as { stateId, aspect, questionType }.
 */
export function selectCard(universe, now = new Date()) {
  const withKeys = universe.map(u => ({ ...u, key: cardKey(u.stateId, u.aspect, u.questionType) }));

  const due = withKeys
    .filter(u => isSeen(u.key))
    .map(u => ({ u, due: new Date(store.cards[u.key].due) }))
    .filter(x => x.due <= now)
    .sort((a, b) => a.due - b.due);
  if (due.length) return { ...due[0].u, reason: 'due' };

  const unseen = withKeys.filter(u => !isSeen(u.key));
  if (unseen.length) return { ...unseen[Math.floor(Math.random() * unseen.length)], reason: 'new' };

  const soonest = withKeys
    .map(u => ({ u, due: new Date(store.cards[u.key].due) }))
    .sort((a, b) => a.due - b.due)[0];
  return { ...soonest.u, reason: 'ahead' };
}

// --- reporting ------------------------------------------------------------

export function stats(now = new Date()) {
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const cards = Object.values(store.cards);
  const today = dayStamp(now);
  const streakIsLive = store.streak.lastDay === today || store.streak.lastDay === yesterdayOf(now);

  return {
    seen: cards.length,
    dueToday: cards.filter(c => new Date(c.due) <= endOfToday).length,
    streak: streakIsLive ? store.streak.count : 0
  };
}

export function reset() {
  store = emptyStore();
  lastGrade = null;
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // nothing to remove
  }
}
