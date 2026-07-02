import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "championshipData";

const RIVALS = ["Rex", "Nova", "Blaze", "Vega", "Kira"];

export const championshipState = {
  data: loadData()
};

export function setupChampionship(state, showScreen) {
  state.championship = championshipState;

  document.getElementById("championshipBtn").onclick = () => {
    updateChampionshipUI();
    showScreen("championshipScreen");
  };

  document.getElementById("startChampionship").onclick = () => startChampionship();
  document.getElementById("recordChampRace").onclick = () => recordRound(state);
  document.getElementById("finishChampionship").onclick = () => finishChampionship(state, true);
  document.getElementById("resetChampionship").onclick = () => {
    if (!confirm("¿Reiniciar la copa actual?")) return;
    championshipState.data.active = false;
    championshipState.data.round = 0;
    championshipState.data.playerPoints = 0;
    championshipState.data.rivals = createRivals();
    saveData();
    updateChampionshipUI();
    window.showToast?.("Copa reiniciada");
  };

  updateChampionshipUI();
}

export function updateChampionship(state) {
  updateChampionshipHUD();
}

function startChampionship() {
  const data = championshipState.data;
  data.active = true;
  data.name = "Copa Neon";
  data.round = 0;
  data.totalRounds = 5;
  data.playerPoints = 0;
  data.rivals = createRivals();
  data.lastRaceStat = getGlobalRaceStat();
  saveData();
  updateChampionshipUI();
  window.showToast?.("Campeonato iniciado");
}

function recordRound(state) {
  const data = championshipState.data;
  if (!data.active) {
    window.showToast?.("Primero empieza una copa");
    return;
  }

  if (data.round >= data.totalRounds) {
    finishChampionship(state, true);
    return;
  }

  const raceStat = getGlobalRaceStat();
  const completedRealRace = raceStat > (data.lastRaceStat || 0);

  const basePosition = completedRealRace ? 1 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 3);
  const position = Math.max(1, Math.min(6, basePosition));
  const points = pointsForPosition(position);

  data.round += 1;
  data.playerPoints += points;
  data.lastRaceStat = raceStat;

  data.rivals.forEach(rival => {
    const rivalPos = 1 + Math.floor(Math.random() * 6);
    rival.points += pointsForPosition(rivalPos);
  });

  saveData();
  updateChampionshipUI();

  window.showToast?.("Ronda " + data.round + ": P" + position + " · +" + points + " pts");

  if (data.round >= data.totalRounds) {
    finishChampionship(state, true);
  }
}

function finishChampionship(state, reward) {
  const data = championshipState.data;
  if (!data.active && !reward) return;

  const standings = getStandings();
  const playerPlace = standings.findIndex(x => x.player) + 1;

  if (reward && data.round > 0) {
    const winBonus = playerPlace === 1 ? 700 : playerPlace <= 3 ? 420 : 220;
    const coins = winBonus + data.playerPoints * 8;
    const xp = Math.round(coins * 0.55);

    addCoins(state, coins);
    addXP(state, xp);
    addStat(state, "championshipsFinished", 1);

    if (playerPlace === 1) {
      data.wins += 1;
      addStat(state, "championshipsWon", 1);
    }

    data.bestScore = Math.max(data.bestScore, data.playerPoints);
    data.lastPlace = playerPlace;
    window.showToast?.("Copa terminada: P" + playerPlace + " · +" + coins + " monedas");
  }

  data.active = false;
  saveData();
  updateChampionshipUI();
}

function getStandings() {
  const data = championshipState.data;
  const rows = [
    { name: "Tú", points: data.playerPoints || 0, player: true },
    ...(data.rivals || [])
  ];

  return rows.sort((a, b) => b.points - a.points);
}

function updateChampionshipUI() {
  const data = championshipState.data;
  const progress = data.totalRounds ? Math.round((data.round / data.totalRounds) * 100) : 0;

  setText("champName", data.active ? data.name : "Sin copa activa");
  setText("champRound", (data.round || 0) + "/" + (data.totalRounds || 5));
  setText("champPoints", data.playerPoints || 0);
  setText("champWins", data.wins || 0);
  setText("champBest", data.bestScore || 0);
  setText("champReward", data.active ? "según posición final" : data.lastPlace ? "Última posición: P" + data.lastPlace : "--");

  const fill = document.getElementById("champFill");
  if (fill) fill.style.width = progress + "%";

  const standings = document.getElementById("champStandings");
  if (standings) {
    standings.innerHTML = "";
    getStandings().forEach((row, i) => {
      const div = document.createElement("div");
      div.className = "champ-row" + (row.player ? " player" : "");
      div.innerHTML = `<b>#${i + 1}</b><span>${row.name}</span><b>${row.points}</b>`;
      standings.appendChild(div);
    });
  }

  updateChampionshipHUD();
}

function updateChampionshipHUD() {
  const hud = document.getElementById("hudChampionship");
  if (!hud) return;

  const data = championshipState.data;
  hud.textContent = data.active
    ? "R" + data.round + "/" + data.totalRounds + " · " + data.playerPoints + " pts"
    : data.wins ? "Copas " + data.wins : "--";
}

function createRivals() {
  return RIVALS.map(name => ({
    name,
    points: Math.floor(Math.random() * 4)
  }));
}

function pointsForPosition(position) {
  return [0, 25, 18, 15, 10, 8, 6][position] || 4;
}

function getGlobalRaceStat() {
  try {
    const progress = JSON.parse(localStorage.getItem("playerProgress") || "{}");
    return Number(progress.stats?.races || 0);
  } catch {
    return 0;
  }
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.wins === "number" ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    active: false,
    name: "Copa Neon",
    round: 0,
    totalRounds: 5,
    playerPoints: 0,
    rivals: createRivals(),
    wins: 0,
    bestScore: 0,
    lastPlace: null,
    lastRaceStat: 0
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(championshipState.data));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
