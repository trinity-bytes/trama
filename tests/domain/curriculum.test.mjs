import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  createCurriculum,
  validateCurriculum,
  relationsFor,
  topologicalOrder,
  hasseEdges,
  metricsFor,
} from "../../js/domain/curriculum.mjs";

function legacy(seed) {
  const context = vm.createContext({});
  vm.runInContext(
    readFileSync(new URL("../../js/models/Curso.js", import.meta.url), "utf8") +
      "\n" +
      readFileSync(
        new URL("../../js/models/Curriculum.js", import.meta.url),
        "utf8",
      ) +
      `\nthis.result = new Curriculum(); result.generarCursos(); result.generarRequisitos(${JSON.stringify(seed)});`,
    context,
  );
  return JSON.parse(JSON.stringify(context.result));
}
for (const seed of ["0", "1", "2025"])
  test(`preserves legacy seeded curriculum ${seed}`, () => {
    const old = legacy(seed),
      current = createCurriculum(seed);
    assert.deepEqual(
      current.courses.map((c) => [c.id, c.name, c.cycle]),
      old.cursos.map((c) => [c.id, c.nombre, c.ciclo]),
    );
    assert.deepEqual(
      current.edges,
      old.cursos.flatMap((c) => c.cursosPrerequisito.map((id) => [id, c.id])),
    );
    assert.equal(current.seed, seed);
  });
test("random initialization creates fresh reproducible seeds", () => {
  const a = createCurriculum(),
    b = createCurriculum();
  assert.notEqual(a.seed, b.seed);
  assert.deepEqual(createCurriculum(a.seed), a);
});
test("generated plans satisfy validation and topological edge invariants", () => {
  for (let seed = 0; seed < 100; seed++) {
    const plan = createCurriculum(seed),
      order = topologicalOrder(plan);
    assert.equal(validateCurriculum(plan).ok, true);
    assert.equal(order.length, 50);
    for (const [a, b] of plan.edges)
      assert.ok(order.indexOf(a) < order.indexOf(b));
  }
});
test("malformed plans fail safely and invalid graphs reject ordering", () => {
  for (const value of [
    null,
    {},
    { courses: [null], edges: [null] },
    { courses: "bad", edges: 5 },
  ])
    assert.equal(validateCurriculum(value).ok, false);
  for (const edges of [
    [[1, 999]],
    [[1, 2]],
    [
      [1, 6],
      [1, 6],
    ],
    [
      [1, 6],
      [6, 1],
    ],
    [[1, 26]],
    [
      [1, 6],
      [1, 7],
      [1, 8],
    ],
  ]) {
    const plan = { ...createCurriculum("1"), edges };
    assert.equal(validateCurriculum(plan).ok, false);
    assert.throws(() => topologicalOrder(plan), /invalid curriculum/i);
  }
  const plan = createCurriculum("1");
  plan.courses[1].id = 1;
  assert.equal(validateCurriculum(plan).ok, false);
});
test("relations deduplicate indirect reachability and reduction preserves covers", () => {
  const plan = {
    ...createCurriculum("1"),
    edges: [
      [1, 6],
      [1, 11],
      [6, 11],
      [6, 16],
      [11, 16],
    ],
  };
  assert.deepEqual(relationsFor(plan, 1), {
    requires: [],
    unlocks: [6, 11],
    indirect: [16],
    ancestors: [],
    descendants: [6, 11, 16],
  });
  assert.deepEqual(relationsFor(plan, 16).ancestors, [1, 6, 11]);
  assert.deepEqual(hasseEdges(plan), [
    [1, 6],
    [6, 11],
    [11, 16],
  ]);
  assert.equal(metricsFor(plan).height, 4);
  assert.ok(metricsFor(plan).minima.includes(1));
  assert.ok(metricsFor(plan).maxima.includes(16));
});
