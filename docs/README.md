# docs

Review material. None of it is loaded by the app.

- **STATE.md** — project state and the durable invariants: the aspect convention,
  the projection and the check that proves its sign, the arc extents, and the
  sourcing rules. Read this before changing `src/engine.js` or either renderer.
- **silhouettes.html** — the ten hull types at four aspects, daylight.
- **buoyage.html** — all sixteen marks, day and night, with the lights running
  their real rhythms.

The two HTML pages are generated from the modules in `data/` and `src/`, so they
go stale the moment the geometry changes. They are committed because reviewing a
rendering change by reading path data is not realistic. Regenerate them whenever
the profiles or the light patterns move.
