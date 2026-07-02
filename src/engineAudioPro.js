const STORAGE_KEY = "engineAudioProData";

const PRESETS = {
  street: {
    preset: "street",
    engineVolume: 65,
    turboVolume: 45,
    skidVolume: 45,
    sirenVolume: 45,
    auto: true,
    vibration: true
  },
  sport: {
    preset: "sport",
    engineVolume: 75,
    turboVolume: 60,
    skidVolume: 55,
    sirenVolume: 50,
    auto: true,
    vibration: true
  },
  supercar: {
    preset: "supercar",
    engineVolume: 85,
    turboVolume: 75,
    skidVolume: 60,
    sirenVolume: 55,
    auto: true,
    vibration: true
  },
  electric: {
    preset: "electric",
    engineVolume: 55,
    turboVolume: 35,
    skidVolume: 35,
    sirenVolume: 45,
    auto: true,
    vibration: false
  },
  off: {
    preset: "off",
    engineVolume: 0,
    turboVolume: 0,
    skidVolume: 0,
    sirenVolume: 0,
    auto: false,
    vibration: false
  }
};

export const engineAudioState = {
  data: loadData(),
  ctx: null,
  nodes: null,
  active: false,
  rpm: 0,
  turbo: 0,
  skid: 0,
  siren: 0,
  lastVibration: 0
};

export function setupEngineAudioPro(state, showScreen) {
  state.engineAudioPro = engineAudioState;

  document.getElementById("engineAudioBtn").onclick = () => {
    syncForm();
    updateEngineAudioUI(state);
    showScreen("engineAudioScreen");
  };

  document.getElementById("engineAudioStart").onclick = async () => {
    await startEngineAudio();
    updateEngineAudioUI(state);
  };

  document.getElementById("engineAudioStop").onclick = () => {
    stopEngineAudio();
    updateEngineAudioUI(state);
  };

  document.getElementById("saveEngineAudio").onclick = () => {
    readForm();
    saveData();
    applyPresetToForm();
    updateEngineAudioUI(state);
    window.showToast?.("Audio Pro guardado");
  };

  document.getElementById("engineAudioPreset").onchange = () => {
    const preset = document.getElementById("engineAudioPreset").value;
    engineAudioState.data = { ...(PRESETS[preset] || PRESETS.street) };
    syncForm();
    saveData();
    updateEngineAudioUI(state);
    window.showToast?.("Motor: " + presetLabel(preset));
  };

  [
    "engineVolume",
    "turboVolume",
    "skidVolume",
    "sirenVolume",
    "engineAudioAuto",
    "engineAudioVibration"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = () => {
        readForm();
        engineAudioState.data.preset = engineAudioState.data.preset === "off" ? "street" : engineAudioState.data.preset;
        saveData();
        updateEngineAudioUI(state);
      };
    }
  });

  syncForm();
  updateEngineAudioUI(state);
}

export function updateEngineAudioPro(state, dt) {
  const data = engineAudioState.data;

  if (data.auto && !engineAudioState.active && Math.abs(state.speed || 0) > 0.25 && data.preset !== "off") {
    startEngineAudio();
  }

  updateTelemetry(state, dt);

  if (engineAudioState.active && engineAudioState.nodes) {
    updateNodes(state);
  }

  updateEngineAudioHUD();
}

async function startEngineAudio() {
  if (engineAudioState.data.preset === "off") return;

  if (!engineAudioState.ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      window.showToast?.("Audio no compatible");
      return;
    }
    engineAudioState.ctx = new AudioContext();
  }

  if (engineAudioState.ctx.state === "suspended") {
    await engineAudioState.ctx.resume();
  }

  if (!engineAudioState.nodes) {
    engineAudioState.nodes = createAudioNodes(engineAudioState.ctx);
  }

  engineAudioState.active = true;
  document.body.classList.add("engine-audio-active");
  window.showToast?.("Audio Motor Pro activado");
}

function stopEngineAudio() {
  engineAudioState.active = false;
  document.body.classList.remove("engine-audio-active");

  if (engineAudioState.nodes) {
    setGain(engineAudioState.nodes.masterGain, 0, 0.08);
  }
}

