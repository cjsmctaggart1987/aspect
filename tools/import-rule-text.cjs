#!/usr/bin/env node
/**
 * Imports the rule text from a plain-text transcription into data/rule-text.js.
 *
 * WHY THIS IS A SCRIPT AND NOT A PASTE
 *
 * The structure has to come from the source, not from what anybody remembers
 * the structure to be. Run against a file, this parser reports what it found
 * before it writes anything: which rules, which subparagraphs, and every place
 * the source disagrees with what the app already declares. A disagreement is a
 * finding, not something to smooth over.
 *
 *   node tools/import-rule-text.cjs <file.txt> [--write]
 *
 * Without --write it only reports.
 *
 * WHAT IT COPES WITH
 *
 * Text scraped out of a PDF: form feeds mid-line at page breaks, hard wrapping
 * at about 115 columns, headings centred with runs of spaces, and the odd
 * missing space after a marker.
 *
 * THE LETTER-OR-ROMAN PROBLEM
 *
 * "(i)" is both the ninth letter and the first roman numeral, and the rules use
 * both: Rule 35 runs to (k), while Rule 27(a) has (i), (ii), (iii) beneath it.
 * The parser resolves it by sequence rather than by shape — a marker that is
 * the next letter due continues the letter list, anything else that reads as a
 * roman numeral opens or continues a sub-list. That also throws out the false
 * markers that hard wrapping creates, such as Rule 35(j) wrapping onto a line
 * that begins "(b) or (g) of this Rule".
 */

const fs = require('fs');
const path = require('path');
const NL = String.fromCharCode(10);   // heredocs mangle escapes on this machine

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const ROMANS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];

/** Page breaks, tabs and non-breaking spaces gone; wrapping left alone. */
function normalise(raw) {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/\f/g, '\n')            // a form feed can sit mid-line at a page break
    .replace(/ /g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\t/g, ' ');
}

const isRuleHeading = line => /^\s*Rule\s+(\d+)\s*$/.exec(line.trim());
const isPartHeading = line => /^\s*Part\s+([A-E])\s*[-–—]\s*(.+?)\s*$/.exec(line.trim());
const isAnnexHeading = line => /^\s*Annex\s+(I{1,3}V?|IV)\b\s*(.*)$/i.exec(line.trim());
const isSectionHeading = line =>
  /^\s*Section\s+(I{1,3})\s*[-–—]?\s*(.*)$/.exec(line.trim());

/** A marker at the start of a line: "(a)", "(iii)", tolerating a missing space. */
const marker = line => {
  const m = /^\(([a-z]{1,5})\)\.?\s*(.*)$/.exec(line);
  return m ? { token: m[1], rest: m[2] } : null;
};

function parse(text) {
  const lines = normalise(text).split('\n');
  const rules = [];
  let rule = null;          // { number, heading, paras: [] }
  let expectLetter = 0;     // index into LETTERS of the next letter due
  let letterPara = null;    // the (a)-level paragraph currently open
  let romanPara = null;     // the (i)-level paragraph currently open
  let current = null;       // where loose text is appended
  let pendingHeading = false;
  const notes = [];

  const closeRule = () => { if (rule) rules.push(rule); };

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    const trimmed = line.trim();

    const ruleHead = isRuleHeading(line);
    if (ruleHead) {
      closeRule();
      rule = { number: Number(ruleHead[1]), heading: null, paras: [], line: n + 1 };
      expectLetter = 0;
      letterPara = romanPara = current = null;
      pendingHeading = true;
      continue;
    }
    if (!rule) continue;                       // front matter before Rule 1

    if (!trimmed) { continue; }

    // The line after a rule number, centred, is its heading.
    if (pendingHeading) {
      pendingHeading = false;
      if (!marker(trimmed)) { rule.heading = trimmed; continue; }
    }

    if (isPartHeading(line) || isSectionHeading(line) || isAnnexHeading(line)) {
      // Structural headings between rules; the part is already known from the
      // app's own table, so they are only used to confirm the reading order.
      current = null;
      continue;
    }

    const mk = marker(trimmed);
    if (mk) {
      const token = mk.token;
      const nextLetter = LETTERS[expectLetter];
      if (token === nextLetter) {
        expectLetter++;
        letterPara = { path: [token], text: mk.rest ? [mk.rest] : [], line: n + 1 };
        rule.paras.push(letterPara);
        romanPara = null;
        current = letterPara;
        continue;
      }
      if (ROMANS.includes(token) && letterPara) {
        const seen = rule.paras.filter(p => p.path.length === 2 &&
          p.path[0] === letterPara.path[0]).map(p => p.path[1]);
        const due = ROMANS[seen.length];
        if (token === due) {
          romanPara = { path: [letterPara.path[0], token], text: mk.rest ? [mk.rest] : [], line: n + 1 };
          rule.paras.push(romanPara);
          current = romanPara;
          continue;
        }
      }
      // Out of sequence: hard wrapping has put a cross-reference such as
      // "(b) or (g) of this Rule" at the start of a line. It is body text.
      notes.push(`Rule ${rule.number}: "(${token})" at line ${n + 1} read as wrapped text, not a marker`);
    }

    if (current) current.text.push(trimmed);
    else {
      // Text before any (a): the rule's own opening words, as in Rule 3.
      rule.lead = rule.lead || [];
      rule.lead.push(trimmed);
    }
  }
  closeRule();
  return { rules, notes };
}

const join = parts => parts.join(' ').replace(/\s+/g, ' ').trim();

