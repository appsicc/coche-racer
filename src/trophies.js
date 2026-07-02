import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "trophiesData";

const TROPHIES = [
  { id: "first_race", icon: "🏁", title: "Primer rugido", desc: "Completa 1 carrera.", stat: "races", target: 1, points: 10, coins: 120, xp: 60 },
  { id: "race_fan", icon: "🏆", title: "Piloto constante", desc: "Completa 10 carreras.", stat: "races", target: 10, points: 25, coins: 300, xp: 150 },
  { id: "drift_start", icon: "💨", title: "Primer derrape", desc: "Termina 1 sesión drift.", stat: "driftRuns", target: 1, points: 10, coins: 140, xp: 70 },
  { id: "drift_master", icon: "🔥", title: "Rey del drift", desc: "Consigue 10000 puntos drift totales.", stat: "driftScore", target: 10000, points: 35, coins: 520, xp: 260 },
  { id: "escape_police", icon: "🚨", title: "Fuga limpia", desc: "Escapa 1 vez de la policía.", stat: "policeEscapes", target: 1, points: 15, coins: 220, xp: 120 },
  { id: "wanted_legend", icon: "⭐", title: "Leyenda buscada", desc: "Escapa 5 veces de la policía.", stat: "policeEscapes", target: 5, points: 40, coins: 650, xp: 320 },
  { id: "champ_done", icon: "🥇", title: "Finalista Neon", desc: "Termina 1 campeonato.", stat: "championshipsFinished", target: 1, points: 20, coins: 350, xp: 190 },
  { id: "champ_win", icon: "👑", title: "Campeón de copa", desc: "Gana 1 campeonato.", stat: "championshipsWon", target: 1, points: 45, coins: 800, xp: 420 },
  { id: "crew_member", icon: "🤝", title: "Trabajo en equipo", desc: "Completa 3 misiones de crew.", stat: "crewMissions", target: 3, points: 25, coins: 360, xp: 180 },
  { id: "story_one", icon: "📖", title: "Historia iniciada", desc: "Completa 1 capítulo de historia.", stat: "storyChapters", target: 1, points: 20, coins: 300, xp: 160 },
  { id: "story_all", icon: "🌟", title: "Historia de leyenda", desc: "Completa 5 capítulos de historia.", stat: "storyChapters", target: 5, points: 60, coins: 1000, xp: 520 },
  { id: "weekly_player", icon: "📅", title: "Jugador semanal", desc: "Completa 4 retos semanales.", stat: "weeklyChallenges", target: 4, points: 35, coins: 600, xp: 300 },
  { id: "collector", icon: "💰", title: "Coleccionista", desc: "Recoge 1000 monedas.", stat: "coinsCollected", target: 1000, points: 35, coins: 700, xp: 260 },
  { id: "tutorial_done", icon: "🎓", title: "Aprendiz rápido", desc: "Completa el tutorial guiado.", stat: "tutorialsCompleted", target: 1, points: 20, coins: 250, xp: 130 }
];

const COLLECTION_REWARDS = [
  { id: "collection_5", required: 5, label: "Pack Coleccionista I", coins: 500, xp: 250, coupon: 1 },
  { id: "collection_10", required: 10, label: "Pack Coleccionista II", coins: 900, xp: 450, coupon: 1 },
  { id: "collection_all", required: TROPHIES.length, label: "Leyenda completa", coins: 1600, xp: 800, coupon: 2 }
];

export const trophiesState = {
  data: loadData()
};

export function setupTrophies(state, showScreen) {
  state.trophies = trophiesState;

  document.getElementById("trophiesBtn").onclick = () => {
    updateTrophies(state);
    showScreen("trophiesScreen");
  };

  document.getElementById("claimAllTrophies").onclick = () => {
    claimAllAvailable(state);
  };

  document.getElementById("claimCollectionReward").onclick = () => {
    claimNextCollectionReward(state);
  };

  updateTrophies(state);
}

export function updateTrophies(state) {
  checkUnlocks(state);
  updateTrophyUI(state);
  updateTrophyHUD();
  saveData();
}

function checkUnlocks(state) {
  const stats = state.progress?.stats || {};

  TROPHIES.forEach(trophy => {
    if (trophiesState.data.unlocked.includes(trophy.id)) return;
    if (Number(stats[trophy.stat] || 0) >= trophy.target) {
      trophiesState.data.unlocked.push(trophy.id);
      trophiesState.data.newUnlocks += 1;
      window.showToast?.("Trofeo desbloqueado: " + trophy.title);
    }
  });
}

