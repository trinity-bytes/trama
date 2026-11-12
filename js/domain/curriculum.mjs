import { courseNames } from "./catalogue.mjs";

const sorted = (values) => [...values].sort((a, b) => a - b);
let generation = 0;
function freshSeed() {
  const random =
    globalThis.crypto?.randomUUID?.() ?? `${Math.random()}-${Math.random()}`;
  return `${Date.now()}-${++generation}-${random}`;
}

// This hash and LCG deliberately preserve the original seeded generator.
function randomFor(seed) {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    state ^= seed.charCodeAt(i);
    state +=
      (state << 1) + (state << 4) + (state << 7) + (state << 8) + (state << 24);
  }
  state = Math.abs(state);
  return () => {
    state = (1664525 * state + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

export function createCurriculum(seed) {
  const resolvedSeed =
    seed === undefined || seed === null || seed === ""
      ? freshSeed()
      : String(seed);
  const courses = courseNames.map((name, index) => ({
    id: index + 1,
    code: `C${String(index + 1).padStart(2, "0")}`,
    name,
    cycle: Math.floor(index / 5) + 1,
  }));
  const incoming = new Map(courses.map((c) => [c.id, []]));
  const random = randomFor(resolvedSeed);
  for (let source = 1; source <= 45; source++) {
    const targetCount = Math.floor(random() * 3);
    const assigned = new Set();
    for (
      let attempts = 0;
      assigned.size < targetCount && attempts < 100;
      attempts++
    ) {
      const target = Math.floor(random() * 50) + 1;
      const from = courses[source - 1],
        to = courses[target - 1];
      if (
        to.cycle <= from.cycle ||
        to.cycle > from.cycle + 4 ||
        assigned.has(target) ||
        incoming.get(target).length >= 2
      )
        continue;
      assigned.add(target);
      incoming.get(target).push(source);
    }
  }
  return {
    courses,
    edges: courses.flatMap((c) => incoming.get(c.id).map((id) => [id, c.id])),
    seed: resolvedSeed,
  };
}

// One defensive index is used by validation and all graph projections.
function graphFor(curriculum) {
  const courses = Array.isArray(curriculum?.courses) ? curriculum.courses : [];
  const edges = Array.isArray(curriculum?.edges) ? curriculum.edges : [];
  const byId = new Map();
  for (const course of courses)
    if (course && Number.isInteger(course.id)) byId.set(course.id, course);
  const incoming = new Map([...byId.keys()].map((id) => [id, []]));
  const outgoing = new Map([...byId.keys()].map((id) => [id, []]));
  for (const edge of edges) {
    if (!Array.isArray(edge) || edge.length !== 2) continue;
    const [from, to] = edge;
    if (!byId.has(from) || !byId.has(to)) continue;
    outgoing.get(from).push(to);
    incoming.get(to).push(from);
  }
  return { courses, edges, byId, incoming, outgoing };
}

function orderedIds(graph) {
  const degree = new Map(
    [...graph.incoming].map(([id, parents]) => [id, parents.length]),
  );
  const queue = sorted(
    [...degree].filter(([, n]) => n === 0).map(([id]) => id),
  );
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const next of graph.outgoing.get(id)) {
      degree.set(next, degree.get(next) - 1);
      if (degree.get(next) === 0) queue.push(next);
    }
  }
  return order;
}

