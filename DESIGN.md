# Trama design reference

The approved Trama Loom (de-slopped Grove) design is the source of truth, not the former Bootstrap interface. Mode: Operate. Reference: Figma `ILO4n89w9g60lgf1icRJOc`, page `65:2`.

## Foundations

| Role | Value |
| --- | --- |
| Canvas / surface / raised | `#0f1813` / `#162019` / `#1d2a22` |
| Subtle / strong line | `#26342b` / `#3a4b3f` |
| Primary / muted / faint text | `#ece8dc` / `#a3ad9f` / `#869180` |
| Selected / requires | `#e9e2c9` with `#131b15` on filled accents |
| Unlocks / indirect | `#e98a54`; dashed outline distinguishes indirect relationships |
| Supporting accent | `#86c29a` |
| Relationship tints | `#2b3229` / `#36281f` |
| Display / UI / identifiers | Schibsted Grotesk SemiBold / Geist / Geist Mono |

Display headings use -2% tracking. Geist Mono is reserved for course codes, numeric identifiers and keyboard hints. Default and dimmed tiles have no visible border; content is top-aligned. Relationship outlines remain explicit. Detail stats are inline at 13px, not oversized counters. Validation has no decorative full progress bars or repeated fact counters; demo notices use neutral raised surfaces. The logo is the exported bone woven-T mark.

## Composition

Desktop: compact app bar, ten cycle columns with five course tiles each, dependency detail below the grid when selected. The graph and analysis are first-class views. No global footer; product information belongs in About.

Mobile: bottom navigation, cycle picker, one cycle at a time, contextual details in a sheet. Preserve readable course names and touch targets of at least 44 CSS pixels. Do not force the desktop grid into a horizontally overflowing page.

## Interaction

Selection, requires, unlocks, indirect and unrelated courses must be distinguishable without relying only on color. Search, selected course, navigation and regeneration derive from application state. Feedback is announced through live regions. Native dialogs must restore focus; graph data needs an accessible text alternative. Respect reduced-motion preferences.

## Data truth

All counts, relationships and displayed seed values come from the active generated curriculum. Never hardcode the representative C06 relationships or seed 2025 from the design.
