import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "sponsorsData";

const BRANDS = [
  { id: "neonfuel", name: "NeonFuel", tag: "Nitro", focus: "speed", color: "#00d4ff" },
  { id: "driftlab", name: "DriftLab", tag: "Drift", focus: "drift", color: "#ff33cc" },
  { id: "stormguard", name: "StormGuard", tag: "Resistencia", focus: "weather", color: "#ffd166" },
  { id: "urbanx", name: "UrbanX", tag: "Ciudad", focus: "missions", color: "#44ff88" },
  { id: "wantedpro", name: "WantedPro", tag: "Policía", focus: "police", color: "#ff3355" }
];

const OBJECTIVE_POOLS = {
  speed: [
    { label: "Completa 3 carreras", stat: "races", target: 3 },
    { label: "Completa 2 retos de habilidad", stat: "skillChallengesCompleted", target: 2 },
    { label: "Completa 1 ruta personalizada", stat: "customRoutesCompleted", target: 1 }
  ],
  drift: [
    { label: "Termina 2 sesiones drift", stat: "driftRuns", target: 2 },
    { label: "Consigue 8000 puntos drift", stat: "driftScore", target: 8000 },
    { label: "Completa 1 reto de habilidad", stat: "skillChallengesCompleted", target: 1 }
  ],
  weather: [
    { label: "Completa 1 clima extremo", stat: "extremeWeatherCompleted", target: 1 },
    { label: "Completa 2 rutas personalizadas", stat: "customRoutesCompleted", target: 2 },
    { label: "Usa 1 kit o mejora de taller", stat: "partsPacksOpened", target: 1 }
  ],
  missions: [
    { label: "Completa 2 misiones de ciudad", stat: "cityMissions", target: 2 },
    { label: "Completa 2 misiones de crew", stat: "crewMissions", target: 2 },
    { label: "Completa 1 capítulo de historia", stat: "storyChapters", target: 1 }
  ],
  police: [
    { label: "Escapa 1 vez de la policía", stat: "policeEscapes", target: 1 },
    { label: "Completa 1 persecución avanzada", stat: "policeEscapes", target: 1 },
    { label: "Completa 1 reto semanal", stat: "weeklyChallenges", target: 1 }
  ]
};

export const sponsorsState = {
  data: loadData()
};

export function setupSponsors(state, showScreen) {
  state.sponsors = sponsorsState;

  document.getElementById("sponsorsBtn").onclick = () => {
    updateSponsors(state);
    showScreen("sponsorsScreen");
  };

  document.getElementById("claimSponsorReward").onclick = () => claimReward(state);
  document.getElementById("rerollSponsorContract").onclick = () => rerollContract(state);
  document.getElementById("dropSponsorContract").onclick = () => {
    sponsorsState.data.active = null;
    saveData();
    updateSponsors(state);
    window.showToast?.("Contrato abandonado");
  };

  if (!sponsorsState.data.active) {
    sponsorsState.data.active = makeContract(BRANDS[0], state);
    saveData();
  }

  updateSponsors(state);
}

export function updateSponsors(state) {
  updateSponsorUI(state);
  updateSponsorHUD();
}

function makeContract(brand, state) {
  const pool = OBJECTIVE_POOLS[brand.focus] || OBJECTIVE_POOLS.speed;
  const objectives = shuffle(pool).slice(0, 2).map(obj => ({ ...obj }));
  const level = sponsorsState.data.levels[brand.id] || 1;
  const stats = state.progress?.stats || {};

  const starts = {};
  objectives.forEach(obj => {
    starts[obj.stat] = Number(stats[obj.stat] || 0);
  });

  return {
    id: "contract_" + Date.now(),
    brandId: brand.id,
    brandName: brand.name,
    tag: brand.tag,
    objectives,
    starts,
    level,
    rewardCoins: 350 + level * 120,
    rewardXP: 180 + level * 75,
    rep: 12 + level * 4
  };
}

function rerollContract(state) {
  const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
  sponsorsState.data.active = makeContract(brand, state);
  saveData();
  updateSponsors(state);
  window.showToast?.("Nuevo contrato: " + brand.name);
}

function signBrand(state, brandId) {
  const brand = BRANDS.find(b => b.id === brandId) || BRANDS[0];
  sponsorsState.data.active = makeContract(brand, state);
  saveData();
  updateSponsors(state);
  window.showToast?.("Contrato firmado: " + brand.name);
}

function getProgress(state, contract, obj) {
  const stats = state.progress?.stats || {};
  const start = contract.starts?.[obj.stat] || 0;
  return Math.max(0, Number(stats[obj.stat] || 0) - start);
}

function isComplete(state, contract) {
  if (!contract) return false;
  return contract.objectives.every(obj => getProgress(state, contract, obj) >= obj.target);
}

