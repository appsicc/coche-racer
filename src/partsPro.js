import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "partsProData";

const SLOTS = [
  { id: "motor", label: "Motor", stat: "velocidad" },
  { id: "turbo", label: "Turbo", stat: "nitro" },
  { id: "tires", label: "Neumáticos", stat: "manejo" },
  { id: "brakes", label: "Frenos", stat: "frenada" },
  { id: "chassis", label: "Chasis", stat: "resistencia" }
];

const RARITIES = {
  common: { label: "Común", bonus: 4, sell: 45 },
  rare: { label: "Rara", bonus: 8, sell: 95 },
  epic: { label: "Épica", bonus: 14, sell: 180 },
  legendary: { label: "Legendaria", bonus: 22, sell: 320 }
};

const PACKS = {
  basic: { price: 240, count: 3, epicChance: 0.04, legendaryChance: 0.0 },
  rare: { price: 520, count: 3, epicChance: 0.18, legendaryChance: 0.025 },
  epic: { price: 1050, count: 4, epicChance: 0.34, legendaryChance: 0.08 }
};

export const partsProState = {
  data: loadData()
};

export function setupPartsPro(state, showScreen) {
  state.partsPro = partsProState;

  document.getElementById("partsProBtn").onclick = () => {
    updatePartsPro(state);
    showScreen("partsProScreen");
  };

  document.getElementById("openBasicPartsPack").onclick = () => openPack(state, "basic");
  document.getElementById("openRarePartsPack").onclick = () => openPack(state, "rare");
  document.getElementById("openEpicPartsPack").onclick = () => openPack(state, "epic");
  document.getElementById("removeInstalledParts").onclick = () => removeAllInstalled(state);
  document.getElementById("sellDuplicateParts").onclick = () => sellDuplicates(state);
  document.getElementById("resetPartsPro").onclick = () => {
    if (!confirm("¿Reiniciar inventario de piezas?")) return;
    partsProState.data = createData();
    saveData();
    updatePartsPro(state);
    window.showToast?.("Piezas reiniciadas");
  };

  updatePartsPro(state);
}

export function updatePartsPro(state) {
  ensureCar(state);
  updatePartsProUI(state);
  updatePartsProHUD(state);
}

export function getPartsProBonus(state) {
  const key = getCarKey(state);
  const installed = partsProState.data.installed[key] || {};
  const bonus = { speed: 0, nitro: 0, handling: 0, brake: 0, armor: 0 };

  Object.entries(installed).forEach(([slot, partId]) => {
    const part = partsProState.data.inventory.find(p => p.id === partId);
    if (!part) return;
    const amount = RARITIES[part.rarity]?.bonus || 0;

    if (slot === "motor") bonus.speed += amount;
    if (slot === "turbo") bonus.nitro += amount;
    if (slot === "tires") bonus.handling += amount;
    if (slot === "brakes") bonus.brake += amount;
    if (slot === "chassis") bonus.armor += amount;
  });

  return bonus;
}

function openPack(state, type) {
  const pack = PACKS[type] || PACKS.basic;
  const coins = getWallet();

  if (coins < pack.price) {
    window.showToast?.("Faltan monedas: " + pack.price);
    return;
  }

  setWallet(coins - pack.price);

  const parts = [];
  for (let i = 0; i < pack.count; i++) parts.push(generatePart(pack));

  partsProState.data.inventory.unshift(...parts);
  partsProState.data.packsOpened += 1;
  addXP(state, Math.round(pack.price * 0.12));
  addStat(state, "partsPacksOpened", 1);

  saveData();
  updatePartsPro(state);
  window.showToast?.("Pack abierto: +" + parts.length + " piezas");
}

function generatePart(pack) {
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const roll = Math.random();

  let rarity = "common";
  if (roll < pack.legendaryChance) rarity = "legendary";
  else if (roll < pack.legendaryChance + pack.epicChance) rarity = "epic";
  else if (roll < 0.48) rarity = "rare";

  const rarityInfo = RARITIES[rarity];
  const serial = Math.floor(Math.random() * 9999).toString().padStart(4, "0");

  return {
    id: "part_" + Date.now() + "_" + Math.floor(Math.random() * 999999),
    slot: slot.id,
    slotLabel: slot.label,
    stat: slot.stat,
    rarity,
    name: slot.label + " " + rarityInfo.label + " #" + serial,
    bonus: rarityInfo.bonus
  };
}

function installPart(state, partId) {
  const part = partsProState.data.inventory.find(p => p.id === partId);
  if (!part) return;

  const key = getCarKey(state);
  ensureCar(state);
  partsProState.data.installed[key][part.slot] = part.id;

  saveData();
  updatePartsPro(state);
  window.showToast?.("Instalada: " + part.slotLabel);
}

