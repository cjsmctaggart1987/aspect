/**
 * The brand assets, and the one rule they must never break.
 *
 * The mark is not artwork, it is the same geometry the app teaches: a green
 * sector of 112.5 degrees, a red sector of 112.5, and a white sector of 135,
 * closing a circle exactly. Redraw it at any other angles and the logo starts
 * contradicting Rule 21 on every page it appears on.
 *
 * So these checks read the generated SVGs and measure the arcs, rather than
 * trusting that whoever last touched make-brand.cjs kept the numbers.
 */
import { readFileSync, existsSync } from 'node:fs';

const brand = f => readFileSync(`brand/${f}`, 'utf8');
const html = () => readFileSync('index.html', 'utf8');
const bundle = () => readFileSync('aspect-standalone.html', 'utf8');

const GENERATED = [
  'aspect-mark.svg', 'aspect-mark-night.svg', 'aspect-mark-mono.svg',
  'aspect-mark-reversed.svg', 'aspect-favicon.svg', 'aspect-favicon-mono.svg',
  'aspect-favicon-tiny.svg', 'aspect-lockup.svg', 'aspect-lockup-night.svg',
  'aspect-social.svg'
];
const SUPPLIED = ['aspect-mark-512.png', 'aspect-social.png', 'aspect-lockup.png'];
const DERIVED = ['apple-touch-icon-180.png'];

const PALETTE = {
  green: '#00A862', red: '#CE2019', white: '#FFFFFF', ink: '#0E1F28', paper: '#E7EEF0'
};

/**
 * The sector angles, read back out of the drawn path.
 *
 * Each band starts "M x y A r r 0 f 1 x2 y2" — the two endpoints on the outer
 * arc. Converting them back to bearings recovers the angle the sector spans,
 * which is the number that actually matters.
 */
