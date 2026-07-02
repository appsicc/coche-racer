import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "dailyEventsData";

const EVENT_POOL = [
  {
    id: "coin_day",
    title: "Cazador de monedas",
    desc: "Recoge monedas en cualquier modo.",
    stat: "coinsCollected",
    target: 35,
    reward: 180,
    xp: 90
  },
  {
    id: "urban_day",
    title: "Turno urbano",
    desc: "Completa misiones urbanas.",
    stat: "cityMissions",
    target: 2,
    reward: 220,
    xp: 110
  },
  {
    id: "workshop_day",
    title: "Mecánico de guardia",
    desc: "Completa misiones de taller.",
    stat: "workshopMissions",
    target: 2,
    reward: 240,
    xp: 120
  },
  {
    id: "race_day",
    title: "Día de circuito",
    desc: "Completa carreras.",
    stat: "races",
    target: 1,
    reward: 200,
    xp: 100
  },
  {
    id: "chase_day",
    title: "Noche de persecución",
    desc: "Sobrevive a persecuciones.",
    stat: "chases",
    target: 1,
    reward: 260,
    xp: 130
  }
];

const SPECIAL_EVENTS = [
  {
    id: "season_grinder",
    title: "Piloto constante",
    desc: "Completa 3 contratos de carrera.",
    stat: "careerContracts",
    target: 3,
    reward: 450,
    xp: 220
  },
  {
    id: "collector_big",
    title: "Caja fuerte",
    desc: "Recoge 150 monedas.",
    stat: "coinsCollected",
    target: 150,
    reward: 500,
    xp: 250
  },
  {
    id: "city_master",
    title: "Dueño de la ciudad",
    desc: "Completa 5 misiones urbanas.",
    stat: "cityMissions",
    target: 5,
    reward: 520,
    xp: 260
  }
];

export function setupDailyEvents(state) {
  state.dailyEvents = loadEvents(state);
  ensureDailyEvent(state);
}

