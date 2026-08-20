/**
 * Reachability.
 *
 * Content that is built, bundled and tested but that no tab surfaces is not
 * finished — it is just invisible, and it will stay invisible because
 * everything about it looks green. The distress and Morse modules sat in
 * exactly that state for a commit, so this suite exists to make sure it cannot
 * happen quietly again.
 *
 * The checks read index.html rather than a list of tabs kept here, so a new
 * section is covered by having been declared, not by somebody remembering to
 * add it in two places.
 */
import { readFileSync } from 'node:fs';
import { QUESTION_TYPES as SOUND_TYPES, soundUniverse } from '../src/sound-questions.js';
import { BUOY_QUESTION_TYPES, buoyUniverse } from '../src/buoyage-questions.js';
import { FLAG_QUESTION_TYPES, flagUniverse } from '../src/flag-questions.js';
import { MANOEUVRE_QUESTION_TYPES, manoeuvreUniverse } from '../src/manoeuvre-questions.js';
import { DEFINITION_QUESTION_TYPES, definitionUniverse } from '../src/definition-questions.js';
import { MANOEUVRE_SCENARIOS } from '../data/manoeuvre-scenarios.js';
import { FLAGS } from '../data/flags.js';
import { DISTRESS_QUESTION_TYPES, MORSE_QUESTION_TYPES, distressUniverse, deliveryFor,
  distressQuestionFor } from '../src/distress-questions.js';
import { SOUND_SIGNALS } from '../data/sound-signals.js';
import { DISTRESS_SIGNALS } from '../data/distress-signals.js';
import { MORSE_CHARACTERS } from '../data/morse.js';
import { VESSEL_STATES } from '../data/vessel-states.js';
import { MARKS } from '../data/buoyage.js';
import { RULE_TEXT_QUESTION_TYPES, ruleTextUniverse } from '../src/rule-text-questions.js';

const html = () => readFileSync('index.html', 'utf8');
const appScript = () => {
  const h = html();
  const tag = '<script type="module">\n';
  const o = h.indexOf(tag) + tag.length;
  return h.slice(o, h.indexOf('\n</script>', o));
};

const TABS = ['lights', 'buoys', 'sound', 'distress', 'morse', 'flags', 'manoeuvre', 'defs',
  'text'];

/**
 * Question types that are built and wired but deal no cards yet, and why.
 *
 * Both need the verbatim rule text, which is pending a source. Listing them
 * here rather than dropping them from the count keeps the gap visible: if
 * somebody fills the text, these start dealing and the exception should go.
 */
const PENDING_TYPES = ['text-cloze'];

const renderSources = ['render-lights', 'render-buoy', 'render-signal', 'render-manoeuvre',
  'render-flag', 'render-distress'].map(m => readFileSync(`src/${m}.js`, 'utf8'));

/**
 * WCAG relative luminance and contrast ratio.
 *
 * Worth having here because the night palette got this exactly backwards on the
 * first attempt: the accents are fills with text sitting on them, so
 * brightening them for a dark page made the white text on them worse rather
 * than better. Eyeballing a palette does not catch that. Arithmetic does.
 */
const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

