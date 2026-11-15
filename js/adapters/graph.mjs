import { relationsFor, hasseEdges } from "../domain/curriculum.mjs";
import { courseClass } from "../ui/presentation.mjs";

export function createGraph(
  container,
  curriculum,
  selected,
  options,
  onSelect,
) {
  if (!globalThis.cytoscape) {
    container.textContent =
      "No se pudo cargar el grafo. Use la vista de lista.";
    return { destroy() {}, fit() {}, zoom() {}, png() {} };
  }
  const relations =
    selected === null ? null : relationsFor(curriculum, selected);
  const visible =
    selected === null || options.scope === "all"
      ? curriculum.courses
      : curriculum.courses.filter((course) =>
          [
            selected,
            ...relations.requires,
            ...relations.unlocks,
            ...(options.scope === "full"
              ? [...relations.ancestors, ...relations.descendants]
              : []),
          ].includes(course.id),
        );
  const ids = new Set(visible.map((course) => course.id));
  const edges = (
    options.hasse ? hasseEdges(curriculum) : curriculum.edges
  ).filter(([a, b]) => ids.has(a) && ids.has(b));
  // Keep each course in its actual academic cycle, independent of graph depth.
  const cycleWidth = 220;
  const rowHeight = 100;
  const rows = new Map();
  const positions = new Map();
  for (const course of curriculum.courses) {
    const row = rows.get(course.cycle) || 0;
    rows.set(course.cycle, row + 1);
    positions.set(course.id, { x: (course.cycle - 1) * cycleWidth, y: row * rowHeight });
  }
  const bands = document.createElement("div");
  bands.className = "graph-bands";
  bands.setAttribute("aria-hidden", "true");
  if (options.bands) {
    for (const cycle of [...rows.keys()].sort((a, b) => a - b)) {
      const band = document.createElement("div");
      band.className = "graph-band";
      band.textContent = `Ciclo ${String(cycle).padStart(2, "0")}`;
      Object.assign(band.style, {
        left: `${(cycle - 1) * cycleWidth - cycleWidth / 2}px`,
        top: "-70px",
        width: `${cycleWidth}px`,
        height: `${Math.max(...rows.values()) * rowHeight + 40}px`,
      });
      bands.append(band);
    }
  }
  container.before(bands);
  const cy = globalThis.cytoscape({
    container,
    elements: [
      ...visible.map((course) => ({
        data: {
          id: String(course.id),
          label: `${course.code} · ${course.name}`,
          cycle: course.cycle,
        },
        position: positions.get(course.id),
        grabbable: false,
        classes: courseClass(course.id, selected, relations),
      })),
      ...edges.map(([a, b]) => ({
        data: { id: `${a}-${b}`, source: String(a), target: String(b) },
        classes:
          relations?.requires.includes(a) && b === selected
            ? "requires"
            : a === selected
              ? "unlocks"
              : "indirect",
      })),
    ],
    style: [
      {
        selector: "node",
        style: {
          shape: "round-rectangle",
          "background-color": "#162019",
          "border-color": "#3a4b3f",
          "border-width": 0,
          label: "data(label)",
          color: "#ece8dc",
          "font-family": "Geist",
          "font-size": 11,
          "text-wrap": "wrap",
          "text-max-width": 135,
          "text-valign": "center",
          width: 156,
          height: 62,
        },
      },
      {
        selector: "node.selected",
        style: {
          "background-color": "#e9e2c9",
          color: "#131b15",
          "border-color": "#e9e2c9",
        },
      },
      {
        selector: "node.requires",
        style: {
          "background-color": "#2b3229",
          "border-color": "#e9e2c9",
          "border-width": 2,
        },
      },
      {
        selector: "node.unlocks",
        style: {
          "background-color": "#36281f",
          "border-color": "#e98a54",
          "border-width": 2,
        },
      },
      {
        selector: "node.indirect",
        style: { "border-color": "#e98a54", "border-style": "dashed", "border-width": 1 },
      },
      {
        selector: "edge",
        style: {
          width: 1.5,
          "line-color": "#3a4b3f",
          "target-arrow-color": "#3a4b3f",
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
        },
      },
      {
        selector: "edge.requires",
        style: { "line-color": "#e9e2c9", "target-arrow-color": "#e9e2c9" },
      },
      {
        selector: "edge.unlocks,edge.indirect",
        style: { "line-color": "#e98a54", "target-arrow-color": "#e98a54" },
      },
      { selector: "edge.indirect", style: { "line-style": "dashed" } },
    ],
    layout: { name: "preset", padding: 45 },
    minZoom: 0.12,
    maxZoom: 2.5,
    wheelSensitivity: 0.2,
  });
  const syncBands = () => {
    const { x, y } = cy.pan();
    bands.style.transform = `translate(${x}px, ${y}px) scale(${cy.zoom()})`;
  };
  cy.on("pan zoom", syncBands);
  syncBands();
  cy.on("tap", "node", (event) => onSelect(Number(event.target.id())));
  return {
    destroy: () => { cy.destroy(); bands.remove(); },
    fit: () => cy.fit(undefined, 45),
    zoom: (factor) =>
      cy.zoom({
        level: cy.zoom() * factor,
        renderedPosition: {
          x: container.clientWidth / 2,
          y: container.clientHeight / 2,
        },
      }),
    png: () => {
      const link = document.createElement("a");
      link.href = cy.png({ bg: "#0f1813", full: true, scale: 2 });
      link.download = "trama-grafo.png";
      link.click();
    },
  };
}
