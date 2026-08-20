/**
 * Distress signals, drawn.
 *
 * Same discipline as the buoys: every mark here is generated from a
 * description, nothing is traced from a publication. Flag N is a four by four
 * chequer and flag C is five horizontal bands, so both are loops rather than
 * artwork, and the square-and-ball signal is a rectangle and a circle.
 *
 * That is not only a copyright position. A traced flag is a picture of one
 * flag; a generated one is the rule, and if the description is wrong the
 * drawing is visibly wrong rather than quietly right.
 */

import { ALPHABET_FLAGS } from '../data/flags.js';
import { renderHoist } from './render-flag.js';

const CODE_HEX = {
  blue: '#0B4EA2',
  white: '#F6F4EE',
  red: '#D0231C',
  black: '#141A1E',
  orange: '#E8631A'
};

const OUTLINE = '#0B1116';

/**
 * The code signal NC: N hoisted above C, in that order.
 *
 * Drawn on a halyard because the order is the whole signal. C over N is not a
 * distress signal, and a picture of two flags side by side would not say so.
 */
export function renderFlagNC({ width = 200 } = {}) {
  // N above C, drawn from data/flags.js. The two flags were hardcoded here
  // before the code flag section existed, which meant two descriptions of the
  // same flags that could drift apart. There is now one.
  const n = ALPHABET_FLAGS.find(f => f.id === 'N');
  const c = ALPHABET_FLAGS.find(f => f.id === 'C');
  return renderHoist([n, c], { width });
}

/**
 * A square flag with a ball above or below it.
 *
 * Drawn with the ball above, and the alternative shown faintly below, because
 * the annex allows either and a learner shown only one arrangement will not
 * recognise the other. "Anything resembling a ball" is the actual wording: it
 * is meant to be improvised.
 */
export function renderSquareAndBall({ width = 200, height = 170 } = {}) {
  const mast = 60, fw = 78, fh = 66, x = 76;
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="A square flag with a ball above it, and the permitted alternative with the ball below">
    <line x1="${mast}" y1="8" x2="${mast}" y2="${height - 8}" stroke="${OUTLINE}" stroke-width="2.5"/>
    <circle cx="${x + fw / 2}" cy="26" r="15" fill="${OUTLINE}"/>
    <rect x="${x}" y="52" width="${fw}" height="${fh}" fill="${CODE_HEX.white}"
      stroke="${OUTLINE}" stroke-width="1.4"/>
    <g opacity=".28">
      <circle cx="${x + fw / 2}" cy="${52 + fh + 20}" r="15" fill="${OUTLINE}"/>
      <text x="${x + fw + 10}" y="${52 + fh + 24}" font-family="ui-monospace,monospace"
        font-size="9" fill="${OUTLINE}">or below</text>
    </g>
  </svg>`;
}

/**
 * Arms outstretched to each side, raised and lowered slowly and repeatedly.
 *
 * Two positions side by side rather than an animation: the signal is the
 * repetition between them, and a still figure with arms out is not the signal
 * at all. An arrow between the two carries the movement.
 */
export function renderArmSignal({ width = 200, height = 170 } = {}) {
  const figure = (cx, armY, label) => `
    <g stroke="${OUTLINE}" stroke-width="3" fill="none" stroke-linecap="round">
      <circle cx="${cx}" cy="52" r="9" fill="${OUTLINE}" stroke="none"/>
      <line x1="${cx}" y1="61" x2="${cx}" y2="108"/>
      <line x1="${cx}" y1="108" x2="${cx - 13}" y2="134"/>
      <line x1="${cx}" y1="108" x2="${cx + 13}" y2="134"/>
      <line x1="${cx}" y1="72" x2="${cx - 30}" y2="${armY}"/>
      <line x1="${cx}" y1="72" x2="${cx + 30}" y2="${armY}"/>
    </g>
    <text x="${cx}" y="152" text-anchor="middle" font-family="ui-monospace,monospace"
      font-size="9" fill="#4A626E">${label}</text>`;
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="A figure raising and lowering both arms outstretched to each side, slowly and repeatedly">
    ${figure(56, 44, 'raised')}
    ${figure(144, 96, 'lowered')}
    <g stroke="#C3006B" stroke-width="1.4" fill="none">
      <path d="M 90 74 Q 100 62 110 74"/>
      <path d="M 110 74 l -5 -1 l 3 5" stroke-linejoin="round"/>
      <path d="M 110 86 Q 100 98 90 86"/>
      <path d="M 90 86 l 5 1 l -3 -5" stroke-linejoin="round"/>
    </g>
  </svg>`;
}

/** Which drawing, if any, belongs to a given distress signal. */
export function renderDistress(id, opts) {
  switch (id) {
    case 'flag-nc': return renderFlagNC(opts);
    case 'square-ball': return renderSquareAndBall(opts);
    case 'arms': return renderArmSignal(opts);
    default: return '';
  }
}

export const DRAWN_DISTRESS = ['flag-nc', 'square-ball', 'arms'];
