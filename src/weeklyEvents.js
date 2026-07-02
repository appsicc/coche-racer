import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "weeklyEventsData";

const CHALLENGE_POOL = [
  { id: "races_3", title: "Piloto semanal", desc: "Completa 3 carreras.", stat: "races", target: 3, points: 120, coins: 220 },
  { id: "drift_2", title: "Semana de drift", desc: "Termina 2 sesiones de drift.", stat: "driftRuns", target: 2, points: 110, coins: 200 },
  { id: "police_1", title: "Escapada famosa", desc: "Escapa 1 vez de la policía.", stat: "policeEscapes", target: 1, points: 130, coins: 260 },
  { id: "crew_2", title: "Trabajo en equipo", desc: "Completa 2 misiones de crew.", stat: "crewMissions", target: 2, points: 100, coins: 190 },
  { id: "coins_250", title: "Coleccionista", desc: "Recoge 250 monedas.", stat: "coinsCollected", target: 250, points: 140, coins: 280 },
  { id: "champ_1", title: "Competición oficial", desc: "Termina 1 campeonato.", stat: "championshipsFinished", target: 1, points: 150, coins: 320 },
  { id: "events_2", title: "Constancia diaria", desc: "Completa 2 eventos diarios.", stat: "dailyEvents", target: 2, points: 120, coins: 240 },
  { id: "workshop_3", title: "Turno de taller", desc: "Completa 3 misiones de taller.", stat: "workshopMissions", target: 3, points: 110, coins: 210 }
];

const REWARDS = [
  { level: 1, points: 100, coins: 150, xp: 90, label: "Pack inicial" },
  { level: 2, points: 250, coins: 250, xp: 130, label: "Bonus de piloto" },
  { level: 3, points: 430, coins: 350, xp: 180, label: "Pack de taller" },
  { level: 4, points: 640, coins: 500, xp: 250, label: "Pack avanzado" },
  { level: 5, points: 900, coins: 800, xp: 420, label: "Premio semanal" }
];

export const weeklyState = {
  data: loadData()
};

export function setupWeeklyEvents(state, showScreen) {
  state.weeklyEvents = weeklyState;

  document.getElementById("weeklyBtn").onclick = () => {
    updateWeeklyEvents(state);
    showScreen("weeklyScreen");
  };

  document.getElementById("refreshWeekly").onclick = () => {
    ensureWeek(state, true);
    updateWeeklyEvents(state);
    window.showToast?.("Semana actualizada");
  };

  document.getElementById("resetWeekly").onclick = () => {
    if (!confirm("¿Resetear eventos semanales?")) return;
    localStorage.removeItem(STORAGE_KEY);
    weeklyState.data = loadData();
    ensureWeek(state, true);
    updateWeeklyEvents(state);
    window.showToast?.("Semanales reseteados");
  };

  ensureWeek(state);
  updateWeeklyUI(state);
}

export function updateWeeklyEvents(state) {
  ensureWeek(state);
  updateWeeklyUI(state);
  updateWeeklyHUD();
  saveData();
}

function ensureWeek(state, force = false) {
  const key = getWeekKey();

  if (!force && weeklyState.data.weekKey === key && weeklyState.data.challenges.length) {
    return;
  }

  const selected = pickChallenges(key, 4);
  const stats = state.progress?.stats || {};

  weeklyState.data.weekKey = key;
  weeklyState.data.challenges = selected.map(ch => ({
    ...ch,
    start: Number(stats[ch.stat] || 0),
    claimed: false
  }));
  weeklyState.data.rewardClaims = [];
  saveData();
}

function pickChallenges(key, count) {
  const pool = [...CHALLENGE_POOL];
  const picked = [];

  let seed = hashCode(key);
  while (picked.length < count && pool.length) {
    seed = (seed * 9301 + 49297) % 233280;
    const index = Math.abs(seed) % pool.length;
    picked.push(pool.splice(index, 1)[0]);
  }

  return picked;
}

function claimChallenge(state, id) {
  const challenge = weeklyState.data.challenges.find(c => c.id === id);
  if (!challenge) return;

  const stats = state.progress?.stats || {};
  const current = Number(stats[challenge.stat] || 0);
  const progress = current - challenge.start;

  if (progress < challenge.target || challenge.claimed) {
    window.showToast?.("Reto semanal no completado");
    return;
  }

  challenge.claimed = true;
  weeklyState.data.points += challenge.points;

  addCoins(state, challenge.coins);
  addXP(state, Math.round(challenge.points * 0.8));
  addStat(state, "weeklyChallenges", 1);

  saveData();
  updateWeeklyUI(state);
  window.showToast?.("Reto semanal: +" + challenge.points + " puntos");
}

