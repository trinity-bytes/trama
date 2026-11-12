import { createCurriculum } from "../domain/curriculum.mjs";

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export function searchCourses(curriculum, query) {
  const text = normalize(query);
  const code = text.match(/^c?0*(\d+)$/i);
  return curriculum.courses.filter(
    (course) =>
      !text ||
      (code
        ? course.id === Number(code[1])
        : normalize(course.name).includes(text) ||
          normalize(course.code).includes(text)),
  );
}

export function createStore(curriculum = createCurriculum()) {
  let state = {
    curriculum,
    view: "grid",
    analysisTab: "validation",
    query: "",
    selectedCourseId: null,
    cycle: 1,
    revision: 0,
  };
  const listeners = new Set();
  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch(action) {
      let next = state;
      switch (action?.type) {
        case "navigate":
          if (["grid", "graph", "analysis"].includes(action.view))
            next = { ...state, view: action.view };
          break;
        case "analysis":
          next = { ...state, analysisTab: action.tab };
          break;
        case "search": {
          const query = String(action.query ?? "");
          const selectedCourseId = searchCourses(state.curriculum, query).some(
            (c) => c.id === state.selectedCourseId,
          )
            ? state.selectedCourseId
            : null;
          next = { ...state, query, selectedCourseId };
          break;
        }
        case "select":
          next = {
            ...state,
            selectedCourseId: state.curriculum.courses.some(
              (c) => c.id === action.id,
            )
              ? action.id
              : null,
          };
          break;
        case "cycle":
          if (
            Number.isInteger(action.cycle) &&
            action.cycle >= 1 &&
            action.cycle <= 10
          )
            next = { ...state, cycle: action.cycle };
          break;
        case "regenerate":
          next = {
            ...state,
            curriculum: createCurriculum(action.seed),
            selectedCourseId: null,
            revision: state.revision + 1,
          };
          break;
      }
      if (next !== state) {
        state = next;
        for (const listener of [...listeners]) listener(state);
      }
      return state;
    },
  };
}
