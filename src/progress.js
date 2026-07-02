import { addCoins } from "./shop.js";

export function setupProgress(state) {
  state.progress = loadProgress();
  ensureDefaults(state.progress);
}

export function getNextXP(level) {
  return 100 + (level - 1) * 80;
}

export function addXP(state, amount) {
  state.progress.xp += Math.floor(amount);

  while (state.progress.xp >= getNextXP(state.progress.level)) {
    state.progress.xp -= getNextXP(state.progress.level);
    state.progress.level++;
    window.showToast?.("¡Subiste al nivel " + state.progress.level + "!");
  }

  saveProgress(state);
  updateProfileUI(state);
}

export function addStat(state, key, amount = 1) {
  ensureDefaults(state.progress);
  state.progress.stats[key] = (state.progress.stats[key] || 0) + amount;
  saveProgress(state);
  updateProfileUI(state);
}

export function completeMission(state, id) {
  const mission = state.manifest.missions.find(m => m.id === id);
  if (!mission) return false;

  if (state.progress.completedMissions.includes(id)) return false;

  state.progress.completedMissions.push(id);
  addCoins(state, mission.rewardCoins);
  addXP(state, mission.rewardXP);
  saveProgress(state);
  updateProfileUI(state);
  window.showToast?.("Misión completada: " + mission.name);
  return true;
}

export function isCarUnlocked(state, index) {
  const car = state.manifest.cars[index];
  if (!car?.unlock || index === 0) return true;
  if (state.progress.unlockedCars.includes(car.id)) return true;
  return state.progress.level >= car.unlock.level;
}

export function isMapUnlocked(state, index) {
  const map = state.manifest.maps[index];
  if (!map?.unlock || index === 0) return true;
  if (state.progress.unlockedMaps.includes(map.id)) return true;
  return state.progress.level >= map.unlock.level;
}

export function tryUnlockCar(state, index) {
  const car = state.manifest.cars[index];
  if (isCarUnlocked(state, index)) return true;
  const cost = car.unlock?.cost || 0;

  if ((state.wallet || 0) < cost) {
    window.showToast?.("Necesitas nivel " + car.unlock.level + " o " + cost + " monedas");
    return false;
  }

  state.wallet -= cost;
  localStorage.setItem("walletCoins", String(state.wallet));
  state.progress.unlockedCars.push(car.id);
  saveProgress(state);
  updateProfileUI(state);
  window.showToast?.("Coche desbloqueado");
  return true;
}

export function tryUnlockMap(state, index) {
  const map = state.manifest.maps[index];
  if (isMapUnlocked(state, index)) return true;
  const cost = map.unlock?.cost || 0;

  if ((state.wallet || 0) < cost) {
    window.showToast?.("Necesitas nivel " + map.unlock.level + " o " + cost + " monedas");
    return false;
  }

  state.wallet -= cost;
  localStorage.setItem("walletCoins", String(state.wallet));
  state.progress.unlockedMaps.push(map.id);
  saveProgress(state);
  updateProfileUI(state);
  window.showToast?.("Circuito desbloqueado");
  return true;
}

export function setupProfileUI(state, showScreen) {
  document.getElementById("profileBtn").onclick = () => {
    updateProfileUI(state);
    showScreen("profileScreen");
  };
  updateProfileUI(state);
}

export function updateProfileUI(state) {
  if (!state.progress) return;
  ensureDefaults(state.progress);

  setText("profileLevel", state.progress.level);
  setText("profileXP", state.progress.xp);
  setText("profileNextXP", getNextXP(state.progress.level));
  setText("profileCoins", state.wallet || 0);
  setText("statRaces", state.progress.stats.races);
  setText("statWins", state.progress.stats.wins);
  setText("statChases", state.progress.stats.chases);
  setText("statCoinsCollected", state.progress.stats.coinsCollected);
  setText("statCityMissions", state.progress.stats.cityMissions || 0);

  const fill = document.getElementById("xpFill");
  if (fill) {
    fill.style.width = Math.min(100, (state.progress.xp / getNextXP(state.progress.level)) * 100) + "%";
  }

  const list = document.getElementById("missionsList");
  if (list && state.manifest?.missions) {
    list.innerHTML = "";
    state.manifest.missions.forEach(m => {
      const done = state.progress.completedMissions.includes(m.id);
      const div = document.createElement("div");
      div.className = "mission-card" + (done ? " completed" : "");
      div.innerHTML = `
        <b>${m.name}</b>
        <p>Recompensa: ${m.rewardCoins} monedas + ${m.rewardXP} XP</p>
        <p>${done ? "Completada" : "Pendiente"}</p>
      `;
      list.appendChild(div);
    });
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem("playerProgress") || "{}");
  } catch {
    return {};
  }
}

function saveProgress(state) {
  localStorage.setItem("playerProgress", JSON.stringify(state.progress));
}

function ensureDefaults(progress) {
  progress.level ??= 1;
  progress.xp ??= 0;
  progress.completedMissions ??= [];
  progress.unlockedCars ??= [];
  progress.unlockedMaps ??= [];
  progress.stats ??= {};
  progress.stats.races ??= 0;
  progress.stats.wins ??= 0;
  progress.stats.chases ??= 0;
  progress.stats.coinsCollected ??= 0;
  progress.stats.cityMissions ??= 0;
}
