import test from "node:test";
import assert from "node:assert/strict";
import { createCurriculum } from "../../js/domain/curriculum.mjs";
import { createStore, searchCourses } from "../../js/application/store.mjs";

test("search supports accents, name, code and numeric aliases", () => {
  const plan = createCurriculum("2025");
  for (const query of ["C6", "C06", "6"])
    assert.deepEqual(
      searchCourses(plan, query).map((c) => c.id),
      [6],
    );
  assert.ok(searchCourses(plan, "calculo").some((c) => c.id === 6));
  assert.equal(searchCourses(plan, "").length, 50);
});
test("query invalidates hidden selection but preserves matching selection", () => {
  const store = createStore(createCurriculum("2025"));
  store.dispatch({ type: "select", id: 6 });
  store.dispatch({ type: "search", query: "calculo" });
  assert.equal(store.getState().selectedCourseId, 6);
  store.dispatch({ type: "search", query: "programacion" });
  assert.equal(store.getState().selectedCourseId, null);
});
test("regeneration publishes fresh canonical data in every view, keeping navigation", () => {
  for (const view of ["grid", "graph", "analysis"]) {
    const store = createStore(createCurriculum("2025"));
    store.dispatch({ type: "navigate", view });
    store.dispatch({ type: "analysis", tab: "topological" });
    store.dispatch({ type: "select", id: 6 });
    let calls = 0;
    const unsubscribe = store.subscribe(() => calls++);
    store.dispatch({ type: "regenerate", seed: "1" });
    assert.deepEqual(store.getState().curriculum, createCurriculum("1"));
    assert.equal(store.getState().view, view);
    assert.equal(store.getState().analysisTab, "topological");
    assert.equal(store.getState().selectedCourseId, null);
    assert.equal(store.getState().revision, 1);
    assert.equal(calls, 1);
    unsubscribe();
    store.dispatch({ type: "cycle", cycle: 2 });
    assert.equal(calls, 1);
  }
});
test("default state, invalid actions and random regeneration are safe", () => {
  const store = createStore(createCurriculum("1"));
  assert.deepEqual(
    { ...store.getState(), curriculum: null },
    {
      curriculum: null,
      view: "grid",
      analysisTab: "validation",
      query: "",
      selectedCourseId: null,
      cycle: 1,
      revision: 0,
    },
  );
  store.dispatch({ type: "select", id: 999 });
  assert.equal(store.getState().selectedCourseId, null);
  store.dispatch({ type: "regenerate" });
  assert.notEqual(store.getState().curriculum.seed, "1");
});
