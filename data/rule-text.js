/**
 * The rule text, as addressable paragraphs.
 *
 * WHERE THE TEXT COMES FROM
 *
 * `data/rule-text-source.js`, which is generated — never hand-edited — by
 * `node tools/import-rule-text.cjs <file.txt> --write`. The structure comes
 * from the source too: the parser reads the markers and builds the paragraph
 * list, rather than fitting the source into a shape somebody remembered. That
 * matters, because the shape somebody remembered was wrong in two places, and
 * the import is what found them.
 *
 * This is the only section of the app that quotes rather than paraphrases.
 * Everywhere else an approximation is a paraphrase and says so; here it would
 * be a misquoted regulation presented as the regulation. So nothing in this
 * file is written from memory, and `status` records exactly how good the text
 * is rather than implying it is authoritative.
 *
 * STATUS VALUES
 *
 *   imported          text came from the source file, unedited, uncollated
 *   pending-source    no text: the source did not cover it
 *   pending-amendment no text: the source predates the amendment that added it
 *
 * There is no `verified` status in use. Nothing here has been read against an
 * official copy line by line, and pretending otherwise is the failure this
 * file exists to avoid. Read SOURCE_CAVEATS before trusting a paragraph.
 *
 * ID SCHEME
 *
 * `rule-26-b-i` for Rule 26(b)(i); `annex-4-2` for Annex IV paragraph 2. It
 * matches the granularity of the citations used across the app, which is the
 * point: store coarser than the citations and every link lands in the wrong
 * place.
 */

import { RULE_SOURCE, RULE_SOURCE_META } from './rule-text-source.js';

export const RULE_PARTS = [
  { id: 'A', name: 'Part A — General', rules: [1, 2, 3] },
  { id: 'B', name: 'Part B — Steering and sailing rules', rules: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] },
  { id: 'C', name: 'Part C — Lights and shapes', rules: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31] },
  { id: 'D', name: 'Part D — Sound and light signals', rules: [32, 33, 34, 35, 36, 37] },
  { id: 'E', name: 'Part E — Exemptions', rules: [38] }
];

export const RULE_SECTIONS = [
  { part: 'B', name: 'Section I — Conduct of vessels in any condition of visibility', rules: [4, 5, 6, 7, 8, 9, 10] },
  { part: 'B', name: 'Section II — Conduct of vessels in sight of one another', rules: [11, 12, 13, 14, 15, 16, 17, 18] },
  { part: 'B', name: 'Section III — Conduct of vessels in restricted visibility', rules: [19] }
];

/**
 * What is wrong with the text that is in here.
 *
 * Recorded in the data rather than in a commit message, because the app shows
 * it to the reader. A study aid that quietly serves a superseded regulation is
 * worse than one that admits it is quoting an old copy.
 */
export const SOURCE_CAVEATS = [
  {
    id: 'pre-2001',
    summary: 'The transcription predates the 2001 amendments',
    detail: 'It carries no wing-in-ground craft provisions. Rule 3(m) and Rule 18(f) are '
      + 'therefore absent, and both are cited elsewhere in the app. They are kept as '
      + 'addressable paragraphs with no text, so their links still work.'
  },
  {
    id: 'us-rendering',
    summary: 'It is a US rendering, not the IMO wording',
    detail: 'It reads "maneuver", "meters" and "draft" where the IMO text reads '
      + '"manoeuvre", "metres" and "draught". The wording is not otherwise known to '
      + 'differ, but it has not been collated against an official copy.'
  },
  {
    id: 'rule-38-g',
    summary: 'Rule 38(g) cites Annex II where it should cite Annex III',
    detail: 'Annex III is the one about sound signal appliances. This is an error in the '
      + 'transcription, left as it stands rather than silently corrected: editing a text '
      + 'that is presented as quoted is how a study aid stops being trustworthy.'
  },
  {
    id: 'typos',
    summary: 'It carries the odd transcription slip',
    detail: 'Rule 6(b)(ii) reads "constrains" where it should read "constraints". A scan '
      + 'for the usual scanning damage found nothing else, which is not the same as there '
      + 'being nothing else. Slips are left as they stand, for the reason above.'
  },
  {
    id: 'annexes',
    summary: 'The annexes are not in the source at all',
    detail: 'Annexes I to IV are addressable but have no text. Annex IV matters most, '
      + 'because the distress section cites it by paragraph.'
  }
];

/**
 * Rule headings, in the app's own spelling.
 *
 * A heading is a title, not regulatory text, so it follows the rest of the app
 * rather than the source's Americanised capitals. The importer reports any
 * heading that differs from the source by more than spelling.
 */
