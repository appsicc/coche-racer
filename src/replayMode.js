import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const STORAGE_KEY = "replayModeData";
const MAX_SAMPLES = 360;

export const replayState = {
  data: loadData(),
  recording: true,
  samples: [],
  timer: 0,
  distance: 0,
  topSpeed: 0,
  maxDamage: 0,
  bestDrift: 0,
  lastPos: null,
  ghost: null,
  ghostIndex: 0,
  ghostTimer: 0,
  selectedSaved: 0
};

export function setupReplayMode(state, showScreen) {
  state.replayMode = replayState;

  document.getElementById("replayBtn").onclick = () => {
    updateReplayUI(state);
    showScreen("replayScreen");
  };

  document.getElementById("toggleReplayRecording").onclick = () => {
    replayState.recording = !replayState.recording;
    updateReplayUI(state);
    window.showToast?.(replayState.recording ? "Grabación activada" : "Grabación pausada");
  };

  document.getElementById("playReplayGhost").onclick = () => startGhostReplay(state);
  document.getElementById("stopReplayGhost").onclick = () => stopGhostReplay(state);
  document.getElementById("clearReplayData").onclick = () => clearReplay(state);
  document.getElementById("exportReplayJSON").onclick = () => exportReplayJSON();
  document.getElementById("saveReplayBest").onclick = () => saveReplaySnapshot(state);

  updateReplayUI(state);
}

export function updateReplayMode(state, dt) {
  if (replayState.recording && state.car) {
    replayState.timer += dt;
    if (replayState.timer >= 0.16) {
      replayState.timer = 0;
      recordSample(state);
    }
  }

  if (replayState.ghost) {
    updateGhostReplay(dt);
  }

  updateReplayHUD();
}

function recordSample(state) {
  const p = state.car.position;
  const speed = Math.round(Math.abs(state.speed || 0) * 180);
  const damage = Math.round(Number(state.damage || 0));
  const drift = Math.floor(state.driftMode?.score || 0);

  const sample = {
    t: Date.now(),
    x: Number(p.x.toFixed(2)),
    y: Number((p.y || 0).toFixed(2)),
    z: Number(p.z.toFixed(2)),
    r: Number((state.car.rotation?.y || 0).toFixed(3)),
    speed,
    damage,
    drift
  };

  if (replayState.lastPos) {
    replayState.distance += Math.hypot(sample.x - replayState.lastPos.x, sample.z - replayState.lastPos.z);
  }

  replayState.lastPos = sample;
  replayState.topSpeed = Math.max(replayState.topSpeed, speed);
  replayState.maxDamage = Math.max(replayState.maxDamage, damage);
  replayState.bestDrift = Math.max(replayState.bestDrift, drift);

  replayState.samples.push(sample);
  if (replayState.samples.length > MAX_SAMPLES) replayState.samples.shift();

  updateReplayUI(state);
}

function startGhostReplay(state) {
  const samples = getActiveSamples();
  if (!samples.length || !state.scene) {
    window.showToast?.("No hay repetición para reproducir");
    return;
  }

  stopGhostReplay(state);
  replayState.ghost = createGhostCar();
  replayState.ghostIndex = 0;
  replayState.ghostTimer = 0;
  state.scene.add(replayState.ghost);
  document.body.classList.add("replay-playing");
  window.showToast?.("Fantasma iniciado");
}

function updateGhostReplay(dt) {
  const samples = getActiveSamples();
  if (!samples.length || !replayState.ghost) return;

  replayState.ghostTimer += dt;
  const stepRate = 0.065;

  while (replayState.ghostTimer >= stepRate) {
    replayState.ghostTimer -= stepRate;
    replayState.ghostIndex += 1;
  }

  if (replayState.ghostIndex >= samples.length) {
    replayState.ghostIndex = 0;
  }

  const current = samples[replayState.ghostIndex];
  const next = samples[Math.min(samples.length - 1, replayState.ghostIndex + 1)];
  const a = replayState.ghostTimer / stepRate;

  replayState.ghost.position.set(
    lerp(current.x, next.x, a),
    0.55,
    lerp(current.z, next.z, a)
  );
  replayState.ghost.rotation.y = lerpAngle(current.r || 0, next.r || 0, a);
}

function stopGhostReplay(state) {
  if (replayState.ghost && state.scene) {
    state.scene.remove(replayState.ghost);
  }
  replayState.ghost = null;
  replayState.ghostIndex = 0;
  document.body.classList.remove("replay-playing");
}

function createGhostCar() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.55, 4.2),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.42 })
  );
  body.position.y = 0.45;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.55, 1.6),
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.28 })
  );
  cabin.position.y = 0.9;
  cabin.position.z = -0.25;
  group.add(cabin);

  const light = new THREE.PointLight(0xffd166, 1.4, 10);
  light.position.y = 1.2;
  group.add(light);

  group.name = "replay_ghost";
  return group;
}

