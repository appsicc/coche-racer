import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "crewData";

const MEMBERS = [
  { id: "mechanic", name: "Mecánica", desc: "Reduce costes de taller.", level: 1 },
  { id: "navigator", name: "Copiloto", desc: "Mejora bonus de GPS y misiones.", level: 2 },
  { id: "tuner", name: "Tuner", desc: "Aumenta recompensas de drift.", level: 3 },
  { id: "scout", name: "Ojeador", desc: "Mejora eventos y destacados.", level: 4 },
  { id: "strategist", name: "Estratega", desc: "Más premio en campeonatos.", level: 5 }
];

const PERKS = [
  { id: "repair_discount", name: "Descuento taller", desc: "-10% simbólico en reparaciones", level: 2 },
  { id: "drift_bonus", name: "Drift boost", desc: "+ bonus de crew por drift", level: 3 },
  { id: "police_escape", name: "Escape experto", desc: "+ recompensa al escapar", level: 4 },
  { id: "champ_bonus", name: "Premio de copa", desc: "+ bonus por campeonato", level: 5 },
  { id: "daily_bonus", name: "Bonus diario crew", desc: "Mejor bonus pasivo", level: 6 }
];

const MISSIONS = [
  { id: "race", title: "Correr por la crew", stat: "races", target: 2, rep: 80, coins: 120 },
  { id: "drift", title: "Derrapes para fans", stat: "driftRuns", target: 1, rep: 70, coins: 100 },
  { id: "escape", title: "Escapar y ganar respeto", stat: "policeEscapes", target: 1, rep: 100, coins: 160 },
  { id: "events", title: "Eventos de equipo", stat: "dailyEvents", target: 1, rep: 60, coins: 90 }
];

export const crewState = {
  data: loadData()
};

export function setupCrewSystem(state, showScreen) {
  state.crewSystem = crewState;

  document.getElementById("crewBtn").onclick = () => {
    updateCrewSystem(state);
    showScreen("crewScreen");
  };

  document.getElementById("saveCrewName").onclick = () => {
    const input = document.getElementById("crewNameInput");
    crewState.data.name = (input?.value || "Crew Neon").trim().slice(0, 20) || "Crew Neon";
    saveData();
    updateCrewUI(state);
    window.showToast?.("Nombre de crew guardado");
  };

  document.getElementById("claimCrewBonus").onclick = () => {
    claimPassiveBonus(state);
  };

  updateCrewUI(state);
}

export function updateCrewSystem(state) {
  checkCrewMissions(state);
  updateCrewUI(state);
  updateCrewHUD();
}

export function addCrewRep(state, amount, reason = "Crew") {
  crewState.data.rep += Math.max(0, Math.floor(amount));
  const oldLevel = crewState.data.level;
  crewState.data.level = calculateLevel(crewState.data.rep);

  if (crewState.data.level > oldLevel) {
    window.showToast?.("Crew nivel " + crewState.data.level);
  }

  crewState.data.log.unshift({
    reason,
    amount,
    time: new Date().toISOString()
  });
  crewState.data.log = crewState.data.log.slice(0, 12);
  saveData();
}

function checkCrewMissions(state) {
  const stats = state.progress?.stats || {};

  MISSIONS.forEach(mission => {
    const current = Number(stats[mission.stat] || 0);
    const progress = crewState.data.missions[mission.id] || { start: current, claimed: false };

    if (progress.start === undefined) progress.start = current;
    crewState.data.missions[mission.id] = progress;
  });

  saveData();
}

function claimMission(state, missionId) {
  const mission = MISSIONS.find(m => m.id === missionId);
  if (!mission) return;

  const stats = state.progress?.stats || {};
  const progress = crewState.data.missions[mission.id] || { start: Number(stats[mission.stat] || 0), claimed: false };
  const done = Number(stats[mission.stat] || 0) - progress.start >= mission.target;

  if (!done || progress.claimed) {
    window.showToast?.("Misión de crew no completada");
    return;
  }

  progress.claimed = true;
  crewState.data.missions[mission.id] = progress;

  addCrewRep(state, mission.rep, mission.title);
  addCoins(state, mission.coins);
  addXP(state, Math.round(mission.rep * 0.7));
  addStat(state, "crewMissions", 1);

  saveData();
  updateCrewUI(state);
  window.showToast?.("Crew +" + mission.rep + " rep");
}

