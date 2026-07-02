import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "extremeWeatherData";

const EVENTS = {
  storm: {
    label: "Tormenta",
    duration: 95,
    rewardRate: 4.8,
    xpRate: 2.1,
    advice: "Reduce velocidad en curvas y evita impactos: la tormenta aumenta el riesgo."
  },
  fog: {
    label: "Niebla densa",
    duration: 80,
    rewardRate: 4.2,
    xpRate: 1.8,
    advice: "Conduce suave y atento al GPS: la visibilidad está reducida."
  },
  wind: {
    label: "Viento fuerte",
    duration: 75,
    rewardRate: 3.9,
    xpRate: 1.6,
    advice: "Corrige la dirección poco a poco: el viento empuja el coche."
  }
};

export const extremeWeatherState = {
  data: loadData(),
  active: false,
  type: null,
  timer: 0,
  survived: 0,
  intensity: 0,
  effectTick: 0,
  logTimer: 0
};

export function setupExtremeWeather(state, showScreen) {
  state.extremeWeather = extremeWeatherState;

  document.getElementById("extremeWeatherBtn").onclick = () => {
    updateExtremeWeatherUI(state);
    showScreen("extremeWeatherScreen");
  };

  document.getElementById("startStormEvent").onclick = () => startEvent(state, "storm");
  document.getElementById("startFogEvent").onclick = () => startEvent(state, "fog");
  document.getElementById("startWindEvent").onclick = () => startEvent(state, "wind");
  document.getElementById("stopExtremeWeather").onclick = () => finishEvent(state, false);

  updateExtremeWeatherUI(state);
}

export function updateExtremeWeather(state, dt) {
  if (!extremeWeatherState.active) {
    updateExtremeWeatherHUD();
    return;
  }

  const ev = EVENTS[extremeWeatherState.type];
  extremeWeatherState.timer -= dt;
  extremeWeatherState.survived += dt;
  extremeWeatherState.effectTick += dt;
  extremeWeatherState.logTimer += dt;

  const progress = 1 - Math.max(0, extremeWeatherState.timer) / ev.duration;
  extremeWeatherState.intensity = Math.min(1, 0.35 + progress * 0.65);

  applyDrivingEffect(state, dt);

  if (extremeWeatherState.logTimer > 18) {
    extremeWeatherState.logTimer = 0;
    addLog(ev.label, "Sobreviviendo " + Math.round(extremeWeatherState.survived) + "s");
  }

  if (extremeWeatherState.timer <= 0) {
    finishEvent(state, true);
  }

  updateExtremeWeatherUI(state);
  updateExtremeWeatherHUD();
}

function startEvent(state, type) {
  const ev = EVENTS[type];
  if (!ev) return;

  extremeWeatherState.active = true;
  extremeWeatherState.type = type;
  extremeWeatherState.timer = ev.duration;
  extremeWeatherState.survived = 0;
  extremeWeatherState.intensity = 0.35;
  extremeWeatherState.effectTick = 0;

  document.body.classList.remove("extreme-storm", "extreme-fog", "extreme-wind");
  document.body.classList.add("extreme-" + type);

  addLog(ev.label, "Evento iniciado");
  updateExtremeWeatherUI(state);
  window.showToast?.("Clima extremo: " + ev.label);
}

function finishEvent(state, completed) {
  if (!extremeWeatherState.active) return;

  const ev = EVENTS[extremeWeatherState.type];
  const seconds = Math.round(extremeWeatherState.survived);
  const coins = completed ? Math.round(seconds * ev.rewardRate) : Math.round(seconds * ev.rewardRate * 0.35);
  const xp = completed ? Math.round(seconds * ev.xpRate) : Math.round(seconds * ev.xpRate * 0.35);

  if (seconds > 5) {
    addCoins(state, coins);
    addXP(state, xp);
    addStat(state, "extremeWeatherRuns", 1);
    if (completed) addStat(state, "extremeWeatherCompleted", 1);

    extremeWeatherState.data.bestSurvival = Math.max(extremeWeatherState.data.bestSurvival, seconds);
    extremeWeatherState.data.totalSurvival += seconds;
    extremeWeatherState.data.completed += completed ? 1 : 0;
    addLog(ev.label, (completed ? "Completado" : "Interrumpido") + " · +" + coins + " monedas");
  }

  extremeWeatherState.active = false;
  extremeWeatherState.type = null;
  extremeWeatherState.timer = 0;
  extremeWeatherState.intensity = 0;
  document.body.classList.remove("extreme-storm", "extreme-fog", "extreme-wind");

  saveData();
  updateExtremeWeatherUI(state);
  window.showToast?.("Clima extremo terminado: +" + coins + " monedas");
}