function removePart(state, slot) {
  const key = getCarKey(state);
  ensureCar(state);
  delete partsProState.data.installed[key][slot];

  saveData();
  updatePartsPro(state);
  window.showToast?.("Pieza quitada");
}

function removeAllInstalled(state) {
  const key = getCarKey(state);
  partsProState.data.installed[key] = {};
  saveData();
  updatePartsPro(state);
  window.showToast?.("Piezas quitadas");
}

function sellDuplicates(state) {
  const seen = new Set();
  const keep = [];
  let earned = 0;

  partsProState.data.inventory.forEach(part => {
    const token = part.slot + "_" + part.rarity;
    const isInstalled = Object.values(partsProState.data.installed).some(carInstall => Object.values(carInstall).includes(part.id));

    if (!seen.has(token) || isInstalled) {
      seen.add(token);
      keep.push(part);
    } else {
      earned += RARITIES[part.rarity]?.sell || 40;
    }
  });

  if (!earned) {
    window.showToast?.("No hay duplicados para vender");
    return;
  }

  partsProState.data.inventory = keep;
  setWallet(getWallet() + earned);
  saveData();
  updatePartsPro(state);
  window.showToast?.("Duplicados vendidos: +" + earned);
}

function updatePartsProUI(state) {
  const car = state.manifest?.cars?.[state.selectedCarIndex] || {};
  const key = getCarKey(state);
  const installed = partsProState.data.installed[key] || {};
  const bonus = getPartsProBonus(state);

  setText("partsProCar", car.name || "Coche");
  setText("partsProMotor", partLabel(installed.motor));
  setText("partsProTurbo", partLabel(installed.turbo));
  setText("partsProTires", partLabel(installed.tires));
  setText("partsProBrakes", partLabel(installed.brakes));
  setText("partsProChassis", partLabel(installed.chassis));
  setText("partsProTotal", `Vel +${bonus.speed} · Nitro +${bonus.nitro} · Manejo +${bonus.handling} · Frenos +${bonus.brake} · Res +${bonus.armor}`);

  renderInventory(state);
}

function renderInventory(state) {
  const box = document.getElementById("partsProInventory");
  if (!box) return;

  const key = getCarKey(state);
  const installed = partsProState.data.installed[key] || {};
  const installedIds = new Set(Object.values(installed));

  if (!partsProState.data.inventory.length) {
    box.innerHTML = "<p>No tienes piezas todavía. Abre un pack para empezar.</p>";
    return;
  }

  box.innerHTML = "";
  partsProState.data.inventory.forEach(part => {
    const isInstalled = installedIds.has(part.id);
    const rarity = RARITIES[part.rarity] || RARITIES.common;

    const row = document.createElement("div");
    row.className = `parts-pro-row ${part.rarity} ${isInstalled ? "installed" : ""}`;
    row.innerHTML = `
      <b>${isInstalled ? "✅ " : ""}${escapeHTML(part.name)}</b>
      <p><span class="parts-rarity ${part.rarity}">${rarity.label}</span> · ${part.slotLabel} · ${part.stat} +${part.bonus}</p>
      <button>${isInstalled ? "QUITAR" : "INSTALAR"}</button>
    `;

    row.querySelector("button").onclick = () => {
      if (isInstalled) removePart(state, part.slot);
      else installPart(state, part.id);
    };

    box.appendChild(row);
  });
}

function updatePartsProHUD(state) {
  const hud = document.getElementById("hudPartsPro");
  if (!hud) return;

  const key = getCarKey(state);
  const installedCount = Object.keys(partsProState.data.installed[key] || {}).length;
  hud.textContent = installedCount ? installedCount + "/5" : partsProState.data.inventory.length + " inv";
}

function ensureCar(state) {
  const key = getCarKey(state);
  if (!partsProState.data.installed[key]) partsProState.data.installed[key] = {};
}

function partLabel(partId) {
  if (!partId) return "--";
  const part = partsProState.data.inventory.find(p => p.id === partId);
  if (!part) return "--";
  return part.name + " +" + part.bonus;
}

function getCarKey(state) {
  return "car_" + Number(state.selectedCarIndex || 0);
}

function getWallet() {
  return Number(localStorage.getItem("walletCoins") || 0);
}

function setWallet(value) {
  localStorage.setItem("walletCoins", String(Math.max(0, Math.round(value))));
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && Array.isArray(data.inventory) ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    inventory: [],
    installed: {},
    packsOpened: 0
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(partsProState.data));
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
