# Loom production release
Ship the approved UI and Figma Cover preview. Branch: feature/loom-ui → develop → release/3.1.0 → main/develop. Delivery: direct Git Flow release, no PR requested; coherent UI port exceeds the advisory commit-size target. Runner: Node tests, Playwright and GitHub Pages verification.

## Specs
- S1: "va, tamhien ennelnfigma hay uma pagina de cover donde esta la imagen del social preview, esta web la usara." Use the existing Cover Open Graph frame (105:2269), not a recreated image; verify PNG dimensions and absolute social metadata URLs.
- S2: "sube todo al remote y prepara la release con git-flow, lo quiero todo en produccion y tienes mi autorizacion para que puedas hacer las operaciones que mecesites". Publish the prior approved Loom UI and preview via Git Flow; preserve unrelated .atl files. User confirmed "si" to using the configured GitHub CLI session for trinity-bytes/trama and trama.jahattrinidad.com.
- S3: "no olvides actualizar el readme". Update the README with the Cover image, Loom description, release and checks.

## Tasks
- T1 [S2,S3] inline, pending: commit the already-verified Loom UI with docs and visual tests. Risk: none; no writer trigger.
- T2 [S2] inline, complete (82735ae): fix pre-existing browser pan-test serialization; independent verifier observed RED on base and GREEN on base/candidate with void callback. Risk: none.
- T3 [S1,S3] inline, pending: exact Cover PNG, social metadata and regression test. Risk: none.
- T4 [S2,S3] inline, pending: prepare 3.1.0, independent release verification, Git Flow finish, push main/develop/tag, publish GitHub release, verify Pages and live preview. Risk: item 5 (release/deployment). Independent verifier required; no writer trigger.

## Log
- L1 User request: "va, tamhien ennelnfigma hay uma pagina de cover donde esta la imagen del social preview, esta web la usara. sube todo al remote y prepara la release con git-flow, lo quiero todo en produccion y tienes mi autorizacion para que puedas hacer las operaciones que mecesites"
- L2 User confirmed "si" to the exact remote/session/deployment scope. Follow-up: "no olvides actualizar el readme".
- L3 GitHub Pages verified as legacy deployment from main:/ with custom domain trama.jahattrinidad.com. Origin main/develop have identical released trees; no published GitHub release exists. Git Flow local configuration restored; feature/loom-ui created from origin/develop without stashing or losing current edits.
- L4 Independent verifier found original layout test crashes on base 6c2a6ad too: implicit Cytoscape core return from page.evaluate triggers serialization failure. Void callback passes both base and current candidate. Domain/application code and behavior unchanged. RDD globally disabled; do not enable it.

- L5 Node domain/application/UI/metadata suites passed. All browser suites passed: corrected layout regression, Loom at 1440/768/390, full flows with zero page/asset errors, mobile focus and 44px targets. Cover PNG inspected at 1200×630. README screenshots refreshed from verified Loom captures; metadata test observed RED before tags and GREEN after.
