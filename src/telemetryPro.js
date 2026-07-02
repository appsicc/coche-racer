const STORAGE_KEY = "telemetryProData";

export const telemetryState = {
  data: loadData(),
  samples: [],
  timer: 0,
  driveTime: 0,
  topSpeed: 0,
  speedSum: 0,
  speedSamples: 0,
  maxDamage: 0,
  maxWanted: 0,
  bestDrift: 0,
  nitroUse: 0,
  lastSavedAt: 0
};

export function setupTelemetryPro(state, showScreen) {
  state.telemetryPro = telemetryState;

  document.getElementById("telemetryBtn").onclick = () => {
    updateTelemetryUI(state);
    showScreen("telemetryScreen");
  };

  document.getElementById("saveTelemetryRun").onclick = () => {
    saveTelemetryRun(state, true);
  };

  document.getElementById("clearTelemetryHistory").onclick = () => {
    if (!confirm("¿Borrar historial de telemetría?")) return;
    telemetryState.data.runs = [];
    saveData();
    updateTelemetryUI(state);
    window.showToast?.("Historial de telemetría borrado");
  };

  updateTelemetryUI(state);
}

export function updateTelemetryPro(state, dt) {
  const speed = Math.round(Math.abs(state.speed || 0) * 180);
  const damage = Math.round(Number(state.damage || 0));
  const wanted = Number(state.policeAdvanced?.wanted || 0);
  const drift = Math.floor(state.driftMode?.score || 0);
  const controls = state.controls || {};
  const nitro = controls.nitro || controls.boost || controls.space ? 1 : 0;

  telemetryState.timer += dt;
  if (speed > 3) telemetryState.driveTime += dt;

  telemetryState.topSpeed = Math.max(telemetryState.topSpeed, speed);
  telemetryState.maxDamage = Math.max(telemetryState.maxDamage, damage);
  telemetryState.maxWanted = Math.max(telemetryState.maxWanted, wanted);
  telemetryState.bestDrift = Math.max(telemetryState.bestDrift, drift);
  telemetryState.nitroUse += nitro ? dt : 0;

  telemetryState.speedSum += speed;
  telemetryState.speedSamples += 1;

  if (telemetryState.timer >= 0.22) {
    telemetryState.timer = 0;
    telemetryState.samples.push({
      t: performance.now(),
      speed,
      damage,
      wanted,
      drift,
      nitro
    });

    if (telemetryState.samples.length > 90) {
      telemetryState.samples.shift();
    }
  }

  if (telemetryState.driveTime > 45 && performance.now() - telemetryState.lastSavedAt > 120000) {
    saveTelemetryRun(state, false);
  }

  updateTelemetryHUD();
  drawTelemetryChart();
}

function saveTelemetryRun(state, manual) {
  if (telemetryState.driveTime < 3 && manual) {
    window.showToast?.("Conduce un poco antes de guardar");
    return;
  }

  const run = {
    id: Date.now(),
    date: new Date().toISOString(),
    topSpeed: telemetryState.topSpeed,
    avgSpeed: getAvgSpeed(),
    maxDamage: telemetryState.maxDamage,
    maxWanted: telemetryState.maxWanted,
    bestDrift: telemetryState.bestDrift,
    nitroUse: Math.round(telemetryState.nitroUse),
    driveTime: Math.round(telemetryState.driveTime),
    car: getCarName(state),
    map: getMapName(state)
  };

  telemetryState.data.runs.unshift(run);
  telemetryState.data.runs = telemetryState.data.runs.slice(0, 20);
  telemetryState.lastSavedAt = performance.now();
  saveData();
  updateTelemetryUI(state);

  if (manual) {
    window.showToast?.("Sesión de telemetría guardada");
  }
}

function updateTelemetryUI(state) {
  setText("telemetryTopSpeed", telemetryState.topSpeed + " km/h");
  setText("telemetryAvgSpeed", getAvgSpeed() + " km/h");
  setText("telemetryMaxDamage", telemetryState.maxDamage + "%");
  setText("telemetryDriveTime", Math.round(telemetryState.driveTime) + "s");

  const live = document.getElementById("telemetryLiveStats");
  if (live) {
    const last = telemetryState.samples[telemetryState.samples.length - 1] || {};
    const lines = [
      ["Velocidad", (last.speed || 0) + " km/h"],
      ["Daño", (last.damage || 0) + "%"],
      ["Nivel búsqueda", (last.wanted || 0) + "★"],
      ["Drift actual", (last.drift || 0) + " pts"],
      ["Nitro", last.nitro ? "ON" : "OFF"],
      ["Coche", getCarName(state)],
      ["Mapa", getMapName(state)]
    ];

    live.innerHTML = lines.map(([k, v]) => `<div class="telemetry-line"><b>${k}:</b> ${v}</div>`).join("");
  }

  const history = document.getElementById("telemetryHistory");
  if (history) {
    if (!telemetryState.data.runs.length) {
      history.innerHTML = "<p>No hay sesiones guardadas todavía.</p>";
    } else {
      history.innerHTML = telemetryState.data.runs.map(run => `
        <div class="telemetry-run">
          <b>${formatDate(run.date)}</b>
          <p>${escapeHTML(run.car)} · ${escapeHTML(run.map)}</p>
          <p>${run.topSpeed} km/h máx · ${run.avgSpeed} km/h media · daño ${run.maxDamage}%</p>
          <p>Drift ${run.bestDrift} · búsqueda ${run.maxWanted}★ · nitro ${run.nitroUse}s</p>
        </div>
      `).join("");
    }
  }

  drawTelemetryChart();
}

function drawTelemetryChart() {
  const canvas = document.getElementById("telemetryCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const pad = 24;
  const samples = telemetryState.samples;

  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "rgba(0,212,255,.13)");
  bg.addColorStop(1, "rgba(0,0,0,.22)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad + ((h - pad * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }

  drawLine(ctx, samples.map(s => s.speed), 260, "#00d4ff", w, h, pad);
  drawLine(ctx, samples.map(s => s.damage), 100, "#ff3355", w, h, pad);
  drawLine(ctx, samples.map(s => s.wanted * 20), 100, "#ffd166", w, h, pad);

  ctx.fillStyle = "rgba(255,255,255,.86)";
  ctx.font = "12px Arial";
  ctx.fillText("Velocidad", pad, 16);
  ctx.fillText("Daño", pad + 90, 16);
  ctx.fillText("Búsqueda", pad + 150, 16);
}

function drawLine(ctx, values, max, color, w, h, pad) {
  if (!values.length) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  values.forEach((value, i) => {
    const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
    const y = h - pad - Math.min(1, value / max) * (h - pad * 2);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function updateTelemetryHUD() {
  const hud = document.getElementById("hudTelemetry");
  if (!hud) return;

  hud.textContent = telemetryState.topSpeed
    ? telemetryState.topSpeed + " máx · " + getAvgSpeed() + " med"
    : "--";

  document.body.classList.toggle("telemetry-hot", telemetryState.maxDamage > 70);
}

function getAvgSpeed() {
  if (!telemetryState.speedSamples) return 0;
  return Math.round(telemetryState.speedSum / telemetryState.speedSamples);
}

function getCarName(state) {
  return state.manifest?.cars?.[state.selectedCarIndex]?.name || "Coche";
}

function getMapName(state) {
  return state.manifest?.maps?.[state.selectedMapIndex]?.name || "Mapa";
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && Array.isArray(data.runs) ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    runs: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(telemetryState.data));
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
