import test from "node:test";
import assert from "node:assert/strict";
import {
  escapeHtml,
  courseClass,
  curriculumCsv,
  readLink,
  shareLink,
} from "../../js/ui/presentation.mjs";
const curriculum = {
  seed: "2025",
  courses: [
    { id: 1, code: "C01", name: 'A,"B"', cycle: 1 },
    { id: 2, code: "C02", name: "Other", cycle: 2 },
  ],
  edges: [[1, 2]],
};
test("course relations have distinct non-color states", () => {
  const r = { requires: [1], unlocks: [3], indirect: [4] };
  assert.equal(courseClass(2, 2, r), "selected");
  assert.equal(courseClass(1, 2, r), "requires");
  assert.equal(courseClass(3, 2, r), "unlocks");
  assert.equal(courseClass(4, 2, r), "indirect");
});
test("dynamic data is escaped and CSV preserves quotes", () => {
  assert.equal(escapeHtml('<a>"'), "&lt;a&gt;&quot;");
  assert.match(curriculumCsv(curriculum), /"A,""B"""/);
});
test("share links preserve unrelated params and reproducible seed/course", () => {
  const url = shareLink("https://example.test/?x=1", curriculum, 2);
  assert.equal(new URL(url).searchParams.get("x"), "1");
  assert.deepEqual(readLink(url), { seed: "2025", course: 2 });
});

test("analysis exports use the active validation and topological results", async () => {
  const { exportForView } = await import("../../js/ui/presentation.mjs");
  const { createCurriculum, validateCurriculum, topologicalOrder } =
    await import("../../js/domain/curriculum.mjs");
  const plan = createCurriculum("2025");
  const state = {
    curriculum: plan,
    view: "analysis",
    analysisTab: "validation",
  };
  const validation = exportForView(state, "json");
  assert.equal(validation.filename, "trama-validacion.json");
  assert.deepEqual(JSON.parse(validation.content), validateCurriculum(plan));
  const validationCsv = exportForView(state, "csv");
  assert.match(validationCsv.content, /metrica,valor/);
  assert.match(validationCsv.content, /nombre,ok,detalles/);
  const topology = exportForView({ ...state, analysisTab: "topology" }, "csv");
  assert.equal(topology.filename, "trama-orden-topologico.csv");
  assert.equal(topology.content.split("\r\n")[0], "orden,id,nombre,ciclo");
  assert.deepEqual(
    topology.content
      .split("\r\n")
      .slice(1)
      .map((row) => Number(row.split(",")[1])),
    topologicalOrder(plan),
  );
  const changed = createCurriculum("1");
  const updated = exportForView({ ...state, curriculum: changed }, "json");
  assert.deepEqual(JSON.parse(updated.content), validateCurriculum(changed));
  const ordinary = exportForView({ ...state, view: "grid" }, "json");
  assert.deepEqual(JSON.parse(ordinary.content), plan);
});
