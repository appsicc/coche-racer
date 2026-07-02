import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "careerData";

const BASE_CONTRACTS = [
  {
    id: "race_win",
    title: "Piloto de circuito",
    description: "Completa una carrera en cualquier posición.",
    targetStat: "races",
    targetAmount: 1,
    reward: 220,
    rep: 35
  },
  {
    id: "urban_worker",
    title: "Especialista urbano",
    description: "Completa 2 misiones urbanas.",
    targetStat: "cityMissions",
    targetAmount: 2,
    reward: 260,
    rep: 45
  },
  {
    id: "mechanic_runner",
    title: "Mensajero del taller",
    description: "Completa 2 misiones de taller.",
    targetStat: "workshopMissions",
    targetAmount: 2,
    reward: 280,
    rep: 50
  },
  {
    id: "coin_hunter",
    title: "Cazador de monedas",
    description: "Recoge 50 monedas.",
    targetStat: "coinsCollected",
    targetAmount: 50,
    reward: 240,
    rep: 40
  },
  {
    id: "chase_rookie",
    title: "Fuga controlada",
    description: "Sobrevive a una persecución.",
    targetStat: "chases",
    targetAmount: 1,
    reward: 300,
    rep: 55
  }
];

export function setupCareer(state) {
  state.career = loadCareer();
  ensureContracts(state);
}

export function setupCareerUI(state, showScreen) {
  document.getElementById("careerBtn").onclick = () => {
    updateCareer(state);
    showScreen("careerScreen");
  };

  document.getElementById("claimCareerReward").onclick = () => claimCareerReward(state);

  document.getElementById("newCareerSeason").onclick = () => {
    if (!confirm("¿Empezar una nueva temporada? Se generarán nuevos contratos.")) return;
    state.career.season += 1;
    state.career.activeContractId = null;
    state.career.claimable = null;
    state.career.contracts = [];
    ensureContracts(state);
    saveCareer(state);
    updateCareer(state);
    window.showToast?.("Nueva temporada iniciada");
  };

  document.getElementById("resetCareer").onclick = () => {
    if (!confirm("¿Resetear todo el modo carrera?")) return;
    state.career = createCareer();
    ensureContracts(state);
    saveCareer(state);
    updateCareer(state);
    window.showToast?.("Modo carrera reseteado");
  };

  updateCareer(state);
}

export function updateCareer(state) {
  if (!state.career) return;

  const active = getActiveContract(state);
  if (active && isContractComplete(state, active)) {
    state.career.claimable = active.id;
  }

  updateCareerUI(state);
  updateCareerHUD(state);
  saveCareer(state);
}

export function notifyCareerStat(state) {
  updateCareer(state);
}

function ensureContracts(state) {
  if (state.career.contracts && state.career.contracts.length) return;

  const season = state.career.season || 1;
  state.career.contracts = BASE_CONTRACTS.map(c => ({
    ...c,
    id: c.id + "_s" + season,
    baseId: c.id,
    targetAmount: Math.ceil(c.targetAmount * (1 + (season - 1) * 0.35)),
    reward: Math.round(c.reward * (1 + (season - 1) * 0.28)),
    rep: Math.round(c.rep * (1 + (season - 1) * 0.18)),
    startValue: 0,
    done: false
  }));
}

function updateCareerUI(state) {
  const career = state.career;
  const active = getActiveContract(state);
  const progress = getSeasonProgress(career);

  setText("careerSeason", career.season);
  setText("careerRep", career.reputation);
  setText("careerContractsDone", career.contractsDone);
  setText("careerReward", active ? active.reward + " monedas + " + active.rep + " rep" : "0 monedas");

  const fill = document.getElementById("careerProgressFill");
  if (fill) fill.style.width = progress + "%";

  const activeText = document.getElementById("careerContractText");
  if (activeText) {
    activeText.textContent = active
      ? active.title + " · " + getContractProgressText(state, active)
      : "Elige un contrato disponible.";
  }

  const claim = document.getElementById("claimCareerReward");
  if (claim) claim.disabled = !career.claimable;

  const list = document.getElementById("careerContractsList");
  if (!list) return;

  list.innerHTML = "";
  career.contracts.forEach(contract => {
    const div = document.createElement("div");
    div.className = "career-contract" + (career.activeContractId === contract.id ? " active" : "");
    div.innerHTML = `
      <b>${contract.done ? "✅ " : ""}${contract.title}</b>
      <p>${contract.description}</p>
      <p>${getContractProgressText(state, contract)}</p>
      <p>${contract.reward} monedas · ${contract.rep} rep</p>
      <button ${contract.done ? "disabled" : ""}>${career.activeContractId === contract.id ? "ACTIVO" : "ACEPTAR"}</button>
    `;
    div.querySelector("button").onclick = () => acceptContract(state, contract.id);
    list.appendChild(div);
  });
}

function updateCareerHUD(state) {
  const hud = document.getElementById("hudCareer");
  if (!hud) return;

  const active = getActiveContract(state);
  if (!active) {
    hud.textContent = "Sin contrato";
    return;
  }

  hud.textContent = active.title + " · " + getContractProgressText(state, active);
}

function acceptContract(state, id) {
  const contract = state.career.contracts.find(c => c.id === id);
  if (!contract || contract.done) return;

  const statValue = getStat(state, contract.targetStat);
  contract.startValue = statValue;
  state.career.activeContractId = id;
  state.career.claimable = null;
  saveCareer(state);
  updateCareer(state);
  window.showToast?.("Contrato aceptado: " + contract.title);
}

function claimCareerReward(state) {
  const contract = state.career.contracts.find(c => c.id === state.career.claimable);
  if (!contract || !isContractComplete(state, contract)) {
    window.showToast?.("Contrato no completado");
    return;
  }

  contract.done = true;
  state.career.reputation += contract.rep;
  state.career.contractsDone += 1;
  state.career.claimable = null;
  state.career.activeContractId = null;

  addCoins(state, contract.reward);
  addXP(state, Math.round(contract.rep * 1.5));
  addStat(state, "careerContracts", 1);

  saveCareer(state);
  updateCareer(state);
  window.showToast?.("Contrato cobrado: +" + contract.reward + " monedas");
}

function getActiveContract(state) {
  return state.career.contracts.find(c => c.id === state.career.activeContractId);
}

function isContractComplete(state, contract) {
  const current = getStat(state, contract.targetStat);
  return current - contract.startValue >= contract.targetAmount;
}

function getContractProgressText(state, contract) {
  const current = Math.max(0, getStat(state, contract.targetStat) - contract.startValue);
  return Math.min(current, contract.targetAmount) + "/" + contract.targetAmount;
}

function getStat(state, stat) {
  return Number(state.progress?.stats?.[stat] || 0);
}

function getSeasonProgress(career) {
  const total = career.contracts.length || 1;
  const done = career.contracts.filter(c => c.done).length;
  return Math.round((done / total) * 100);
}

function loadCareer() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && data.contracts ? data : createCareer();
  } catch {
    return createCareer();
  }
}

function createCareer() {
  return {
    season: 1,
    reputation: 0,
    contractsDone: 0,
    activeContractId: null,
    claimable: null,
    contracts: []
  };
}

function saveCareer(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.career));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
