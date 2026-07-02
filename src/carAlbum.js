import { addCoins } from "./shop.js";
import { addXP, addStat, isCarUnlocked } from "./progress.js";

const STORAGE_KEY = "carAlbumData";

const RARITIES = [
  { name: "Común", points: 10, color: "#9ca3af" },
  { name: "Raro", points: 20, color: "#00d4ff" },
  { name: "Épico", points: 35, color: "#a855f7" },
  { name: "Legendario", points: 55, color: "#ffd166" }
];

export const carAlbumState = {
  data: loadData(),
  filter: "all",
  selectedIndex: 0
};

export function setupCarAlbum(state, showScreen) {
  state.carAlbum = carAlbumState;

  document.getElementById("carAlbumBtn").onclick = () => {
    refreshAlbum(state);
    showScreen("carAlbumScreen");
  };

  document.getElementById("albumFilterAll").onclick = () => {
    carAlbumState.filter = "all";
    updateAlbumUI(state);
  };

  document.getElementById("albumFilterUnlocked").onclick = () => {
    carAlbumState.filter = "unlocked";
    updateAlbumUI(state);
  };

  document.getElementById("albumFilterLocked").onclick = () => {
    carAlbumState.filter = "locked";
    updateAlbumUI(state);
  };

  document.getElementById("albumMarkViewed").onclick = () => {
    markViewed(state, carAlbumState.selectedIndex);
  };

  document.getElementById("albumSelectCar").onclick = () => {
    if (!isCarUnlocked(state, carAlbumState.selectedIndex)) {
      window.showToast?.("Coche bloqueado");
      return;
    }
    state.selectedCarIndex = carAlbumState.selectedIndex;
    localStorage.setItem("selectedCarIndex", String(carAlbumState.selectedIndex));
    markViewed(state, carAlbumState.selectedIndex, false);
    updateAlbumUI(state);
    window.showToast?.("Coche seleccionado desde álbum");
  };

  document.getElementById("albumOpenShowroom").onclick = () => {
    if (!isCarUnlocked(state, carAlbumState.selectedIndex)) {
      window.showToast?.("Coche bloqueado");
      return;
    }
    state.selectedCarIndex = carAlbumState.selectedIndex;
    localStorage.setItem("selectedCarIndex", String(carAlbumState.selectedIndex));
    document.getElementById("showroomBtn")?.click();
  };

  refreshAlbum(state);
}

export function updateCarAlbum(state) {
  autoMarkSelected(state);
  updateAlbumHUD(state);
}

function refreshAlbum(state) {
  ensureAlbumCars(state);
  autoMarkSelected(state);
  updateAlbumUI(state);
  saveData();
}

function ensureAlbumCars(state) {
  const total = state.manifest?.cars?.length || 0;
  for (let i = 0; i < total; i++) {
    const key = String(i);
    if (!carAlbumState.data.cars[key]) {
      carAlbumState.data.cars[key] = {
        seen: false,
        rewardClaimed: false
      };
    }
  }
}

function autoMarkSelected(state) {
  const selected = Number(state.selectedCarIndex || localStorage.getItem("selectedCarIndex") || 0);
  if (isCarUnlocked(state, selected)) {
    markViewed(state, selected, false);
  }
}

function markViewed(state, index, showToast = true) {
  ensureAlbumCars(state);
  const key = String(index);
  if (!carAlbumState.data.cars[key]) return;

  const already = carAlbumState.data.cars[key].seen;
  carAlbumState.data.cars[key].seen = true;

  if (!already) {
    const rarity = getRarity(index);
    carAlbumState.data.points += rarity.points;
    addStat(state, "carsViewed", 1);
    if (showToast) window.showToast?.("Álbum: +" + rarity.points + " pts");
  }

  saveData();
  updateAlbumUI(state);
}

function claimAlbumReward(state) {
  const total = state.manifest?.cars?.length || 0;
  const seen = getSeenCount();
  const unlocked = getUnlockedCount(state);

  let reward = null;
  if (seen >= total && !carAlbumState.data.rewardsClaimed.includes("seen_all")) {
    reward = { id: "seen_all", coins: 650, xp: 320, text: "Galería vista completa" };
  } else if (unlocked >= total && !carAlbumState.data.rewardsClaimed.includes("unlocked_all")) {
    reward = { id: "unlocked_all", coins: 1200, xp: 650, text: "Colección desbloqueada completa", coupon: 2 };
  } else if (seen >= Math.ceil(total / 2) && !carAlbumState.data.rewardsClaimed.includes("seen_half")) {
    reward = { id: "seen_half", coins: 300, xp: 160, text: "Media galería vista" };
  }

  if (!reward) {
    window.showToast?.("No hay recompensa de álbum disponible");
    return;
  }

  carAlbumState.data.rewardsClaimed.push(reward.id);
  addCoins(state, reward.coins);
  addXP(state, reward.xp);
  addStat(state, "albumRewards", 1);

  if (reward.coupon) {
    const coupons = Number(localStorage.getItem("workshopCoupons") || 0) + reward.coupon;
    localStorage.setItem("workshopCoupons", String(coupons));
  }

  saveData();
  updateAlbumUI(state);
  window.showToast?.(reward.text + ": +" + reward.coins + " monedas");
}

