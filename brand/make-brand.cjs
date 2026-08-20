/* Generates the Aspect brand asset set from geometry. Run: node make-brand.cjs */
const fs = require('fs');
const path = require('path');

// Writes beside itself: this script lives in brand/, which is the asset folder.
const OUT = __dirname;
fs.mkdirSync(OUT, { recursive: true });

// ---- palette -------------------------------------------------------------
const C = {
  green:  '#00A862',
  red:    '#CE2019',
  white:  '#FFFFFF',
  ink:    '#0E1F28',
  paper:  '#E7EEF0',
  greenN: '#00B86E',
  redN:   '#E02B22',
  soft:   '#4A626E'
};

// ---- geometry ------------------------------------------------------------
const pol = (r, d) => [50 + r * Math.sin(d * Math.PI / 180), 50 - r * Math.cos(d * Math.PI / 180)];
const f2 = n => n.toFixed(2);

/** Annulus sector: outer arc, radial in, inner arc back, close. */
const band = (rIn, rOut, a, b) => {
  const [ox1, oy1] = pol(rOut, a), [ox2, oy2] = pol(rOut, b);
  const [ix1, iy1] = pol(rIn, a),  [ix2, iy2] = pol(rIn, b);
  const lg = (((b - a) % 360) + 360) % 360 > 180 ? 1 : 0;
  return `M ${f2(ox1)} ${f2(oy1)} A ${rOut} ${rOut} 0 ${lg} 1 ${f2(ox2)} ${f2(oy2)}`
       + ` L ${f2(ix2)} ${f2(iy2)} A ${rIn} ${rIn} 0 ${lg} 0 ${f2(ix1)} ${f2(iy1)} Z`;
};
const tick = (r1, r2, d, w, c) => {
  const [x1, y1] = pol(r1, d), [x2, y2] = pol(r2, d);
  return `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" stroke="${c}" stroke-width="${w}"/>`;
};
const spike = (rIn, rOut, d, hw, c) => {
  const [tx, ty] = pol(rOut, d), [ax, ay] = pol(rIn, d - hw), [bx, by] = pol(rIn, d + hw);
  return `<path d="M ${f2(tx)} ${f2(ty)} L ${f2(bx)} ${f2(by)} L ${f2(ax)} ${f2(ay)} Z" fill="${c}"/>`;
};

// mode: light | dark | mono | reversed
const pal = m =>
    m === 'dark'     ? { g: C.greenN, r: C.redN, w: C.white, i: C.paper, edge: C.paper }
  : m === 'mono'     ? { g: C.ink,    r: C.ink,  w: 'none',  i: C.ink,   edge: C.ink }
  : m === 'reversed' ? { g: C.paper,  r: C.paper, w: 'none', i: C.paper, edge: C.paper }
  :                    { g: C.green,  r: C.red,  w: C.white, i: C.ink,   edge: C.ink };

const rose = p => {
  let s = '';
  for (let d = 0; d < 360; d += 90) s += spike(41, 48, d, 6.5, p.i);
  for (let d = 45; d < 360; d += 90) s += spike(41, 45, d, 4.5, p.i);
  return s;
};
const ring = (p, step = 30) => {
  let t = '';
  for (let d = 0; d < 360; d += step) t += tick(40, d % 90 === 0 ? 33.5 : 36, d, d % 90 === 0 ? 2.6 : 1.7, p.i);
  return `<circle cx="50" cy="50" r="40" fill="none" stroke="${p.i}" stroke-width="2"/>${t}`;
};

/** The three light arcs closing the ring. 112.5 + 112.5 + 135 = 360. */
const arcs = (p, rIn, rOut, ew) => {
  const e = `stroke="${p.edge}" stroke-width="${ew}" stroke-linejoin="round"`;
  const wFill = p.w === 'none' ? `fill="none" ${e}` : `fill="${p.w}" ${e}`;
  return `<path d="${band(rIn, rOut, 112.5, 247.5)}" ${wFill}/>`
       + `<path d="${band(rIn, rOut, 0, 112.5)}" fill="${p.g}" ${e}/>`
       + `<path d="${band(rIn, rOut, 247.5, 360)}" fill="${p.r}" ${e}/>`;
};

