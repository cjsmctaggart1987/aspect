# Aspect — project state

> Snapshot, not a spec. The invariants below are durable; the commit list and
> open items are true as of the commit that last touched this file.

A study aid for the navigation rules: what a vessel's lights and shapes tell you,
and what the marks in a channel mean. Every picture is generated from a rule and a
viewing angle. There are no stored diagrams.

- **Remote:** https://github.com/cjsmctaggart1987/aspect — public, no licence file (all rights reserved)
- **Stack:** plain ES modules, no bundler, no framework. `serve` for dev, two Node scripts.
- **State:** working tree clean, `main` in sync with origin, 13 commits.

---

## Invariants — do not "fix" these

**Aspect** is the bearing of the observer from the target vessel's bow, measured
clockwise. 0 head-on, 90 her starboard beam, 180 dead astern of her, 270 her port beam.
It is not your heading and it is not a relative bearing.

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

**Everything projects the same way.** Lights, day shapes and every silhouette structure
are points, boxes or plates in ship coordinates put through the same `project()`.
Nothing is drawn in a fixed pose, which is why the picture cannot contradict itself as
the aspect changes.

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
index.html              markup, styling, app as an ES module      436 lines
vendor/ts-fsrs.js       vendored FSRS lib, generated               60 KB
data/vessel-states.js   30 vessel states                           576
data/buoyage.js         16 buoyage marks                           270
src/engine.js           arcs, projection, question generation      146
src/render-lights.js    scene and aspect dial renderers            393
src/render-buoy.js      buoy renderer                              140
src/scheduler.js        spaced repetition (FSRS)                   171
build.cjs               regenerates the single-file bundle          85
vendor.cjs              refreshes vendor/ts-fsrs.js                 41
aspect-standalone.html  build output, committed on purpose        141 KB
docs/                   review material, never loaded by the app
```

`aspect-standalone.html` is a build artifact committed deliberately: it is the form you
hand to someone with no network. It runs from `file://` — no server needed.

**Module types.** The package is `"type": "module"`, which is what `data/`, `src/` and
`vendor/` always were. The two build-time scripts are genuinely CommonJS and carry
`.cjs`, which is CommonJS whatever the type field says. Node can therefore import the
app's real modules directly from the repo root, with no scratch copy.
`src/scheduler.js` is the exception: it needs a browser for `localStorage`.

**Build rule:** `build.cjs` strips `export ` from top-level declarations and **blanks
import and `export { ... }` lines rather than deleting them**, so bundle line numbers
still match source line numbers. The build is reproducible byte for byte.
`.gitattributes` pins LF because `core.autocrlf` was on globally and a CRLF checkout
would silently break that.

**Why ts-fsrs is vendored:** there is no bundler. A bare specifier means nothing to a
browser, and serving `node_modules` would tie the app to an install layout.
`npm run vendor` regenerates it; `package.json` is the source of truth for the version.

## Commands

```
npm install
npm run dev      # serve on :5173 — the module version needs HTTP, not file://
npm run build    # regenerate aspect-standalone.html
npm run vendor   # refresh vendor/ts-fsrs.js from node_modules
```

To just look at it: double-click `aspect-standalone.html`.

---

## Commits — 13, all pushed

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
| `3da7a41` | Add docs: project state and rendering review sheets |
| `003388d` | Declare the package as ESM, move Node scripts to .cjs |
| `3e0dbd8` | Draw a distinct silhouette for each type of vessel |
| `b604a66` | Show buoyage light rhythms, and add a night view |

### Spaced repetition — `src/scheduler.js`

Card key `stateId:aspect:questionType`, 480 cards, created lazily on first exposure.
Most-overdue-first selection, falling back to unseen, then to soonest-due. One attempt
per card: right first time is Good, wrong is Again, and a "that was easy" control
replaces the Good with an Easy by restoring the card's pre-review state and re-running
it rather than reviewing twice. All state in one versioned `localStorage` key
(`aspect.review.v1`) — no account, no backend, no cookie. Reset behind a confirm.

`engine.js` and the renderers are untouched by it. `index.html` builds the question for
the chosen card using the engine's exported `distractors` and `shuffle`, because
`makeQuestion` picks its own state and aspect, which is the thing the scheduler exists
to override.

