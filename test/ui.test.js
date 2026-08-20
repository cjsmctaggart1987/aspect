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
import { FLAGS } from '../data/flags.js';
import { DISTRESS_QUESTION_TYPES, MORSE_QUESTION_TYPES, distressUniverse, deliveryFor,
  distressQuestionFor } from '../src/distress-questions.js';
import { SOUND_SIGNALS } from '../data/sound-signals.js';
import { DISTRESS_SIGNALS } from '../data/distress-signals.js';
import { MORSE_CHARACTERS } from '../data/morse.js';
import { VESSEL_STATES } from '../data/vessel-states.js';
import { MARKS } from '../data/buoyage.js';

const html = () => readFileSync('index.html', 'utf8');
const appScript = () => {
  const h = html();
  const tag = '<script type="module">\n';
  const o = h.indexOf(tag) + tag.length;
  return h.slice(o, h.indexOf('\n</script>', o));
};

const TABS = ['lights', 'buoys', 'sound', 'distress', 'morse', 'flags'];

export default function run(t) {
  const page = html();
  const app = appScript();

  t.section('six tabs, each with a view and a drill or a list');
  t.ok('every tab has a button and a section',
    TABS.every(id => page.includes(`id="tab-${id}"`) && page.includes(`id="view-${id}"`)),
    TABS.filter(id => !page.includes(`id="view-${id}"`)).join(', ') || `${TABS.length} tabs`);
  t.ok('switchTab shows and hides all six',
    TABS.every(id => app.includes(`$('view-${id}').classList.toggle('hidden'`)));
  t.ok('every tab button is wired to switchTab',
    TABS.every(id => app.includes(`$('tab-${id}').addEventListener`)));
  t.ok('switching tabs stops any sound in progress', /function switchTab\([^)]*\)\s*\{\s*stop\(\)/.test(app));

  t.section('every section surfaces its own data');
  const surfaces = [
    ['vessel states', VESSEL_STATES.length, /VESSEL_STATES\.forEach/.test(app)],
    ['buoyage marks', MARKS.length, /MARKS\.filter\(m =>/.test(app)],
    ['sound signals', SOUND_SIGNALS.length, /SOUND_SIGNALS\.filter\(s => s\.group/.test(app)],
    ['distress signals', DISTRESS_SIGNALS.length, /DISTRESS_SIGNALS\.filter\(s => s\.modality/.test(app)],
    ['morse characters', MORSE_CHARACTERS.length, /MORSE_CHARACTERS\.map\(c =>/.test(app)],
    ['code flags', FLAGS.length, /FLAG_GROUPS\.map\(g =>/.test(app)]
  ];
  for (const [what, count, listed] of surfaces) {
    t.ok(`${what} are listed in the UI`, listed, `${count} items`);
  }

  t.section('every declared question type is reachable through a drill');
  // Light types are declared in the app itself; the rest come from the modules.
  const lightTypes = (app.match(/const LIGHT_QUESTION_TYPES = \[([^\]]+)\]/) || [, ''])[1]
    .split(',').map(x => x.trim().replace(/['"]/g, '')).filter(Boolean);
  const declared = [...lightTypes, ...BUOY_QUESTION_TYPES, ...SOUND_TYPES,
    ...DISTRESS_QUESTION_TYPES, ...MORSE_QUESTION_TYPES, ...FLAG_QUESTION_TYPES];
  t.ok('fifteen question types declared across the app', declared.length === 15, declared.join(', '));

  // Reachable means: some universe the app builds contains the type, and that
  // universe is handed to selectCard.
  const reachable = new Set([
    ...lightTypes,
    ...buoyUniverse().map(c => c.questionType),
    ...flagUniverse().map(c => c.questionType),
    ...soundUniverse().map(c => c.questionType),
    ...distressUniverse().map(c => c.questionType)
  ]);
  const unreachable = declared.filter(type => !reachable.has(type));
  t.ok('every declared type appears in a universe', unreachable.length === 0, unreachable.join(', '));

  const universeNames = ['UNIVERSE', 'SOUND_UNIVERSE', 'DISTRESS_UNIVERSE', 'BUOY_UNIVERSE', 'FLAG_UNIVERSE'];
  t.ok('every universe the app builds reaches the scheduler',
    universeNames.every(n => app.includes(`selectCard(${n}`) ||
      new RegExp(`universe: ${n}`).test(app)),
    universeNames.join(', '));
  // Four drills, three call sites: Lights and Sound each have their own, and
  // Distress and Morse share makeDrill. Counting call sites would therefore be
  // the wrong assertion — count the drills.
  const ownDrills = (app.match(/selectCard\((UNIVERSE|SOUND_UNIVERSE)\)/g) || []).length;
  const sharedDrills = (app.match(/^makeDrill\(\{/gm) || []).length;
  t.ok('six drills, two with their own loop and four sharing one',
    ownDrills === 2 && sharedDrills === 4,
    `${ownDrills} own + ${sharedDrills} shared`);
  t.ok('every drill grades through the scheduler',
    (app.match(/grade\([^)]*right \? GRADE\.GOOD : GRADE\.AGAIN\)/g) || []).length === ownDrills + 1,
    'one grade path per drill loop');

  t.section('no built content is left unreachable');
  // Anything exported as a renderer should be called somewhere in the app.
  const renderers = ['renderScene', 'renderDial', 'renderBuoy', 'signalStrip', 'renderDistress', 'lightSignal', 'renderFlag'];
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
