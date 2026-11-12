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
  const cy = globalThis.cytoscape({
    container,
    elements: [
      ...visible.map((course) => ({
        data: {
          id: String(course.id),
          label: `${course.code} · ${course.name}`,
          cycle: course.cycle,
        },
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
          "background-color": "#0d2925",
          "border-color": "#2a5a51",
          "border-width": 1,
          label: "data(label)",
          color: "#ecf2e9",
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
          "background-color": "#cbf15a",
          color: "#072019",
          "border-color": "#cbf15a",
        },
      },
      {
        selector: "node.requires",
        style: {
          "background-color": "#1b3a26",
          "border-color": "#cbf15a",
          "border-width": 2,
        },
      },
      {
        selector: "node.unlocks",
        style: {
          "background-color": "#2e3523",
          "border-color": "#f5b544",
          "border-width": 2,
        },
      },
      {
        selector: "node.indirect",
        style: { "border-color": "#f5b544", "border-style": "dashed" },
      },
      {
        selector: "edge",
        style: {
          width: 1.5,
          "line-color": "#2a5a51",
          "target-arrow-color": "#2a5a51",
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
        },
      },
      {
        selector: "edge.requires",
        style: { "line-color": "#cbf15a", "target-arrow-color": "#cbf15a" },
      },
      {
        selector: "edge.unlocks,edge.indirect",
        style: { "line-color": "#f5b544", "target-arrow-color": "#f5b544" },
      },
      { selector: "edge.indirect", style: { "line-style": "dashed" } },
    ],
    layout: {
      name: "dagre",
      rankDir: matchMedia("(max-width: 700px)").matches ? "TB" : "LR",
      rankSep: 70,
      nodeSep: 28,
      padding: 45,
    },
    minZoom: 0.12,
    maxZoom: 2.5,
    wheelSensitivity: 0.2,
  });
  cy.on("tap", "node", (event) => onSelect(Number(event.target.id())));
  return {
    destroy: () => cy.destroy(),
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
      link.href = cy.png({ bg: "#061c1a", full: true, scale: 2 });
      link.download = "trama-grafo.png";
      link.click();
    },
  };
}
