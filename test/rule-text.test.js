/**
 * The rule text: structure, citations and the link layer.
 *
 * The text itself is not here to check — every paragraph ships pending a
 * source, deliberately. What can be checked is everything the link layer rests
 * on, and that is worth checking hard, because a citation that resolves to
 * nothing is a dead link the reader taps in the middle of an answer.
 *
 * The citation sweep walks the real data modules rather than a list copied out
 * of them. Add a rule reference anywhere in the app and this suite starts
 * checking it without anyone remembering to update a fixture.
 */
import { RULE_TEXT, RULE_PARTS, RULE_SECTIONS, ANNEXES, paragraphById, citationToId,
  findCitations, searchRuleText, paragraphsPending, CLOZE_POLICY } from '../data/rule-text.js';
import { ruleTextUniverse, ruleTextQuestionFor, resolveAnswerId, whichRuleSources,
  completableParagraphs, clozeParagraphs, RULE_TEXT_QUESTION_TYPES, ruleTextSpace }
  from '../src/rule-text-questions.js';
import { DEFINITIONS } from '../data/definitions.js';
import { SOUND_SIGNALS } from '../data/sound-signals.js';
import { DISTRESS_SIGNALS } from '../data/distress-signals.js';
import { MARKS } from '../data/buoyage.js';
import { FLAGS } from '../data/flags.js';
import { VESSEL_STATES } from '../data/vessel-states.js';

/** Every string reachable from a value, however deeply nested. */
function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(v => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(v => strings(v, out));
  return out;
}

const CORPUS = [
  ['definitions', DEFINITIONS], ['sound signals', SOUND_SIGNALS],
  ['distress signals', DISTRESS_SIGNALS], ['buoyage', MARKS], ['flags', FLAGS],
  ['vessel states', VESSEL_STATES]
];