export default function run(t) {
  const page = html();
  const app = appScript();

  t.section('nine tabs, each with a view and a drill or a list');
  t.ok('every tab has a button and a section',
    TABS.every(id => page.includes(`id="tab-${id}"`) && page.includes(`id="view-${id}"`)),
    TABS.filter(id => !page.includes(`id="view-${id}"`)).join(', ') || `${TABS.length} tabs`);
  t.ok('switchTab shows and hides all nine',
    TABS.every(id => app.includes(`$('view-${id}').classList.toggle('hidden'`)));
  t.ok('every tab button is wired to switchTab',
    TABS.every(id => app.includes(`$('tab-${id}').addEventListener`)));
  t.ok('switching tabs stops any sound in progress', /function switchTab\([^)]*\)\s*\{\s*stop\(\)/.test(app));

  t.section('each section introduces itself');
  // The lights intro — "drag the observer round the dial" — sat in the header
  // for eight tabs' worth of history, describing one of them. A line anchored
  // above the tab strip is a claim about the whole app, so it had better be
  // true of the whole app.
  const sectionOf = id => {
    const at = page.indexOf(`id="view-${id}"`);
    return at < 0 ? '' : page.slice(at, page.indexOf('</section>', at));
  };
  const introless = TABS.filter(id => !/<p class="sub"/.test(sectionOf(id)));
  t.ok('every tab opens with its own intro line', introless.length === 0,
    introless.join(', ') || `${TABS.length} sections`);
  const header = page.slice(page.indexOf('<header>'), page.indexOf('</header>'));
  t.ok('the header carries the lockup and the readout, not a section\'s prose',
    !/<p class="sub"/.test(header) && /class="lockup"/.test(header) &&
    /id="space"/.test(header),
    'a line about one tab does not belong above all nine');
  t.ok('the intro that moved is now inside the lights section',
    /Drag the observer round the\s+dial/.test(sectionOf('lights')));

  t.section('every section surfaces its own data');
  const surfaces = [
    ['vessel states', VESSEL_STATES.length, /VESSEL_STATES\.forEach/.test(app)],
    ['buoyage marks', MARKS.length, /MARKS\.filter\(m =>/.test(app)],
    ['sound signals', SOUND_SIGNALS.length, /SOUND_SIGNALS\.filter\(s => s\.group/.test(app)],
    ['distress signals', DISTRESS_SIGNALS.length, /DISTRESS_SIGNALS\.filter\(s => s\.modality/.test(app)],
    ['morse characters', MORSE_CHARACTERS.length, /MORSE_CHARACTERS\.map\(c =>/.test(app)],
    ['code flags', FLAGS.length, /FLAG_GROUPS\.map\(g =>/.test(app)],
    ['manoeuvre scenarios', MANOEUVRE_SCENARIOS.length, /SCENARIO_CATEGORIES\.map\(cat =>/.test(app)]
  ];
  for (const [what, count, listed] of surfaces) {
    t.ok(`${what} are listed in the UI`, listed, `${count} items`);
  }

  t.section('every declared question type is reachable through a drill');
  // Light types are declared in the app itself; the rest come from the modules.
  const lightTypes = (app.match(/const LIGHT_QUESTION_TYPES = \[([^\]]+)\]/) || [, ''])[1]
    .split(',').map(x => x.trim().replace(/['"]/g, '')).filter(Boolean);
  const declared = [...lightTypes, ...BUOY_QUESTION_TYPES, ...SOUND_TYPES,
    ...DISTRESS_QUESTION_TYPES, ...MORSE_QUESTION_TYPES, ...FLAG_QUESTION_TYPES, ...MANOEUVRE_QUESTION_TYPES, ...DEFINITION_QUESTION_TYPES,
    ...RULE_TEXT_QUESTION_TYPES];
  t.ok('twenty-six question types declared across the app', declared.length === 26,
    declared.join(', '));

  // Reachable means: some universe the app builds contains the type, and that
  // universe is handed to selectCard.
  const reachable = new Set([
    ...lightTypes,
    ...buoyUniverse().map(c => c.questionType),
    ...flagUniverse().map(c => c.questionType),
    ...manoeuvreUniverse().map(c => c.questionType),
    ...definitionUniverse().map(c => c.questionType),
    ...soundUniverse().map(c => c.questionType),
    ...distressUniverse().map(c => c.questionType),
    ...ruleTextUniverse().map(c => c.questionType)
  ]);
  const unreachable = declared.filter(type => !reachable.has(type) && !PENDING_TYPES.includes(type));
  t.ok('every declared type appears in a universe, bar the ones waiting on a source',
    unreachable.length === 0, unreachable.join(', '));
  // The exception must stay honest in both directions: a pending type that has
  // quietly started dealing cards is no longer pending and should be counted.
  t.ok('the pending types really are dealing nothing',
    PENDING_TYPES.every(type => !reachable.has(type)),
    PENDING_TYPES.join(', ') + ' — waiting on blanks authored against the text');

  const universeNames = ['UNIVERSE', 'SOUND_UNIVERSE', 'DISTRESS_UNIVERSE', 'BUOY_UNIVERSE', 'FLAG_UNIVERSE', 'MV_UNIVERSE', 'DEF_UNIVERSE',
    'TEXT_UNIVERSE'];
  t.ok('every universe the app builds reaches the scheduler',
    universeNames.every(n => app.includes(`selectCard(${n}`) ||
      new RegExp(`universe: ${n}`).test(app)),
    universeNames.join(', '));
  // Four drills, three call sites: Lights and Sound each have their own, and
  // Distress and Morse share makeDrill. Counting call sites would therefore be
  // the wrong assertion — count the drills.
  const ownDrills = (app.match(/selectCard\((UNIVERSE|SOUND_UNIVERSE)\)/g) || []).length;
  const sharedDrills = (app.match(/^makeDrill\(\{/gm) || []).length;
  t.ok('nine drills, two with their own loop and seven sharing one',
    ownDrills === 2 && sharedDrills === 7,
    `${ownDrills} own + ${sharedDrills} shared`);
  t.ok('every drill grades through the scheduler',
    (app.match(/grade\([^)]*right \? GRADE\.GOOD : GRADE\.AGAIN\)/g) || []).length === ownDrills + 1,
    'one grade path per drill loop');

  t.section('the rule text is a layer under the app, not a tab on its own');
  // The whole case for this section is that a citation is tappable wherever it
  // appears. A rule printed as plain text is a dead end the reader has to go
  // and look up by hand, which is what the section was built to stop.
  const plain = [...app.matchAll(/textContent = [^;]*\.(explain|rule)\b/g)].map(m => m[0]);
  t.ok('no rule or explanation is printed without passing through the link layer',
    plain.length === 0, plain.slice(0, 3).join(' | '));
  const cards = [...app.matchAll(/class="rules?">\${([^}]*)}/g)].map(m => m[1]);
  t.ok('every rule shown on a reference card is linked',
    cards.length > 0 && cards.every(c => c.includes('linkCitations(')),
    cards.filter(c => !c.includes('linkCitations(')).join(' | ') || `${cards.length} cards`);
  t.ok('the link layer is applied in every section, not just one',
    (app.match(/linkCitations\(/g) || []).length >= 8,
    `${(app.match(/linkCitations\(/g) || []).length} call sites`);
  t.ok('a click on a citation opens the text tab at that paragraph',
    /data-rule\b/.test(app) && /switchTab\('text'\)/.test(app) &&
    /scrollIntoView/.test(app));
  t.ok('links are delegated from the document, so they work in any tab',
    /document\.addEventListener\('click'/.test(app));

  t.section('the index is browsable and searchable');
  t.ok('the index tab carries a search box and a place to draw the rules',
    page.includes('id="textSearch"') && page.includes('id="textIndex"'));
  t.ok('typing in the search box redraws the index',
    /\$\('textSearch'\)\.addEventListener\('input'/.test(app) &&
    /searchRuleText\(/.test(app));
  t.ok('the index draws once on load, not only after a search',
    /drawRuleIndex\(null\);/.test(app));
  t.ok('the index is drop-downs: a part, then a rule, then its text',
    /<details class="rulegroup"/.test(app) && /<summary>/.test(app) &&
    /class="rulepart"/.test(app));
  t.ok('a drop-down is native <details>, not a class toggled by hand',
    !/classList\.toggle\('open'/.test(app),
    'keyboard accessible, and find-in-page can open it');
  t.ok('a search forces the matching rules open',
    /\$\{show \|\| indexExpanded \? ' open' : ''\}/.test(app),
    'a hit behind a closed drop-down is worse than no hit');
  t.ok('there is a way to open the lot for reading straight through',
    page.includes('id="textExpand"') &&
    /\$\('textExpand'\)\.addEventListener/.test(app));
  t.ok('following a citation opens the drop-down it lands in',
    /group\.open = true/.test(app),
    'otherwise the reader arrives at a collapsed heading');
  t.ok('Part B keeps its three sections as subheadings',
    /class="rulesec"/.test(app));
  t.ok('a paragraph with no text says so, and says which kind of gap it is',
    /No text./.test(app) && /pending-amendment/.test(app));
  t.ok('the section names its source and lists what is wrong with it',
    app.includes("$('textNote').innerHTML") && /SOURCE_CAVEATS/.test(app) &&
    /SOURCE_META.file/.test(app) && /not been collated/.test(app),
    'a study aid that hides a bad source is worse than one with no source');

  t.section('night mode');
  // A self-referential token — --wash:var(--wash) — shipped once and nothing
  // caught it: CSS resolves a cycle to nothing, so the hover tint silently
  // vanished in day mode while every other check stayed green.
  const css = page.slice(page.indexOf('<style>'), page.indexOf('</style>'));
  const cyclic = [...css.matchAll(/(--[\w-]+)\s*:\s*var\(\s*\1\s*[,)]/g)].map(m => m[1]);
  t.ok('no custom property is defined in terms of itself', cyclic.length === 0,
    cyclic.join(', ') || 'CSS resolves a cycle to nothing, in silence');

  const tokens = block => {
    const at = css.indexOf(block);
    const body = css.slice(at, css.indexOf('}', at));
    return new Map([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
  };
  const day = tokens(':root{');
  const night = tokens(':root[data-theme="night"]{');
  t.ok('the night palette redefines the chrome tokens',
    ['--paper', '--ink', '--ink-soft', '--rule', '--card', '--magenta', '--good', '--warn']
      .every(k => night.has(k)),
    [...night.keys()].length + ' overridden');
  t.ok('every night token is one the day palette already declares',
    [...night.keys()].every(k => day.has(k)),
    [...night.keys()].filter(k => !day.has(k)).join(', ') || 'no orphans');
  t.ok('every night token actually differs from its day value',
    [...night].every(([k, v]) => day.get(k) !== v),
    [...night].filter(([k, v]) => day.get(k) === v).map(([k]) => k).join(', '));

  // --night is the sea at night in the lights panel. It means the same thing in
  // both themes, and flipping it would darken a diagram that is already dark.
  t.ok('--night is left alone, because it is a depiction and not a theme colour',
    !night.has('--night'));
  t.ok('no renderer reads a CSS custom property',
    renderSources.every(src => !/var\(--/.test(src)),
    'every diagram colours itself, so a theme cannot recolour a buoy');

  t.ok('the chrome hardcodes no colour that would have to flip',
    !/(background|border-color)\s*:\s*rgba\(255,255,255/.test(
      css.replace(/--card[\w-]*\s*:\s*rgba\(255,255,255[^;]*;/g, '')),
    'card fills go through --card');

  t.ok('the theme is set before first paint, not from the module',
    /data-theme/.test(page.slice(0, page.indexOf('<style>'))) &&
    /localStorage\.getItem\('aspect\.theme'\)/.test(page.slice(0, page.indexOf('<style>'))),
    'otherwise a dark page flashes white on the way in');
  t.ok('the toggle exists, flips the attribute and remembers the choice',
    page.includes('id="themeToggle"') &&
    /setTheme\(themeNow\(\) === 'night' \? 'day' : 'night'\)/.test(app) &&
    /localStorage\.setItem\('aspect\.theme', theme\)/.test(app));
  t.ok('the toggle says what it will do and reports its state',
    /aria-pressed/.test(app) && /aria-label/.test(app) &&
    /textContent = theme === 'night' \? 'Day' : 'Night'/.test(app));
  t.ok('a reader who has chosen is not overruled by the system later',
    !/matchMedia\('\(prefers-color-scheme[^)]*\)'\)\.add(EventListener|Listener)/.test(app),
    'no listener re-flips the page after a choice');

  t.section('both palettes are readable');
  // AA is 4.5:1 for body text. Every pair below is text a reader has to read,
  // not decoration.
  const pairsFor = pal => [
    ['body text', pal['--ink'], pal['--paper']],
    ['secondary text', pal['--ink-soft'], pal['--paper']],
    ['citations and rule numbers', pal['--magenta'], pal['--paper']],
    ['text on a selected tab', pal['--paper'], pal['--ink']],
    ['text on a right answer', pal['--on-accent'], pal['--good']],
    ['text on a wrong answer', pal['--on-accent'], pal['--magenta']],
    ['text on a caution badge', pal['--on-accent'], pal['--warn']],
    ['text on a role badge', pal['--on-accent'], pal['--ink-soft']]
  ];
  const dayPal = Object.fromEntries(day);
  const themes = [['day', dayPal], ['night', { ...dayPal, ...Object.fromEntries(night) }]];
  for (const [name, pal] of themes) {
    const pairs = pairsFor(pal)
      .filter(([, fg, bg]) => /^#[0-9A-Fa-f]{6}$/.test(fg || '') && /^#[0-9A-Fa-f]{6}$/.test(bg || ''));
    const failures = pairs
      .map(([what, fg, bg]) => [what, contrast(fg, bg)])
      .filter(([, ratio]) => ratio < 4.5);
    t.ok(`the ${name} palette clears 4.5 to 1 wherever text sits on a fill`,
      pairs.length === 8 && failures.length === 0,
      failures.map(([what, r]) => `${what} ${r.toFixed(2)}`).join(', ')
        || `${pairs.length} pairs checked`);
  }

  t.section('no built content is left unreachable');
  // Anything exported as a renderer should be called somewhere in the app.
  const renderers = ['renderScene', 'renderDial', 'renderBuoy', 'signalStrip', 'renderDistress', 'lightSignal', 'renderFlag', 'renderManoeuvre'];
  const uncalled = renderers.filter(r => !new RegExp(`${r}\\(`).test(app));
  t.ok('every renderer is called by the UI', uncalled.length === 0, uncalled.join(', '));
  t.ok('the Annex IV prohibition is shown as a standing note, not per signal',
    app.includes("$('annexNote').innerHTML") && page.includes('class="standing"'));
  t.ok('the modality is stated on every distress card',
    /<span class="modality">\$\{sig\.modality\}<\/span>/.test(app));
  t.ok('the Morse speed control states the dit in milliseconds',
    app.includes('ditMs()') && page.includes('id="ditRead"'));

  t.section('drills never play on their own');
  // play() must only be reachable from a click handler, never from next().
  const nextBody = app.slice(app.indexOf('  function next() {'), app.indexOf('  function progress()') > 0
    ? app.length : app.length);
  t.ok('the shared drill does not play when a question is dealt',
    !/function next\(\)[\s\S]{0,1800}?\bplay\(/.test(app));
  t.ok('every play call sits inside a click handler',
    (app.match(/addEventListener\('click'[\s\S]{0,400}?play\(/g) || []).length >= 3);

  t.section('reduced motion has a working path for morse-see');
  const see = distressQuestionFor({ stateId: 'morse-A', aspect: 'na', questionType: 'morse-see' });
  const allowed = deliveryFor(see, { motion: true });
  const reduced = deliveryFor(see, { motion: false });
  t.ok('with motion, morse-see is delivered as light', allowed.mode === 'light' && !allowed.substituted);
  t.ok('with reduced motion it substitutes sound rather than showing nothing',
    reduced.mode === 'sound' && reduced.substituted === true);
  t.ok('the substitution is explained, not silent',
    /reduced motion/i.test(reduced.note) && reduced.note.length > 40);
  t.ok('a non-light question is unaffected by the motion setting',
    deliveryFor(distressQuestionFor({ stateId: 'morse-A', aspect: 'na', questionType: 'morse-hear' }),
      { motion: false }).substituted === false);
  t.ok('the app renders the substitution note and the lamp fallback',
    app.includes('$(cfg.subNote).textContent = delivery.note') &&
    /Reduced motion is set/.test(app));
  t.ok('the lamp itself refuses to draw a still lamp under reduced motion',
    /function showLamp[\s\S]{0,320}stillness\.matches/.test(app));
  t.section('the hide toggle');
  t.ok('the Observer panel carries a hide checkbox', page.includes('id="hideDetail"'));
  t.ok('both panels are addressable',
    page.includes('id="observerPanel"') && page.includes('id="targetPanel"'));
  t.ok('both panels wrap their contents in a maskable region',
    (page.match(/<div class="maskable">/g) || []).length === 2);
  // If the toggle sat inside the region it hides, ticking it would hide the
  // control and there would be no way to untick it.
  const observer = page.slice(page.indexOf('id="observerPanel"'), page.indexOf('id="targetPanel"'));
  const maskStart = observer.indexOf('<div class="maskable">');
  const maskEnd = observer.indexOf('</div>', observer.indexOf('bandRead'));
  const togglePos = observer.indexOf('id="hideDetail"');
  t.ok('the toggle sits outside the region it hides, so it stays clickable',
    togglePos > maskEnd && maskStart < maskEnd, 'otherwise it cannot be unticked');
  t.ok('hiding is visibility, so the layout does not jump',
    page.includes('.panel.masked .maskable{visibility:hidden}'));
  t.ok('one listener, toggling a class on each panel, and nothing else',
    app.split("$('hideDetail').addEventListener").length - 1 === 1 &&
    app.split("classList.toggle('masked'").length - 1 === 2);
  // The previous attempt at this drove masking through draw() and the render
  // path, and took the whole app down. This one must stay well clear of both.
  const handler = app.slice(app.indexOf("$('hideDetail')"),
    app.indexOf("$('hideDetail')") + 300);
  t.ok('masking never touches the render path',
    !/draw\(\)|renderScene|renderDial|innerHTML/.test(handler),
    'it toggles two classes and nothing else');
}
