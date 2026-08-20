/**
 * Code flags, drawn from their geometry.
 *
 * Same discipline as the buoys and the distress signals: every flag is executed
 * from its description, nothing is traced. A chequer is a loop, a saltire is two
 * lines, a border is nested rectangles. If the description is wrong the flag is
 * visibly wrong, which is the property that makes docs/flags.html worth looking
 * at.
 *
 * Shape and design are separate. The design fills a rectangle; the shape then
 * cuts it — a swallowtail notch, a pennant taper, a triangle. That keeps the
 * twelve primitives from each needing four variants.
 */

import { FLAG_HEX, flagMeaning } from '../data/flags.js';

const hex = c => FLAG_HEX[c] || c;
const FLAG_OUTLINE = '#0B1116';

// The rectangle every design is painted into, before the shape cuts it.
const W = 120;
const H = 80;

/** The cut that turns a painted rectangle into this kind of flag. */
function clipShape(shape, id) {
  switch (shape) {
    case 'swallowtail':
      return `<path d="M 0 0 L ${W} 0 L ${W * 0.72} ${H / 2} L ${W} ${H} L 0 ${H} Z"/>`;
    case 'pennant':
      return `<path d="M 0 0 L ${W} ${H * 0.34} L ${W} ${H * 0.66} L 0 ${H} Z"/>`;
    case 'triangle':
      return `<path d="M 0 0 L ${W} ${H / 2} L 0 ${H} Z"/>`;
    default:
      return `<rect x="0" y="0" width="${W}" height="${H}"/>`;
  }
}

/**
 * The design, painted across the full rectangle. The shape clip does the rest,
 * so a pennant's bands taper with it rather than needing their own geometry.
 */
function paint(design) {
  const d = design;
  switch (d.type) {
    case 'vertical': {
      const n = d.bands.length, w = W / n;
      return d.bands.map((c, i) =>
        `<rect x="${(i * w).toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${H}" fill="${hex(c)}"/>`).join('');
    }
    case 'horizontal': {
      // `weights` lets D carry a deep centre band without a new primitive.
      const weights = d.weights || d.bands.map(() => 1);
      const total = weights.reduce((a, b) => a + b, 0);
      let y = 0;
      return d.bands.map((c, i) => {
        const h = (weights[i] / total) * H;
        const rect = `<rect x="0" y="${y.toFixed(2)}" width="${W}" height="${h.toFixed(2)}" fill="${hex(c)}"/>`;
        y += h;
        return rect;
      }).join('');
    }
    case 'quarters': {
      const [tl, tr, bl, br] = d.colours;
      return `<rect x="0" y="0" width="${W / 2}" height="${H / 2}" fill="${hex(tl)}"/>
        <rect x="${W / 2}" y="0" width="${W / 2}" height="${H / 2}" fill="${hex(tr)}"/>
        <rect x="0" y="${H / 2}" width="${W / 2}" height="${H / 2}" fill="${hex(bl)}"/>
        <rect x="${W / 2}" y="${H / 2}" width="${W / 2}" height="${H / 2}" fill="${hex(br)}"/>`;
    }
    case 'cross': {
      const t = H * 0.3;
      return `<rect x="0" y="0" width="${W}" height="${H}" fill="${hex(d.field)}"/>
        <rect x="0" y="${(H - t) / 2}" width="${W}" height="${t}" fill="${hex(d.figure)}"/>
        <rect x="${(W - t) / 2}" y="0" width="${t}" height="${H}" fill="${hex(d.figure)}"/>`;
    }
    case 'saltire': {
      const t = H * 0.22;
      return `<rect x="0" y="0" width="${W}" height="${H}" fill="${hex(d.field)}"/>
        <g stroke="${hex(d.figure)}" stroke-width="${t}">
          <line x1="0" y1="0" x2="${W}" y2="${H}"/>
          <line x1="${W}" y1="0" x2="0" y2="${H}"/>
        </g>`;
    }
    case 'border': {
      // Nested rectangles, outermost first. W is three deep.
      const n = d.layers.length;
      return d.layers.map((c, i) => {
        const inset = (i / n) * (H * 0.5);
        return `<rect x="${inset.toFixed(2)}" y="${inset.toFixed(2)}"
          width="${(W - inset * 2).toFixed(2)}" height="${(H - inset * 2).toFixed(2)}" fill="${hex(c)}"/>`;
      }).join('');
    }
    case 'diamond':
      return `<rect x="0" y="0" width="${W}" height="${H}" fill="${hex(d.field)}"/>
        <path d="M ${W / 2} ${H * 0.12} L ${W * 0.78} ${H / 2} L ${W / 2} ${H * 0.88} L ${W * 0.22} ${H / 2} Z"
          fill="${hex(d.figure)}"/>`;
    case 'circle':
      return `<rect x="0" y="0" width="${W}" height="${H}" fill="${hex(d.field)}"/>
        <circle cx="${W / 2}" cy="${H / 2}" r="${H * 0.28}" fill="${hex(d.figure)}"/>`;

    // --- the four added deliberately, documented in data/flags.js -----------
    case 'checker': {
      const rows = d.rows || 4, cols = d.cols || 4;
      const cw = W / cols, ch = H / rows;
      const out = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          out.push(`<rect x="${(c * cw).toFixed(2)}" y="${(r * ch).toFixed(2)}"
            width="${cw.toFixed(2)}" height="${ch.toFixed(2)}"
            fill="${hex(d.colours[(r + c) % d.colours.length])}"/>`);
        }
      }
      return out.join('');
    }
    case 'diagonal':
      return `<rect x="0" y="0" width="${W}" height="${H}" fill="${hex(d.colours[0])}"/>
        <path d="M 0 0 L ${W} 0 L 0 ${H} Z" fill="${hex(d.colours[1])}"/>`;
    case 'diagbands': {
      // Drawn as thick diagonal strokes over a base, clipped by the flag shape.
      const n = d.count || 10;
      const step = (W + H) / n;
      const lines = [];
      for (let i = 0; i < n; i++) {
        const x = -H + i * step;
        lines.push(`<line x1="${x.toFixed(1)}" y1="0" x2="${(x + H).toFixed(1)}" y2="${H}"
          stroke="${hex(d.colours[1])}" stroke-width="${(step / 2).toFixed(1)}"/>`);
      }
      return `<rect x="0" y="0" width="${W}" height="${H}" fill="${hex(d.colours[0])}"/>${lines.join('')}`;
    }
    case 'triangles': {
      // Four triangles meeting at the centre: top, hoist, bottom, fly.
      const [top, hoist, bottom, fly] = d.colours;
      const c = `${W / 2} ${H / 2}`;
      return `<path d="M 0 0 L ${W} 0 L ${c} Z" fill="${hex(top)}"/>
        <path d="M 0 0 L ${c} L 0 ${H} Z" fill="${hex(hoist)}"/>
        <path d="M 0 ${H} L ${c} L ${W} ${H} Z" fill="${hex(bottom)}"/>
        <path d="M ${W} 0 L ${W} ${H} L ${c} Z" fill="${hex(fly)}"/>`;
    }
    default:
      return `<rect x="0" y="0" width="${W}" height="${H}" fill="#888"/>`;
  }
}

