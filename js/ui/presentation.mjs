import { validateCurriculum, topologicalOrder } from "../domain/curriculum.mjs";

export function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}
export function courseClass(id, selected, relations) {
  if (id === selected) return "selected";
  for (const name of ["requires", "unlocks", "indirect"])
    if (relations?.[name]?.includes(id)) return name;
  return "";
}
export function curriculumCsv(curriculum) {
  const cell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  return (
    "\ufeff" +
    [
      ["codigo", "nombre", "ciclo", "prerrequisitos"],
      ...curriculum.courses.map((course) => [
        course.code,
        course.name,
        course.cycle,
        curriculum.edges
          .filter(([, to]) => to === course.id)
          .map(([from]) => curriculum.courses.find((c) => c.id === from)?.code)
          .join("; "),
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n")
  );
}
export function readLink(href) {
  const url = new URL(href);
  const course =
    url.searchParams.get("course") ?? url.searchParams.get("curso");
  return {
    seed: url.searchParams.get("seed") || undefined,
    course: course ? Number(course.replace(/^c/i, "")) : null,
  };
}
export function shareLink(href, curriculum, selected) {
  const url = new URL(href);
  url.searchParams.set("seed", curriculum.seed);
  url.searchParams.delete("curso");
  if (selected !== null) url.searchParams.set("course", selected);
  else url.searchParams.delete("course");
  return url.href;
}
export function download(filename, content, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Resolve exports on demand from the current state, never from a captured render.
export function exportForView(state, format) {
  const { curriculum, view, analysisTab } = state;
  const cell = (value) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
  let filename = "trama-plan",
    data = curriculum;
  let csv = curriculumCsv(curriculum);
  if (view === "analysis" && analysisTab === "validation") {
    filename = "trama-validacion";
    data = validateCurriculum(curriculum);
    const metrics = [
      "metrica,valor",
      ...Object.entries(data.metrics).map(([key, value]) => `${key},${value}`),
    ];
    csv = metrics
      .concat(
        ["", "nombre,ok,detalles"],
        data.checks.map((check) =>
          [
            cell(check.name),
            check.ok ? "OK" : "Falla",
            cell(check.details),
          ].join(","),
        ),
      )
      .join("\r\n");
  } else if (view === "analysis" && analysisTab === "topology") {
    filename = "trama-orden-topologico";
    data = topologicalOrder(curriculum).map((id, index) => ({
      order: index + 1,
      ...curriculum.courses.find((course) => course.id === id),
    }));
    csv = [
      "orden,id,nombre,ciclo",
      ...data.map((course) =>
        [course.order, course.id, cell(course.name), course.cycle].join(","),
      ),
    ].join("\r\n");
  }
  return {
    filename: `${filename}.${format}`,
    content: format === "json" ? JSON.stringify(data, null, 2) : csv,
    type: format === "json" ? "application/json" : "text/csv;charset=utf-8",
  };
}