function createAudioNodes(ctx) {
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(ctx.destination);

  const engineOsc = ctx.createOscillator();
  engineOsc.type = "sawtooth";
  const engineGain = ctx.createGain();
  engineGain.gain.value = 0;
  engineOsc.connect(engineGain).connect(masterGain);
  engineOsc.start();

  const lowOsc = ctx.createOscillator();
  lowOsc.type = "triangle";
  const lowGain = ctx.createGain();
  lowGain.gain.value = 0;
  lowOsc.connect(lowGain).connect(masterGain);
  lowOsc.start();

  const turboOsc = ctx.createOscillator();
  turboOsc.type = "sine";
  const turboGain = ctx.createGain();
  turboGain.gain.value = 0;
  turboOsc.connect(turboGain).connect(masterGain);
  turboOsc.start();

  const skidOsc = ctx.createOscillator();
  skidOsc.type = "square";
  const skidFilter = ctx.createBiquadFilter();
  skidFilter.type = "highpass";
  skidFilter.frequency.value = 900;
  const skidGain = ctx.createGain();
  skidGain.gain.value = 0;
  skidOsc.connect(skidFilter).connect(skidGain).connect(masterGain);
  skidOsc.start();

  const sirenOsc = ctx.createOscillator();
  sirenOsc.type = "sine";
  const sirenGain = ctx.createGain();
  sirenGain.gain.value = 0;
  sirenOsc.connect(sirenGain).connect(masterGain);
  sirenOsc.start();

  return {
    masterGain,
    engineOsc,
    engineGain,
    lowOsc,
    lowGain,
    turboOsc,
    turboGain,
    skidOsc,
    skidGain,
    skidFilter,
    sirenOsc,
    sirenGain
  };
}

function updateTelemetry(state, dt) {
  const speed = Math.abs(state.speed || 0);
  const controls = state.controls || {};
  const wanted = Number(state.policeAdvanced?.wanted || 0);

  const steer = Math.abs(controls.steer || 0);
  const turning = steer > 0.45 || controls.left || controls.right;
  const braking = controls.brake || controls.down;

  engineAudioState.rpm = lerp(engineAudioState.rpm, Math.min(1, speed / 2.1), dt * 3.5);
  engineAudioState.turbo = lerp(engineAudioState.turbo, controls.nitro || controls.boost || controls.space ? 1 : 0, dt * 4);
  engineAudioState.skid = lerp(engineAudioState.skid, turning && braking && speed > 0.55 ? 1 : 0, dt * 5);
  engineAudioState.siren = lerp(engineAudioState.siren, Math.min(1, wanted / 5), dt * 3);

  if (engineAudioState.turbo > 0.7 && engineAudioState.data.vibration) {
    maybeVibrate();
  }
}

function updateNodes(state) {
  const ctx = engineAudioState.ctx;
  const n = engineAudioState.nodes;
  const d = engineAudioState.data;

  const rpm = engineAudioState.rpm;
  const turbo = engineAudioState.turbo;
  const skid = engineAudioState.skid;
  const siren = engineAudioState.siren;

  const preset = d.preset || "street";
  const electric = preset === "electric";

  const baseFreq = electric ? 95 : preset === "supercar" ? 92 : preset === "sport" ? 78 : 62;
  const topFreq = electric ? 620 : preset === "supercar" ? 310 : preset === "sport" ? 245 : 205;

  setFrequency(n.engineOsc, baseFreq + rpm * topFreq + turbo * 80);
  setFrequency(n.lowOsc, 35 + rpm * 95);
  setFrequency(n.turboOsc, 420 + rpm * 420 + turbo * 540);
  setFrequency(n.skidOsc, 180 + rpm * 60);
  setFrequency(n.skidFilter, 650 + rpm * 1200);

  const sirenWave = Math.sin(performance.now() * 0.004) * 0.5 + 0.5;
  setFrequency(n.sirenOsc, 520 + sirenWave * 340);

  setGain(n.masterGain, 0.85, 0.08);
  setGain(n.engineGain, (d.engineVolume / 100) * (0.04 + rpm * 0.12), 0.04);
  setGain(n.lowGain, (d.engineVolume / 100) * (0.035 + rpm * 0.08), 0.04);
  setGain(n.turboGain, (d.turboVolume / 100) * turbo * 0.11, 0.04);
  setGain(n.skidGain, (d.skidVolume / 100) * skid * 0.055, 0.03);
  setGain(n.sirenGain, (d.sirenVolume / 100) * siren * 0.075, 0.04);
}

