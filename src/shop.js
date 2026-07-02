import { unlockAchievement } from "./achievements.js";

const MAX_LEVEL = 5;
const BASE_COST = 60;

export function setupShop(state) {
  state.wallet = Number(localStorage.getItem("walletCoins") || 0);
  state.upgrades = loadAllUpgrades();
}

export function getCarUpgradeKey(state) {
  const car = state.manifest.cars[state.selectedCarIndex];
  return car?.id || "default_car";
}

export function getCurrentUpgrades(state) {
  const key = getCarUpgradeKey(state);
  if (!state.upgrades[key]) {
    state.upgrades[key] = {
      speed: 0,
      acceleration: 0,
      handling: 0,
      nitro: 0,
      armor: 0
    };
  }
  return state.upgrades[key];
}

export function addCoins(state, amount) {
  state.wallet = Math.max(0, (state.wallet || 0) + Math.floor(amount));
  localStorage.setItem("walletCoins", String(state.wallet));
  updateShopUI(state);
}

export function buyUpgrade(state, type) {
  const upgrades = getCurrentUpgrades(state);
  if (!(type in upgrades)) return false;

  const level = upgrades[type];
  if (level >= MAX_LEVEL) {
    window.showToast?.("Mejora al máximo");
    return false;
  }

  const cost = getUpgradeCost(level);
  if ((state.wallet || 0) < cost) {
    window.showToast?.("No tienes monedas suficientes");
    return false;
  }

  state.wallet -= cost;
  upgrades[type]++;
  saveAllUpgrades(state.upgrades);
  localStorage.setItem("walletCoins", String(state.wallet));
  updateShopUI(state);
  unlockAchievement(state, "upgrade_master");
  window.showToast?.("Mejora comprada");
  return true;
}

export function applyUpgradeStats(state) {
  const up = getCurrentUpgrades(state);
  if (!state.carStats) return;

  state.carStats.maxSpeed += up.speed * 0.08;
  state.carStats.acceleration += up.acceleration * 0.08;
  state.carStats.handling += up.handling * 0.06;
  state.carStats.nitroBonus = up.nitro * 8;
  state.carStats.armor = up.armor * 0.08;
}

export function getDamageMultiplier(state) {
  const up = getCurrentUpgrades(state);
  return Math.max(0.55, 1 - up.armor * 0.10);
}

export function getNitroMax(state) {
  const up = getCurrentUpgrades(state);
  return 100 + up.nitro * 12;
}

export function setupShopUI(state, showScreen) {
  document.getElementById("shopBtn").onclick = () => {
    updateShopUI(state);
    showScreen("shopScreen");
  };

  document.getElementById("buySpeed").onclick = () => buyUpgrade(state, "speed");
  document.getElementById("buyAccel").onclick = () => buyUpgrade(state, "acceleration");
  document.getElementById("buyHandling").onclick = () => buyUpgrade(state, "handling");
  document.getElementById("buyNitro").onclick = () => buyUpgrade(state, "nitro");
  document.getElementById("buyArmor").onclick = () => buyUpgrade(state, "armor");

  updateShopUI(state);
}

export function updateShopUI(state) {
  const up = getCurrentUpgrades(state);
  const car = state.manifest?.cars?.[state.selectedCarIndex];

  setText("walletCoins", state.wallet || 0);
  setText("shopCarName", car?.name || "Coche");
  setText("upSpeed", up.speed);
  setText("upAccel", up.acceleration);
  setText("upHandling", up.handling);
  setText("upNitro", up.nitro);
  setText("upArmor", up.armor);

  setButton("buySpeed", up.speed);
  setButton("buyAccel", up.acceleration);
  setButton("buyHandling", up.handling);
  setButton("buyNitro", up.nitro);
  setButton("buyArmor", up.armor);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setButton(id, level) {
  const btn = document.getElementById(id);
  if (!btn) return;

  if (level >= MAX_LEVEL) {
    btn.textContent = "MAX";
    btn.disabled = true;
    return;
  }

  btn.disabled = false;
  btn.textContent = "Mejorar · " + getUpgradeCost(level) + " monedas";
}

function getUpgradeCost(level) {
  return BASE_COST + level * 55;
}

function loadAllUpgrades() {
  try {
    return JSON.parse(localStorage.getItem("carUpgrades") || "{}");
  } catch {
    return {};
  }
}

function saveAllUpgrades(upgrades) {
  localStorage.setItem("carUpgrades", JSON.stringify(upgrades));
}


export function spendCoins(state, amount) {
  amount = Math.max(0, Math.round(amount || 0));
  state.wallet = Number(localStorage.getItem("walletCoins") || state.wallet || 0);
  if (state.wallet < amount) return false;
  state.wallet -= amount;
  localStorage.setItem("walletCoins", String(state.wallet));
  const walletEl = document.getElementById("walletCoins");
  if (walletEl) walletEl.textContent = state.wallet;
  return true;
}