function claimPassiveBonus(state) {
  const now = Date.now();
  const last = Number(crewState.data.lastBonus || 0);
  const hours = (now - last) / 1000 / 60 / 60;

  if (last && hours < 6) {
    const left = Math.ceil(6 - hours);
    window.showToast?.("Bonus disponible en " + left + "h");
    return;
  }

  const coins = 75 + crewState.data.level * 35;
  const xp = 40 + crewState.data.level * 18;

  addCoins(state, coins);
  addXP(state, xp);
  addCrewRep(state, 20 + crewState.data.level * 4, "Bonus pasivo");

  crewState.data.lastBonus = now;
  saveData();
  updateCrewUI(state);
  window.showToast?.("Bonus crew: +" + coins + " monedas");
}

function updateCrewUI(state) {
  const data = crewState.data;
  const nextNeed = repForLevel(data.level + 1);
  const currentNeed = repForLevel(data.level);
  const fill = Math.min(100, ((data.rep - currentNeed) / Math.max(1, nextNeed - currentNeed)) * 100);

  setText("crewNameTitle", data.name);
  setText("crewLevel", data.level);
  setText("crewRep", data.rep + " / " + nextNeed);

  const input = document.getElementById("crewNameInput");
  if (input) input.value = data.name;

  const fillEl = document.getElementById("crewRepFill");
  if (fillEl) fillEl.style.width = fill + "%";

  renderMembers();
  renderPerks();
  renderMissions(state);
}

function renderMembers() {
  const list = document.getElementById("crewMembersList");
  if (!list) return;

  list.innerHTML = "";
  MEMBERS.forEach(member => {
    const unlocked = crewState.data.level >= member.level;
    const row = document.createElement("div");
    row.className = "crew-row " + (unlocked ? "unlocked" : "locked");
    row.innerHTML = `
      <b>${unlocked ? "✅ " : "🔒 "}${member.name}</b>
      <p>${member.desc}</p>
      <p>Nivel necesario: ${member.level}</p>
    `;
    list.appendChild(row);
  });
}

function renderPerks() {
  const list = document.getElementById("crewPerksList");
  if (!list) return;

  list.innerHTML = "";
  PERKS.forEach(perk => {
    const unlocked = crewState.data.level >= perk.level;
    const row = document.createElement("div");
    row.className = "crew-row " + (unlocked ? "unlocked" : "locked");
    row.innerHTML = `
      <b>${unlocked ? "⭐ " : "🔒 "}${perk.name}</b>
      <p>${perk.desc}</p>
      <p>Se desbloquea en nivel ${perk.level}</p>
    `;
    list.appendChild(row);
  });
}

function renderMissions(state) {
  const list = document.getElementById("crewMissionsList");
  if (!list) return;

  const stats = state.progress?.stats || {};
  list.innerHTML = "";

  MISSIONS.forEach(mission => {
    const progress = crewState.data.missions[mission.id] || { start: Number(stats[mission.stat] || 0), claimed: false };
    const current = Math.max(0, Number(stats[mission.stat] || 0) - progress.start);
    const done = current >= mission.target;

    const row = document.createElement("div");
    row.className = "crew-row " + (progress.claimed ? "unlocked" : "");
    row.innerHTML = `
      <b>${progress.claimed ? "✅ " : ""}${mission.title}</b>
      <p>${Math.min(current, mission.target)}/${mission.target}</p>
      <p>Recompensa: ${mission.rep} rep + ${mission.coins} monedas</p>
      <button ${!done || progress.claimed ? "disabled" : ""}>COBRAR</button>
    `;
    row.querySelector("button").onclick = () => claimMission(state, mission.id);
    list.appendChild(row);
  });
}

function updateCrewHUD() {
  const hud = document.getElementById("hudCrew");
  if (!hud) return;
  hud.textContent = crewState.data.name + " Nv." + crewState.data.level;
}

function calculateLevel(rep) {
  let level = 1;
  while (rep >= repForLevel(level + 1)) level++;
  return Math.min(20, level);
}

function repForLevel(level) {
  return Math.floor((level - 1) * (level - 1) * 140);
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.rep === "number" ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    name: "Crew Neon",
    level: 1,
    rep: 0,
    missions: {},
    lastBonus: 0,
    log: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(crewState.data));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