function claimAllAvailable(state) {
  let claimed = 0;

  TROPHIES.forEach(trophy => {
    if (trophiesState.data.unlocked.includes(trophy.id) && !trophiesState.data.claimed.includes(trophy.id)) {
      trophiesState.data.claimed.push(trophy.id);
      trophiesState.data.points += trophy.points;
      addCoins(state, trophy.coins);
      addXP(state, trophy.xp);
      claimed++;
    }
  });

  if (claimed > 0) {
    addStat(state, "trophiesClaimed", claimed);
    saveData();
    updateTrophyUI(state);
    window.showToast?.("Trofeos cobrados: " + claimed);
  } else {
    window.showToast?.("No hay trofeos para cobrar");
  }
}

function claimNextCollectionReward(state) {
  const unlockedCount = trophiesState.data.unlocked.length;
  const next = COLLECTION_REWARDS.find(r => unlockedCount >= r.required && !trophiesState.data.collectionClaimed.includes(r.id));

  if (!next) {
    window.showToast?.("No hay recompensa de colección disponible");
    return;
  }

  trophiesState.data.collectionClaimed.push(next.id);
  addCoins(state, next.coins);
  addXP(state, next.xp);
  addStat(state, "collectionRewards", 1);

  if (next.coupon) {
    const coupons = Number(localStorage.getItem("workshopCoupons") || 0) + next.coupon;
    localStorage.setItem("workshopCoupons", String(coupons));
  }

  saveData();
  updateTrophyUI(state);
  window.showToast?.("Colección: " + next.label);
}

function updateTrophyUI(state) {
  const unlockedCount = trophiesState.data.unlocked.length;
  const total = TROPHIES.length;

  setText("trophyCount", unlockedCount + "/" + total);
  setText("trophyPoints", trophiesState.data.points);

  const fill = document.getElementById("trophyFill");
  if (fill) fill.style.width = Math.round((unlockedCount / total) * 100) + "%";

  renderTrophies(state);
  updateCollectionText();
}

function renderTrophies(state) {
  const list = document.getElementById("trophiesList");
  if (!list) return;

  const stats = state.progress?.stats || {};
  list.innerHTML = "";

  TROPHIES.forEach(trophy => {
    const current = Math.min(Number(stats[trophy.stat] || 0), trophy.target);
    const unlocked = trophiesState.data.unlocked.includes(trophy.id);
    const claimed = trophiesState.data.claimed.includes(trophy.id);

    const row = document.createElement("div");
    row.className = "trophy-row " + (claimed ? "claimed" : unlocked ? "unlocked" : "");
    row.innerHTML = `
      <span class="trophy-icon">${trophy.icon}</span>
      <b>${claimed ? "✅ " : unlocked ? "🎁 " : "🔒 "}${trophy.title}</b>
      <p>${trophy.desc}</p>
      <p>${current}/${trophy.target}</p>
      <p>${trophy.points} pts · ${trophy.coins} monedas · ${trophy.xp} XP</p>
    `;
    list.appendChild(row);
  });
}

function updateCollectionText() {
  const unlockedCount = trophiesState.data.unlocked.length;
  const next = COLLECTION_REWARDS.find(r => !trophiesState.data.collectionClaimed.includes(r.id));

  const text = document.getElementById("collectionRewardText");
  const btn = document.getElementById("claimCollectionReward");

  if (!next) {
    if (text) text.textContent = "Todas las recompensas de colección cobradas.";
    if (btn) btn.disabled = true;
    return;
  }

  if (text) {
    text.textContent = `${next.label}: requiere ${next.required} trofeos. Tienes ${unlockedCount}. Recompensa: ${next.coins} monedas + ${next.xp} XP${next.coupon ? " + " + next.coupon + " bono taller" : ""}.`;
  }

  if (btn) btn.disabled = unlockedCount < next.required;
}

function updateTrophyHUD() {
  const hud = document.getElementById("hudTrophies");
  if (!hud) return;

  const pending = trophiesState.data.unlocked.filter(id => !trophiesState.data.claimed.includes(id)).length;
  hud.textContent = pending > 0 ? pending + " por cobrar" : trophiesState.data.unlocked.length + "/" + TROPHIES.length;
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && Array.isArray(data.unlocked) ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    unlocked: [],
    claimed: [],
    collectionClaimed: [],
    points: 0,
    newUnlocks: 0
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trophiesState.data));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
