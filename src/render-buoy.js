/** Buoy renderer. Body form, colour bands and topmark all come from the data. */

export const HEX = {
  red: '#D0231C', green: '#0E9E4F', yellow: '#F2C200',
  black: '#141A1E', white: '#F6F4EE', blue: '#1B5FBF'
};

export function bandRects(bands, x, y, w, h) {
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

export function body(mark) {
  const y = -10, h = 62, w = 46, x = -w / 2;
  const clip = {
    can: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/>`,
    cone: `<path d="M 0 ${y} L ${w / 2} ${y + h} L ${-w / 2} ${y + h} Z"/>`,
    sphere: `<circle cx="0" cy="${y + h / 2}" r="${w / 2 + 2}"/>`,
    pillar: `<path d="M ${x + 8} ${y} L ${-x - 8} ${y} L ${-x} ${y + h} L ${x} ${y + h} Z"/>`
  }[mark.body];
  return `<defs><clipPath id="bodyClip">${clip}</clipPath></defs>
    <g clip-path="url(#bodyClip)">${bandRects(mark.bands, x - 4, y - 4, w + 8, h + 8)}</g>
    <g fill="none" stroke="#0B1116" stroke-width="1.4" opacity=".6">${clip}</g>`;
}

export function topmark(tm) {
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

export function renderBuoy(mark) {
  return `<svg viewBox="-70 -90 140 180" xmlns="http://www.w3.org/2000/svg"
    role="img" aria-label="${mark.name}">
    <line x1="-56" y1="52" x2="56" y2="52" stroke="#8FA8B3" stroke-width="1.5"/>
    <g>${topmark(mark.topmark)}${body(mark)}</g>
  </svg>`;
}
