# Trama

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

Explore a curriculum of 50 illustrative courses across 10 academic cycles and understand prerequisite relationships. The curriculum is demo data, not an institutional academic plan or an enrollment recommendation.

## Capabilities and Constraints

- Generate prerequisite relationships randomly on initial load. An explicit seed reproduces a scenario for sharing and investigation.
- Explore the curriculum as a cycle grid, directed graph and analysis views.
- Inspect direct prerequisites, direct unlocks and indirect reach from a selected course.
- Validate the generated curriculum, inspect prerequisite relationships and a topological order, and export the active data.
- Use a responsive static web application without a server-side API, build step or account.
- Preserve the existing Spanish course catalogue and UI terminology.

## Brand Commitments

The product and repository are named Trama. The approved Figma v2 design is the implementation reference; its course relationships and seed labels are illustrative, not fixed datasets.

## Evidence on Hand

The existing generator, course catalogue and graph algorithms are in the repository. Approved design: Figma file `ILO4n89w9g60lgf1icRJOc`, page `65:2`. Architecture audit and user corrections are recorded in `odd/tasks/trama-v3.md` and Engram.

## Open Decisions

No production deployment, remote publication or supported browser matrix has been established by this implementation request.
