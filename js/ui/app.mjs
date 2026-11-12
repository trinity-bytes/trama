import {
  createCurriculum,
  relationsFor,
  validateCurriculum,
  topologicalOrder,
  metricsFor,
} from "../domain/curriculum.mjs";
import { createStore, searchCourses } from "../application/store.mjs";
import { createGraph } from "../adapters/graph.mjs";
import {
  escapeHtml as esc,
  courseClass,
  curriculumCsv,
  readLink,
  shareLink,
  download,
  exportForView,
} from "./presentation.mjs";

const initial = readLink(location.href);
const store = createStore(createCurriculum(initial.seed));
const workspace = document.querySelector("#workspace");
const modal = document.querySelector("#modal");
const search = document.querySelector("#search");
let graph = null;
let dialogTrigger = null;
let toastTimer;
const graphOptions = { scope: "full", hasse: false, bands: true };
const labels = { grid: "Malla", graph: "Grafo", analysis: "Análisis" };
const pad = (number) => String(number).padStart(2, "0");
const button = (action, label, extra = "") =>
  `<button data-action="${action}" ${extra}>${label}</button>`;
function announce(message) {
  document.querySelector("#announcement").textContent = message;
}
function toast(message) {
  const element = document.querySelector("#toast");
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (element.hidden = true), 4500);
}
function selectedRelations(state) {
  return state.selectedCourseId === null
    ? null
    : relationsFor(state.curriculum, state.selectedCourseId);
}
function tile(course, state, relation, compact = false) {
  const status = courseClass(course.id, state.selectedCourseId, relation);
  const label =
    {
      requires: "↤ requiere",
      unlocks: "desbloquea ↦",
      indirect: "indirecto",
      selected: "seleccionado",
    }[status] ?? "";
  return `<button class="course ${status} ${compact ? "compact" : ""}" data-course="${course.id}" aria-pressed="${course.id === state.selectedCourseId}" title="${esc(course.code + " " + course.name)}"><span class="course-meta"><span>${esc(course.code)}</span><span>${label}</span></span><span class="course-name">${esc(course.name)}</span></button>`;
}
function legend() {
  return '<div class="legend" aria-label="Relaciones"><span><i class="selected"></i>Seleccionado</span><span><i class="requires"></i>↤ Requiere</span><span><i class="unlocks"></i>Desbloquea ↦</span><span><i class="indirect"></i>Indirecto</span></div>';
}
function exportMenu(graphView = false) {
  return `<details class="export-menu"><summary>Exportar</summary><div>${button("json", "JSON")}${button("csv", "CSV")}${graphView ? button("png", "Imagen PNG") : ""}</div></details>`;
}
function details(state) {
  const course = state.curriculum.courses.find(
    (course) => course.id === state.selectedCourseId,
  );
  if (!course) return "";
  const relation = selectedRelations(state);
  const lane = (title, ids, status) =>
    `<section class="flow-lane"><h3>${title}</h3><div>${
      ids.length
        ? ids
            .map((id) =>
              tile(
                state.curriculum.courses.find((course) => course.id === id),
                {
                  ...state,
                  selectedCourseId:
                    status === "selected" ? id : state.selectedCourseId,
                },
                relation,
                true,
              ),
            )
            .join("")
        : '<p class="muted">Sin cursos</p>'
    }</div></section>`;
  return `<section class="relationship-strip" aria-label="Detalle del curso"><div class="course-identity"><p class="mono lime">${esc(course.code)} · Ciclo ${pad(course.cycle)}</p><h2>${esc(course.name)}</h2><div class="stats"><span><strong class="lime">${relation.requires.length}</strong>requiere</span><span><strong class="amber">${relation.unlocks.length}</strong>desbloquea</span><span><strong>${relation.descendants.length}</strong>en su alcance</span></div><div class="actions">${button("graph", "Ver en grafo ↗", 'class="primary"')}${button("route", "Ruta completa")}${button("share", "Compartir")}</div></div><div class="dependency-flow"><h3>Trama de dependencias</h3><div class="flow-lanes">${lane("Requiere", relation.requires, "requires")}<img class="flow-arrow" src="assets/trama/arrow.svg" width="24" height="24" alt="hacia">${lane("Este curso", [course.id], "selected")}<img class="flow-arrow" src="assets/trama/arrow.svg" width="24" height="24" alt="hacia">${lane("Desbloquea", relation.unlocks, "unlocks")}<img class="flow-arrow" src="assets/trama/arrow.svg" width="24" height="24" alt="hacia">${lane(
    "Luego habilita",
    relation.descendants.filter((id) => !relation.unlocks.includes(id)),
    "indirect",
  )}</div></div>${button("clear", "Deseleccionar", 'class="clear-selection"')}</section>`;
}
function gridView(state, matches) {
  const relation = selectedRelations(state);
  const cycles = [
    ...new Set(state.curriculum.courses.map((course) => course.cycle)),
  ];
  const filtered = new Set(matches.map((course) => course.id));
  const grid = cycles
    .map(
      (cycle) =>
        `<section class="cycle ${cycle === state.cycle ? "current-cycle" : ""}" aria-label="Ciclo ${cycle}"><h2>Ciclo <span class="mono">${pad(cycle)}</span></h2>${state.curriculum.courses
          .filter((course) => course.cycle === cycle && filtered.has(course.id))
          .map((course) => tile(course, state, relation))
          .join("")}</section>`,
    )
    .join("");
  const cyclePicker = `<nav class="cycle-picker" aria-label="Seleccionar ciclo">${cycles.map((cycle) => `<button data-cycle="${cycle}" aria-current="${cycle === state.cycle ? "true" : "false"}">Ciclo <strong>${pad(cycle)}</strong></button>`).join("")}</nav><p class="cycle-caption">Ciclo ${pad(state.cycle)} · ${matches.filter((course) => course.cycle === state.cycle).length} cursos</p>`;
  return `${cyclePicker}<div class="curriculum-grid">${grid}</div>${details(state)}${state.selectedCourseId !== null ? `<div class="mobile-selection">${button("detail", "Ver detalle", 'class="primary"')}<span>${esc(state.curriculum.courses.find((course) => course.id === state.selectedCourseId)?.name)}</span></div>` : ""}`;
}
function analysisView(state) {
  const result = validateCurriculum(state.curriculum);
  const allChecks = result.checks;
  const cycles = allChecks.filter((check) => /^Ciclo \d+:/.test(check.name));
  const edges = state.curriculum.edges;
  const firstIds = new Set(
    state.curriculum.courses
      .filter((course) => course.cycle === 1)
      .map((course) => course.id),
  );
  const lastIds = new Set(
    state.curriculum.courses
      .filter((course) => course.cycle === 10)
      .map((course) => course.id),
  );
  result.checks = [
    {
      name: "Distribución por ciclos",
      ok: cycles.every((check) => check.ok),
      details: "Cada uno de los 10 ciclos tiene exactamente 5 cursos.",
    },
    {
      name: "Cursos del primer ciclo",
      ok: edges.every(([, to]) => !firstIds.has(to)),
      details: "Los cursos del ciclo 01 no tienen prerrequisitos.",
    },
    {
      name: "Cursos del último ciclo",
      ok: edges.every(([from]) => !lastIds.has(from)),
      details: "Ningún curso del ciclo 10 es prerrequisito de otro.",
    },
    {
      name: "Límites de prerrequisitos",
      ok: allChecks
        .filter((check) => /Máximo|Cronología/.test(check.name))
        .every((check) => check.ok),
      details:
        "Hasta 2 prerrequisitos y 2 desbloqueos directos; distancia máxima de 4 ciclos.",
    },
    {
      name: "Grafo sin ciclos",
      ok: allChecks
        .filter((check) => !/Ciclo \d+:|Máximo|Cronología/.test(check.name))
        .every((check) => check.ok),
      details:
        "Relaciones únicas entre cursos existentes, sin dependencias circulares.",
    },
  ];
  const tabs = `<nav class="analysis-tabs" aria-label="Tipo de análisis">${[
    ["validation", "Validación"],
    ["prerequisites", "Prerrequisitos"],
    ["topology", "Orden topológico"],
  ]
    .map(
      ([tab, label]) =>
        `<button data-tab="${tab}" aria-current="${state.analysisTab === tab ? "true" : "false"}">${label}</button>`,
    )
    .join("")}</nav>`;
  let body = "";
  if (state.analysisTab === "validation") {
    body = `<div class="analysis-layout"><section class="panel verdict"><div class="verdict-head"><h2>${result.ok ? `El plan cumple las ${result.checks.length} reglas.` : "Hay reglas por revisar."}</h2><strong class="lime">${result.checks.filter((check) => check.ok).length}/${result.checks.length}</strong></div><div class="rules">${result.checks.map((check) => `<article class="rule"><img src="assets/trama/${check.ok ? "check" : "info"}.svg" width="22" height="22" alt="${check.ok ? "Correcto" : "Revisar"}"><div><h3>${esc(check.name)}</h3><p>${esc(typeof check.details === "string" ? check.details : JSON.stringify(check.details))}</p></div><span class="rule-progress ${check.ok ? "ok" : ""}"></span><span>${check.ok ? "Cumple" : "Revisar"}</span></article>`).join("")}</div></section><aside><section class="panel"><h3>Qué se comprueba</h3><p>Las reglas del ejemplo: 50 cursos repartidos en 10 ciclos. Esta comprobación no sustituye una validación académica oficial.</p><div class="stats"><span><strong>${result.metrics.totalCourses}</strong>cursos</span><span><strong>${result.metrics.cycles}</strong>ciclos</span><span><strong>${result.metrics.edges}</strong>relaciones</span></div></section><section class="panel demo-note"><h3>Datos de demostración</h3><p>Si cambia la semilla, las relaciones se regeneran y estos resultados se vuelven a calcular.</p>${button("seed", "Cambiar semilla")}</section></aside></div>`;
  } else {
    const ordered =
      state.analysisTab === "topology"
        ? topologicalOrder(state.curriculum)
        : state.curriculum.courses.map((course) => course.id);
    const orderedCourses = ordered
      .map((item) =>
        typeof item === "object"
          ? item
          : state.curriculum.courses.find((course) => course.id === item),
      )
      .filter(Boolean);
    body = `<section class="panel"><h2>${state.analysisTab === "topology" ? "Una ruta posible, sin saltar prerrequisitos." : "Cada curso y lo que necesita antes."}</h2><p class="muted">${state.analysisTab === "topology" ? "El orden respeta todas las relaciones del plan." : "Las flechas van del prerrequisito al curso que lo requiere."}</p>${[
      ...new Set(state.curriculum.courses.map((course) => course.cycle)),
    ]
      .map(
        (cycle) =>
          `<section class="analysis-cycle"><h3>Ciclo ${pad(cycle)}</h3>${orderedCourses
            .filter((course) => course.cycle === cycle)
            .map((course) => {
              const requirements = relationsFor(
                state.curriculum,
                course.id,
              ).requires;
              return `<div class="analysis-row"><button data-course="${course.id}"><span class="mono">${esc(course.code)}</span> ${esc(course.name)}</button><span>${requirements.length ? requirements.map((id) => `<button class="relation-chip" data-course="${id}">${esc(state.curriculum.courses.find((item) => item.id === id)?.code)}</button>`).join("") : "Sin prerrequisitos"}</span></div>`;
            })
            .join("")}</section>`,
      )
      .join("")}</section>`;
  }
  return `<div class="analysis-controls">${tabs}${exportMenu()}</div>${body}`;
}
function graphView(state) {
  const metrics = metricsFor(state.curriculum);
  return `<p class="graph-metrics mono">${metrics.minima.length} mínimos · ${metrics.maxima.length} máximos · altura ${metrics.height}</p><div class="graph-options"><div class="segmented">${[
    ["direct", "Directas"],
    ["full", "Alcance completo"],
    ["all", "Todo el plan"],
  ]
    .map(([scope, label]) =>
      button(
        "scope",
        label,
        `data-scope="${scope}" aria-pressed="${graphOptions.scope === scope}"`,
      ),
    )
    .join(
      "",
    )}</div><label><input id="bands" type="checkbox" ${graphOptions.bands ? "checked" : ""}> Franjas por ciclo</label><label><input id="hasse" type="checkbox" ${graphOptions.hasse ? "checked" : ""}> Reducción de Hasse</label></div><section class="graph-shell ${graphOptions.bands ? "with-bands" : ""}"><div id="graph" aria-label="Grafo interactivo de prerrequisitos" role="img"></div><div class="graph-toolbar">${button("zoom-out", "−", 'aria-label="Alejar"')}${button("zoom-in", "+", 'aria-label="Acercar"')}${button("fit", "Ajustar")}${exportMenu(true)}${button("list", "Ver como lista")}</div><p class="graph-hint">Las flechas van del prerrequisito al curso que lo requiere.</p></section><details class="graph-list"><summary>Alternativa textual del grafo</summary>${state.curriculum.courses
    .map(
      (course) =>
        `<p><button data-course="${course.id}">${esc(course.code)} ${esc(course.name)}</button> — Requiere: ${
          relationsFor(state.curriculum, course.id)
            .requires.map((id) =>
              esc(
                state.curriculum.courses.find((item) => item.id === id)?.code,
              ),
            )
            .join(", ") || "ninguno"
        }</p>`,
    )
    .join("")}</details>${details(state)}`;
}
function render() {
  graph?.destroy();
  graph = null;
  const state = store.getState();
  const matches = searchCourses(state.curriculum, state.query);
  document
    .querySelectorAll("[data-view]")
    .forEach((element) =>
      element.setAttribute(
        "aria-current",
        element.dataset.view === state.view ? "page" : "false",
      ),
    );
  document.querySelector("#seed-label").textContent =
    `DEMO · SEMILLA ${state.curriculum.seed}`;
  const cycles = new Set(state.curriculum.courses.map((course) => course.cycle))
    .size;
  workspace.innerHTML = `<div class="title-row"><div><h1>${state.query ? "Resultados de búsqueda" : { grid: "Malla curricular", graph: "Grafo de prerrequisitos", analysis: "Análisis del plan" }[state.view]}</h1><p class="subtitle mono">${state.query ? `${matches.length} resultados para «${esc(state.query)}»` : `${state.curriculum.courses.length} cursos · ${cycles} ciclos · ${state.curriculum.edges.length} relaciones`}</p></div>${state.view === "grid" && !state.query ? legend() : ""}</div>${state.query ? (matches.length ? `<div class="search-results">${matches.map((course) => tile(course, state, selectedRelations(state))).join("")}</div>` : `<section class="empty"><h2>No encontramos ese curso.</h2><p>Pruebe con otro nombre o código de curso.</p>${button("clear-search", "Limpiar búsqueda", 'class="primary"')}</section>`) : state.view === "grid" ? gridView(state, matches) : state.view === "analysis" ? analysisView(state) : graphView(state)}`;
  if (state.view === "graph" && !state.query)
    graph = createGraph(
      document.querySelector("#graph"),
      state.curriculum,
      state.selectedCourseId,
      graphOptions,
      (id) => selectCourse(id),
    );
  history.replaceState(
    null,
    "",
    shareLink(location.href, state.curriculum, state.selectedCourseId),
  );
  document.title = `${labels[state.view]} — Trama`;
}
function selectCourse(id) {
  const course = store
    .getState()
    .curriculum.courses.find((course) => course.id === id);
  if (!course) return;
  store.dispatch({ type: "select", id });
  store.dispatch({ type: "cycle", cycle: course.cycle });
  if (store.getState().query) {
    search.value = "";
    store.dispatch({ type: "search", query: "" });
    store.dispatch({ type: "navigate", view: "grid" });
  }
  announce(`${course.code}, ${course.name}, seleccionado`);
  if (
    matchMedia("(max-width: 700px)").matches &&
    store.getState().view === "grid"
  )
    showDialog("detail");
}
function showDialog(kind) {
  // A course click rerenders its button before opening the detail sheet.
  // Resolve the replacement trigger rather than saving the disconnected node.
  if (!modal.open) {
    dialogTrigger =
      kind === "detail"
        ? workspace.querySelector(
            `[data-course="${store.getState().selectedCourseId}"]`,
          )
        : document.activeElement;
  }
  const state = store.getState();
  if (kind === "detail")
    modal.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">Detalle del curso</h2>${button("close", "Cerrar")}</div>${details(state)}`;
  else if (kind === "about")
    modal.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">Acerca de Trama</h2>${button("close", "Cerrar")}</div><div class="about-brand"><img src="assets/trama/mark.svg" width="24" height="24" alt=""><span>Trama</span></div><p class="mono">Versión 3.0.1</p><p>Explore cómo se conectan los cursos de un plan de estudios.</p><p class="demo-note">Los cursos y relaciones son datos de demostración. No representan un plan académico oficial.</p><p>Hecho por Trinity Bytes · Licencia MIT</p>`;
  else
    modal.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">Datos de demostración</h2>${button("close", "Cerrar")}</div><p>Esta malla es un ejemplo. Los cursos se mantienen y las relaciones se generan aleatoriamente.</p><form id="seed-form"><label for="seed-input">Semilla reproducible</label><input id="seed-input" name="seed" value="${esc(state.curriculum.seed)}" required maxlength="120"><p class="muted">La misma semilla genera las mismas relaciones. Regenerar cambia el plan y limpia la selección.</p><div class="actions"><button class="primary" type="submit">Aplicar semilla</button>${button("random", "Regenerar al azar")}</div></form>`;
  if (!modal.open) modal.showModal();
}
function regenerate(seed) {
  modal.close();
  store.dispatch({ type: "regenerate", seed });
  toast("Malla regenerada. Todos los análisis están al día.");
  announce("Malla regenerada. Se limpió la selección.");
}
document.addEventListener("click", async (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.view) {
    store.dispatch({ type: "navigate", view: target.dataset.view });
    return;
  }
  if (target.dataset.course) {
    selectCourse(Number(target.dataset.course));
    return;
  }
  if (target.dataset.cycle) {
    store.dispatch({ type: "cycle", cycle: Number(target.dataset.cycle) });
    return;
  }
  if (target.dataset.tab) {
    store.dispatch({ type: "analysis", tab: target.dataset.tab });
    return;
  }
  const action = target.dataset.action;
  if (action === "search") {
    document.body.classList.toggle("search-open");
    search.focus();
    return;
  }
  if (["about", "seed", "detail"].includes(action)) {
    showDialog(action);
    return;
  }
  if (action === "close") modal.close();
  if (action === "random") regenerate();
  if (action === "clear") {
    modal.close();
    store.dispatch({ type: "select", id: null });
  }
  if (action === "clear-search") {
    search.value = "";
    store.dispatch({ type: "search", query: "" });
    search.focus();
  }
  if (action === "graph" || action === "route") {
    graphOptions.scope = "full";
    modal.close();
    store.dispatch({ type: "navigate", view: "graph" });
  }
  if (action === "scope") {
    graphOptions.scope = target.dataset.scope;
    render();
  }
  if (action === "fit") graph?.fit();
  if (action === "zoom-in") graph?.zoom(1.2);
  if (action === "zoom-out") graph?.zoom(1 / 1.2);
  if (action === "png") graph?.png();
  if (action === "list") {
    const list = document.querySelector(".graph-list");
    list.open = true;
    list.querySelector("summary").focus();
  }
  if (action === "json" || action === "csv") {
    const file = exportForView(store.getState(), action);
    download(file.filename, file.content, file.type);
  }
  if (action === "share")
    try {
      await navigator.clipboard.writeText(
        shareLink(
          location.href,
          store.getState().curriculum,
          store.getState().selectedCourseId,
        ),
      );
      toast("Enlace copiado.");
    } catch {
      toast(
        "No se pudo copiar. Copie el enlace desde la barra de direcciones.",
      );
    }
});
search.addEventListener("input", () => {
  store.dispatch({ type: "search", query: search.value });
  announce(
    `${searchCourses(store.getState().curriculum, search.value).length} cursos encontrados`,
  );
});
document.addEventListener("change", (event) => {
  if (event.target.id === "hasse" || event.target.id === "bands") {
    graphOptions[event.target.id] = event.target.checked;
    render();
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id === "seed-form") {
    event.preventDefault();
    regenerate(new FormData(event.target).get("seed").trim());
  }
});
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    const box = modal.getBoundingClientRect();
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      modal.close();
  }
});
modal.addEventListener("close", () => {
  const isVisible = (element) =>
    element?.isConnected &&
    element !== document.body &&
    element.getClientRects().length > 0 &&
    !element.closest("dialog:not([open])");
  const fallback = [
    ...document.querySelectorAll('[data-view][aria-current="page"]'),
  ].find(isVisible);
  (isVisible(dialogTrigger) ? dialogTrigger : fallback)?.focus();
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !modal.open &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
  ) {
    event.preventDefault();
    search.focus();
  }
  if (event.key === "Escape" && !modal.open) {
    if (search.value) {
      search.value = "";
      store.dispatch({ type: "search", query: "" });
    } else store.dispatch({ type: "select", id: null });
  }
});
store.subscribe(render);
if (
  initial.course &&
  store
    .getState()
    .curriculum.courses.some((course) => course.id === initial.course)
) {
  store.dispatch({ type: "select", id: initial.course });
  store.dispatch({
    type: "cycle",
    cycle: store
      .getState()
      .curriculum.courses.find((course) => course.id === initial.course).cycle,
  });
}
render();