const RULE_HEADINGS = {
  1: 'Application', 2: 'Responsibility', 3: 'General definitions',
  4: 'Application', 5: 'Look-out', 6: 'Safe speed', 7: 'Risk of collision',
  8: 'Action to avoid collision', 9: 'Narrow channels', 10: 'Traffic separation schemes',
  11: 'Application', 12: 'Sailing vessels', 13: 'Overtaking', 14: 'Head-on situation',
  15: 'Crossing situation', 16: 'Action by give-way vessel', 17: 'Action by stand-on vessel',
  18: 'Responsibilities between vessels', 19: 'Conduct of vessels in restricted visibility',
  20: 'Application', 21: 'Definitions', 22: 'Visibility of lights',
  23: 'Power-driven vessels underway', 24: 'Towing and pushing', 25: 'Sailing vessels underway and vessels under oars',
  26: 'Fishing vessels', 27: 'Vessels not under command or restricted in their ability to manoeuvre',
  28: 'Vessels constrained by their draught', 29: 'Pilot vessels',
  30: 'Anchored vessels and vessels aground', 31: 'Seaplanes',
  32: 'Definitions', 33: 'Equipment for sound signals',
  34: 'Manoeuvring and warning signals', 35: 'Sound signals in restricted visibility',
  36: 'Signals to attract attention', 37: 'Distress signals',
  38: 'Exemptions'
};

export const ANNEXES = [
  { id: 'I', number: 1, name: 'Annex I — Positioning and technical details of lights and shapes' },
  { id: 'II', number: 2, name: 'Annex II — Additional signals for fishing vessels in close proximity' },
  { id: 'III', number: 3, name: 'Annex III — Technical details of sound signal appliances' },
  { id: 'IV', number: 4, name: 'Annex IV — Distress signals' }
];

/**
 * Paragraphs the app cites that the source does not contain.
 *
 * Both were added by the 2001 amendments. They are declared so their citations
 * still resolve — a link that goes nowhere is worse than a paragraph that
 * admits it has no text.
 *
 * Rule 23(d) and Rule 35(k) used to be declared here too, and have been
 * dropped. Nothing cited them; they were guesses at a structure that the
 * source settles.
 */
const AMENDMENT_GAPS = [
  { id: 'rule-3-m', citation: 'Rule 3(m)', rule: 3, path: ['m'], parentId: 'rule-3' },
  { id: 'rule-18-f', citation: 'Rule 18(f)', rule: 18, path: ['f'], parentId: 'rule-18' }
];

const partFor = n => (RULE_PARTS.find(p => p.rules.includes(n)) || {}).id || null;
const sectionFor = n => (RULE_SECTIONS.find(s => s.rules.includes(n)) || {}).name || null;

/** `rule-26-b-i` -> { rule: 26, path: ['b', 'i'] } */
function readId(id) {
  const bits = id.split('-');
  return { rule: Number(bits[1]), path: bits.slice(2) };
}

const paragraph = e => ({
  text: null,
  status: 'pending-source',
  blanks: [],
  heading: null,
  parentId: null,
  ...e
});

function build() {
  const out = [];

  for (const src of RULE_SOURCE) {
    const { rule, path } = readId(src.id);
    out.push(paragraph({
      id: src.id,
      rule,
      part: partFor(rule),
      section: sectionFor(rule),
      path,
      citation: src.citation,
      parentId: path.length ? ['rule', rule, ...path.slice(0, -1)].join('-') : null,
      heading: path.length ? null : (RULE_HEADINGS[rule] || null),
      text: src.text || null,
      status: src.text ? 'imported' : 'pending-source'
    }));
  }

  // Spliced in after the last subparagraph of their rule rather than appended,
  // so Rule 3(m) reads after Rule 3(l) instead of turning up at the end.
  for (const gap of AMENDMENT_GAPS) {
    const entry = paragraph({
      ...gap,
      part: partFor(gap.rule),
      section: sectionFor(gap.rule),
      status: 'pending-amendment'
    });
    let at = out.length;
    for (let i = 0; i < out.length; i++) {
      if (out[i].rule === gap.rule) at = i + 1;
    }
    out.splice(at, 0, entry);
  }

  for (const ax of ANNEXES) {
    out.push(paragraph({
      id: `annex-${ax.number}`,
      rule: null,
      part: 'Annex',
      section: null,
      path: [],
      citation: `Annex ${ax.id}`,
      heading: ax.name
    }));
    // Annex IV is cited by paragraph in the distress section.
    if (ax.number === 4) {
      for (const n of [1, 2, 3]) {
        out.push(paragraph({
          id: `annex-4-${n}`,
          rule: null,
          part: 'Annex',
          section: null,
          path: [String(n)],
          citation: `Annex IV(${n})`,
          parentId: 'annex-4'
        }));
      }
    }
  }

  return out;
}

export const RULE_TEXT = build();