function clearReplay(state) {
  if (!confirm("¿Borrar repetición reciente?")) return;

  replayState.samples = [];
  replayState.distance = 0;
  replayState.topSpeed = 0;
  replayState.maxDamage = 0;
  replayState.bestDrift = 0;
  replayState.lastPos = null;
  stopGhostReplay(state);
  updateReplayUI(state);
  window.showToast?.("Repetición borrada");
}

function saveReplaySnapshot(state) {
  if (replayState.samples.length < 10) {
    window.showToast?.("Necesitas más recorrido grabado");
    return;
  }

  const snapshot = {
    id: Date.now(),
    date: new Date().toISOString(),
    samples: replayState.samples.slice(-MAX_SAMPLES),
    summary: getSummary()
  };

  replayState.data.saved.unshift(snapshot);
  replayState.data.saved = replayState.data.saved.slice(0, 8);
  replayState.selectedSaved = 0;
  saveData();
  updateReplayUI(state);
  window.showToast?.("Repetición guardada");
}

function loadSavedReplay(state, index) {
  const item = replayState.data.saved[index];
  if (!item) return;

  replayState.selectedSaved = index;
  replayState.samples = item.samples.map(s => ({ ...s }));
  const summary = item.summary || {};
  replayState.topSpeed = summary.topSpeed || 0;
  replayState.distance = summary.distance || 0;
  replayState.maxDamage = summary.maxDamage || 0;
  replayState.bestDrift = summary.bestDrift || 0;
  replayState.lastPos = replayState.samples[replayState.samples.length - 1] || null;
  updateReplayUI(state);
  window.showToast?.("Repetición cargada");
}

function deleteSavedReplay(state, index) {
  if (!confirm("¿Borrar esta repetición guardada?")) return;
  replayState.data.saved.splice(index, 1);
  saveData();
  updateReplayUI(state);
}

function exportReplayJSON() {
  if (replayState.samples.length < 2) {
    window.showToast?.("No hay datos para exportar");
    return;
  }

  const payload = {
    name: "replay-" + new Date().toISOString(),
    summary: getSummary(),
    samples: replayState.samples
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "replay_coches_v56.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function updateReplayUI(state) {
  const duration = Math.round(replayState.samples.length * 0.16);
  const fill = Math.min(100, Math.round((replayState.samples.length / MAX_SAMPLES) * 100));

  setText("replaySampleCount", replayState.samples.length);
  setText("replayDuration", duration + "s");
  setText("replayStatus", replayState.ghost ? "Reproduciendo fantasma" : replayState.recording ? "Grabando" : "Pausado");
  setText("replayTopSpeed", replayState.topSpeed + " km/h");
  setText("replayDistance", Math.round(replayState.distance) + " m");
  setText("replayDamage", replayState.maxDamage + "%");
  setText("replayDrift", replayState.bestDrift);

  const btn = document.getElementById("toggleReplayRecording");
  if (btn) btn.textContent = replayState.recording ? "PAUSAR GRABACIÓN" : "ACTIVAR GRABACIÓN";

  const replayFill = document.getElementById("replayFill");
  if (replayFill) replayFill.style.width = fill + "%";

  renderSavedReplays(state);
  updateReplayHUD();
}

function renderSavedReplays(state) {
  const list = document.getElementById("savedReplaysList");
  if (!list) return;

  if (!replayState.data.saved.length) {
    list.innerHTML = "<p>No hay repeticiones guardadas todavía.</p>";
    return;
  }

  list.innerHTML = "";
  replayState.data.saved.forEach((item, index) => {
    const s = item.summary || {};
    const row = document.createElement("div");
    row.className = "replay-row " + (index === replayState.selectedSaved ? "active" : "");
    row.innerHTML = `
      <b>${formatDate(item.date)}</b>
      <p>${s.topSpeed || 0} km/h máx · ${Math.round(s.distance || 0)} m · daño ${s.maxDamage || 0}%</p>
      <button data-action="load">CARGAR</button>
      <button data-action="delete">BORRAR</button>
    `;

    row.querySelector('[data-action="load"]').onclick = () => loadSavedReplay(state, index);
    row.querySelector('[data-action="delete"]').onclick = () => deleteSavedReplay(state, index);
    list.appendChild(row);
  });
}

function updateReplayHUD() {
  const hud = document.getElementById("hudReplay");
  if (!hud) return;

  hud.textContent = replayState.ghost
    ? "Ghost " + (replayState.ghostIndex + 1) + "/" + replayState.samples.length
    : replayState.samples.length ? Math.round(replayState.samples.length * 0.16) + "s" : "--";
}

function getSummary() {
  return {
    topSpeed: replayState.topSpeed,
    distance: Math.round(replayState.distance),
    maxDamage: replayState.maxDamage,
    bestDrift: replayState.bestDrift,
    samples: replayState.samples.length
  };
}

function getActiveSamples() {
  return replayState.samples;
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && Array.isArray(data.saved) ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    saved: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(replayState.data));
}

function formatDate(date) {
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "--";
  }
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * Math.max(0, Math.min(1, t));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
