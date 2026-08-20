/**
 * Sound signals, drawn.
 *
 * An audio-only question is unanswerable for anyone deaf, anyone with no
 * sound, and anyone sitting somewhere they cannot turn it on. So every signal
 * is also readable: the pattern laid out left to right in time, filled spans
 * for blasts, empty for the gaps between them.
 *
 * This deliberately shares the visual language of the buoyage rhythm strip
 * rather than the code. The two describe different things — a light character
 * repeating forever against a sound pattern with a beginning and an end — and
 * fusing them would mean one function serving two masters, which is how the
 * buoyage renderer ended up with a hardcoded clip id shared across twelve
 * marks. Same idiom, separate module, on purpose.
 */

const INK = '#0B1116';
const SOFT = '#4A626E';

/** A blast is filled, a gap is not. Bell and gong are hatched to read as struck. */
const FILL = {
  dit: '#10222C',
  dah: '#10222C',
  report: '#C3006B',
  continuous: '#10222C',
  short: '#10222C',
  prolonged: '#10222C',
  stroke: '#C3006B',
  bell: 'url(#ring)',
  gong: 'url(#ring)'
};

// Read as a mariner would say it: "two prolonged blasts", not "two prolongeds".
const LABEL = {
  dit: ['dit', 'dits'],
  dah: ['dah', 'dahs'],
  report: ['report', 'reports'],
  continuous: ['continuous sounding', 'continuous sounding'],
  short: ['short blast', 'short blasts'],
  prolonged: ['prolonged blast', 'prolonged blasts'],
  stroke: ['stroke', 'strokes'],
  bell: ['rapid ringing of the bell', 'rapid ringing of the bell'],
  gong: ['rapid sounding of the gong', 'rapid sounding of the gong']
};

const COUNTED = new Set(['short', 'prolonged', 'stroke', 'dit', 'dah', 'report']);

/**
 * The whole signal as one strip.
 *
 * Width is fixed and time is scaled to fit, so a one-second blast and a
 * seventeen-second aground signal both fill the card. That makes the shape of
 * a signal comparable at a glance, which is the point, at the cost of the
 * strips not sharing a common scale. The seconds are labelled so the trade is
 * visible rather than misleading.
 */
export function signalStrip(signal, { width = 260, height = 26, anonymous = false } = {}) {
  const total = signal.seconds;
  const at = t => (t / total) * width;

  let cursor = 0;
  const spans = signal.pattern.map(span => {
    const x = at(cursor);
    const w = Math.max(1.2, at(cursor + span.seconds) - x);
    cursor += span.seconds;
    if (span.type === 'gap') return '';
    return `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${height}"
      fill="${FILL[span.type] || INK}"/>`;
  }).join('');

  // A tick every second while they are countable, then every five.
  const step = total > 20 ? 5 : 1;
  const ticks = [];
  for (let t = step; t < total; t += step) {
    ticks.push(`<line x1="${at(t).toFixed(1)}" y1="${height - 4}" x2="${at(t).toFixed(1)}" y2="${height}"
      stroke="${INK}" stroke-width="0.75" opacity=".35"/>`);
  }

  return `<svg viewBox="0 -14 ${width} ${height + 20}" xmlns="http://www.w3.org/2000/svg"
    class="sigstrip" role="img" aria-label="${anonymous ? 'A signal pattern' : describe(signal)}">
    <defs>
      <pattern id="ring" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="4" height="4" fill="#10222C" opacity=".18"/>
        <line x1="0" y1="0" x2="0" y2="4" stroke="#10222C" stroke-width="2"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" fill="${INK}" opacity=".07"/>
    ${spans}
    ${ticks.join('')}
    <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="${INK}"
      stroke-width="1" opacity=".4"/>
    <text x="${width}" y="-4" text-anchor="end" font-family="ui-monospace,monospace"
      font-size="9" fill="${SOFT}">${total}s${signal.repeat ? ` · every ${signal.repeat}s` : ''}</text>
  </svg>`;
}

/**
 * The signal in words, for the aria-label and for anywhere the strip will not
 * fit. Counts runs so it reads "two prolonged, one short" rather than listing
 * every span.
 */