function claimReward(state) {
  const contract = sponsorsState.data.active;
  if (!contract) {
    window.showToast?.("No hay contrato activo");
    return;
  }

  if (!isComplete(state, contract)) {
    window.showToast?.("Contrato incompleto");
    return;
  }

  addWallet(contract.rewardCoins);
  addXP(state, contract.rewardXP);
  addStat(state, "sponsorContracts", 1);

  sponsorsState.data.reputation += contract.rep;
  sponsorsState.data.levels[contract.brandId] = (sponsorsState.data.levels[contract.brandId] || 1) + 1;
  sponsorsState.data.completed += 1;
  sponsorsState.data.history.unshift({
    id: Date.now(),
    brand: contract.brandName,
    coins: contract.rewardCoins,
    xp: contract.rewardXP,
    rep: contract.rep,
    date: new Date().toISOString()
  });
  sponsorsState.data.history = sponsorsState.data.history.slice(0, 20);

  const brand = BRANDS.find(b => b.id === contract.brandId) || BRANDS[0];
  sponsorsState.data.active = makeContract(brand, state);

  saveData();
  updateSponsors(state);
  window.showToast?.("Contrato cobrado: +" + contract.rewardCoins + " monedas");
}

function updateSponsorUI(state) {
  const contract = sponsorsState.data.active;
  const progressItems = contract ? contract.objectives.map(obj => Math.min(getProgress(state, contract, obj), obj.target)) : [];
  const targetTotal = contract ? contract.objectives.reduce((sum, obj) => sum + obj.target, 0) : 0;
  const progressTotal = progressItems.reduce((sum, val) => sum + val, 0);
  const fill = targetTotal ? Math.round((progressTotal / targetTotal) * 100) : 0;

  setText("sponsorActiveName", contract ? contract.brandName : "Ninguna");
  setText("sponsorLevel", contract ? contract.level : 0);
  setText("sponsorReputation", sponsorsState.data.reputation);
  setText("sponsorProgress", progressTotal + "/" + targetTotal);

  const bar = document.getElementById("sponsorFill");
  if (bar) bar.style.width = Math.min(100, fill) + "%";

  const claim = document.getElementById("claimSponsorReward");
  if (claim) claim.disabled = !contract || !isComplete(state, contract);

  renderBrands(state);
  renderObjectives(state);
  renderHistory();
}

function renderBrands(state) {
  const box = document.getElementById("sponsorsList");
  if (!box) return;

  box.innerHTML = "";
  BRANDS.forEach(brand => {
    const level = sponsorsState.data.levels[brand.id] || 1;
    const active = sponsorsState.data.active?.brandId === brand.id;
    const row = document.createElement("div");
    row.className = "sponsor-row " + (active ? "active" : "");
    row.innerHTML = `
      <b style="color:${brand.color}">${escapeHTML(brand.name)}</b>
      <p><span class="sponsor-tag">${escapeHTML(brand.tag)}</span> · nivel ${level}</p>
      <button>${active ? "ACTIVO" : "FIRMAR"}</button>
    `;
    row.querySelector("button").disabled = active;
    row.querySelector("button").onclick = () => signBrand(state, brand.id);
    box.appendChild(row);
  });
}

function renderObjectives(state) {
  const box = document.getElementById("sponsorObjectives");
  if (!box) return;

  const contract = sponsorsState.data.active;
  if (!contract) {
    box.innerHTML = "<p>No hay contrato activo.</p>";
    return;
  }

  box.innerHTML = contract.objectives.map(obj => {
    const progress = getProgress(state, contract, obj);
    const done = progress >= obj.target;
    return `
      <div class="sponsor-row ${done ? "done" : ""}">
        <b>${done ? "✅ " : "🎯 "}${escapeHTML(obj.label)}</b>
        <p>${Math.min(progress, obj.target)}/${obj.target}</p>
      </div>
    `;
  }).join("");
}

function renderHistory() {
  const box = document.getElementById("sponsorHistory");
  if (!box) return;

  if (!sponsorsState.data.history.length) {
    box.innerHTML = "<p>No hay contratos completados todavía.</p>";
    return;
  }

  box.innerHTML = sponsorsState.data.history.map(item => `
    <div class="sponsor-row done">
      <b>${escapeHTML(item.brand)}</b>
      <p>+${item.coins} monedas · +${item.xp} XP · +${item.rep} rep</p>
      <p>${formatDate(item.date)}</p>
    </div>
  `).join("");
}

function updateSponsorHUD() {
  const hud = document.getElementById("hudSponsors");
  if (!hud) return;
  const contract = sponsorsState.data.active;
  hud.textContent = contract ? contract.brandName + " · rep " + sponsorsState.data.reputation : "--";
}

function addWallet(amount) {
  const coins = Number(localStorage.getItem("walletCoins") || 0);
  localStorage.setItem("walletCoins", String(coins + amount));
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.reputation === "number" ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    active: null,
    reputation: 0,
    completed: 0,
    levels: {},
    history: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sponsorsState.data));
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