const BY_ID = new Map(RULE_TEXT.map(p => [p.id, p]));
export const paragraphById = id => BY_ID.get(id) || null;

/** The paragraphs directly beneath one, in order. */
export const childrenOf = id => RULE_TEXT.filter(p => p.parentId === id);

/**
 * Whether a paragraph introduces an enumerated list, and what is in it.
 *
 * Derived from the structure rather than stored: a paragraph whose own text
 * ends in a colon or semicolon and which has three or more subparagraphs is
 * introducing a list, and those subparagraphs are its items. Rule 27(a) — "A
 * vessel not under command shall exhibit:" — is one. Rule 8(f), which has no
 * text of its own and simply runs (f)(i), (f)(ii), is not.
 *
 * The colon test is what keeps the completion drill honest. Without it the
 * drill would ask what completes lists that were never lists.
 */
const LIST_ITEM_LIMIT = 300;

export function listUnder(id) {
  const parent = paragraphById(id);
  if (!parent || !parent.text || !/[:;]\s*$/.test(parent.text)) return null;
  const items = childrenOf(id);
  if (items.length < 3 || !items.every(i => i.text && i.text.length <= LIST_ITEM_LIMIT)) return null;
  return items.map(i => i.text);
}

export const listParagraphs = () => RULE_TEXT.filter(p => listUnder(p.id));

/**
 * Turn a citation as written anywhere in the app into a paragraph id.
 *
 * "Rule 26(b)(i)" -> rule-26-b-i. "Annex IV(2)" -> annex-4-2. Returns null
 * rather than guessing, so a citation that does not resolve is visible as a
 * broken link instead of silently landing on the parent rule.
 */
export function citationToId(citation) {
  if (!citation) return null;
  const rule = String(citation).match(/^Rule\s+(\d+)((?:\([a-z0-9]+\))*)\s*$/i);
  if (rule) {
    const parts = (rule[2] || '').match(/\(([a-z0-9]+)\)/gi) || [];
    const chain = parts.map(p => p.replace(/[()]/g, '').toLowerCase());
    return ['rule', rule[1], ...chain].join('-');
  }
  const annex = String(citation).match(/^Annex\s+(I{1,3}V?|IV)\s*(?:\(?\s*(\d+)\s*\)?)?\s*$/i);
  if (annex) {
    const n = { i: 1, ii: 2, iii: 3, iv: 4 }[annex[1].toLowerCase()];
    if (!n) return null;
    return annex[2] ? `annex-${n}-${annex[2]}` : `annex-${n}`;
  }
  return null;
}

/** Every citation string that appears in a piece of text, in order. */
export function findCitations(text) {
  if (!text) return [];
  const out = [];
  const re = /\bRule\s+\d+(?:\([a-z0-9]+\))*|\bAnnex\s+(?:I{1,3}V?|IV)(?:\s*\(\s*\d+\s*\))?/gi;
  for (const m of String(text).matchAll(re)) {
    const citation = m[0].replace(/\s+/g, ' ').trim();
    out.push({ citation, id: citationToId(citation), index: m.index });
  }
  return out;
}

/**
 * Plain substring and rule-number search.
 *
 * No index, no fuzzy matching, no library. There are a few hundred paragraphs
 * and a linear scan over them is imperceptible; anything cleverer would be
 * machinery in search of a problem.
 */
export function searchRuleText(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  // A bare number or a citation jumps straight to the paragraph.
  const asCitation = citationToId(/^\d/.test(q) ? `Rule ${q}` : q);
  const direct = asCitation ? paragraphById(asCitation) : null;
  const hits = RULE_TEXT.filter(p =>
    (p.text && p.text.toLowerCase().includes(q)) ||
    (p.heading && p.heading.toLowerCase().includes(q)) ||
    p.citation.toLowerCase().includes(q));
  return direct ? [direct, ...hits.filter(p => p.id !== direct.id)] : hits;
}

export const paragraphsPending = () => RULE_TEXT.filter(p => !p.text);
export const paragraphsWithText = () => RULE_TEXT.filter(p => p.text);
export const SOURCE_META = RULE_SOURCE_META;

/**
 * Cloze policy, recorded here so it is not quietly reversed later.
 *
 * Blanks are authored by hand, never computed. An algorithm choosing which
 * words to remove has no idea which words carry the rule, so it produces cards
 * asking for "the" and "of" — busywork that feels like study. A human picks the
 * word the paragraph turns on: "more than 22.5 degrees abaft her beam", "shall",
 * "may", "not under command".
 *
 * There are still no blanks. Now that there is text to author them against,
 * that is a job for somebody who has read it, not for a generator.
 */
export const CLOZE_POLICY = {
  authored: true,
  computed: false,
  note: 'Blanks are authored by hand against the real text. Do not generate them.'
};
