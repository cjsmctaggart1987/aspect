/**
 * Answer leaks.
 *
 * A drill that shows you the answer is not a drill. The failure is easy to
 * reintroduce because every display element wants to show what it knows, so
 * this suite renders each question type in its unrevealed state and asserts the
 * serialised output contains none of the answer.
 *
 * The strings it looks for come off the question object, never a list kept
 * here, so a new vessel state, mark, signal or question type is covered the day
 * it is added rather than the day somebody remembers.
 */
import { readFileSync } from 'node:fs';
import { PLACEHOLDER, mask, answerStrings, panelFields, legendEntries, anonymity } from '../src/reveal.js';
import { VESSEL_STATES, ASPECT_BANDS } from '../data/vessel-states.js';
import { MARKS } from '../data/buoyage.js';
import { visibleLights } from '../src/engine.js';
import { renderScene, renderDial } from '../src/render-lights.js';
import { renderBuoy } from '../src/render-buoy.js';
import { signalStrip, lightSignal } from '../src/render-signal.js';
import { buoyUniverse, buoyageQuestionFor } from '../src/buoyage-questions.js';
import { soundUniverse, soundQuestionFor } from '../src/sound-questions.js';
import { distressUniverse, distressQuestionFor } from '../src/distress-questions.js';
import { morseSignal } from '../data/morse.js';

/**
 * Everything a drill puts on screen for a question, except the options list.
 *
 * The options must contain the right answer — that is what makes it answerable
 * — so they are excluded here and checked separately. Everything else is fair
 * game for a leak.
 */
function unrevealedView(q) {
  const parts = [];
  const hide = anonymity(false);

  if (q.state) {                                   // lights
    const band = ASPECT_BANDS.find(b => b.deg === q.aspect);
    const f = panelFields(q, false, { band: band && band.label });
    parts.push(f.name, f.rule, f.summary, f.hint, f.band, f.aspect);
    parts.push(renderScene(q.state, q.aspect, q.makingWay, 'night', true, hide));
    parts.push(renderScene(q.state, q.aspect, q.makingWay, 'day', true, hide));
    parts.push(renderDial(q.aspect, hide));
    const lights = visibleLights(q.state, q.aspect, q.makingWay);
    parts.push(JSON.stringify(legendEntries(lights, false)));
  }
  if (q.mark) {                                    // buoyage
    parts.push(renderBuoy(q.mark, q.night ? 'night' : 'day', true, hide));
  }
  if (q.signal && q.asLight) {                     // morse, shown as light
    parts.push(lightSignal(q.signal, { motion: true, ...hide }));
  }
  // Deliberately excludes the prompt. The prompt is the question stem and may
  // legitimately hand you information: sound-select states the situation and
  // asks which signal fits it, distress-identify names the signal and asks what
  // it means. So the stem is checked separately, against the one thing it must
  // never contain — the correct option's text.
  return parts.filter(Boolean).join('\n');
}

const rightAnswerText = q => {
  const right = (q.options || []).find(o => o.id === q.answerId);
  return right ? right.text : null;
};

/**
 * Whether a stem gives the answer away.
 *
 * Answers shorter than four characters are skipped, the same threshold
 * answerStrings uses and for the same reason: a Morse answer is one letter, and
 * "A lamp is flashing this" contains an A, "Listen" an L, "What character" a W.
 * Matching those would report noise as a leak forever. Morse prompts are
 * checked against the code instead, which is unambiguous.
 */
const promptLeaks = q => {
  const right = rightAnswerText(q);
  if (right && right.length > 3 && q.prompt.includes(right)) return true;
  // Same threshold again for the code: E is a single dot and "Listen." has a
  // full stop in it. Only codes long enough to be unmistakable are matched.
  const code = q.signal && q.signal.code;
  return !!(code && code.length >= 3 && q.prompt.includes(code));
};

const LIGHT_TYPES = ['identify', 'aspect'];

/** Rebuild a lights question without importing the app. */
function lightsQuestion(state, band, type) {
  return {
    type, state, aspect: band.deg, makingWay: true,
    prompt: type === 'aspect' ? 'From what aspect are you viewing her?' : 'What are you looking at?',
    options: type === 'aspect'
      ? ASPECT_BANDS.slice(0, 4).map(b => ({ id: String(b.deg), text: b.label }))
      : [state, ...VESSEL_STATES.filter(s => s.id !== state.id).slice(0, 3)]
          .map(s => ({ id: s.id, text: s.name })),
    answerId: type === 'aspect' ? String(band.deg) : state.id,
    explain: `${state.rule}. ${state.summary} ${state.dutyHint}`
  };
}