export function setupDailyEventsUI(state, showScreen) {
  document.getElementById("eventsBtn").onclick = () => {
    updateDailyEvents(state);
    showScreen("eventsScreen");
  };

  document.getElementById("claimDailyEvent").onclick = () => claimDailyEvent(state);
  document.getElementById("claimDailyLogin").onclick = () => claimDailyLogin(state);
  document.getElementById("refreshEvents").onclick = () => {
    ensureDailyEvent(state, true);
    updateDailyEvents(state);
    window.showToast?.("Eventos actualizados");
  };

  document.getElementById("resetEvents").onclick = () => {
    if (!confirm("¿Resetear eventos diarios?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state.dailyEvents = loadEvents(state);
    ensureDailyEvent(state, true);
    updateDailyEvents(state);
    window.showToast?.("Eventos reseteados");
  };

  updateDailyEvents(state);
}

export function updateDailyEvents(state) {
  if (!state.dailyEvents) return;

  ensureDailyEvent(state);
  checkSpecialClaims(state);
  updateDailyEventsUI(state);
  updateEventHUD(state);
  saveEvents(state);
}

function ensureDailyEvent(state, force = false) {
  const today = getTodayKey();
  if (!force && state.dailyEvents.dayKey === today && state.dailyEvents.daily) return;

  const index = Math.abs(hashCode(today)) % EVENT_POOL.length;
  const template = EVENT_POOL[index];

  state.dailyEvents.dayKey = today;
  state.dailyEvents.daily = {
    ...template,
    startValue: getStat(state, template.stat),
    claimed: false
  };

  saveEvents(state);
}

function updateDailyEventsUI(state) {
  const data = state.dailyEvents;
  const daily = data.daily;
  const current = getProgress(state, daily);

  setText("dailyEventTitle", daily.title);
  setText("dailyEventDesc", daily.desc);
  setText("dailyEventProgress", current + "/" + daily.target);
  setText("dailyEventReward", daily.reward + " monedas + " + daily.xp + " XP");
  setText("dailyStreak", data.streak + " días");
  setText("streakBonus", getStreakBonus(data.streak) + " monedas");

  const fill = document.getElementById("dailyEventFill");
  if (fill) fill.style.width = Math.min(100, current / daily.target * 100) + "%";

  const claim = document.getElementById("claimDailyEvent");
  if (claim) claim.disabled = daily.claimed || current < daily.target;

  const login = document.getElementById("claimDailyLogin");
  if (login) login.disabled = data.lastLoginClaim === getTodayKey();

  renderSpecialEvents(state);
}

function renderSpecialEvents(state) {
  const list = document.getElementById("specialEventsList");
  if (!list) return;

  list.innerHTML = "";

  SPECIAL_EVENTS.forEach(event => {
    const claimed = state.dailyEvents.specialClaimed.includes(event.id);
    const current = Math.min(getStat(state, event.stat), event.target);

    const row = document.createElement("div");
    row.className = "special-event-row" + (claimed ? " done" : "");
    row.innerHTML = `
      <b>${claimed ? "✅ " : ""}${event.title}</b>
      <p>${event.desc}</p>
      <p>${current}/${event.target}</p>
      <p>${event.reward} monedas + ${event.xp} XP</p>
      <button ${claimed || current < event.target ? "disabled" : ""}>RECLAMAR</button>
    `;

    row.querySelector("button").onclick = () => claimSpecialEvent(state, event.id);
    list.appendChild(row);
  });
}

function claimDailyEvent(state) {
  const daily = state.dailyEvents.daily;
  const progress = getProgress(state, daily);

  if (daily.claimed || progress < daily.target) {
    window.showToast?.("Evento diario no completado");
    return;
  }

  daily.claimed = true;
  addCoins(state, daily.reward);
  addXP(state, daily.xp);
  addStat(state, "dailyEvents", 1);
  saveEvents(state);
  updateDailyEvents(state);
  window.showToast?.("Evento diario reclamado");
}

function claimDailyLogin(state) {
  const today = getTodayKey();
  if (state.dailyEvents.lastLoginClaim === today) {
    window.showToast?.("Bonus diario ya reclamado");
    return;
  }

  const yesterday = getOffsetDayKey(-1);
  if (state.dailyEvents.lastLoginClaim === yesterday) {
    state.dailyEvents.streak += 1;
  } else {
    state.dailyEvents.streak = 1;
  }

  state.dailyEvents.lastLoginClaim = today;
  const bonus = getStreakBonus(state.dailyEvents.streak);
  addCoins(state, bonus);
  addXP(state, Math.round(bonus / 2));
  saveEvents(state);
  updateDailyEvents(state);
  window.showToast?.("Bonus diario: +" + bonus + " monedas");
}

function claimSpecialEvent(state, id) {
  const event = SPECIAL_EVENTS.find(e => e.id === id);
  if (!event || state.dailyEvents.specialClaimed.includes(id)) return;

  if (getStat(state, event.stat) < event.target) {
    window.showToast?.("Reto no completado");
    return;
  }

  state.dailyEvents.specialClaimed.push(id);
  addCoins(state, event.reward);
  addXP(state, event.xp);
  addStat(state, "specialEvents", 1);
  saveEvents(state);
  updateDailyEvents(state);
  window.showToast?.("Reto especial reclamado");
}

function checkSpecialClaims(state) {
  if (!state.dailyEvents.specialClaimed) state.dailyEvents.specialClaimed = [];
}

function updateEventHUD(state) {
  const hud = document.getElementById("hudEvent");
  if (!hud || !state.dailyEvents?.daily) return;

  const d = state.dailyEvents.daily;
  hud.textContent = d.claimed ? "Diario completado" : d.title + " " + getProgress(state, d) + "/" + d.target;
}

function getProgress(state, event) {
  return Math.min(event.target, Math.max(0, getStat(state, event.stat) - (event.startValue || 0)));
}

function getStat(state, stat) {
  return Number(state.progress?.stats?.[stat] || 0);
}

function getStreakBonus(streak) {
  return Math.min(500, 75 + Math.max(0, streak - 1) * 25);
}

function loadEvents(state) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (data && data.specialClaimed) return data;
  } catch {}

  return {
    dayKey: "",
    daily: null,
    streak: 0,
    lastLoginClaim: "",
    specialClaimed: []
  };
}

function saveEvents(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.dailyEvents));
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getOffsetDayKey(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function hashCode(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
