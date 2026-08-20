# Aspect — project state

> Snapshot, not a spec. The invariants below are durable; the commit list and
> open items are true as of the commit that added this file.

A study aid for the navigation rules: what a vessel's lights and shapes tell you,
and what the marks in a channel mean. Every picture is generated from a rule and a
viewing angle. There are no stored diagrams.

- **Remote:** https://github.com/cjsmctaggart1987/aspect — public, no licence file (all rights reserved)
- **Stack:** plain ES modules, no bundler, no framework. `serve` for dev, one Node script to build.

---

## Invariants — do not "fix" these

**Aspect** is the bearing of the observer from the target vessel's bow, measured
clockwise. 0 head-on, 90 her starboard beam, 180 dead astern of her, 270 her port beam.
It is not your heading and not a relative bearing.

**Ship coordinates:** `x` forward, `y` to starboard, `z` above the waterline. Metres.

**Projection:**

```
screen_x = x · sin(aspect) − y · cos(aspect)
```

This sign convention is verified and correct. At aspect 0 it collapses to
`screen_x = −y`, so her green starboard sidelight appears on the observer's **left**.
That is what you see from a real bridge wing. It reads as inverted if you treat it as
a heading rotation, which is why it gets wrongly "corrected".

**Light arcs** are computed in `src/engine.js` from the arc name, never stored per
state: masthead 225°, sidelights 112.5° each, sternlight 135°, all-round 360°.

**Sourcing:** rule text worked from 33 CFR Subchapter E, buoyage from 33 CFR Part 62,
both US Government works. Never reproduce IALA or IMO publication text or diagrams —
IALA is a non-governmental association and its publications are its copyright. All
diagrams are generated at runtime; no bitmaps, no traced figures.

---

## Layout and dependency order

Nothing may reference anything later in this list. `build.cjs` concatenates in exactly
this order, so a backward import produces a bundle that throws on load even though the
module build runs fine.

```
index.html              markup, styling, app as an ES module   436 lines
vendor/ts-fsrs.js       vendored FSRS lib, generated            60 KB
data/vessel-states.js   30 vessel states                        576
data/buoyage.js         16 buoyage marks                        270
src/engine.js           arcs, projection, question generation   146
src/render-lights.js    scene and aspect dial renderers         393
src/render-buoy.js      buoy renderer                           140
src/scheduler.js        spaced repetition (FSRS)                171
build.cjs               regenerates the single-file bundle       85
vendor.cjs              refreshes vendor/ts-fsrs.js              41
aspect-standalone.html  build output, committed on purpose
```

`aspect-standalone.html` is a build artifact but is committed deliberately: it is the
form you hand to someone with no network. It works from `file://` — no server needed.

**Build rule:** `build.cjs` strips `export ` from top-level declarations and **blanks
import and `export { ... }` lines rather than deleting them**, so bundle line numbers
still match source line numbers. The build is reproducible byte for byte.
`.gitattributes` pins LF because `core.autocrlf` was on globally and a CRLF checkout
would silently break that.

**Why vendored:** there is no bundler. A bare specifier means nothing to a browser and
serving `node_modules` would tie the app to an install layout. `npm run vendor`
regenerates it; `package.json` is the source of truth for the version.

## Commands

```
npm install
npm run dev      # serve on :5173 — module version needs HTTP, not file://
npm run build    # regenerate aspect-standalone.html
npm run vendor   # refresh vendor/ts-fsrs.js from node_modules
```

---

## Committed — 9 commits, all pushed, main in sync

| | |
|---|---|
| `f1767fc` | Split the standalone bundle back into source modules |
| `d885a53` | Track .gitattributes and package-lock.json |
| `0263f10` | Update renderers and app shell to the newer upstream revision |
| `2d1ee48` | Widen the hull plan to cover outboard lights |
| `c69200e` | Size day shapes in metres and add a cones-apex form |
| `770cbf5` | Move the ram-anchored forward anchor light inside the stem |
| `5cf7bc3` | Add README |
| `c1cfd1b` | Schedule the drill with FSRS |
| `096d0f1` | Migrate the fishing-gear-150 cone pair to cones-apex |

**Spaced repetition** (`src/scheduler.js`): card key `stateId:aspect:questionType`,
480 cards, created lazily on first exposure. Most-overdue-first selection, falling back
to unseen, then to soonest-due. One attempt per card: right first time is Good, wrong is
Again, and a "that was easy" control replaces the Good with an Easy by restoring the
card's pre-review state and re-running it rather than reviewing twice. All state in one
versioned `localStorage` key (`aspect.review.v1`) — no account, no backend, no cookie.
Reset behind a confirm. `engine.js` and the renderers are untouched by it; `index.html`
builds the question for the chosen card using the engine's exported `distractors` and
`shuffle`, because `makeQuestion` picks its own state and aspect.

