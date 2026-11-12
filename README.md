# Trama

A static, interactive curriculum explorer: 50 demo courses, 10 academic cycles and randomly generated prerequisite relationships. Version **3.0.0** implements the approved Grove interface without Bootstrap.

## Run locally

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Use an HTTP server rather than opening `index.html` directly: the application uses native JavaScript modules. There is no build step or backend.

## Explore

- **Malla:** select a course to inspect prerequisites, direct unlocks and indirect reach. On mobile, choose a cycle and open course details in a sheet.
- **Grafo:** explore the same directed relationships with zoom, fit and a transitive-reduction (Hasse) view.
- **Análisis:** inspect validation, prerequisite relationships and a topological order grouped by cycle.
- **Search:** find a course by its code or accent-insensitive name. Selection and results stay synchronized.
- **Demo data:** the initial curriculum is random. The seed control generates another scenario or reproduces an explicit seed. Figma examples are illustrative, not a fixed dataset.
- **Export:** download data from the current curriculum; graph image export is separate from analysis data exports.

An explicit `?seed=2025` reproduces that scenario. Share links retain the active seed. Course labels and the UI remain in Spanish.

## Architecture

- `js/domain/`: course catalogue, seeded generation, canonical edges, validation and graph algorithms.
- `js/application/`: explicit state, actions and selectors; no DOM dependencies.
- `js/ui/`: native-module application shell and view rendering.
- `js/adapters/`: graph, downloads and external browser APIs.
- `css/trama.css`: Grove tokens, components and responsive layouts.
- `tests/`: deterministic regression coverage and browser smoke checks.

Cytoscape and Dagre remain local browser dependencies. Bootstrap is not part of the active interface. `PRODUCT.md` and `DESIGN.md` record the approved product and visual constraints.

## Verification

Run the deterministic tests with a current Node.js release:

```sh
node --test tests/domain/*.test.mjs tests/application/*.test.mjs tests/ui/*.test.mjs
```

The mobile accessibility regression check runs against the local server:

```sh
TRAMA_BASE_URL=http://localhost:8000 node tests/browser/flows.mjs
TRAMA_BASE_URL=http://localhost:8000 node tests/browser/mobile-accessibility.mjs
```

Set `PLAYWRIGHT_MODULE` to an existing Playwright module path and `CHROMIUM_PATH` when Chromium is not at `/usr/bin/chromium`.

Browser verification requires Chromium and Playwright; those are development tools, not runtime dependencies. Exact observed commands and limitations are recorded in `odd/tasks/trama-v3.md`. Automated accessibility checks do not replace real screen-reader or physical-device testing.

## Local development and releases

Repository: `https://github.com/trinity-bytes/trama`.

Git Flow uses `main`, `develop`, `feature/`, `release/` and `hotfix/`. Feature branches integrate into `develop`; the local `3.0.0` release is finished with Git Flow AVH. Commit messages follow Conventional Commits in lowercase English. Pushing branches/tags, creating a GitHub release or deploying are separate operations; a local release tag does not mean publication.

## License

[MIT](LICENSE). Demo data is not an official academic curriculum.
