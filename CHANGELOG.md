# Changelog

## [3.0.0] - 2026-11-11

### Added
- Trama Grove interface with responsive curriculum grid, graph, analysis and course details.
- Explicit application state, canonical graph relations and deterministic regression coverage.

### Changed
- Renamed the product and repository references to Trama.
- Replaced the active Bootstrap interface in one cutover with native components and dialogs.
- Kept random initial generation and explicit seeded reproducibility; design examples are not fixed data.

### Fixed
- Stale analysis/export snapshots after regeneration.
- Search and course selection inconsistencies and graph lifecycle cleanup.
- Validation robustness and directional direct/indirect relationship presentation.


Todas las novedades relevantes de este proyecto serán documentadas en este archivo.

## [2.0] - 2025-08-16

Enfoque: valor demostrable (Hasse, orden topológico, exportaciones) y accesibilidad/UX.

### Añadido
- Vista “Ver Orden Topológico” (Kahn) + exportación CSV (orden,id,nombre,ciclo).
- Validación del plan con resumen visual + export JSON/CSV.
- Grafo: toggle Hasse (reducción transitiva), métricas del poset (mínimos/máximos/altura).
- Carriles por ciclo con alineación de nodos por ciclo.
- Buscador con botones Buscar/Limpiar, sugerencias con resaltado del término, ARIA y atajos.
- “Ver en Grafo” desde la selección con centrado/resaltado del nodo.
- Semillas reproducibles (?seed) y botón “Copiar enlace con semilla”.
- Accesibilidad: roles/ARIA en toolbar/tooltip/métricas/overlays, focus visible, modal con manejo de foco.
- Documentación: demo en vivo (Pages), exports, atajos, a11y y capturas.

### Cambiado
- Contraste de botones de exportación en cabeceras.
- Ordenamiento topológico refactorizado a Kahn para consistencia y detección de ciclos.

### Arreglado
- Rutas y contenedores duplicados del grafo; colores de cytoscape sin variables.
- Superposición de overlays con controles; estado visual de Hasse.
- Alineación de nodos en carriles y altura del overlay sincronizada.

### Notas
- Reglas 10×5 garantizadas; C1–C5 sin prereqs; C46–C50 no son prereqs; ≤2 prereqs/curso.
- Requiere navegador moderno; probada en Chrome/Edge.
