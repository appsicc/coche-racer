import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "seasonPassData";
const POINTS_PER_LEVEL = 100;

const MISSIONS = [
  { id: "races", label: "Completa 5 carreras", stat: "races", target: 5, points: 120 },
  { id: "drift", label: "Consigue 12000 puntos drift", stat: "driftScore", target: 12000, points: 140 },
  { id: "police", label: "Escapa 2 veces de la policía", stat: "policeEscapes", target: 2, points: 150 },
  { id: "routes", label: "Completa 2 rutas personalizadas", stat: "customRoutesCompleted", target: 2, points: 130 },
  { id: "sponsors", label: "Completa 2 contratos de patrocinador", stat: "sponsorContracts", target: 2, points: 160 },
  { id: "skill", label: "Completa 4 retos de habilidad", stat: "skillChallengesCompleted", target: 4, points: 135 },
  { id: "weather", label: "Supera 1 clima extremo", stat: "extremeWeatherCompleted", target: 1, points: 125 }
];

const REWARDS = [
  { level: 1, coins: 150, xp: 60, label: "Inicio de temporada" },
  { level: 2, coins: 240, xp: 90, label: "Pack callejero" },
  { level: 3, coins: 320, xp: 130, label: "Bonus taller" },
  { level: 4, coins: 440, xp: 170, label: "Crédito de garaje" },
  { level: 5, coins: 620, xp: 240, label: "Recompensa épica" },
  { level: 6, coins: 760, xp: 300, label: "Contrato premium" },
  { level: 7, coins: 920, xp: 360, label: "Leyenda neon" },
  { level: 8, coins: 1200, xp: 500, label: "Final de temporada" }
];

export const seasonPassState = {
  data: loadData(),
  lastStats: {}
};

export function setupSeasonPass(state, showScreen) {
  state.seasonPass = seasonPassState;

  document.getElementById("seasonPassBtn").onclick = () => {
    updateSeasonPass(state);
    showScreen("seasonPassScreen");
  };

  document.getElementById("claimSeasonRewards").onclick = () => claimRewards(state);
  document.getElementById("seasonAddTestPoints").onclick = () => {
    addSeasonPoints(state, 90, "Puntos de prueba");
    updateSeasonPass(state);
  };
  document.getElementById("seasonReset").onclick = () => {
    if (!confirm("¿Reiniciar temporada?")) return;
    seasonPassState.data = createData();
    saveData();
    updateSeasonPass(state);
    window.showToast?.("Temporada reiniciada");
  };

  updateSeasonPass(state);
}

export function updateSeasonPass(state) {
  detectProgress(state);
  checkMissions(state);
  updateSeasonUI(state);
  updateSeasonHUD();
}

function detectProgress(state) {
  const stats = state.progress?.stats || {};
  const tracked = ["races","driftRuns","policeEscapes","customRoutesCompleted","skillChallengesCompleted","sponsorContracts","extremeWeatherCompleted"];

  tracked.forEach(stat => {
    const current = Number(stats[stat] || 0);
    const last = Number(seasonPassState.lastStats[stat] || current);
    const diff = current - last;

    if (diff > 0) {
      addSeasonPoints(state, diff * 12, "Progreso: " + stat, false);
    }

    seasonPassState.lastStats[stat] = current;
  });
}

function checkMissions(state) {
  const stats = state.progress?.stats || {};

  MISSIONS.forEach(mission => {
    if (seasonPassState.data.completedMissions.includes(mission.id)) return;

    const progress = Number(stats[mission.stat] || 0);
    if (progress >= mission.target) {
      seasonPassState.data.completedMissions.push(mission.id);
      addSeasonPoints(state, mission.points, mission.label, false);
      window.showToast?.("Misión temporada completada");
    }
  });

  saveData();
}

function addSeasonPoints(state, points, reason, addHistory = true) {
  seasonPassState.data.points += points;

  while (seasonPassState.data.points >= POINTS_PER_LEVEL && seasonPassState.data.level < REWARDS.length) {
    seasonPassState.data.points -= POINTS_PER_LEVEL;
    seasonPassState.data.level += 1;
    addStat(state, "seasonLevels", 1);
    window.showToast?.("Nivel de temporada " + seasonPassState.data.level);
  }

  if (addHistory) {
    seasonPassState.data.history.unshift({
      id: Date.now(),
      text: reason,
      points,
      date: new Date().toISOString()
    });
    seasonPassState.data.history = seasonPassState.data.history.slice(0, 24);
  }

  saveData();
}