function updateAlbumUI(state) {
  ensureAlbumCars(state);

  const total = state.manifest?.cars?.length || 0;
  const seen = getSeenCount();
  const unlocked = getUnlockedCount(state);
  const percent = total ? Math.round((seen / total) * 100) : 0;

  setText("albumSeen", seen + "/" + total);
  setText("albumUnlocked", unlocked + "/" + total);
  setText("albumPoints", carAlbumState.data.points);

  const fill = document.getElementById("albumFill");
  if (fill) fill.style.width = percent + "%";

  const claim = document.getElementById("claimAlbumReward");
  if (claim) claim.onclick = () => claimAlbumReward(state);

  renderAlbumList(state);
  renderAlbumDetail(state);
  updateAlbumHUD(state);
}

function renderAlbumList(state) {
  const list = document.getElementById("albumCarsList");
  if (!list) return;

  list.innerHTML = "";
  const cars = state.manifest?.cars || [];

  cars.forEach((car, index) => {
    const unlocked = isCarUnlocked(state, index);
    const seen = !!carAlbumState.data.cars[String(index)]?.seen;

    if (carAlbumState.filter === "unlocked" && !unlocked) return;
    if (carAlbumState.filter === "locked" && unlocked) return;

    const rarity = getRarity(index);
    const selected = index === carAlbumState.selectedIndex;
    const color = getColorForIndex(index);

    const row = document.createElement("div");
    row.className = "album-car " + (selected ? "selected " : "") + (unlocked ? "" : "locked");
    row.style.setProperty("--car-color", color);
    row.innerHTML = `
      <div class="album-thumb"></div>
      <b>${unlocked ? car.name : "Coche bloqueado"}</b>
      <p>${seen ? "Visto" : "No visto"} · ${unlocked ? "Desbloqueado" : "Bloqueado"}</p>
      <span class="album-rarity" style="color:${rarity.color}">${rarity.name}</span>
    `;
    row.onclick = () => {
      carAlbumState.selectedIndex = index;
      if (unlocked) markViewed(state, index, false);
      updateAlbumUI(state);
    };
    list.appendChild(row);
  });
}

function renderAlbumDetail(state) {
  const cars = state.manifest?.cars || [];
  const car = cars[carAlbumState.selectedIndex] || {};
  const unlocked = isCarUnlocked(state, carAlbumState.selectedIndex);
  const seen = !!carAlbumState.data.cars[String(carAlbumState.selectedIndex)]?.seen;
  const rarity = getRarity(carAlbumState.selectedIndex);

  setText("albumDetailName", unlocked ? car.name || "Coche" : "Coche bloqueado");
  setText(
    "albumDetailInfo",
    `${rarity.name} · ${seen ? "visto" : "no visto"} · ${unlocked ? "desbloqueado" : "bloqueado"} · ${rarity.points} puntos al verlo.`
  );
}

function updateAlbumHUD(state) {
  const hud = document.getElementById("hudAlbum");
  if (!hud) return;
  const total = state.manifest?.cars?.length || 0;
  hud.textContent = getSeenCount() + "/" + total;
}

function getSeenCount() {
  return Object.values(carAlbumState.data.cars).filter(car => car.seen).length;
}

function getUnlockedCount(state) {
  const total = state.manifest?.cars?.length || 0;
  let count = 0;
  for (let i = 0; i < total; i++) {
    if (isCarUnlocked(state, i)) count++;
  }
  return count;
}

function getRarity(index) {
  return RARITIES[index % RARITIES.length];
}

function getColorForIndex(index) {
  return ["#ff3333", "#ff8a00", "#cdd7e6", "#2288ff", "#44ff88", "#ff33cc", "#ffd166"][index % 7];
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.cars === "object" ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    cars: {},
    points: 0,
    rewardsClaimed: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carAlbumState.data));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