function sectorAngles(svg) {
  const out = [];
  for (const m of svg.matchAll(/d="M ([\d.]+) ([\d.]+) A (\d+) \3 0 \d 1 ([\d.]+) ([\d.]+)/g)) {
    const bearing = (x, y) => (Math.atan2(x - 50, 50 - y) * 180 / Math.PI + 360) % 360;
    const a = bearing(Number(m[1]), Number(m[2]));
    const b = bearing(Number(m[4]), Number(m[5]));
    out.push(Math.round(((b - a + 360) % 360) * 10) / 10);
  }
  return out;
}

export default function run(t) {
  t.section('the asset set is present');
  t.ok('every generated SVG exists', GENERATED.every(f => existsSync(`brand/${f}`)),
    GENERATED.filter(f => !existsSync(`brand/${f}`)).join(', ') || `${GENERATED.length} files`);
  t.ok('the supplied rasters are there', SUPPLIED.every(f => existsSync(`brand/${f}`)),
    SUPPLIED.filter(f => !existsSync(`brand/${f}`)).join(', '));
  t.ok('the derived iOS icon is there', DERIVED.every(f => existsSync(`brand/${f}`)));
  t.ok('the generator and the manifest are in the folder',
    existsSync('brand/make-brand.cjs') && existsSync('brand/make-icons.cjs') &&
    existsSync('brand/aspect.webmanifest') && existsSync('brand/README.md'));

  t.section('112.5 + 112.5 + 135 = 360');
  // The one invariant. Three sectors, two of them the sidelight arcs and one
  // the sternlight arc, closing the circle with nothing left over.
  for (const file of ['aspect-mark.svg', 'aspect-favicon.svg', 'aspect-favicon-tiny.svg']) {
    const angles = sectorAngles(brand(file));
    t.ok(`${file} draws three sectors`, angles.length === 3, angles.join(' + '));
    t.ok(`${file} spans 135, 112.5 and 112.5`,
      angles.length === 3 && angles.includes(135) &&
      angles.filter(a => a === 112.5).length === 2,
      angles.join(' + '));
    t.ok(`${file} closes the circle exactly`,
      Math.abs(angles.reduce((a, b) => a + b, 0) - 360) < 0.05,
      `${angles.reduce((a, b) => a + b, 0)} degrees`);
  }

  t.section('the palette');
  const light = brand('aspect-mark.svg');
  t.ok('the mark uses the green, the red, the sternlight white and the ink',
    [PALETTE.green, PALETTE.red, PALETTE.white, PALETTE.ink].every(c => light.includes(c)));
  t.ok('the night mark keeps the geometry and changes only the colours',
    sectorAngles(brand('aspect-mark-night.svg')).join() === sectorAngles(light).join(),
    'brighter lights, paper-coloured edge, identical arcs');
  t.ok('no asset invents a colour outside the palette',
    [...light.matchAll(/#[0-9A-Fa-f]{6}/g)].map(m => m[0].toUpperCase())
      .every(c => Object.values(PALETTE).map(v => v.toUpperCase()).includes(c)),
    [...new Set([...light.matchAll(/#[0-9A-Fa-f]{6}/g)].map(m => m[0]))].join(' '));

  t.section('the header lockup is the same geometry, not a copy of it');
  const page = html();
  const inline = (page.match(/<svg class="lockup-mark"[\s\S]*?<\/svg>/) || [''])[0];
  t.ok('the mark is inlined, not linked as an image',
    inline.length > 0 && !/<img[^>]+aspect-mark/.test(page),
    'inline so it can take the night palette');
  const paths = [...brand('aspect-mark.svg').matchAll(/d="([^"]+)"/g)].map(m => m[1]);
  const missing = paths.filter(d => !inline.includes(d));
  t.ok('every path in the inline mark is a path from brand/aspect-mark.svg',
    paths.length > 0 && missing.length === 0,
    missing.length ? `${missing.length} differ` : `${paths.length} paths match`);
  t.ok('the inline mark takes its colours from custom properties',
    ['--mk-green', '--mk-red', '--mk-white', '--mk-ink'].every(v => inline.includes(`var(${v})`)));
  t.ok('the night palette is wired to those properties',
    /\.lockup\.night \.lockup-mark\{[^}]*--mk-green:\s*#00B86E/.test(page.replace(/\s+/g, ' ')
      .replace(/\.lockup\.night \.lockup-mark\{ /, '.lockup.night .lockup-mark{')) ||
    /#00B86E/.test(page),
    'brand/aspect-mark-night.svg colours');
  t.ok('the wordmark carries the lockup letter-spacing, as em so it scales',
    /letter-spacing:\.1289em/.test(page) && /letter-spacing:\.256em/.test(page),
    '4.9/38em and 3.2/12.5em, read off aspect-lockup.svg');
  t.ok('the strapline is there and the h1 still says Aspect',
    /<p class="lockup-sub">Rules of the Road<\/p>/.test(page) && /<h1>Aspect<\/h1>/.test(page));

  t.section('the head');
  t.ok('the title and description are the brand ones',
    page.includes('<title>Aspect — Rules of the Road</title>') &&
    /name="description" content="A free drill tool for COLREGs/.test(page));
  t.ok('three levels of favicon, SVG first with a PNG fallback',
    /rel="icon" href="brand\/aspect-favicon-tiny\.svg" sizes="16x16" type="image\/svg\+xml"/.test(page) &&
    /rel="icon" href="brand\/aspect-favicon\.svg" sizes="any" type="image\/svg\+xml"/.test(page) &&
    /rel="icon" href="brand\/aspect-mark-512\.png" sizes="512x512" type="image\/png"/.test(page));
  t.ok('iOS gets its own 180', /rel="apple-touch-icon" href="brand\/apple-touch-icon-180\.png" sizes="180x180"/.test(page));
  t.ok('the manifest is linked, and a theme colour is given for each palette',
    /rel="manifest" href="brand\/aspect\.webmanifest"/.test(page) &&
    /theme-color" content="#E7EEF0" media="\(prefers-color-scheme: light\)"/.test(page) &&
    /theme-color" content="#0B141B" media="\(prefers-color-scheme: dark\)"/.test(page),
    'the browser chrome should not stay pale behind a dark page');
  t.ok('there is a canonical link', /rel="canonical" href="https:\/\//.test(page));
  t.ok('Open Graph and Twitter point at the social card at 1200 by 630',
    /property="og:image" content="https:\/\/[^"]+aspect-social\.png"/.test(page) &&
    /property="og:image:width" content="1200"/.test(page) &&
    /property="og:image:height" content="630"/.test(page) &&
    /name="twitter:card" content="summary_large_image"/.test(page) &&
    /name="twitter:image" content="https:\/\/[^"]+aspect-social\.png"/.test(page));

  t.section('the manifest');
  const manifest = JSON.parse(brand('aspect.webmanifest'));
  t.ok('name, short name, theme and background are as specified',
    manifest.name === 'Aspect — Rules of the Road' && manifest.short_name === 'Aspect' &&
    manifest.theme_color === '#0E1F28' && manifest.background_color === '#E7EEF0',
    `${manifest.name} / ${manifest.short_name}`);
  t.ok('every icon it names exists',
    manifest.icons.every(i => existsSync(`brand/${i.src}`)),
    manifest.icons.map(i => i.src).join(', '));

  t.section('the standalone bundle stays self-contained');
  // It runs from file://, where a relative href resolves against whatever
  // folder it was dropped in. An icon that 404s is the least of it: the point
  // is that the file is the whole app.
  const built = bundle();
  const refs = [...built.matchAll(/(?:href|src)="([^"]+\.(?:png|svg|jpe?g|webp|ico|gif))"/gi)]
    .map(m => m[1]).filter(u => !/^data:/i.test(u));
  t.ok('the bundle loads no image from anywhere', refs.length === 0,
    refs.slice(0, 4).join(', ') || 'every icon is a data URI');
  t.ok('the tiny favicon is inlined as a data URI',
    /<link rel="icon" href="data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+" sizes="16x16"/.test(built));
  t.ok('the manifest and PNG icons are dropped rather than left dangling',
    !/rel="manifest"/.test(built) && !/apple-touch-icon/.test(built) &&
    built.includes('a file:// page has no home screen'));
  t.ok('the header mark is inline in the bundle too',
    /<svg class="lockup-mark"/.test(built) && built.includes(paths[0]));
  t.ok('the Open Graph URLs survive, because they are metadata not resources',
    /property="og:image" content="https:\/\//.test(built),
    'a crawler reads them; the page never fetches them');
}