export default function run(t) {
  t.section('structure');
  t.ok('every paragraph has an id, a citation, a part and a path',
    RULE_TEXT.every(p => p.id && p.citation && p.part && Array.isArray(p.path)));
  t.ok('ids are unique', new Set(RULE_TEXT.map(p => p.id)).size === RULE_TEXT.length,
    `${RULE_TEXT.length} paragraphs`);
  t.ok('citations are unique', new Set(RULE_TEXT.map(p => p.citation)).size === RULE_TEXT.length);
  t.ok('Parts A to E and all four annexes are present',
    RULE_PARTS.length === 5 && ANNEXES.length === 4 &&
    RULE_PARTS.every(part => RULE_TEXT.some(p => p.part === part.id)) &&
    RULE_TEXT.some(p => p.part === 'Annex'));
  t.ok('Rules 1 to 38 each have a top-level paragraph',
    Array.from({ length: 38 }, (_, i) => i + 1).every(n => paragraphById(`rule-${n}`)),
    `${RULE_TEXT.filter(p => p.path.length === 0 && p.rule).length} rules`);
  t.ok('Part B carries its three sections',
    RULE_SECTIONS.length === 3 &&
    RULE_SECTIONS.every(s => RULE_TEXT.some(p => p.section === s.name)));

  t.section('parent chains');
  const orphans = RULE_TEXT.filter(p => p.parentId && !paragraphById(p.parentId));
  t.ok('no paragraph points at a parent that does not exist', orphans.length === 0,
    orphans.slice(0, 3).map(p => `${p.id} -> ${p.parentId}`).join(', ') || 'all resolve');
  const parentless = RULE_TEXT.filter(p => p.path.length > 0 && !p.parentId);
  t.ok('every subparagraph has a parent', parentless.length === 0,
    parentless.slice(0, 3).map(p => p.id).join(', '));
  const depthWrong = RULE_TEXT.filter(p =>
    p.parentId && paragraphById(p.parentId).path.length !== p.path.length - 1);
  t.ok('each level sits exactly one below its parent', depthWrong.length === 0,
    depthWrong.slice(0, 3).map(p => p.id).join(', '));
  t.ok('a subparagraph shares its rule and part with its parent',
    RULE_TEXT.filter(p => p.parentId).every(p => {
      const up = paragraphById(p.parentId);
      return up.rule === p.rule && up.part === p.part;
    }));

  t.section('citations resolve, both ways');
  t.ok('a citation round-trips through its id',
    RULE_TEXT.every(p => citationToId(p.citation) === p.id),
    RULE_TEXT.filter(p => citationToId(p.citation) !== p.id).slice(0, 3)
      .map(p => p.citation).join(', ') || `${RULE_TEXT.length} citations`);
  t.ok('citationToId returns null rather than guessing at nonsense',
    citationToId('Rule fourteen') === null && citationToId('') === null &&
    citationToId('Annex IX') === null && citationToId('see the rules') === null);
  t.ok('a citation to a paragraph that does not exist resolves to nothing',
    paragraphById(citationToId('Rule 13(z)')) === null &&
    paragraphById(citationToId('Rule 99')) === null);

  t.section('every rule reference in the app lands somewhere');
  // This is the check the link layer exists for. Each miss is a citation a
  // reader can tap that goes nowhere.
  let total = 0;
  const dead = [];
  for (const [name, data] of CORPUS) {
    for (const s of strings(data)) {
      for (const c of findCitations(s)) {
        total++;
        if (!c.id || !paragraphById(c.id)) dead.push(`${name}: ${c.citation}`);
      }
    }
  }
  t.ok('every citation across the app resolves to a real paragraph', dead.length === 0,
    dead.slice(0, 5).join(' | ') || `${total} references swept`);
  t.ok('the sweep actually found citations to check', total > 50, `${total} found`);

  t.section('finding citations inside prose');
  const sample = 'Under Rule 18(a)(iv) she keeps clear, but Rule 13 overrides it. See Annex IV(2).';
  const found = findCitations(sample);
  t.ok('all three are found, in order, with their offsets',
    found.length === 3 && found[0].citation === 'Rule 18(a)(iv)' &&
    found[1].citation === 'Rule 13' && found[2].citation === 'Annex IV(2)' &&
    found.every(f => sample.slice(f.index, f.index + f.citation.length) === f.citation),
    found.map(f => f.citation).join(', '));
  t.ok('prose with no citation yields none',
    findCitations('She shows two masthead lights.').length === 0 &&
    findCitations(null).length === 0);
  t.ok('a citation the structure does not hold reports a null target, not a wrong one',
    findCitations('Rule 6(q) says so')[0].id === 'rule-6-q' &&
    paragraphById('rule-6-q') === null);

  t.section('search');
  t.ok('a bare rule number jumps to that rule first',
    searchRuleText('13')[0].id === 'rule-13' && searchRuleText('18')[0].id === 'rule-18');
  t.ok('a citation jumps to the subparagraph',
    searchRuleText('Rule 34(c)(i)')[0].id === 'rule-34-c-i');
  t.ok('headings are searchable before any text exists',
    searchRuleText('overtaking').some(p => p.id === 'rule-13') &&
    searchRuleText('look-out').some(p => p.id === 'rule-5'));
  t.ok('an empty query returns nothing rather than everything',
    searchRuleText('').length === 0 && searchRuleText('   ').length === 0);
  t.ok('a query that matches nothing returns nothing', searchRuleText('zzzzq').length === 0);

  t.section('the text is pending, and says so');
  // Not a placeholder for later: it is the check that stops anyone bulk-filling
  // these fields from memory, which is the failure this section was built to
  // avoid.
  t.ok('every paragraph without text is marked pending-source, not left blank',
    RULE_TEXT.filter(p => !p.text).every(p => p.status === 'pending-source'),
    `${paragraphsPending().length} of ${RULE_TEXT.length} pending`);
  t.ok('any paragraph that does carry text is marked verified',
    RULE_TEXT.filter(p => p.text).every(p => p.status === 'verified'),
    `${RULE_TEXT.filter(p => p.text).length} with text`);
  t.ok('blanks are authored, never computed',
    CLOZE_POLICY.authored === true && CLOZE_POLICY.computed === false);
  t.ok('no blank exists on a paragraph with no text',
    RULE_TEXT.every(p => (p.blanks || []).length === 0 || !!p.text));

  t.section('questions');
  const universe = ruleTextUniverse();
  t.ok('every card key is three-part and unique',
    universe.every(c => c.stateId && c.aspect && c.questionType) &&
    new Set(universe.map(c => `${c.stateId}:${c.aspect}:${c.questionType}`)).size
      === universe.length,
    `${universe.length} cards`);
  t.ok('every card names a declared question type',
    universe.every(c => RULE_TEXT_QUESTION_TYPES.includes(c.questionType)));
  t.ok('the text-dependent types produce no cards while the text is pending',
    completableParagraphs().length === 0 && clozeParagraphs().length === 0 &&
    universe.every(c => c.questionType === 'text-which-rule'),
    'text-complete-list and text-cloze wait for a source');

  t.section('which-rule questions');
  const sources = whichRuleSources();
  t.ok('every source statement points at a paragraph that exists',
    sources.every(s => paragraphById(s.paragraphId)), `${sources.length} statements`);
  t.ok('no citation appears twice, so no question has two right answers',
    new Set(sources.map(s => s.citation)).size === sources.length);

  let malformed = 0, leaked = 0, dupes = 0;
  for (const card of universe) {
    for (let i = 0; i < 15; i++) {
      const q = resolveAnswerId(ruleTextQuestionFor(card));
      if (!q || !q.prompt || q.options.length !== 4 ||
          !q.options.some(o => o.id === q.answerId)) { malformed++; continue; }
      if (new Set(q.options.map(o => o.text)).size !== q.options.length) dupes++;
      // The stem must not contain the citation the reader is asked to name.
      const right = q.options.find(o => o.id === q.answerId).text;
      if (q.prompt.includes(right.split(' — ')[0])) leaked++;
    }
  }
  t.ok('every draw is well formed, with four options and a findable answer', malformed === 0,
    `${universe.length * 15} draws`);
  t.ok('no two options read the same', dupes === 0);
  t.ok('no prompt gives away the citation it is asking for', leaked === 0);

  t.section('distractors are near misses, not obvious wrongs');
  const q = resolveAnswerId(ruleTextQuestionFor(
    universe.find(c => c.stateId.startsWith('snd-')) || universe[0]));
  const right = paragraphById(q.answerId);
  const near = q.options.filter(o => o.id !== q.answerId)
    .every(o => { const p = paragraphById(o.id); return p && p.part === right.part; });
  t.ok('wrong options come from the same part where the part has enough paragraphs',
    near || RULE_TEXT.filter(p => p.part === right.part).length < 4,
    q.options.map(o => o.text.split(' — ')[0]).join(' / '));

  t.section('coverage, stated honestly');
  const space = ruleTextSpace();
  t.ok('the space report matches what the universe actually holds',
    space.cards === universe.length && space.paragraphs === RULE_TEXT.length);
  const cited = new Set();
  for (const [, data] of CORPUS) {
    for (const s of strings(data)) for (const c of findCitations(s)) if (c.id) cited.add(c.id);
  }
  t.ok('the paragraphs the app cites are a real subset of the structure',
    cited.size > 0 && [...cited].every(id => paragraphById(id)),
    `${cited.size} of ${RULE_TEXT.length} paragraphs are cited somewhere`);
}