**Day shapes** are sized as a diameter in metres through the state scale with a 14px
floor. `SHAPE_D_M = 1.5` is an assumption, not a rule value — Annex I's minimum is 0.6 m,
which is unreadable at this scale, so the floor dominates on large vessels.
`cones-apex` takes one mounting height and draws both cones from it, apexes exactly
coincident. Used by all four fishing states at 13.5 m.

---

## UNCOMMITTED — two features awaiting visual review

716 insertions across 6 files. Both verified geometrically; **neither has been seen
rendered**. Held back deliberately because recognisability and proportion are judgement
calls that geometry cannot settle.

### 1. Vessel silhouettes

New `hull` field on all 30 states, 10 types: `cargo` (4), `small-power` (9), `sail` (4),
`fishing` (4), `tug` (3), `pilot` (2), `barge`, `dredger`, `hovercraft`, `wig`.

Every structure — deckhouse, funnel, mast, sail, gantry, lift fan, tailplane — is a box
or plate in ship coordinates put through the same `project()` the lights use, so profiles
foreshorten on their own and can never disagree with the lights standing on them. A sail
is a plate in the fore-and-aft plane, so it goes edge-on head-on. Positions are fractions
of half-length, so one profile fits a 32 m ship and a 5 m one.

Removed the heuristic that placed the deckhouse at the average of the visible lights;
each type now pins it to a station.

**The `HULLS` proportions are invented** — where a funnel sits, how tall a trawler's
gantry is, how far aft the hovercraft's fans are. This is the part needing review.

### 2. Buoyage rhythm strips and night mode

New `pattern` field on all 16 marks — structured timings worked from Part 62, lit spans
in seconds within a period, alongside the existing prose `rhythm` which stays
authoritative. Strip drawn above the topmark, one period left to right, lit spans in the
light's colour, period labelled.

Very quick drawn at 120/min; the Q alternative stays in the card text.

Five marks have no prescribed rhythm (four laterals plus `special`, "any rhythm not used
for white lights"). They show one plausible character labelled "strip shows one example".

"By night" button beside the region switch: body drops to 14% opacity, card and water go
dark, and the light blinks its real rhythm on a SMIL cycle one period long.

**Accessibility note:** the page's `prefers-reduced-motion` CSS rule only kills CSS
animation — SMIL ignores it. The vessels' flashing yellow has therefore been running for
reduced-motion users all along. The buoy lamp threads a `motion` flag and checks
`matchMedia`, rendering **lit and steady** when reduced motion is set, because a light
that never comes on reads as no light at all. **This has not been retrofitted to the
vessel lights — outstanding.**

---

## Verification

All checks are geometric, run in Node against the real modules by copying `data/` and
`src/` into a scratch dir with `{"type":"module"}` (the repo is `type: commonjs`).

Currently green:

- 30 states × 360 aspects: **zero visible lights falling outside the hull**
- 30 states × 48 aspect/mode combinations: no NaN or undefined
- 2520 deck structures across all states at 5° steps: none overhanging the hull
- Sail: 113.8 units wide on her beam, 0.00 head-on, mirrors correctly between beams
- Sternlight alone at exactly 135°, with the 112/113 arc boundary intact
- 16 buoy clip ids unique, none named `bodyClip`
- Flash counts read off rendered SVG: N 6, E 3, S 6+LFl, W 9, isolated 2, preferred 2+1
- 33 SMIL animations, keyTimes monotonic and normalised 0→1

**Fixed bug worth remembering:** `render-buoy.js` used a single hardcoded
`clipPath id="bodyClip"` for every mark. Twelve marks in one document meant every
`url(#bodyClip)` resolved to whichever came first, so every buoy body was clipped to the
can shape of the port hand mark — cones and spheres drew their correct outline over a
can-shaped block of colour. Now `clip-<mark.id>`.

---

## Open items

1. **Visual review of both uncommitted features**, then commit.
2. `SHAPE_D_M = 1.5` — assumption, not a rule value.
3. `HULLS` proportions — invented.
4. Retrofit the reduced-motion fix to the vessel lights.
5. `data/buoyage.js` contains "Cayman, the Americas and Japan are Region B" in teaching
   text. Factual about IALA region membership, but it is a geographic tell in a public repo.

## Environment notes

- Windows. Git Bash available; escaping `\d` / `\\` through heredocs is unreliable —
  build regexes from string concatenation or `String.fromCharCode(10)` instead.
- The browser automation available in this setup connects to a Chrome instance that
  **cannot reach `localhost`** (`ERR_CONNECTION_REFUSED` while `curl` gets 200 on the same
  machine). All visual verification has therefore been done by the human, or not at all.
- The repo is `type: commonjs`, so Node cannot import the app's ES modules directly.