### Vessel silhouettes — `src/render-lights.js`

A `hull` field on every state and ten profiles: `cargo` (4 states), `small-power` (9),
`sail` (4), `fishing` (4), `tug` (3), `pilot` (2), `barge`, `dredger`, `hovercraft`,
`wig`. Stations are fractions of the half length, so one profile fits a 32 m ship and a
5 m one. This replaced a heuristic that placed the deckhouse at the mean of the visible
lights, which wandered as lights came in and out of view with aspect.

### Day shapes

Sized as a diameter in metres through the state scale with a 14px floor. `cones-apex`
takes one mounting height and draws both cones from it, apexes exactly coincident; used
by all four fishing states at 13.5 m.

### Buoyage rhythms — `data/buoyage.js`, `src/render-buoy.js`

A `pattern` field on all 16 marks: lit spans in seconds within a period, worked from
Part 62. The prose `rhythm` stays and stays authoritative. Strip drawn above the
topmark, one period left to right, in the light's own colour, period labelled. Very
quick drawn at 120/min; the quick alternative stays in the card text.

Five marks have no prescribed rhythm — the four laterals and `special` — and show one
plausible character labelled as an example.

A night button drops the body to 14% opacity, darkens card and water, and blinks the
light on a SMIL cycle one period long.

---

## Verification

All checks are geometric, run in Node against the real modules imported directly from
the repo root. Currently green:

- 30 states × 360 aspects: **zero visible lights falling outside the hull**
- 30 states × 48 aspect/mode combinations: no NaN or undefined
- 2520 deck structures at 5° steps: none overhanging the hull
- Sail 113.8 units wide on her beam, 0.00 head-on, mirrors correctly between beams
- Sternlight alone at exactly 135°, 112/113 arc boundary intact
- 16 buoy clip ids unique, none named `bodyClip`
- Flash counts off rendered SVG: N 6, E 3, S 6+LFl, W 9, isolated 2, preferred 2+1
- 33 SMIL animations, keyTimes monotonic and normalised 0→1

**The test suites are not in the repo.** They live in a scratch directory and will not
survive the session. See open items.

**Fixed bug worth remembering:** `render-buoy.js` used a single hardcoded
`clipPath id="bodyClip"` for every mark. Twelve marks in one document meant every
`url(#bodyClip)` resolved to whichever came first, so every buoy body was clipped to
the can shape of the port hand mark — cones and spheres drew their correct outline over
a can-shaped block of colour. Now `clip-<mark.id>`.

---

## Open items

1. **Nothing has been reviewed by eye.** The silhouettes and rhythm strips are verified
   geometrically only. Recognisability and proportion are judgement calls geometry
   cannot settle. Contact sheets: `docs/silhouettes.html`, `docs/buoyage.html`.
2. **`SHAPE_D_M = 1.5`** in `render-lights.js` is an assumption, not a rule value.
   Annex I's minimum is 0.6 m, unreadable at this scale, so the 14px floor dominates on
   large vessels.
3. **The `HULLS` proportions are invented** — where a funnel sits, how tall a gantry is.
   Only the projection behaviour is load-bearing.
4. **Reduced motion is still unfixed for the vessel lights.** The page's
   `prefers-reduced-motion` CSS rule only suppresses CSS animation; SMIL ignores it. The
   buoy lamp threads an explicit `motion` flag and checks `matchMedia`. The vessels'
   flashing yellow does not, and has been animating for reduced-motion users throughout.
5. **Commit the test suites** so verification survives and anyone can run it.
6. `data/buoyage.js` contains "Cayman, the Americas and Japan are Region B" in teaching
   text. Factual about IALA region membership, but a geographic tell in a public repo.

## Environment notes

- Windows, Git Bash available. Escaping `\d` and `\\` through heredocs is unreliable —
  build regexes by string concatenation or `String.fromCharCode(10)` instead.
- The browser automation in this setup connects to a Chrome instance that **cannot reach
  `localhost`** (`ERR_CONNECTION_REFUSED` while `curl` gets 200 on the same machine), so
  no rendering has been verified visually by the agent.
- Stage explicit paths rather than `git add -A`. `-A` once swept unreviewed work into an
  unrelated commit, which then had to be split and force-pushed.
