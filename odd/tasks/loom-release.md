# Loom production release
Ship the approved UI and Figma Cover preview. Branch: feature/loom-ui → develop → release/3.1.0 → main/develop. Delivery: direct Git Flow release, no PR requested; coherent UI port exceeds the advisory commit-size target. Runner: Node tests, Playwright and GitHub Pages verification.

## Specs
- S1: "va, tamhien ennelnfigma hay uma pagina de cover donde esta la imagen del social preview, esta web la usara." Use the existing Cover Open Graph frame (105:2269), not a recreated image; verify PNG dimensions and absolute social metadata URLs.
- S2: "sube todo al remote y prepara la release con git-flow, lo quiero todo en produccion y tienes mi autorizacion para que puedas hacer las operaciones que mecesites". Publish the prior approved Loom UI and preview via Git Flow; preserve unrelated .atl files. User confirmed "si" to using the configured GitHub CLI session for trinity-bytes/trama and trama.jahattrinidad.com.
- S3: "no olvides actualizar el readme". Update the README with the Cover image, Loom description, release and checks.

## Tasks
- T1 [S2,S3] inline, complete (c553a74): commit the already-verified Loom UI with docs and visual tests. Risk: none; no writer trigger.
- T2 [S2] inline, complete (82735ae): fix pre-existing browser pan-test serialization; independent verifier observed RED on base and GREEN on base/candidate with void callback. Risk: none.
- T3 [S1,S3] inline, complete (c553a74): exact Cover PNG, social metadata and regression test. Risk: none.
- T4 [S2,S3] inline, complete (6e12fb3; main/tag 357c5dc; develop 40b8362): prepare 3.1.0, independent release verification, Git Flow finish, push main/develop/tag, publish GitHub release, verify Pages and live preview. Risk: item 5 (release/deployment). Independent verifier required; no writer trigger.

## Log
- L1 User request: "va, tamhien ennelnfigma hay uma pagina de cover donde esta la imagen del social preview, esta web la usara. sube todo al remote y prepara la release con git-flow, lo quiero todo en produccion y tienes mi autorizacion para que puedas hacer las operaciones que mecesites"
- L2 User confirmed "si" to the exact remote/session/deployment scope. Follow-up: "no olvides actualizar el readme".
- L3 GitHub Pages verified as legacy deployment from main:/ with custom domain trama.jahattrinidad.com. Origin main/develop have identical released trees; no published GitHub release exists. Git Flow local configuration restored; feature/loom-ui created from origin/develop without stashing or losing current edits.
- L4 Independent verifier found original layout test crashes on base 6c2a6ad too: implicit Cytoscape core return from page.evaluate triggers serialization failure. Void callback passes both base and current candidate. Domain/application code and behavior unchanged. RDD globally disabled; do not enable it.

- L5 Node domain/application/UI/metadata suites passed. All browser suites passed: corrected layout regression, Loom at 1440/768/390, full flows with zero page/asset errors, mobile focus and 44px targets. Cover PNG inspected at 1200×630. README screenshots refreshed from verified Loom captures; metadata test observed RED before tags and GREEN after.

- L6 Feature commits: 82735ae (test harness), c553a74 (cohesive Loom UI/preview/docs/tests; 717 changed lines including 93-line license and Figma SVG exports; no PR requested). Git Flow integrated into develop and started release/3.1.0. VERSION, About, README badge and changelog synchronized to 3.1.0. Independent release verification follows before publication.

- L7 Independent verifier approved S1/S3 and local S2 preparation at 6e12fb3: exact PNG hash 78f70ca4136665b87aa429b3748ef9fa43e58d91d1ce57ef25bcc0378245c61a, metadata test passes, release/version/docs/ancestry consistent; publication still pending. Parent reran metadata test and diff check.

- L8 Git Flow release finish produced main 357c5dc and develop 40b8362, annotated tag 3.1.0; released trees identical and tag ancestor of both. Atomic push published main/develop/tag. GitHub release https://github.com/trinity-bytes/trama/releases/tag/3.1.0 is public, stable, not draft.
- L9 Pages reports built for exact 357c5dc245218dfccecb54c95e17ccadf8453ba2. Live VERSION is 3.1.0; public OG/Twitter tags correct; public PNG hash exactly matches Cover export. Loom browser suite passed against https://trama.jahattrinidad.com at 1440/768/390. No pending checks; real screen-reader/physical-device and third-party social crawler cache behavior not directly tested. Final work log is committed on develop; main/tag retain the verified release source. RDD disabled/unmanaged.