function claimRewards(state) {
  let claimed = 0;
  let totalCoins = 0;
  let totalXP = 0;

  REWARDS.forEach(reward => {
    if (reward.level <= seasonPassState.data.level && !seasonPassState.data.claimedRewards.includes(reward.level)) {
      seasonPassState.data.claimedRewards.push(reward.level);
      addWallet(reward.coins);
      addXP(state, reward.xp);
      claimed++;
      totalCoins += reward.coins;
      totalXP += reward.xp;
    }
  });

  if (!claimed) {
    window.showToast?.("No hay premios para cobrar");
    return;
  }

  seasonPassState.data.history.unshift({
    id: Date.now(),
    text: "Premios cobrados",
    points: claimed,
    date: new Date().toISOString()
  });

  addStat(state, "seasonRewardsClaimed", claimed);
  saveData();
  updateSeasonUI(state);
  window.showToast?.("Premios: +" + totalCoins + " monedas +" + totalXP + " XP");
}

function updateSeasonUI(state) {
  const level = seasonPassState.data.level;
  const points = seasonPassState.data.points;
  const progress = Math.round((points / POINTS_PER_LEVEL) * 100);

  setText("seasonName", "Temporada Neon V65");
  setText("seasonLevel", level);
  setText("seasonPoints", points + "/" + POINTS_PER_LEVEL);
  setText("seasonClaimed", seasonPassState.data.claimedRewards.length);

  const fill = document.getElementById("seasonFill");
  if (fill) fill.style.width = progress + "%";

  renderMissions(state);
  renderRewards();
  renderHistory();
}

function renderMissions(state) {
  const box = document.getElementById("seasonMissions");
  if (!box) return;

  const stats = state.progress?.stats || {};
  box.innerHTML = MISSIONS.map(mission => {
    const progress = Math.min(Number(stats[mission.stat] || 0), mission.target);
    const done = seasonPassState.data.completedMissions.includes(mission.id);
    return `
      <div class="season-row ${done ? "done" : ""}">
        <b>${done ? "✅ " : "🎯 "}${escapeHTML(mission.label)}</b>
        <p>${progress}/${mission.target} · +${mission.points} puntos</p>
      </div>
    `;
  }).join("");
}

function renderRewards() {
  const box = document.getElementById("seasonRewards");
  if (!box) return;

  box.innerHTML = REWARDS.map(reward => {
    const claimed = seasonPassState.data.claimedRewards.includes(reward.level);
    const available = reward.level <= seasonPassState.data.level && !claimed;
    return `
      <div class="season-reward ${claimed ? "claimed" : available ? "available" : ""}">
        <b>Nivel ${reward.level}: ${escapeHTML(reward.label)}</b>
        <p>${reward.coins} monedas · ${reward.xp} XP</p>
        <p>${claimed ? "Cobrado" : available ? "Disponible" : "Bloqueado"}</p>
      </div>
    `;
  }).join("");
}

function renderHistory() {
  const box = document.getElementById("seasonHistory");
  if (!box) return;

  if (!seasonPassState.data.history.length) {
    box.innerHTML = "<p>No hay historial de temporada todavía.</p>";
    return;
  }

  box.innerHTML = seasonPassState.data.history.map(item => `
    <div class="season-row">
      <b>${escapeHTML(item.text)}</b>
      <p>+${item.points} · ${formatDate(item.date)}</p>
    </div>
  `).join("");
}

function updateSeasonHUD() {
  const hud = document.getElementById("hudSeason");
  if (!hud) return;
  hud.textContent = "Nv. " + seasonPassState.data.level;
}

function addWallet(amount) {
  const coins = Number(localStorage.getItem("walletCoins") || 0);
  localStorage.setItem("walletCoins", String(coins + amount));
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.level === "number" ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    level: 1,
    points: 0,
    completedMissions: [],
    claimedRewards: [],
    history: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seasonPassState.data));
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