export function validateCurriculum(curriculum) {
  const graph = graphFor(curriculum),
    checks = [];
  const check = (name, ok, details) => checks.push({ name, ok, details });
  check(
    "Estructura del plan",
    Array.isArray(curriculum?.courses) && Array.isArray(curriculum?.edges),
    "Cursos y relaciones deben ser listas",
  );
  check(
    "50 cursos únicos",
    graph.courses.length === 50 &&
      graph.byId.size === 50 &&
      graph.courses.every(
        (c) =>
          c &&
          Number.isInteger(c.id) &&
          c.id >= 1 &&
          c.id <= 50 &&
          typeof c.name === "string",
      ),
    `${graph.byId.size} identificadores únicos`,
  );
  for (let cycle = 1; cycle <= 10; cycle++) {
    const count = graph.courses.filter((c) => c?.cycle === cycle).length;
    check(`Ciclo ${cycle}: 5 cursos`, count === 5, `${count} cursos`);
  }
  check(
    "Ciclos válidos",
    graph.courses.every(
      (c) => Number.isInteger(c?.cycle) && c.cycle >= 1 && c.cycle <= 10,
    ),
    "Ciclos del 1 al 10",
  );
  const validEdges = graph.edges.every(
    (edge) =>
      Array.isArray(edge) &&
      edge.length === 2 &&
      graph.byId.has(edge[0]) &&
      graph.byId.has(edge[1]),
  );
  check(
    "Extremos existentes",
    validEdges,
    "Cada relación conecta dos cursos existentes",
  );
  check(
    "Relaciones únicas",
    validEdges &&
      new Set(graph.edges.map(([from, to]) => `${from}:${to}`)).size ===
        graph.edges.length,
    `${graph.edges.length} relaciones`,
  );
  check(
    "Cronología de prerrequisitos",
    validEdges &&
      graph.edges.every(([a, b]) => {
        const span = graph.byId.get(b).cycle - graph.byId.get(a).cycle;
        return span > 0 && span <= 4;
      }),
    "Destino posterior, con un máximo de 4 ciclos de distancia",
  );
  const maxPrereqs = Math.max(
    0,
    ...[...graph.incoming.values()].map((ids) => ids.length),
  );
  const maxOut = Math.max(
    0,
    ...[...graph.outgoing.values()].map((ids) => ids.length),
  );
  check("Máximo 2 prerrequisitos", maxPrereqs <= 2, `Máximo: ${maxPrereqs}`);
  check("Máximo 2 desbloqueos directos", maxOut <= 2, `Máximo: ${maxOut}`);
  check(
    "Grafo acíclico (DAG)",
    orderedIds(graph).length === graph.byId.size,
    "Todos los cursos admiten orden topológico",
  );
  return {
    ok: checks.every((c) => c.ok),
    checks,
    metrics: {
      totalCourses: graph.courses.length,
      cycles: new Set(graph.courses.map((c) => c?.cycle)).size,
      edges: graph.edges.length,
      maxPrereqs,
      maxOut,
    },
  };
}

function reachable(adjacency, id, omitted) {
  const seen = new Set([id]),
    pending = [id];
  while (pending.length) {
    const from = pending.shift();
    for (const to of adjacency.get(from) ?? []) {
      if (omitted && from === omitted[0] && to === omitted[1]) continue;
      if (!seen.has(to)) {
        seen.add(to);
        pending.push(to);
      }
    }
  }
  seen.delete(id);
  return sorted(seen);
}

export function relationsFor(curriculum, id) {
  const graph = graphFor(curriculum);
  const requires = sorted(new Set(graph.incoming.get(id) ?? []));
  const unlocks = sorted(new Set(graph.outgoing.get(id) ?? []));
  const ancestors = reachable(graph.incoming, id),
    descendants = reachable(graph.outgoing, id);
  return {
    requires,
    unlocks,
    indirect: descendants.filter((next) => !unlocks.includes(next)),
    ancestors,
    descendants,
  };
}

export function topologicalOrder(curriculum) {
  if (!validateCurriculum(curriculum).ok)
    throw new Error("Invalid curriculum: cannot compute a topological order");
  return orderedIds(graphFor(curriculum));
}

export function hasseEdges(curriculum) {
  const graph = graphFor(curriculum);
  return graph.edges
    .filter(
      (edge) =>
        Array.isArray(edge) &&
        edge.length === 2 &&
        graph.byId.has(edge[0]) &&
        graph.byId.has(edge[1]) &&
        !reachable(graph.outgoing, edge[0], edge).includes(edge[1]),
    )
    .map((edge) => [...edge]);
}

export function metricsFor(curriculum) {
  const graph = graphFor(curriculum),
    order = orderedIds(graph),
    depth = new Map();
  for (const id of order) {
    depth.set(id, Math.max(1, depth.get(id) ?? 1));
    for (const next of graph.outgoing.get(id))
      depth.set(next, Math.max(depth.get(next) ?? 1, depth.get(id) + 1));
  }
  return {
    minima: sorted(
      [...graph.incoming].filter(([, ids]) => !ids.length).map(([id]) => id),
    ),
    maxima: sorted(
      [...graph.outgoing].filter(([, ids]) => !ids.length).map(([id]) => id),
    ),
    height: Math.max(0, ...depth.values()),
  };
}