function toParagraphs(parsed) {
  const out = [];
  for (const rule of parsed.rules) {
    out.push({
      id: `rule-${rule.number}`,
      citation: `Rule ${rule.number}`,
      heading: rule.heading,
      text: rule.lead ? join(rule.lead) : null
    });
    for (const para of rule.paras) {
      out.push({
        id: `rule-${rule.number}-${para.path.join('-')}`,
        citation: `Rule ${rule.number}(${para.path.join(')(')})`,
        heading: null,
        text: join(para.text) || null
      });
    }
  }
  return out;
}


/**
 * Emits data/rule-text-source.js.
 *
 * Generated rather than hand-edited, so re-importing from a better source is
 * one command and not an afternoon. data/rule-text.js reads this and adds the
 * parts, sections, parent chains and the annexes, which the source does not
 * carry.
 */
function writeSource(file, paras) {
  const stamp = new Date().toISOString().slice(0, 10);
  const body = paras.map(p => '  ' + JSON.stringify({
    id: p.id, citation: p.citation, heading: p.heading || undefined, text: p.text || undefined
  })).join(',' + NL);
  const out = [
    '/**',
    ' * GENERATED FILE — do not edit by hand.',
    ' *',
    ' * Regenerate with:',
    ' *   node tools/import-rule-text.cjs <file.txt> --write',
    ' *',
    ' * The importer reports what it found and what it disagrees with before it',
    ' * writes. Read that report; it is the only check on the source.',
    ' */',
    '',
    'export const RULE_SOURCE_META = ' + JSON.stringify({
      file: path.basename(file),
      imported: stamp,
      rules: 38,
      paragraphs: paras.length,
      withText: paras.filter(p => p.text).length
    }, null, 2) + ';',
    '',
    'export const RULE_SOURCE = [',
    body,
    '];',
    ''
  ].join(NL);
  const target = path.join(__dirname, '..', 'data', 'rule-text-source.js');
  fs.writeFileSync(target, out);
  console.log(NL + 'wrote ' + path.relative(process.cwd(), target));
}

// --- report -----------------------------------------------------------------

async function main() {
  const file = process.argv[2];
  const write = process.argv.includes('--write');
  if (!file) {
    console.error('usage: node tools/import-rule-text.cjs <file.txt> [--write]');
    process.exit(2);
  }
  const parsed = parse(fs.readFileSync(file, 'utf8'));
  const paras = toParagraphs(parsed);

  const { RULE_TEXT } = await import('../data/rule-text.js');
  const declared = new Set(RULE_TEXT.map(p => p.id));
  const found = new Set(paras.map(p => p.id));

  const rules = parsed.rules.map(r => r.number);
  console.log(`rules found: ${rules.length}  (${rules[0]} to ${rules[rules.length - 1]})`);
  const gaps = [];
  for (let n = 1; n <= 38; n++) if (!rules.includes(n)) gaps.push(n);
  console.log(`rules missing: ${gaps.length ? gaps.join(', ') : 'none'}`);
  console.log(`paragraphs parsed: ${paras.length}`);
  console.log(`with text: ${paras.filter(p => p.text).length}`);
  console.log(`headings read: ${parsed.rules.filter(r => r.heading).length}`);

  const newIds = paras.filter(p => !declared.has(p.id));
  const goneIds = RULE_TEXT.filter(p => p.rule && !found.has(p.id));
  console.log(`\nin the source but not declared by the app: ${newIds.length}`);
  console.log(newIds.map(p => p.citation).join(', ') || '  none');
  console.log(`\ndeclared by the app but not found in the source: ${goneIds.length}`);
  console.log(goneIds.map(p => p.citation).join(', ') || '  none');

  const empty = paras.filter(p => !p.text && p.id.split('-').length > 2);
  console.log(`\nsubparagraphs that parsed with no text: ${empty.length}`);
  console.log(empty.map(p => p.citation).join(', ') || '  none');

  if (parsed.notes.length) {
    console.log(`\nreadings worth checking (${parsed.notes.length}):`);
    parsed.notes.forEach(n => console.log('  ' + n));
  }

  // Headings are titles rather than regulatory text, so the app keeps its own
  // (and its own spelling). A difference beyond spelling is worth a look.
  const uk = t => String(t || '').toLowerCase()
    .replace(/maneuver/g, 'manoeuvre').replace(/meter/g, 'metre').replace(/draft/g, 'draught')
    .replace(/[^a-z]/g, '');
  const headingDiffs = parsed.rules.filter(r => {
    const mine = RULE_TEXT.find(x => x.id === `rule-${r.number}`);
    return mine && mine.heading && uk(mine.heading) !== uk(r.heading);
  }).map(r => `Rule ${r.number}: app "${RULE_TEXT.find(x => x.id === `rule-${r.number}`).heading}" vs source "${r.heading}"`);
  console.log(`
headings that differ beyond spelling: ${headingDiffs.length}`);
  headingDiffs.forEach(d => console.log('  ' + d));

  if (write) writeSource(file, paras);

  // Intermediate, for eyeballing a parse that looks wrong. Not committed.
  const outFile = path.join(__dirname, '..', 'tools', 'rule-text-parsed.json');
  fs.writeFileSync(outFile, JSON.stringify({ source: path.basename(file), paras }, null, 1));
  console.log(`\nparsed output written to ${path.relative(process.cwd(), outFile)}`);
  if (!write) console.log('(report only — pass --write to update data/rule-text.js)');
}

main();
