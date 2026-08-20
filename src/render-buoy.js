/** Buoy renderer. Body form, colour bands and topmark all come from the data. */

const HEX = {
  red: '#D0231C', green: '#0E9E4F', yellow: '#F2C200',
  black: '#141A1E', white: '#F6F4EE', blue: '#1B5FBF'
};

function bandRects(bands, x, y, w, h) {
  if (bands.length === 1 && bands[0].includes('vertical')) {
    const cols = bands[0].startsWith('red') ? ['red', 'white'] : ['blue', 'yellow'];
    const n = 6, sw = w / n;
    return Array.from({ length: n }, (_, i) =>
      `<rect x="${x + i * sw}" y="${y}" width="${sw}" height="${h}" fill="${HEX[cols[i % 2]]}"/>`).join('');
  }
  const sh = h / bands.length;
  return bands.map((b, i) =>
    `<rect x="${x}" y="${y + i * sh}" width="${w}" height="${sh}" fill="${HEX[b] || '#888'}"/>`).join('');
}

function body(mark) {
  const y = -10, h = 62, w = 46, x = -w / 2;
  const clip = {
    can: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/>`,
    cone: `<path d="M 0 ${y} L ${w / 2} ${y + h} L ${-w / 2} ${y + h} Z"/>`,
    sphere: `<circle cx="0" cy="${y + h / 2}" r="${w / 2 + 2}"/>`,
    pillar: `<path d="M ${x + 8} ${y} L ${-x - 8} ${y} L ${-x} ${y + h} L ${x} ${y + h} Z"/>`
  }[mark.body];
  const cid = `clip-${mark.id}`;
  return `<defs><clipPath id="${cid}">${clip}</clipPath></defs>
    <g clip-path="url(#${cid})">${bandRects(mark.bands, x - 4, y - 4, w + 8, h + 8)}</g>
    <g fill="none" stroke="#0B1116" stroke-width="1.4" opacity=".6">${clip}</g>`;
}

function topmark(tm) {
  if (!tm) return '';
  const f = HEX[tm.color], baseY = -18;
  switch (tm.form) {
    case 'can': return `<rect x="-11" y="${baseY - 20}" width="22" height="22" fill="${f}"/>`;
    case 'cone-up': return `<path d="M 0 ${baseY - 22} L 12 ${baseY} L -12 ${baseY} Z" fill="${f}"/>`;
    case 'sphere': return `<circle cx="0" cy="${baseY - 11}" r="12" fill="${f}"/>`;
    case 'spheres': return `<circle cx="0" cy="${baseY - 10}" r="9" fill="${f}"/>
      <circle cx="0" cy="${baseY - 30}" r="9" fill="${f}"/>`;
    case 'cones-up': return `<path d="M 0 ${baseY - 20} L 11 ${baseY} L -11 ${baseY} Z" fill="${f}"/>
      <path d="M 0 ${baseY - 42} L 11 ${baseY - 22} L -11 ${baseY - 22} Z" fill="${f}"/>`;
    case 'cones-down': return `<path d="M 0 ${baseY} L 11 ${baseY - 20} L -11 ${baseY - 20} Z" fill="${f}"/>
      <path d="M 0 ${baseY - 22} L 11 ${baseY - 42} L -11 ${baseY - 42} Z" fill="${f}"/>`;
    case 'cones-base': return `<path d="M 0 ${baseY - 42} L 11 ${baseY - 21} L -11 ${baseY - 21} Z" fill="${f}"/>
      <path d="M 0 ${baseY} L 11 ${baseY - 21} L -11 ${baseY - 21} Z" fill="${f}"/>`;
    case 'cones-point': return `<path d="M 0 ${baseY - 21} L 11 ${baseY - 42} L -11 ${baseY - 42} Z" fill="${f}"/>
      <path d="M 0 ${baseY - 21} L 11 ${baseY} L -11 ${baseY} Z" fill="${f}"/>`;
    case 'cross': return `<path d="M -12 ${baseY - 24} L 0 ${baseY - 13} L 12 ${baseY - 24} L 5 ${baseY - 12}
      L 12 ${baseY} L 0 ${baseY - 11} L -12 ${baseY} L -5 ${baseY - 12} Z" fill="${f}"/>`;
    default: return '';
  }
}

