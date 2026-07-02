const STORAGE_KEY = "localRanking";

export function setupRanking(state) {
  state.localRanking = loadRanking();
}

export function setupRankingUI(state, showScreen) {
  document.getElementById("rankingBtn").onclick = () => {
    updateRankingUI(state);
    showScreen("rankingScreen");
  };

  document.getElementById("clearRanking").onclick = () => {
    if (!confirm("¿Seguro que quieres borrar el ranking local?")) return;
    state.localRanking = createEmptyRanking();
    saveRanking(state);
    updateRankingUI(state);
    window.showToast?.("Ranking borrado");
  };

  document.getElementById("exportRanking").onclick = () => exportRanking(state);

  updateRankingUI(state);
}

export function recordRaceResult(state, result) {
  if (!state.localRanking) state.localRanking = loadRanking();

  const entry = {
    type: "race",
    map: state.manifest?.maps?.[state.selectedMapIndex]?.name || "Mapa",
    car: state.manifest?.cars?.[state.selectedCarIndex]?.name || "Coche",
    time: result.time || 0,
    position: result.position || 1,
    reward: result.reward || 0,
    date: new Date().toISOString()
  };

  state.localRanking.races.push(entry);
  state.localRanking.races.sort((a, b) => a.time - b.time);
  state.localRanking.races = state.localRanking.races.slice(0, 10);

  addRecent(state, entry);
  saveRanking(state);
  updateRankingUI(state);
}

export function recordDuelResult(state, result) {
  if (!state.localRanking) state.localRanking = loadRanking();

  const entry = {
    type: "duel",
    winner: result.winner || "Jugador",
    reward: result.reward || 0,
    car: state.manifest?.cars?.[state.selectedCarIndex]?.name || "Coche",
    map: state.manifest?.maps?.[state.selectedMapIndex]?.name || "Mapa",
    date: new Date().toISOString()
  };

  state.localRanking.duels.unshift(entry);
  state.localRanking.duels = state.localRanking.duels.slice(0, 12);

  addRecent(state, entry);
  saveRanking(state);
  updateRankingUI(state);
}

export function updateRankingUI(state) {
  const ranking = state.localRanking || loadRanking();

  renderList("bestRaceList", ranking.races, item => `
    <div class="ranking-row">
      <b>${formatTime(item.time)}</b>
      <small>${item.car} · ${item.map}</small>
      <small>Posición: ${item.position} · ${item.reward} monedas</small>
    </div>
  `);

  renderList("duelHistoryList", ranking.duels, item => `
    <div class="ranking-row">
      <b>${item.winner}</b>
      <small>${item.car} · ${item.map}</small>
      <small>${item.reward} monedas · ${formatDate(item.date)}</small>
    </div>
  `);

  renderList("recentHistoryList", ranking.recent, item => `
    <div class="ranking-row">
      <b>${item.type === "race" ? "Carrera" : "Duelo"}</b>
      <small>${item.type === "race" ? formatTime(item.time) + " · Pos. " + item.position : "Ganador: " + item.winner}</small>
      <small>${formatDate(item.date)}</small>
    </div>
  `);
}

function renderList(id, items, template) {
  const el = document.getElementById(id);
  if (!el) return;

  if (!items || !items.length) {
    el.textContent = "Sin datos.";
    return;
  }

  el.innerHTML = items.map(template).join("");
}

function addRecent(state, entry) {
  state.localRanking.recent.unshift(entry);
  state.localRanking.recent = state.localRanking.recent.slice(0, 15);
}

function loadRanking() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && data.races && data.duels && data.recent ? data : createEmptyRanking();
  } catch {
    return createEmptyRanking();
  }
}

function createEmptyRanking() {
  return {
    races: [],
    duels: [],
    recent: []
  };
}

function saveRanking(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.localRanking || createEmptyRanking()));
}

function exportRanking(state) {
  const ranking = state.localRanking || loadRanking();
  const blob = new Blob([JSON.stringify(ranking, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "racing_realista_ranking_" + Date.now() + ".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  window.showToast?.("Ranking exportado");
}

function formatTime(ms) {
  if (!ms) return "--:--.---";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function formatDate(date) {
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "--";
  }
}
