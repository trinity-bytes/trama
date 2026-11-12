# Trama design reference

The approved Trama v2 Grove design is the source of truth, not the former Bootstrap interface. Mode: Operate. Reference: Figma `ILO4n89w9g60lgf1icRJOc`, page `65:2`.

## Foundations

| Role | Value |
| --- | --- |
| Canvas / surface / raised | `#061c1a` / `#0d2925` / `#12352f` |
| Subtle / strong line | `#1c433c` / `#2a5a51` |
| Primary / muted / faint text | `#ecf2e9` / `#8fa9a0` / `#809d93` |
| Selected / requires | `#cbf15a` with `#072019` on filled accents |
| Unlocks / indirect | `#f5b544`; dashed outline distinguishes indirect relationships |
| Supporting accent | `#2cc9a7` |
| Relationship tints | `#1b3a26` / `#2e3523` |
| Display / UI / identifiers | Instrument Serif / Geist / Geist Mono |

## Composition

Desktop: compact app bar, ten cycle columns with five course tiles each, dependency detail below the grid when selected. The graph and analysis are first-class views. No global footer; product information belongs in About.

Mobile: bottom navigation, cycle picker, one cycle at a time, contextual details in a sheet. Preserve readable course names and touch targets of at least 44 CSS pixels. Do not force the desktop grid into a horizontally overflowing page.

## Interaction

Selection, requires, unlocks, indirect and unrelated courses must be distinguishable without relying only on color. Search, selected course, navigation and regeneration derive from application state. Feedback is announced through live regions. Native dialogs must restore focus; graph data needs an accessible text alternative. Respect reduced-motion preferences.

## Data truth

All counts, relationships and displayed seed values come from the active generated curriculum. Never hardcode the representative C06 relationships or seed 2025 from the design.
