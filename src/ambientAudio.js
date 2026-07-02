import { weatherState } from "./weather.js";
import { settings } from "./settings.js";

let ctx = null;
let master = null;
let rainNoise = null;
let rainGain = null;
let cityOsc = null;
let cityGain = null;
let thunderTimer = 0;

export const ambientState = {
  volume: Number(localStorage.getItem("ambientVolume") || 55) / 100
};

export function setupAmbientAudio(state) {
  setupAmbientUI();
  window.addEventListener("pointerdown", unlockAmbient, { once: true });
  window.addEventListener("keydown", unlockAmbient, { once: true });
}

export function unlockAmbient() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();

  master = ctx.createGain();
  master.gain.value = ambientState.volume * 0.35;
  master.connect(ctx.destination);

  createRainLayer();
  createCityLayer();
}

export function updateAmbientAudio(state, dt) {
  if (!ctx || !master) return;

  const enabled = settings.sound;
  const targetMaster = enabled ? ambientState.volume * 0.35 : 0;
  master.gain.setTargetAtTime(targetMaster, ctx.currentTime, 0.12);

  const rainTarget = weatherState.weather === "rain" ? 0.42 :
    weatherState.weather === "storm" ? 0.62 : 0.0;

  if (rainGain) {
    rainGain.gain.setTargetAtTime(rainTarget, ctx.currentTime, 0.18);
  }

  const cityTarget = state.gameMode === "free" || state.gameMode === "chase" ? 0.18 : 0.06;
  if (cityGain) {
    cityGain.gain.setTargetAtTime(cityTarget, ctx.currentTime, 0.25);
  }

  if (weatherState.weather === "storm" && enabled) {
    thunderTimer -= dt;
    if (thunderTimer <= 0) {
      thunderTimer = 4 + Math.random() * 7;
      playThunder();
    }
  } else {
    thunderTimer = Math.max(1.5, thunderTimer);
  }
}

function createRainLayer() {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.65;
  }

  rainNoise = ctx.createBufferSource();
  rainNoise.buffer = buffer;
  rainNoise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 900;

  rainGain = ctx.createGain();
  rainGain.gain.value = 0;

  rainNoise.connect(filter);
  filter.connect(rainGain);
  rainGain.connect(master);
  rainNoise.start();
}

function createCityLayer() {
  cityOsc = ctx.createOscillator();
  cityOsc.type = "sawtooth";
  cityOsc.frequency.value = 55;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 120;

  cityGain = ctx.createGain();
  cityGain.gain.value = 0.05;

  cityOsc.connect(filter);
  filter.connect(cityGain);
  cityGain.connect(master);
  cityOsc.start();
}

function playThunder() {
  if (!ctx || !master) return;

  const duration = 1.2 + Math.random() * 0.8;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const fade = 1 - i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 180 + Math.random() * 90;

  const gain = ctx.createGain();
  gain.gain.value = 0.55 + Math.random() * 0.25;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start();
  src.stop(ctx.currentTime + duration);
}

function setupAmbientUI() {
  const slider = document.getElementById("ambientVolume");
  const label = document.getElementById("ambientLabel");

  if (!slider || !label) return;

  slider.value = Math.round(ambientState.volume * 100);
  label.textContent = slider.value + "%";

  slider.oninput = () => {
    ambientState.volume = Number(slider.value) / 100;
    localStorage.setItem("ambientVolume", String(slider.value));
    label.textContent = slider.value + "%";

    if (master && ctx) {
      master.gain.setTargetAtTime(ambientState.volume * 0.35, ctx.currentTime, 0.08);
    }
  };
}
