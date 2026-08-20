/**
 * One revealed state, read by everything that displays anything.
 *
 * The bug this exists to kill: a drill would ask you to identify a vessel while
 * the left column named her, the dropdown sat on her, the legend listed her
 * lights and the readout gave her aspect. Every one of those was a separate
 * field written by separate code, so every one had to be remembered
 * individually — and a panel added later would leak by default, because
 * showing what you know is the natural thing for display code to do.
 *
 * The fix is to invert that. Answer-bearing values are not written to the DOM
 * directly; they are handed to this module, which decides. Unrevealed is the
 * safe state, and a value nobody has thought about is masked rather than shown.
 *
 * `answerStrings()` is the other half. It derives, from the question object
 * alone, everything that would give the answer away — so a new question type or
 * a new vessel state is covered without anyone adding it to a list.
 */

export const PLACEHOLDER = '—';

/** The one decision. Everything else here defers to it. */
export const mask = (revealed, value) => (revealed ? value : PLACEHOLDER);

/**
 * Every string that must not appear before the user commits.
 *
 * Read off the question, never a hardcoded list, so this keeps covering new
 * content by itself. Short strings are dropped: a two-letter Morse character
 * would match inside half the markup on the page and the check would be noise
 * rather than a signal.
 */
export function answerStrings(question) {
  if (!question) return [];
  const out = [];
  const push = v => { if (typeof v === 'string' && v.trim().length > 3) out.push(v.trim()); };

  const subject = question.state || question.signal || question.mark || null;
  if (subject) {
    push(subject.name);
    push(subject.rule);
    push(subject.summary);
    push(subject.dutyHint);
    push(subject.meaning);
    push(subject.action);
    push(subject.rhythm);
    push(subject.type);
    push(subject.group);
    push(subject.modality);
    push(subject.code);
    for (const light of subject.lights || []) push(light.name);
    for (const shape of subject.dayShapes || []) push(shape.form);
  }

  // The correct option's text: allowed inside the options list, nowhere else.
  const right = (question.options || []).find(o => o.id === question.answerId);
  if (right) push(right.text);
  push(question.explain);

  return [...new Set(out)];
}

/**
 * The values the left-hand panel shows for a question, masked or not.
 *
 * The app writes these and the tests read them, so the two cannot drift: a
 * field added here is a field the leak test starts checking.
 */
export function panelFields(question, revealed, { band = null } = {}) {
  const state = question && question.state;
  return {
    name: revealed && state ? state.name : (revealed ? PLACEHOLDER : 'Unidentified contact'),
    rule: mask(revealed, state ? state.rule : PLACEHOLDER),
    summary: mask(revealed, state ? state.summary : PLACEHOLDER),
    hint: mask(revealed, state ? state.dutyHint : PLACEHOLDER),
    band: mask(revealed, band || PLACEHOLDER),
    aspect: mask(revealed, question && question.aspect != null
      ? `${String(Math.round(question.aspect)).padStart(3, '0')}°` : PLACEHOLDER)
  };
}

/**
 * The legend, which names every light in view and is therefore the loudest leak
 * of all: it answers an identify question outright.
 */
export function legendEntries(lights, revealed) {
  if (!revealed) return [];
  return lights.map(l => ({ name: l.name, color: l.color }));
}

/** Whether renderers should suppress names and figures in their labels. */
export const anonymity = revealed => ({ anonymous: !revealed });
