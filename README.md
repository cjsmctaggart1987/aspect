# Aspect

A drill tool for the navigation rules: what a vessel's lights and shapes tell
you, and what the marks in a channel mean.

Every picture in it is generated from a rule and a viewing angle. There are no
stored diagrams. A vessel state is a table of lights, each with a position in
ship coordinates and the name of the arc it shines through; the engine turns
that plus an observer's aspect into the set of lights actually visible, and the
renderer draws what is left. Add one state to the table and you get eight new
pictures and sixteen new drill questions for nothing.

That constraint is the whole design. If a picture cannot be derived from the
rule, it does not belong in the app.

## Running it

```
npm install
npm run dev      # serves the folder; open the printed URL
```

It must be served over HTTP rather than opened from the filesystem, because the
app loads as ES modules.

```
npm run build    # regenerates aspect-standalone.html
```

`aspect-standalone.html` is a single self-contained file with no network
dependencies at all. It is a build artifact but it is committed on purpose:
it is the form you can hand to someone who has no connection.

The build is reproducible. `build.js` strips `export` from top-level
declarations and blanks import lines in place rather than deleting them, so
line numbers in the bundle still match line numbers in the source and a stack
trace from the bundle is worth reading. A clean checkout builds a bundle
identical to the committed one; an unexpected diff from `npm run build` is a
real regression, not build noise.

## Aspect

**Aspect is the bearing of the observer from the target vessel's bow, measured
clockwise.**

| Aspect | What you are looking at |
| ------ | ----------------------- |
| 0      | Head-on. She is coming at you. |
| 90     | Her starboard beam. |
| 180    | Dead astern of her. She is going away. |
| 270    | Her port beam. |

Aspect describes *her* orientation relative to *you*. It is not your heading
and it is not a relative bearing.

### Ship coordinates

Metres, origin at the waterline amidships: `x` positive **forward**, `y`
positive **to starboard**, `z` **above the waterline**.

### The projection

```
screen_x = x · sin(aspect) − y · cos(aspect)
```

The sign convention is deliberate and it is correct. At aspect 0 the terms
collapse to `screen_x = −y`, so her starboard sidelight, at `y = +beam`, lands
at negative screen x: **viewed head-on, her green starboard light appears on
your left.** That is what you see from a real bridge wing.

It reads as inverted if you treat it as a heading rotation, which is why it
tends to get "corrected" by people who have not checked it against the picture.
Check it against the picture.

## Light arcs

Arcs are computed from the arc name, never stored per state. A light records
which arc it shines through and the engine does the rest.

| Arc | Sector | Extent |
| --- | ------ | ------ |
| Masthead | 225° | Ahead to 22.5° abaft the beam, both sides |
| Sidelight, each side | 112.5° | Ahead to 22.5° abaft that beam |
| Sternlight | 135° | 67.5° from right aft, each side |
| All-round | 360° | — |

Everything the tool knows about which lights you can see from where comes from
those four numbers plus the aspect. The aspect dial in the interface draws the
arcs directly, so dragging the observer around it shows you why the picture
changes rather than asserting it.

## Layout

```
index.html              markup, styling, and the app as an ES module
data/vessel-states.js   vessel states and their lights and day shapes
data/buoyage.js         buoyage marks, Regions A and B
src/engine.js           arcs, projection, question generation
src/render-lights.js    scene and aspect dial renderers
src/render-buoy.js      buoy renderer
build.js                regenerates the single-file bundle
```

Dependency order runs down that list and nothing may reference anything below
it. `build.js` concatenates in exactly that order, so a backward import
produces a bundle that throws on load even though the module build runs fine.

## Sources

Rule text is worked from **33 CFR Subchapter E** and buoyage from **33 CFR
Part 62**. Both are works of the United States Government and are not subject
to copyright.

**No text or diagram from any IALA or IMO publication is reproduced here, and
none should ever be added.** IALA is a non-governmental association and its
publications are its own copyright; IMO publications likewise. The US
regulations describe the same systems and are the source of truth for this
project.

**All diagrams are generated at runtime** from the data tables. There is no
bitmap, no traced figure, and no copied SVG anywhere in the repository.

## Standing

This is a study aid. It is not a substitute for the Navigation Rules, and it
is not authoritative for any operational or examination purpose.

No licence is granted. All rights reserved.
