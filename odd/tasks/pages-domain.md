# Publish Trama on its custom domain
Target: GitHub Pages for trinity-bytes/trama, source main:/, domain trama.jahattrinidad.com. Use the user-authorized gh session; do not modify Cloudflare. Version stays 3.0.0; deployment configuration does not move the existing release tag.
Delivery: Git Flow feature/pages-domain into develop, deployment merge into main, push main/develop and existing tag 3.0.0. Checks: exact CNAME/readme assertions, independent deployment check, Pages API/build/TLS and live browser.

## Specs
- S1: "vamos a hacer que trama quede publicado en trama.jahattrinidad.com" and "si, seguimos en pages". Preserve the app; add root CNAME and document the canonical published URL.
- S2: "si, dale nomas. y esta el record en cloudflare" in response to authorization to use gh for trinity-bytes/trama publication and Pages configuration. Use only that GitHub session; inspect public DNS, do not mutate Cloudflare. Preserve lowercase English Conventional Commits.

## Tasks
- T1 [S1,S2] inline, complete: exact CNAME and canonical URL documentation, independent check. Risk: item 5 (Pages deployment configuration).
- T2 [S1,S2] inline, complete: integrate, publish authorized refs and verify Pages build/TLS/live UI. Risk: item 5 (remote publication).

## Log
- L1 Original user request and authorization are quoted in S1/S2. Existing Pages source main:/, build_type legacy, cname null, HTTPS enforced on old github.io URL. Remote main at 50812db; local main holds verified Trama 3.0.0. Public DNS CNAME trama.jahattrinidad.com -> trinity-bytes.github.io. Custom-domain TLS currently fails hostname validation. No Cloudflare credentials used.

- L2 T1 RED: root CNAME missing. GREEN: exact CNAME bytes, canonical README URL and unchanged app-entry assertions pass; diff whitespace passes. Independent item5 verifier confirmed relative assets and unchanged index, then requested replacing premature Live site wording; scoped recheck PASS after Canonical URL correction. No runtime source changed.
- L3 Publishing main/develop and the existing annotated 3.0.0 tag through the explicitly authorized gh GitHub session is next. No force push; remote main was fetched and verified as an ancestor of local main. No Cloudflare mutations.

- L4 T1 configuration committed as 4e6d1c7 and integrated by Git Flow into develop, then main fast-forward. Atomic authorized gh-backed push published main/develop and existing annotated tag 3.0.0. No force push; release tag unchanged.
- L5 T2 verified: Pages source main:/, custom domain trama.jahattrinidad.com, build built for 4e6d1c7 with no error. Certificate approved; HTTPS enforcement enabled and read back true. HTTP returns 301 to HTTPS; verified TLS request serves the Trama module entry.
- L6 Live Chromium checks at 1440x922 and 390x844 passed: HTTP200, 50 course elements, analysis rules, graph canvas, no page errors/failed assets/horizontal overflow. Public DNS CNAME correctly targets trinity-bytes.github.io; no Cloudflare changes. Final documentation closure changes no runtime source. Risk: item5 (deployment), independently reviewed and verified live. Physical-device/screen-reader testing remains outside these checks.
