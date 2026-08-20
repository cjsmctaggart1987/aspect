/**
 * The rule text, as addressable paragraphs.
 *
 * THE TEXT IS NOT SUPPLIED. READ THIS BEFORE ADDING ANY.
 *
 * Every entry below carries `text: null` and `status: 'pending-source'`. That is
 * deliberate and it is not an oversight.
 *
 * This is the one section of the app that quotes rather than paraphrases, which
 * is exactly why it cannot be written from memory. Everywhere else an
 * approximation is a paraphrase and is honest about being one; here an
 * approximation is a misquotation of a regulation, presented as the regulation.
 * A reader would have no way to tell which paragraphs were right. So the
 * structure is built and the text is left for someone with 33 CFR Subchapter E
 * in front of them.
 *
 * TO SUPPLY IT
 *
 * Fill `text` and set `status: 'verified'` on each entry, from 33 CFR
 * Subchapter E (a US Government work, not subject to copyright). Do not
 * paraphrase into this field — every other file in the project is the place for
 * that. Do not bulk-fill from memory or from a model: fill from the source,
 * paragraph by paragraph, or leave it pending.
 *
 * WHAT IS BUILT
 *
 * The structure: ids, parts, paths, parent chains and headings. That is what
 * citations resolve against, so the link layer works today — tapping "Rule
 * 26(b)" in a lights answer opens the right paragraph, and shows that its text
 * is pending rather than showing something invented.
 *
 * ID SCHEME
 *
 * `rule-26-b-i` for Rule 26(b)(i); `annex-3-1` for Annex III paragraph 1. It
 * matches the granularity of the citations already used across the app, which
 * is the point: store coarser than the citations and every link lands in the
 * wrong place.
 *
 * BLANKS
 *
 * `blanks` is empty on every entry and stays that way until a human authors
 * them. See the note on CLOZE_POLICY below.
 */

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
 * Rule headings. Structure and headings are recalled far more reliably than
 * wording, and they are what the index and the search need to be usable before
 * any text exists. They are still marked unverified.
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
 * Subparagraph structure, declared only where the app cites it or where the
 * shape is needed to hold a citation's parent chain.
 *
 * Deliberately not invented wholesale. A subparagraph declared here that does
 * not exist in the regulation would be a fabricated citation target, which is
 * the same class of error as fabricated text.
 */
const SUBPARAGRAPHS = {
  2: ['a', 'b'],
  3: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'],
  12: ['a', 'b'],
  13: ['a', 'b', 'c', 'd'],
  14: ['a', 'b', 'c'],
  17: ['a', 'b', 'c', 'd'],
  18: ['a', 'b', 'c', 'd', 'e', 'f'],
  23: ['a', 'b', 'c', 'd'],
  24: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
  25: ['a', 'b', 'c', 'd', 'e'],
  26: ['a', 'b', 'c', 'd', 'e'],
  27: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  29: ['a', 'b'],
  30: ['a', 'b', 'c', 'd', 'e'],
  34: ['a', 'b', 'c', 'd', 'e', 'f'],
  35: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']
};

/** Third-level structure, again only where cited. */
const SUBSUB = {
  '3-g': ['i', 'ii', 'iii', 'iv', 'v', 'vi'],
  '12-a': ['i', 'ii', 'iii'],
  '17-a': ['i', 'ii'],
  '23-c': ['i', 'ii'],
  '24-a': ['i', 'ii', 'iii'],
  '26-b': ['i', 'ii', 'iii'],
  '26-c': ['i', 'ii'],
  '27-b': ['i', 'ii', 'iii', 'iv'],
  '29-a': ['i', 'ii'],
  '34-c': ['i', 'ii']
};

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
  for (const part of RULE_PARTS) {
    for (const n of part.rules) {
      const section = RULE_SECTIONS.find(s => s.part === part.id && s.rules.includes(n));
      out.push(paragraph({
        id: `rule-${n}`,
        rule: n,
        part: part.id,
        section: section ? section.name : null,
        path: [],
        citation: `Rule ${n}`,
        heading: RULE_HEADINGS[n] || null
      }));
      for (const a of SUBPARAGRAPHS[n] || []) {
        out.push(paragraph({
          id: `rule-${n}-${a}`,
          rule: n,
          part: part.id,
          section: section ? section.name : null,
          path: [a],
          citation: `Rule ${n}(${a})`,
          parentId: `rule-${n}`
        }));
        for (const r of SUBSUB[`${n}-${a}`] || []) {
          out.push(paragraph({
            id: `rule-${n}-${a}-${r}`,
            rule: n,
            part: part.id,
            section: section ? section.name : null,
            path: [a, r],
            citation: `Rule ${n}(${a})(${r})`,
            parentId: `rule-${n}-${a}`
          }));
        }
      }
    }
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
      for (const p of [1, 2, 3]) {
        out.push(paragraph({
          id: `annex-4-${p}`,
          rule: null,
          part: 'Annex',
          section: null,
          path: [String(p)],
          citation: `Annex IV(${p})`,
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

export const paragraphsPending = () => RULE_TEXT.filter(p => p.status === 'pending-source');
export const paragraphsWithText = () => RULE_TEXT.filter(p => p.text);

/**
 * Cloze policy, recorded here so it is not quietly reversed later.
 *
 * Blanks are authored by hand, never computed. An algorithm choosing which
 * words to remove has no idea which words carry the rule, so it produces cards
 * asking for "the" and "of" — busywork that feels like study. A human picks the
 * word the paragraph turns on: "more than 22.5 degrees abaft her beam", "shall",
 * "may", "not under command".
 *
 * There are no blanks yet, and there should be none until the text is in and
 * somebody has read it.
 */
export const CLOZE_POLICY = {
  authored: true,
  computed: false,
  note: 'Blanks are authored by hand against the real text. Do not generate them.'
};