const markBody = m => { const p = pal(m); return rose(p) + ring(p, 30) + arcs(p, 21, 33, 1.5); };
const faviconBody = m => { const p = pal(m); return rose(p) + arcs(p, 22, 38, 2); };
// At 16px the arrows collapse to specks. This is the arcs alone, heavier, no compass.
const faviconTinyBody = m => { const p = pal(m); return arcs(p, 20, 46, 2.4); };

const wrap = (body, title) =>
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${title}">
  <title>${title}</title>
${body.replace(/></g, '>\n  <')}
</svg>
`;

// ---- mark files ----------------------------------------------------------
const files = {
  'aspect-mark.svg':          wrap(markBody('light'),    'Aspect'),
  'aspect-mark-night.svg':    wrap(markBody('dark'),     'Aspect, reversed for dark backgrounds'),
  'aspect-mark-mono.svg':     wrap(markBody('mono'),     'Aspect, one colour'),
  'aspect-mark-reversed.svg': wrap(markBody('reversed'), 'Aspect, one colour reversed'),
  'aspect-favicon.svg':       wrap(faviconBody('light'), 'Aspect'),
  'aspect-favicon-mono.svg':  wrap(faviconBody('mono'),  'Aspect, one colour'),
  'aspect-favicon-tiny.svg':  wrap(faviconTinyBody('light'), 'Aspect')
};

// ---- lockup --------------------------------------------------------------
// Wordmark set in the app's own label face, with a system fallback stack.
const lockup = (m) => {
  const p = pal(m);
  const ink = m === 'dark' ? C.paper : C.ink;
  const soft = m === 'dark' ? '#8BA1AD' : C.soft;
  const rule = m === 'dark' ? '#2A3A45' : 'rgba(14,31,40,.2)';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 100" role="img" aria-label="Aspect — Rules of the Road">
  <title>Aspect — Rules of the Road</title>
  <g transform="translate(6 14) scale(0.72)">${markBody(m)}</g>
  <line x1="98" y1="26" x2="98" y2="74" stroke="${rule}" stroke-width="1"/>
  <text x="120" y="52" fill="${ink}"
    font-family="'Barlow Semi Condensed','Barlow',Helvetica,Arial,sans-serif"
    font-size="38" font-weight="600" letter-spacing="4.9">ASPECT</text>
  <text x="122" y="70" fill="${soft}"
    font-family="'Barlow Semi Condensed','Barlow',Helvetica,Arial,sans-serif"
    font-size="12.5" font-weight="400" letter-spacing="3.2">RULES OF THE ROAD</text>
</svg>
`;
};
files['aspect-lockup.svg'] = lockup('light');
files['aspect-lockup-night.svg'] = lockup('dark');

// ---- social card ---------------------------------------------------------
files['aspect-social.svg'] =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-label="Aspect — Rules of the Road">
  <title>Aspect — Rules of the Road</title>
  <defs>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(14,31,40,.10)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="${C.paper}"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <line x1="90" y1="150" x2="1110" y2="150" stroke="${C.ink}" stroke-width="2"/>
  <line x1="90" y1="500" x2="1110" y2="500" stroke="rgba(14,31,40,.2)" stroke-width="1"/>
  <g transform="translate(90 196) scale(2.30)">${markBody('light')}</g>
  <text x="368" y="300" fill="${C.ink}"
    font-family="'Barlow Semi Condensed','Barlow',Helvetica,Arial,sans-serif"
    font-size="104" font-weight="600" letter-spacing="13">ASPECT</text>
  <text x="372" y="346" fill="${C.soft}"
    font-family="'Barlow Semi Condensed','Barlow',Helvetica,Arial,sans-serif"
    font-size="27" font-weight="400" letter-spacing="8.4">RULES OF THE ROAD</text>
  <text x="370" y="424" fill="${C.ink}"
    font-family="Spectral,Georgia,serif" font-style="italic" font-size="34">Know what you are looking at.</text>
  <text x="90" y="556" fill="${C.soft}"
    font-family="'IBM Plex Mono',ui-monospace,monospace" font-size="19" letter-spacing="2.4">COLREGS · LIGHTS · SHAPES · SIGNALS · IALA BUOYAGE</text>
</svg>
`;

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), content);
}
console.log('wrote', Object.keys(files).length, 'svg files to', OUT);
