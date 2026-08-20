/**
 * Sound signals, synthesised. No audio files.
 *
 * Everything is built from oscillators and shaped noise, for the same reason
 * every diagram in this project is generated: a recording is a stored answer,
 * and a stored answer drifts from the rule it came from. A whistle here is the
 * Annex III frequency band for that length of vessel, so the pitch question is
 * asking about the rule rather than about a sample somebody chose.
 *
 * The AudioContext is created on the first play() and never at module load.
 * Browsers block audio started without a user gesture, and a context created
 * on load arrives suspended and stays that way.
 */

import { bandFor, BLAST } from '../data/sound-signals.js';

let ctx = null;
let master = null;
let playing = null;      // { stopAt, nodes: [] }

/** Created lazily, on a gesture. Resumed if the browser suspended it. */
async function context() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') await ctx.resume();
  return ctx;
}

export const isSupported = () => !!(window.AudioContext || window.webkitAudioContext);

/** A short burst of filtered noise, reused for whistle breath and strike transients. */
function noiseBuffer(seconds) {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/**
 * A ship's whistle.
 *
 * A single sine reads as a test tone, not a vessel. What makes it a whistle is
 * the fundamental plus a few harmonics that are not quite in tune with each
 * other, and a little air noise underneath. The envelope has real attack and
 * release because a whistle takes a moment to sound and a moment to die, and
 * because a hard edge on a gain node is an audible click.
 */
function whistle(at, seconds, hz, nodes) {
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, at);
  out.gain.exponentialRampToValueAtTime(0.9, at + 0.06);      // attack
  out.gain.setValueAtTime(0.9, at + seconds - 0.09);
  out.gain.exponentialRampToValueAtTime(0.0001, at + seconds); // release
  out.connect(master);
  nodes.push(out);

  // Slightly detuned partials: a real whistle is a resonating column, not a tone.
  const partials = [[1, 1], [2, 0.42], [3, 0.2], [4.02, 0.09]];
  for (const [mult, level] of partials) {
    const osc = ctx.createOscillator();
    osc.type = mult === 1 ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(hz * mult, at);
    // A touch of drift stops it sounding synthetic and dead.
    osc.frequency.linearRampToValueAtTime(hz * mult * 0.995, at + seconds);
    const g = ctx.createGain();
    g.gain.value = level * (mult === 1 ? 0.35 : 1) * 0.3;
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + seconds + 0.05);
    nodes.push(osc, g);
  }

  // Breath.
  const air = ctx.createBufferSource();
  air.buffer = noiseBuffer(seconds + 0.1);
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = hz * 3;
  band.Q.value = 1.2;
  const ag = ctx.createGain();
  ag.gain.value = 0.05;
  air.connect(band).connect(ag).connect(out);
  air.start(at);
  air.stop(at + seconds + 0.05);
  nodes.push(air, band, ag);
}

/**
 * A struck metal instrument: bell or gong.
 *
 * Bells are inharmonic — the partials are not integer multiples, which is why a
 * bell has a pitch you can hum but does not sound like an organ. The ratios
 * below are roughly those of a struck bell. A gong is the same construction an
 * octave or so down, with longer decay and denser partials.
 */
function struck(at, seconds, { base, ratios, decay, strike }, nodes) {
  const out = ctx.createGain();
  out.gain.value = 1;
  out.connect(master);
  nodes.push(out);

  for (const [ratio, level] of ratios) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = base * ratio;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level, at + 0.004);   // near-instant attack
    g.gain.exponentialRampToValueAtTime(0.0001, at + seconds * decay);
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + seconds + 0.05);
    nodes.push(osc, g);
  }

  // The clack of the striker itself.
  const hit = ctx.createBufferSource();
  hit.buffer = noiseBuffer(0.05);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = base * 4;
  const hg = ctx.createGain();
  hg.gain.setValueAtTime(strike, at);
  hg.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  hit.connect(hp).connect(hg).connect(out);
  hit.start(at);
  hit.stop(at + 0.08);
  nodes.push(hit, hp, hg);
}

const BELL = { base: 620, ratios: [[1, 0.5], [2.02, 0.3], [2.98, 0.18], [4.2, 0.1], [5.4, 0.06]], decay: 1, strike: 0.25 };
const GONG = { base: 190, ratios: [[1, 0.5], [1.48, 0.32], [2.1, 0.22], [2.9, 0.14], [3.7, 0.09], [5.1, 0.05]], decay: 1, strike: 0.18 };

/** Rapid ringing: repeated strikes for the span, rather than one long note. */
function ringing(at, seconds, voice, nodes, every = 0.28) {
  for (let t = 0; t < seconds - 0.05; t += every) {
    struck(at + t, Math.min(1.4, seconds - t + 0.6), voice, nodes);
  }
}

/**
 * Play a whole signal.
 *
 * `lengthBand` selects the Annex III whistle band; it falls back to the 20 to
 * 75 m band, which is the one most vessels a small-craft skipper meets sit in.
 * Returns when the pattern has been scheduled, not when it has finished.
 */
export async function play(signal, { lengthBand } = {}) {
  stop();
  const c = await context();
  if (!c) return null;

  const band = bandFor(lengthBand);
  // Middle of the band, geometrically, so the two ends are equally far away.
  const hz = Math.round(Math.sqrt(band.hz[0] * band.hz[1]));

  const nodes = [];
  let t = c.currentTime + 0.08;
  const startedAt = t;

  for (const span of signal.pattern) {
    switch (span.type) {
      case 'short':
      case 'prolonged':
        whistle(t, span.seconds, hz, nodes);
        break;
      case 'stroke':
        struck(t, Math.min(1.5, span.seconds + 0.5), BELL, nodes);
        break;
      case 'bell':
        ringing(t, span.seconds, BELL, nodes);
        break;
      case 'gong':
        ringing(t, span.seconds, GONG, nodes, 0.42);
        break;
      default:
        break;                                   // a gap is simply time passing
    }
    t += span.seconds;
  }

  playing = { nodes, endsAt: t };
  return { startedAt, endsAt: t, hz, band: band.id };
}

/**
 * Cut cleanly, mid-pattern.
 *
 * Stopping the sources is not enough on its own: a source cut at full amplitude
 * clicks. The master gain is ramped down over a few milliseconds first, then
 * everything scheduled is torn down and the gain restored for the next play.
 */
export function stop() {
  if (!ctx || !playing) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(0.0001, now + 0.012);

  for (const node of playing.nodes) {
    try { if (typeof node.stop === 'function') node.stop(now + 0.02); } catch { /* already stopped */ }
  }
  playing = null;

  master.gain.setValueAtTime(0.0001, now + 0.03);
  master.gain.linearRampToValueAtTime(0.7, now + 0.06);
}

/** Whether a signal is still sounding, for button state. */
export const isPlaying = () => !!(ctx && playing && ctx.currentTime < playing.endsAt);