/** The colour a mark's light actually shows. */
const lightHex = mark => HEX[mark.lightColor] || HEX.white;

/**
 * The light character as a strip: one period left to right, lit spans filled.
 *
 * Drawn at every hour of the day because the whole point is comparison. Two
 * cardinals side by side differ only in how many marks are in the strip, which
 * is exactly the thing that is hard to hold in your head from the prose.
 */
function rhythmStrip(mark) {
  const p = mark.pattern;
  if (!p) return '';
  const x0 = -58, w = 116, y = -112, h = 10;
  const at = t => x0 + (t / p.period) * w;

  const lit = p.on.map(([a, b, colour]) => {
    const x = at(a), sw = Math.max(1.4, at(b) - at(a));
    return `<rect x="${x.toFixed(1)}" y="${y}" width="${sw.toFixed(1)}" height="${h}"
      fill="${colour ? HEX[colour] : lightHex(mark)}"/>`;
  }).join('');

  return `<g>
    <rect x="${x0}" y="${y}" width="${w}" height="${h}" fill="#0B1116" opacity=".10"/>
    ${lit}
    <rect x="${x0}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#0B1116"
      stroke-width="1" opacity=".45"/>
    <text x="${x0 + w}" y="${y - 4}" text-anchor="end" font-family="ui-monospace,monospace"
      font-size="9" fill="#4A626E">${p.example ? 'example · ' : ''}${p.period}s</text>
  </g>`;
}

/**
 * The light itself, above the topmark.
 *
 * By night it keeps the mark's real rhythm through one SMIL cycle per period.
 * `motion` is threaded in rather than assumed: a reduced-motion reader gets the
 * light lit and steady, because a light that never comes on reads as no light
 * at all, which would be worse than no animation.
 */
function lamp(mark, mode, motion) {
  const p = mark.pattern;
  const y = -74, colour = lightHex(mark);
  if (mode !== 'night') {
    return `<circle cx="0" cy="${y}" r="3" fill="${colour}" opacity=".28"/>`;
  }
  // Build the on/off envelope for one period.
  let times = [0], vals = [0];
  for (const [a, b] of p.on) {
    times.push(a / p.period, a / p.period, b / p.period, b / p.period);
    vals.push(0, 1, 1, 0);
  }
  times.push(1); vals.push(0);
  const anim = motion
    ? `<animate attributeName="opacity" values="${vals.join(';')}"
         keyTimes="${times.map(t => t.toFixed(4)).join(';')}"
         dur="${p.period}s" repeatCount="indefinite"/>`
    : '';
  // Alternating marks change colour as well as blinking.
  const alt = p.on.filter(o => o[2]);
  const colourAnim = motion && alt.length
    ? `<animate attributeName="fill" values="${p.on.map(o => HEX[o[2]]).join(';')};${HEX[alt[0][2]]}"
         keyTimes="${p.on.map(o => (o[0] / p.period).toFixed(4)).join(';')};1"
         dur="${p.period}s" repeatCount="indefinite"/>`
    : '';
  return `<g>
    <circle cx="0" cy="${y}" r="13" fill="${colour}" opacity=".16">${motion ? anim : ''}</circle>
    <circle cx="0" cy="${y}" r="4" fill="${colour}">${anim}${colourAnim}</circle>
  </g>`;
}

export function renderBuoy(mark, mode = 'day', motion = true, { anonymous = false } = {}) {
  const night = mode === 'night';
  // At night the paint is gone: the rhythm is what identifies her.
  const bodyOpacity = night ? 0.14 : 1;
  const water = night ? '#101922' : '#8FA8B3';
  return `<svg viewBox="-70 -124 140 214" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="${anonymous ? 'An unidentified mark' : mark.name}${night ? ', as seen at night' : ''}">
    ${rhythmStrip(mark)}
    <line x1="-56" y1="52" x2="56" y2="52" stroke="${water}" stroke-width="1.5"/>
    ${lamp(mark, mode, motion)}
    <g opacity="${bodyOpacity}">${topmark(mark.topmark)}${body(mark)}</g>
  </svg>`;
}