export default function run(t) {
  t.section('the reveal primitive');
  t.ok('masking replaces rather than blanks', mask(false, 'Trawler') === PLACEHOLDER && PLACEHOLDER.length > 0);
  t.ok('revealing returns the value', mask(true, 'Trawler') === 'Trawler');
  t.ok('the panel is masked wholesale when unrevealed', (() => {
    const f = panelFields({ state: VESSEL_STATES[0], aspect: 90 }, false, { band: 'Her starboard beam' });
    return Object.values(f).every(v => v === PLACEHOLDER || v === 'Unidentified contact');
  })());
  t.ok('the legend is empty until revealed',
    legendEntries(visibleLights(VESSEL_STATES[1], 45, true), false).length === 0 &&
    legendEntries(visibleLights(VESSEL_STATES[1], 45, true), true).length > 0);
  t.ok('answerStrings reads the question, not a list',
    answerStrings(lightsQuestion(VESSEL_STATES[1], ASPECT_BANDS[2], 'identify'))
      .includes(VESSEL_STATES[1].name));

  t.section('lights: no answer in the unrevealed view');
  let leaks = [];
  for (const state of VESSEL_STATES) {
    for (const band of ASPECT_BANDS) {
      for (const type of LIGHT_TYPES) {
        const q = lightsQuestion(state, band, type);
        const view = unrevealedView(q);
        for (const answer of answerStrings(q)) {
          if (view.includes(answer)) leaks.push(`${state.id}/${band.deg}/${type}: "${answer.slice(0, 40)}"`);
        }
        // The aspect question is answered by the band label and by the figure.
        if (type === 'aspect' && (view.includes(band.label) || view.includes(`${band.deg} degrees`))) {
          leaks.push(`${state.id}/${band.deg}: aspect shown`);
        }
        if (promptLeaks(q)) leaks.push(`${state.id}/${type}: answer in the prompt`);
      }
    }
  }
  t.ok('480 lights questions leak nothing', leaks.length === 0,
    leaks.slice(0, 3).join(' | ') || `${VESSEL_STATES.length * ASPECT_BANDS.length * 2} checked`);

  t.section('buoyage: no answer in the unrevealed view');
  leaks = [];
  for (const card of buoyUniverse()) {
    const q = buoyageQuestionFor(card);
    const view = unrevealedView(q);
    for (const answer of answerStrings(q)) {
      if (view.includes(answer)) leaks.push(`${card.stateId}/${card.questionType}: "${answer.slice(0, 40)}"`);
    }
    if (promptLeaks(q)) leaks.push(`${card.stateId}: answer in the prompt`);
  }
  t.ok('every buoyage card leaks nothing', leaks.length === 0,
    leaks.slice(0, 3).join(' | ') || `${buoyUniverse().length} checked`);

  t.section('sound, distress and Morse: no answer in the unrevealed view');
  leaks = [];
  for (const card of [...soundUniverse(), ...distressUniverse()]) {
    const q = card.questionType.startsWith('sound-')
      ? soundQuestionFor(card) : distressQuestionFor(card);
    const view = unrevealedView(q);
    for (const answer of answerStrings(q)) {
      if (view.includes(answer)) leaks.push(`${card.stateId}/${card.questionType}: "${answer.slice(0, 40)}"`);
    }
    if (promptLeaks(q)) leaks.push(`${card.stateId}/${card.questionType}: answer in the prompt`);
  }
  t.ok('every sound, distress and Morse card leaks nothing', leaks.length === 0,
    leaks.slice(0, 3).join(' | ') || `${soundUniverse().length + distressUniverse().length} checked`);

  t.section('renderers hide their labels when asked');
  const st = VESSEL_STATES.find(s => s.id === 'trawling-making-way');
  t.ok('the scene does not name her', !renderScene(st, 45, true, 'night', true, { anonymous: true }).includes(st.name));
  t.ok('the dial does not state the aspect',
    !renderDial(135, { anonymous: true }).includes('135 degrees'));
  t.ok('the buoy does not name the mark',
    MARKS.every(m => !renderBuoy(m, 'day', true, { anonymous: true }).includes(m.name)));
  t.ok('the lamp does not print the code',
    !lightSignal(morseSignal('SOS'), { anonymous: true }).includes('...---...'));
  t.ok('the strip does not describe itself',
    !signalStrip(morseSignal('A'), { anonymous: true }).includes('one dit'));
  t.ok('all of that is opt-in, so explore is unchanged',
    renderScene(st, 45, true, 'night', true).includes(st.name) &&
    renderBuoy(MARKS[0]).includes(MARKS[0].name) &&
    lightSignal(morseSignal('SOS')).includes('...---...'));

  t.section('the app routes answer-bearing fields through the reveal state');
  const app = (() => {
    const h = readFileSync('index.html', 'utf8');
    const tag = '<script type="module">\n';
    const o = h.indexOf(tag) + tag.length;
    return h.slice(o, h.indexOf('\n</script>', o));
  })();
  t.ok('one reveal flag, not a flag per panel',
    (app.match(/^let revealed = /gm) || []).length === 1);
  t.ok('the identifying fields are written through show(), never directly',
    !/\$\('(mName|mRule|mSummary|mHint|bandRead|aspectRead|legend)'\)\.(textContent|innerHTML) =/.test(app),
    'no direct writes remain');
  t.ok('the dropdown is parked on a placeholder while unrevealed',
    app.includes("if (!revealed) $('stateSel').value = ''"));
  t.ok('a placeholder option exists so the answer is not the selected node',
    app.includes("holder.textContent = 'Unidentified contact'"));
  t.ok('dealing a question masks, answering reveals',
    /setRevealed\(false\)/.test(app) && /setRevealed\(true\)/.test(app));
  t.ok('the scene and dial are anonymised from the same flag',
    app.includes('const hide = anonymity(revealed)'));
}
