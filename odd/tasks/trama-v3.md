# Trama 3.0.0
Implement the approved Trama v2 interface and architecture audit corrections. Base: 50812db. Delivery: separate Git Flow features, local develop integration, local release 3.0.0; no remote publishing. Strategy: single-pr (no PR requested). Forecast: 1,800–2,800 authored changed lines; coherent units may exceed 400 lines. Runner: Node built-in tests and browser smoke checks.

## Specs
- S1: Implement the approved Trama v2 Figma design (file ILO4n89w9g60lgf1icRJOc, page 65:2), preserving vanilla JavaScript and Cytoscape/Dagre. User authorization: "dale, procede". Include malla, graph, analysis, search, seed/regeneration, about, exports, mobile navigation and sheets. Correct the audited state, graph lifecycle, validation and accessibility defects.
- S2: "la generacion es aleatoria siempre, los datos del figma son representativos y de ejemplo, no tienen qe ser reproducidos forzosamente." Initial data remains randomly generated, not a fixed Figma fixture. Preserve explicit seed reproducibility and existing share links.
- S3: "respecto a o de bootstrap preferiria cortar de una en lugar de gradual." Replace active Bootstrap consumers in one UI cutover, not a staged live migration.
- S4: "trabaja en ramas separadas, integras en develop y luego al finalizar haces release 3.0.0 con giflow helper." Use installed Git Flow AVH 1.12.3. "ya cambie el nombre del repo a 'trama' asi que habra que solucionar eso tambien." Update local origin URL and project references; do not rename the active workspace directory or claim a published deployment.
- S5: "conventional commit siempre. full ingles y minuscula". All authored commit subjects and bodies, integration/release merge messages and tag annotations: English, lowercase, Conventional Commits; no AI attribution.

## Tasks
- T1 [S1,S2] domain/state: delegated, complete; parallel independent domain and UI units with disjoint edit surfaces and an agreed module contract. feature/domain-state. Node characterization and RED/GREEN tests. Risk: item 3 (shared state/model contracts).
- T2 [S1,S2,S3] interface: delegated, complete; independent UI unit consumes the declared domain/state contract. feature/trama-interface. Browser checks and source tests. Risk: item 3 (existing URL/navigation/export behavior), item 5 (Bootstrap removal).
- T3 [S1-S5] integration, branding, docs and verification: inline, pending. feature/trama-integration. Full tests, browser checks, independent risk verification. Risk: items 3,5.
- T4 [S4,S5] release: inline, pending. release/3.0.0. Check version, branch ancestry, tag and clean tracked tree. Risk: item 5 (local release).

## Log
- L1 Original implementation authorization: "dale, procede" after audit and user corrections in S2/S3.
- L2 Git Flow clarified by the user: installed git-flow AVH, use feature start/finish and release start/finish. Remote push is separate and is not authorized by a credential/session instruction.
- L3 Initial status: main at 50812db; only preexisting untracked .atl/ and .codegraph/. Git Flow initialized with main/develop and feature/, release/, hotfix/; current feature created. RDD globally off: do not activate review.
- L4 Figma desktop 66:2 retrieved with screenshot. Approved Grove tokens and type replace prior Bootstrap UI. Figma data is illustrative. Existing source/UI language is Spanish; preserve it. Technical docs and comments are English.

- L5 T1 RED: missing modules; GREEN: 11 domain/application tests. Seeded differential 0/1/2025 and 100 seed invariants pass. T2 RED/GREEN: presentation tests and browser flows; parent added active-view export regression, total 15 Node tests pass. Domain and UI independently authored on declared disjoint surfaces; parent staged/integrated by feature branch.
- L6 Independent verifier: S2/S3 pass; S1 initially blocked by mobile dialog restoration and compact touch targets. One correction batch added stable trigger restoration, visible navigation fallback and 44x44 minimum mobile targets. Browser regression RED (focus timeout) then GREEN; scoped independent recheck PASS. No new full review sweep. Physical devices/screen readers not tested; actual system clipboard not verified.
- L7 Native assessment attempted with named high-risk item 3; unavailable because of undeclared untracked inventory. RDD is globally OFF, so no review transaction or consent started. Independent risk verification above remains the functional proof.
- L8 Normalized generated sources with existing cached Prettier; no dependencies installed. Impeccable detector: undersized seed label corrected; font warnings waived because exact approved fonts are mandatory, graph-band stripe advisory is functional cycle-canvas context, not decoration. Screenshots inspected at 1440 and 390; third-party Figma SVGs and licensed fonts self-hosted.