function applyDrivingEffect(state, dt) {
  const type = extremeWeatherState.type;
  const intensity = extremeWeatherState.intensity;
  const speed = Math.abs(state.speed || 0);

  if (type === "storm") {
    if (speed > 1.25 && Math.random() < dt * 0.22 * intensity) {
      state.damage = Math.min(100, (state.damage || 0) + 0.35 * intensity);
    }
  }

  if (type === "fog") {
    state.visibilityModifier = Math.max(0.35, 1 - intensity * 0.55);
  } else {
    state.visibilityModifier = 1;
  }

  if (type === "wind" && state.car && speed > 0.45) {
    const push = Math.sin(performance.now() * 0.0014) * intensity * dt * 0.42;
    state.car.position.x += push;
  }

  if (type === "storm" && Math.random() < dt * 0.8) {
    document.body.classList.toggle("storm-flash", Math.random() > 0.7);
  } else {
    document.body.classList.remove("storm-flash");
  }
}

function updateExtremeWeatherUI(state) {
  const type = extremeWeatherState.type;
  const ev = type ? EVENTS[type] : null;
  const intensity = Math.round(extremeWeatherState.intensity * 100);
  const timer = Math.max(0, Math.ceil(extremeWeatherState.timer));
  const reward = ev ? Math.round(extremeWeatherState.survived * ev.rewardRate) : 0;

  setText("extremeWeatherType", ev ? ev.label : "Ninguno");
  setText("extremeWeatherIntensity", intensity + "%");
  setText("extremeWeatherTimer", extremeWeatherState.active ? timer + "s" : "--");
  setText("extremeWeatherSurvived", Math.round(extremeWeatherState.survived) + "s");
  setText("extremeWeatherBest", extremeWeatherState.data.bestSurvival + "s");
  setText("extremeWeatherReward", reward + " monedas");
  setText("extremeWeatherAdvice", ev ? ev.advice : "El clima está normal.");

  const fill = document.getElementById("extremeWeatherFill");
  if (fill) fill.style.width = intensity + "%";

  const log = document.getElementById("extremeWeatherLog");
  if (log) {
    if (!extremeWeatherState.data.log.length) {
      log.innerHTML = "<p>No hay eventos registrados todavía.</p>";
    } else {
      log.innerHTML = extremeWeatherState.data.log.map(item => `
        <div class="extreme-weather-row">
          <b>${escapeHTML(item.title)}</b>
          <p>${escapeHTML(item.text)} · ${formatTime(item.time)}</p>
        </div>
      `).join("");
    }
  }
}

function updateExtremeWeatherHUD() {
  const hud = document.getElementById("hudExtremeWeather");
  if (!hud) return;

  if (!extremeWeatherState.active) {
    hud.textContent = extremeWeatherState.data.bestSurvival ? "Récord " + extremeWeatherState.data.bestSurvival + "s" : "--";
    return;
  }

  const ev = EVENTS[extremeWeatherState.type];
  hud.textContent = ev.label + " · " + Math.ceil(extremeWeatherState.timer) + "s";
}

function addLog(title, text) {
  extremeWeatherState.data.log.unshift({
    title,
    text,
    time: new Date().toISOString()
  });
  extremeWeatherState.data.log = extremeWeatherState.data.log.slice(0, 18);
  saveData();
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.bestSurvival === "number" ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    bestSurvival: 0,
    totalSurvival: 0,
    completed: 0,
    log: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(extremeWeatherState.data));
}

function formatTime(date) {
  try {
    return new Date(date).toLocaleTimeString();
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