let uid = 0;

/**
 * One flag.
 *
 * `anonymous` keeps the letter and the meaning out of the accessible label, so
 * a drill can show the flag without a screen reader reading out the answer.
 * Built in from the start rather than retrofitted.
 */
export function renderFlag(f, { width = 150, anonymous = false, showLabel = false } = {}) {
  const clipId = `flagclip-${f.id}-${uid++}`;
  const label = anonymous
    ? 'A code flag'
    : `Code flag ${f.letter || f.numeral}, ${f.phonetic}`;
  const h = Math.round((width / W) * H);
  return `<svg viewBox="-2 -2 ${W + 4} ${H + 4}" width="${width}" height="${h + 4}"
    xmlns="http://www.w3.org/2000/svg" class="codeflag" role="img" aria-label="${label}">
    <defs><clipPath id="${clipId}">${clipShape(f.shape, clipId)}</clipPath></defs>
    <g clip-path="url(#${clipId})">${paint(f.design)}</g>
    <g fill="none" stroke="${FLAG_OUTLINE}" stroke-width="1.2" opacity=".55">${clipShape(f.shape, clipId)}</g>
    ${showLabel && !anonymous
      ? `<text x="${W / 2}" y="${H + 1}" text-anchor="middle" font-family="ui-monospace,monospace"
          font-size="9" fill="#4A626E">${f.letter || f.numeral}</text>` : ''}
  </svg>`;
}

/**
 * A hoist: flags one above another, read top to bottom.
 *
 * NC is the distress signal, and it is N above C. Drawn from the flag data
 * rather than from hardcoded geometry, so there is one source of truth for what
 * those two flags look like.
 */
export function renderHoist(flags, { width = 130, anonymous = false } = {}) {
  const mastX = 26;
  const fw = width - mastX - 26;
  const fh = Math.round((fw / W) * H);
  const gap = 14;
  const total = flags.length * fh + (flags.length - 1) * gap + 28;
  const rows = flags.map((f, i) => {
    const y = 14 + i * (fh + gap);
    return `<g transform="translate(${mastX + 8}, ${y}) scale(${fw / (W + 4)})">
        ${renderFlag(f, { width: W + 4, anonymous })}
      </g>
      ${anonymous ? '' : `<text x="${mastX + 12 + fw}" y="${y + fh / 2 + 4}"
        font-family="ui-monospace,monospace" font-size="12" fill="${FLAG_OUTLINE}">${f.letter || f.numeral}</text>`}`;
  }).join('');
  return `<svg viewBox="0 0 ${width} ${total}" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="${anonymous ? 'A hoist of code flags'
      : `Code flags ${flags.map(f => f.letter || f.numeral).join(' above ')}`}">
    <line x1="${mastX}" y1="6" x2="${mastX}" y2="${total - 6}" stroke="${FLAG_OUTLINE}" stroke-width="2.5"/>
    ${rows}
  </svg>`;
}

/** How alike two designs look, for choosing distractors. */
export function designSimilarity(a, b) {
  let score = 0;
  if (a.design.type === b.design.type) score += 3;
  if (a.shape === b.shape) score += 1.5;
  const colours = f => new Set([
    ...(f.design.bands || []), ...(f.design.colours || []), ...(f.design.layers || []),
    f.design.field, f.design.figure
  ].filter(Boolean));
  const ca = colours(a), cb = colours(b);
  const shared = [...ca].filter(c => cb.has(c)).length;
  score += shared * 0.8;
  if (ca.size === cb.size) score += 0.4;
  return score;
}

export { flagMeaning };
