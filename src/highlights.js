const STORAGE_KEY = "highlightsData";

export const highlightsState = {
  data: loadData(),
  session: {
    topSpeed: 0,
    bestDrift: 0,
    maxWanted: 0,
    lastMoment: "--",
    timer: 0,
    lastAutoSave: 0
  }
};

export function setupHighlights(state, showScreen) {
  state.highlights = highlightsState;

  document.getElementById("highlightsBtn").onclick = () => {
    updateHighlightsUI();
    showScreen("highlightsScreen");
  };

  document.getElementById("saveManualHighlight").onclick = () => {
    saveHighlight(state, "Momento manual");
  };

  document.getElementById("copyHighlightSummary").onclick = async () => {
    const text = buildVideoText();
    try {
      await navigator.clipboard.writeText(text);
      window.showToast?.("Resumen copiado");
    } catch {
      window.showToast?.("No se pudo copiar");
    }
  };

  document.getElementById("clearHighlights").onclick = () => {
    if (!confirm("¿Borrar todos los destacados?")) return;
    highlightsState.data.items = [];
    saveData();
    updateHighlightsUI();
    window.showToast?.("Destacados borrados");
  };

  updateHighlightsUI();
}

export function updateHighlights(state, dt) {
  const session = highlightsState.session;
  session.timer += dt;

  const speed = Math.round(Math.abs(state.speed || 0) * 180);
  if (speed > session.topSpeed) {
    session.topSpeed = speed;
    if (speed >= 210) maybeAutoHighlight(state, "Velocidad máxima: " + speed + " km/h");
  }

  const driftScore = Math.floor(state.driftMode?.score || 0);
  if (driftScore > session.bestDrift) {
    session.bestDrift = driftScore;
    if (driftScore >= 2500) maybeAutoHighlight(state, "Drift épico: " + driftScore + " pts");
  }

  const wanted = Number(state.policeAdvanced?.wanted || 0);
  if (wanted > session.maxWanted) {
    session.maxWanted = wanted;
    if (wanted >= 3) maybeAutoHighlight(state, "Persecución nivel " + wanted);
  }

  updateHighlightsHUD();
}

export function saveHighlight(state, title) {
  const item = {
    id: Date.now(),
    title,
    time: new Date().toISOString(),
    topSpeed: highlightsState.session.topSpeed,
    bestDrift: highlightsState.session.bestDrift,
    maxWanted: highlightsState.session.maxWanted,
    coins: getCoins(),
    level: getLevel(),
    car: getCarName(state),
    map: getMapName(state)
  };

  highlightsState.data.items.unshift(item);
  highlightsState.data.items = highlightsState.data.items.slice(0, 20);
  highlightsState.session.lastMoment = title;
  saveData();
  updateHighlightsUI();
  updateHighlightsHUD();
  window.showToast?.("Destacado guardado");
}

function maybeAutoHighlight(state, title) {
  const now = performance.now();
  if (now - highlightsState.session.lastAutoSave < 12000) return;
  highlightsState.session.lastAutoSave = now;
  saveHighlight(state, title);
}

function updateHighlightsUI() {
  setText("highlightTopSpeed", highlightsState.session.topSpeed + " km/h");
  setText("highlightBestDrift", highlightsState.session.bestDrift + " pts");
  setText("highlightWanted", highlightsState.session.maxWanted + " estrellas");
  setText("highlightLast", highlightsState.session.lastMoment);

  const list = document.getElementById("highlightsList");
  if (list) {
    list.innerHTML = "";

    if (!highlightsState.data.items.length) {
      list.innerHTML = "<p>No hay destacados todavía.</p>";
    } else {
      highlightsState.data.items.forEach(item => {
        const row = document.createElement("div");
        row.className = "highlight-row";
        row.innerHTML = `
          <b>${escapeHTML(item.title)}</b>
          <p>${formatDate(item.time)} · ${escapeHTML(item.car)} · ${escapeHTML(item.map)}</p>
          <p>${item.topSpeed} km/h · Drift ${item.bestDrift} · Búsqueda ${item.maxWanted}★</p>
        `;
        list.appendChild(row);
      });
    }
  }

  const textarea = document.getElementById("highlightVideoText");
  if (textarea) textarea.value = buildVideoText();
}

function updateHighlightsHUD() {
  const hud = document.getElementById("hudHighlight");
  if (!hud) return;

  hud.textContent = highlightsState.session.lastMoment !== "--"
    ? highlightsState.session.lastMoment
    : highlightsState.session.topSpeed > 0
      ? highlightsState.session.topSpeed + " km/h"
      : "--";
}

function buildVideoText() {
  const items = highlightsState.data.items.slice(0, 5);
  if (!items.length) {
    return "Nuevo gameplay del juego de coches realista. Carreras, drift, persecuciones y mundo abierto.";
  }

  const best = items[0];
  return [
    "🔥 Nuevo gameplay del juego de coches realista",
    "",
    "Mejor momento: " + best.title,
    "Coche: " + best.car,
    "Mapa: " + best.map,
    "Velocidad máxima: " + best.topSpeed + " km/h",
    "Mejor drift: " + best.bestDrift + " puntos",
    "Nivel de búsqueda: " + best.maxWanted + " estrellas",
    "",
    "Vidas solo hay una, así que a disfrutarla al máximo."
  ].join("\\n");
}

function getCoins() {
  return Number(localStorage.getItem("walletCoins") || 0);
}

function getLevel() {
  try {
    const progress = JSON.parse(localStorage.getItem("playerProgress") || "{}");
    return progress.level || 1;
  } catch {
    return 1;
  }
}

function getCarName(state) {
  return state.manifest?.cars?.[state.selectedCarIndex]?.name || "Coche";
}

function getMapName(state) {
  return state.manifest?.maps?.[state.selectedMapIndex]?.name || "Mapa";
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && Array.isArray(data.items) ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return { items: [] };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(highlightsState.data));
}

function formatDate(date) {
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "--";
  }
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