function claimReward(state, level) {
  const reward = REWARDS.find(r => r.level === level);
  if (!reward) return;

  if (weeklyState.data.rewardClaims.includes(level)) {
    window.showToast?.("Recompensa ya cobrada");
    return;
  }

  if (weeklyState.data.points < reward.points) {
    window.showToast?.("Faltan puntos de pase");
    return;
  }

  weeklyState.data.rewardClaims.push(level);

  addCoins(state, reward.coins);
  addXP(state, reward.xp);
  addStat(state, "weeklyRewards", 1);

  if (level === 3 || level === 5) {
    const coupons = Number(localStorage.getItem("workshopCoupons") || 0) + 1;
    localStorage.setItem("workshopCoupons", String(coupons));
  }

  saveData();
  updateWeeklyUI(state);
  window.showToast?.("Pase: " + reward.label + " cobrado");
}

function updateWeeklyUI(state) {
  const data = weeklyState.data;
  const level = getPassLevel(data.points);
  const next = REWARDS.find(r => r.level === level + 1) || REWARDS[REWARDS.length - 1];
  const prev = REWARDS.find(r => r.level === level) || { points: 0 };
  const fill = Math.min(100, ((data.points - prev.points) / Math.max(1, next.points - prev.points)) * 100);

  setText("weeklyKey", data.weekKey || "--");
  setText("passPoints", data.points || 0);
  setText("passLevel", level);

  const fillEl = document.getElementById("passFill");
  if (fillEl) fillEl.style.width = fill + "%";

  renderChallenges(state);
  renderRewards(state);
  updateWeeklyHUD();
}

function renderChallenges(state) {
  const list = document.getElementById("weeklyChallengesList");
  if (!list) return;

  const stats = state.progress?.stats || {};
  list.innerHTML = "";

  weeklyState.data.challenges.forEach(ch => {
    const progress = Math.max(0, Number(stats[ch.stat] || 0) - ch.start);
    const done = progress >= ch.target;

    const row = document.createElement("div");
    row.className = "weekly-row " + (ch.claimed ? "done" : "");
    row.innerHTML = `
      <b>${ch.claimed ? "✅ " : ""}${ch.title}</b>
      <p>${ch.desc}</p>
      <p>${Math.min(progress, ch.target)}/${ch.target}</p>
      <p>${ch.points} puntos · ${ch.coins} monedas</p>
      <button ${!done || ch.claimed ? "disabled" : ""}>COBRAR</button>
    `;
    row.querySelector("button").onclick = () => claimChallenge(state, ch.id);
    list.appendChild(row);
  });
}

function renderRewards(state) {
  const list = document.getElementById("weeklyRewardsList");
  if (!list) return;

  list.innerHTML = "";

  REWARDS.forEach(reward => {
    const claimed = weeklyState.data.rewardClaims.includes(reward.level);
    const unlocked = weeklyState.data.points >= reward.points;

    const row = document.createElement("div");
    row.className = "weekly-row " + (claimed ? "done" : unlocked ? "" : "locked");
    row.innerHTML = `
      <b>${claimed ? "✅ " : unlocked ? "🎁 " : "🔒 "}Nivel ${reward.level}: ${reward.label}</b>
      <p>Necesita ${reward.points} puntos</p>
      <p>${reward.coins} monedas · ${reward.xp} XP${reward.level === 3 || reward.level === 5 ? " · 1 bono taller" : ""}</p>
      <button ${!unlocked || claimed ? "disabled" : ""}>COBRAR</button>
    `;
    row.querySelector("button").onclick = () => claimReward(state, reward.level);
    list.appendChild(row);
  });
}

function updateWeeklyHUD() {
  const hud = document.getElementById("hudWeekly");
  if (!hud) return;
  hud.textContent = "Nv." + getPassLevel(weeklyState.data.points) + " · " + weeklyState.data.points + " pts";
}

function getPassLevel(points) {
  let level = 1;
  for (const reward of REWARDS) {
    if (points >= reward.points) level = reward.level;
  }
  return level;
}

function getWeekKey() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = Math.floor((now - start) / 86400000);
  const week = Math.ceil((diff + start.getDay() + 1) / 7);
  return now.getFullYear() + "-W" + String(week).padStart(2, "0");
}

function hashCode(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && Array.isArray(data.challenges) ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    weekKey: "",
    points: 0,
    challenges: [],
    rewardClaims: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(weeklyState.data));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