export function describe(signal) {
  const blasts = signal.pattern.filter(p => p.type !== 'gap');
  const runs = [];
  for (const b of blasts) {
    const last = runs[runs.length - 1];
    if (last && last.type === b.type) last.n++;
    else runs.push({ type: b.type, n: 1 });
  }
  const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  return runs.map(r => {
    const label = LABEL[r.type] || [r.type, r.type];
    const noun = label[r.n > 1 ? 1 : 0];
    // The bell and the gong are a continuous action, not a countable thing.
    return COUNTED.has(r.type) ? `${words[r.n - 1] || r.n} ${noun}` : noun;
  }).join(', ');
}

/**
 * A signal shown as light rather than sound.
 *
 * Morse at sea is as often an Aldis lamp as a whistle, and a learner who only
 * ever hears it will not read it off a bridge wing. The lamp flashes the same
 * spans on the same timing, driven by one SMIL cycle built from the pattern.
 *
 * `motion` is threaded through for the same reason it is everywhere else here:
 * prefers-reduced-motion suppresses CSS animation only, and SMIL ignores it. A
 * still lamp is shown lit, because a lamp that never comes on says nothing.
 */
export function lightSignal(signal, { motion = true, width = 260, height = 90, anonymous = false } = {}) {
  const total = signal.seconds;
  const cx = width / 2, cy = 40, r = 16;

  // One opacity envelope across the whole pattern: on at the start of each
  // element, off at its end, square edges so a dit reads as a dit.
  const times = [0];
  const values = [0];
  let cursor = 0;
  for (const span of signal.pattern) {
    const from = cursor / total, to = (cursor + span.seconds) / total;
    if (span.type !== 'gap') {
      times.push(from, from, to, to);
      values.push(0, 1, 1, 0);
    }
    cursor += span.seconds;
  }
  times.push(1); values.push(0);

  const anim = motion
    ? `<animate attributeName="opacity" values="${values.join(';')}"
         keyTimes="${times.map(t => Math.min(1, +t.toFixed(4))).join(';')}"
         dur="${total}s" repeatCount="indefinite"/>`
    : '';

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"
    class="lightsig" role="img" aria-label="${anonymous ? 'A character shown as light' : `${describe(signal)} shown as light`}">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#04070C"/>
    <g>
      <circle cx="${cx}" cy="${cy}" r="${r * 2.4}" fill="#FFF3D6" opacity=".13">${anim}</circle>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFF3D6">${anim}</circle>
    </g>
    <text x="${cx}" y="${height - 14}" text-anchor="middle" font-family="ui-monospace,monospace"
      font-size="10" fill="#8FA8B3">${anonymous ? '' : (signal.code || '')}</text>
  </svg>`;
}

/** A compact legend of what the fills mean, shown once per view rather than per card. */
export function stripKey() {
  return `<svg viewBox="0 0 300 14" xmlns="http://www.w3.org/2000/svg" class="sigkey" role="img"
    aria-label="Key: filled is a blast, gap is silence, hatched is a bell or gong">
    <rect x="0" y="2" width="26" height="10" fill="#10222C"/>
    <text x="31" y="11" font-family="ui-monospace,monospace" font-size="9" fill="${SOFT}">blast</text>
    <rect x="70" y="2" width="26" height="10" fill="${INK}" opacity=".07"/>
    <rect x="70" y="2" width="26" height="10" fill="none" stroke="${INK}" stroke-width="0.75" opacity=".4"/>
    <text x="101" y="11" font-family="ui-monospace,monospace" font-size="9" fill="${SOFT}">silence</text>
    <rect x="150" y="2" width="26" height="10" fill="#C3006B"/>
    <text x="181" y="11" font-family="ui-monospace,monospace" font-size="9" fill="${SOFT}">stroke</text>
    <rect x="225" y="2" width="26" height="10" fill="#10222C" opacity=".3"/>
    <text x="256" y="11" font-family="ui-monospace,monospace" font-size="9" fill="${SOFT}">bell/gong</text>
  </svg>`;
}
