import { addCoins } from "./shop.js";
import { addXP } from "./progress.js";

export function setupAchievements(state) {
  state.achievements = loadAchievements();
}

export function unlockAchievement(state, id) {
  if (!state.manifest?.achievements) return false;
  if (state.achievements[id]) return false;

  const ach = state.manifest.achievements.find(a => a.id === id);
  if (!ach) return false;

  state.achievements[id] = {
    unlockedAt: new Date().toISOString()
  };

  localStorage.setItem("achievements", JSON.stringify(state.achievements));

  addCoins(state, ach.coins || 0);
  addXP(state, ach.xp || 0);

  window.showToast?.("Logro desbloqueado: " + ach.name);
  updateAchievementsUI(state);
  return true;
}

export function setupAchievementsUI(state, showScreen) {
  document.getElementById("achievementsBtn").onclick = () => {
    updateAchievementsUI(state);
    showScreen("achievementsScreen");
  };

  updateAchievementsUI(state);
}

export function updateAchievementsUI(state) {
  const list = document.getElementById("achievementsList");
  if (!list || !state.manifest?.achievements) return;

  list.innerHTML = "";

  state.manifest.achievements.forEach(ach => {
    const done = !!state.achievements?.[ach.id];
    const card = document.createElement("div");
    card.className = "achievement-card " + (done ? "done" : "locked");
    card.innerHTML = `
      <b>${done ? "✅ " : "🔒 "}${ach.name}</b>
      <p>${ach.description}</p>
      <p>Recompensa: ${ach.coins} monedas + ${ach.xp} XP</p>
      <p>${done ? "Desbloqueado" : "Pendiente"}</p>
    `;
    list.appendChild(card);
  });
}

function loadAchievements() {
  try {
    return JSON.parse(localStorage.getItem("achievements") || "{}");
  } catch {
    return {};
  }
}
