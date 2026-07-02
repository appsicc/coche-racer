import { settings } from "./settings.js";

const STATIONS = {
  electro: {
    label: "Electro Drive",
    tracks: ["Turbo Pulse", "Night Boost", "Circuit Energy"],
    bpm: 128,
    scale: [220, 277.18, 329.63, 440, 554.37]
  },
  synth: {
    label: "Synth Night",
    tracks: ["Neon Avenue", "Midnight Engine", "Chrome Skyline"],
    bpm: 96,
    scale: [196, 246.94, 293.66, 392, 493.88]
  },
  arcade: {
    label: "Arcade FM",
    tracks: ["Pixel Gear", "8 Bit Highway", "Coin Rush"],
    bpm: 142,
    scale: [261.63, 329.63, 392, 523.25, 659.25]
  },
  chill: {
    label: "Chill Road",
    tracks: ["Soft Asphalt", "Blue Horizon", "Sunset Cruise"],
    bpm: 82,
    scale: [174.61, 220, 261.63, 349.23, 440]
  }
};

export const radioState = {
  enabled: localStorage.getItem("radioEnabled") === "on",
  station: localStorage.getItem("radioStation") || "electro",
  volume: Number(localStorage.getItem("radioVolume") || 45) / 100,
  trackIndex: Number(localStorage.getItem("radioTrackIndex") || 0),
  ctx: null,
  master: null,
  timer: 0,
  step: 0
};

export function setupCarRadio(state, showScreen) {
  document.getElementById("radioBtn").onclick = () => {
    updateRadioUI();
    showScreen("radioScreen");
  };

  document.getElementById("radioToggle").onclick = () => {
    radioState.enabled = !radioState.enabled;
    localStorage.setItem("radioEnabled", radioState.enabled ? "on" : "off");
    if (radioState.enabled) unlockRadio();
    updateRadioUI();
  };

  document.getElementById("radioNext").onclick = () => nextTrack();

  const slider = document.getElementById("radioVolume");
  if (slider) {
    slider.value = Math.round(radioState.volume * 100);
    slider.oninput = () => {
      radioState.volume = Number(slider.value) / 100;
      localStorage.setItem("radioVolume", String(slider.value));
      applyRadioVolume();
      updateRadioUI();
    };
  }

  document.querySelectorAll(".stationBtn").forEach(btn => {
    btn.onclick = () => setStation(btn.dataset.station);
  });

  if (radioState.enabled) {
    window.addEventListener("pointerdown", unlockRadio, { once: true });
    window.addEventListener("keydown", unlockRadio, { once: true });
  }

  updateRadioUI();
}

export function unlockRadio() {
  if (radioState.ctx) return;

  radioState.ctx = new (window.AudioContext || window.webkitAudioContext)();
  radioState.master = radioState.ctx.createGain();
  radioState.master.connect(radioState.ctx.destination);
  applyRadioVolume();
}

export function updateCarRadio(state, dt) {
  updateRadioHUD();

  if (!radioState.enabled || !settings.sound) {
    document.body.classList.remove("radio-playing");
    return;
  }

  unlockRadio();
  document.body.classList.add("radio-playing");

  if (!radioState.ctx || !radioState.master) return;

  radioState.timer += dt;
  const station = STATIONS[radioState.station] || STATIONS.electro;
  const stepTime = 60 / station.bpm / 2;

  while (radioState.timer >= stepTime) {
    radioState.timer -= stepTime;
    playStep(station);
    radioState.step++;
  }
}

function playStep(station) {
  const ctx = radioState.ctx;
  const now = ctx.currentTime;
  const scale = station.scale;
  const index = patternIndex(radioState.step, radioState.trackIndex);
  const freq = scale[index % scale.length];

  // lead
  if (radioState.step % 2 === 0) {
    playTone(freq * (radioState.step % 8 === 0 ? 2 : 1), 0.07, 0.09, "square", 1800);
  }

  // bass
  if (radioState.step % 4 === 0) {
    playTone(scale[0] / 2, 0.12, 0.16, "sawtooth", 220);
  }

  // hat/percussion
  playNoise(0.025, radioState.step % 4 === 2 ? 0.055 : 0.025, 3500);

  // kick
  if (radioState.step % 4 === 0) {
    playKick();
  }
}

function playTone(freq, gainValue, duration, type, filterFreq) {
  const ctx = radioState.ctx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = type;
  osc.frequency.value = freq;
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;

  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(radioState.master);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(gainValue, duration, filterFreq) {
  const ctx = radioState.ctx;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = "highpass";
  filter.frequency.value = filterFreq;
  gain.gain.value = gainValue;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  src.buffer = buffer;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(radioState.master);
  src.start();
  src.stop(ctx.currentTime + duration);
}

function playKick() {
  const ctx = radioState.ctx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.11);

  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(radioState.master);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

function setStation(station) {
  if (!STATIONS[station]) station = "electro";
  radioState.station = station;
  radioState.trackIndex = 0;
  localStorage.setItem("radioStation", station);
  localStorage.setItem("radioTrackIndex", "0");
  updateRadioUI();
  window.showToast?.("Emisora: " + STATIONS[station].label);
}

function nextTrack() {
  const station = STATIONS[radioState.station] || STATIONS.electro;
  radioState.trackIndex = (radioState.trackIndex + 1) % station.tracks.length;
  localStorage.setItem("radioTrackIndex", String(radioState.trackIndex));
  updateRadioUI();
  window.showToast?.("Canción: " + station.tracks[radioState.trackIndex]);
}

function applyRadioVolume() {
  if (radioState.master && radioState.ctx) {
    radioState.master.gain.setTargetAtTime(radioState.volume * 0.23, radioState.ctx.currentTime, 0.08);
  }
}

function updateRadioUI() {
  const station = STATIONS[radioState.station] || STATIONS.electro;
  const track = station.tracks[radioState.trackIndex] || station.tracks[0];

  const toggle = document.getElementById("radioToggle");
  const stationLabel = document.getElementById("radioStationLabel");
  const trackLabel = document.getElementById("radioTrackLabel");
  const vol = document.getElementById("radioVolumeLabel");

  if (toggle) toggle.textContent = "RADIO: " + (radioState.enabled ? "ON" : "OFF");
  if (stationLabel) stationLabel.textContent = radioState.enabled ? station.label : "Radio apagada";
  if (trackLabel) trackLabel.textContent = radioState.enabled ? track : "--";
  if (vol) vol.textContent = Math.round(radioState.volume * 100) + "%";

  document.querySelectorAll(".stationBtn").forEach(btn => {
    btn.classList.toggle("active-station", btn.dataset.station === radioState.station);
  });

  document.body.classList.toggle("radio-playing", radioState.enabled);
  updateRadioHUD();
}

function updateRadioHUD() {
  const hud = document.getElementById("hudRadio");
  if (!hud) return;

  const station = STATIONS[radioState.station] || STATIONS.electro;
  hud.textContent = radioState.enabled ? station.label : "OFF";
}

function patternIndex(step, track) {
  const patterns = [
    [0, 2, 4, 2, 3, 4, 2, 1],
    [0, 1, 3, 4, 3, 1, 2, 4],
    [0, 4, 3, 2, 1, 2, 3, 4]
  ];
  return patterns[track % patterns.length][step % 8];
}