function updateEngineAudioUI(state) {
  const d = engineAudioState.data;

  setText("engineVolumeValue", d.engineVolume + "%");
  setText("turboVolumeValue", d.turboVolume + "%");
  setText("skidVolumeValue", d.skidVolume + "%");
  setText("sirenVolumeValue", d.sirenVolume + "%");
  setText("engineAudioStatus", engineAudioState.active ? "Activo · " + presetLabel(d.preset) : "Parado · " + presetLabel(d.preset));

  const telemetry = document.getElementById("engineAudioTelemetry");
  if (telemetry) {
    const lines = [
      ["Perfil", presetLabel(d.preset)],
      ["Motor", Math.round(engineAudioState.rpm * 100) + "%"],
      ["Turbo", Math.round(engineAudioState.turbo * 100) + "%"],
      ["Derrape", Math.round(engineAudioState.skid * 100) + "%"],
      ["Sirena", Math.round(engineAudioState.siren * 100) + "%"],
      ["Autoactivar", d.auto ? "ON" : "OFF"],
      ["Vibración", d.vibration ? "ON" : "OFF"]
    ];
    telemetry.innerHTML = lines.map(([k, v]) => `<div class="engine-audio-line"><b>${k}:</b> ${v}</div>`).join("");
  }
}

function updateEngineAudioHUD() {
  const hud = document.getElementById("hudEngineAudio");
  if (!hud) return;

  const d = engineAudioState.data;
  hud.textContent = engineAudioState.active
    ? presetLabel(d.preset) + " · " + Math.round(engineAudioState.rpm * 100) + "%"
    : d.preset === "off" ? "OFF" : "Listo";
}

function readForm() {
  engineAudioState.data = {
    preset: document.getElementById("engineAudioPreset")?.value || "street",
    engineVolume: Number(document.getElementById("engineVolume")?.value || 65),
    turboVolume: Number(document.getElementById("turboVolume")?.value || 55),
    skidVolume: Number(document.getElementById("skidVolume")?.value || 45),
    sirenVolume: Number(document.getElementById("sirenVolume")?.value || 50),
    auto: !!document.getElementById("engineAudioAuto")?.checked,
    vibration: !!document.getElementById("engineAudioVibration")?.checked
  };
}

function syncForm() {
  const d = engineAudioState.data;
  setValue("engineAudioPreset", d.preset || "street");
  setValue("engineVolume", d.engineVolume ?? 65);
  setValue("turboVolume", d.turboVolume ?? 55);
  setValue("skidVolume", d.skidVolume ?? 45);
  setValue("sirenVolume", d.sirenVolume ?? 50);
  setChecked("engineAudioAuto", d.auto);
  setChecked("engineAudioVibration", d.vibration);
  updateVolumeLabels();
}

function applyPresetToForm() {
  syncForm();
  updateVolumeLabels();
}

function updateVolumeLabels() {
  setText("engineVolumeValue", (engineAudioState.data.engineVolume ?? 65) + "%");
  setText("turboVolumeValue", (engineAudioState.data.turboVolume ?? 55) + "%");
  setText("skidVolumeValue", (engineAudioState.data.skidVolume ?? 45) + "%");
  setText("sirenVolumeValue", (engineAudioState.data.sirenVolume ?? 50) + "%");
}

function maybeVibrate() {
  const now = performance.now();
  if (now - engineAudioState.lastVibration < 700) return;
  engineAudioState.lastVibration = now;

  if (navigator.vibrate) {
    navigator.vibrate(18);
  }
}

function setFrequency(node, value) {
  if (!node || !node.frequency) return;
  node.frequency.setTargetAtTime(value, engineAudioState.ctx.currentTime, 0.035);
}

function setGain(node, value, speed = 0.05) {
  if (!node || !node.gain || !engineAudioState.ctx) return;
  node.gain.setTargetAtTime(value, engineAudioState.ctx.currentTime, speed);
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function presetLabel(name) {
  return {
    street: "Street",
    sport: "Sport",
    supercar: "Supercar",
    electric: "Eléctrico",
    off: "OFF"
  }[name] || "Street";
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.engineVolume === "number" ? data : { ...PRESETS.street };
  } catch {
    return { ...PRESETS.street };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(engineAudioState.data));
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function setChecked(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = !!value;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
