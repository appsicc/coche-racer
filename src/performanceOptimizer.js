import { applyQuality, settings } from "./settings.js";

export const perfState = {
  auto: localStorage.getItem("autoPerformance") !== "off",
  performanceMode: localStorage.getItem("performanceMode") === "on",
  samples: [],
  cooldown: 0,
  lastModeChange: 0
};

export function setupPerformanceOptimizer(state) {
  applyPerformanceMode(state);

  const autoBtn = document.getElementById("autoPerformanceToggle");
  const modeBtn = document.getElementById("performanceModeToggle");

  if (autoBtn) {
    autoBtn.onclick = () => {
      perfState.auto = !perfState.auto;
      localStorage.setItem("autoPerformance", perfState.auto ? "on" : "off");
      updatePerformanceUI();
      window.showToast?.("Auto rendimiento: " + (perfState.auto ? "ON" : "OFF"));
    };
  }

  if (modeBtn) {
    modeBtn.onclick = () => {
      perfState.performanceMode = !perfState.performanceMode;
      localStorage.setItem("performanceMode", perfState.performanceMode ? "on" : "off");
      applyPerformanceMode(state);
      updatePerformanceUI();
      window.showToast?.("Modo rendimiento: " + (perfState.performanceMode ? "ON" : "OFF"));
    };
  }

  updatePerformanceUI();
}

export function updatePerformanceOptimizer(state, dt) {
  if (!dt || dt <= 0) return;

  perfState.cooldown = Math.max(0, perfState.cooldown - dt);
  const fps = Math.round(1 / dt);

  perfState.samples.push(fps);
  if (perfState.samples.length > 90) perfState.samples.shift();

  if (!perfState.auto || perfState.cooldown > 0 || perfState.samples.length < 45) {
    updatePerformanceUI();
    return;
  }

  const avg = averageFPS();

  if (avg < 26 && !perfState.performanceMode) {
    perfState.performanceMode = true;
    localStorage.setItem("performanceMode", "on");
    applyQuality(state, "low");
    applyPerformanceMode(state);
    perfState.cooldown = 8;
    window.showToast?.("FPS bajos: modo rendimiento activado");
  } else if (avg < 34 && settings.quality !== "low") {
    applyQuality(state, "low");
    perfState.cooldown = 8;
    window.showToast?.("FPS bajos: calidad baja activada");
  } else if (avg > 52 && perfState.performanceMode && perfState.samples.length >= 80) {
    // Do not automatically disable too aggressively, only if stable.
    perfState.cooldown = 8;
  }

  updatePerformanceUI();
}

export function isPerformanceMode() {
  return perfState.performanceMode;
}

export function getEffectBudget(base) {
  return perfState.performanceMode ? Math.max(8, Math.floor(base * 0.45)) : base;
}

export function getTrafficBudget(base) {
  return perfState.performanceMode ? Math.max(6, Math.floor(base * 0.55)) : base;
}

export function shouldSkipHeavyFrame() {
  if (!perfState.performanceMode) return false;
  return Math.floor(performance.now() / 100) % 2 === 0;
}

function applyPerformanceMode(state) {
  document.body.classList.toggle("performance-mode", perfState.performanceMode);

  if (state?.renderer) {
    const ratio = perfState.performanceMode ? Math.min(window.devicePixelRatio || 1, 1.0) : Math.min(window.devicePixelRatio || 1, 1.7);
    state.renderer.setPixelRatio(ratio);
  }
}

function updatePerformanceUI() {
  const autoBtn = document.getElementById("autoPerformanceToggle");
  const modeBtn = document.getElementById("performanceModeToggle");
  const status = document.getElementById("performanceStatus");

  if (autoBtn) autoBtn.textContent = "AUTO RENDIMIENTO: " + (perfState.auto ? "ON" : "OFF");
  if (modeBtn) modeBtn.textContent = "MODO RENDIMIENTO: " + (perfState.performanceMode ? "ON" : "OFF");

  if (status) {
    const avg = averageFPS();
    status.textContent = perfState.performanceMode
      ? "Rendimiento · FPS medio " + avg
      : "Equilibrado · FPS medio " + avg;
  }
}

function averageFPS() {
  if (!perfState.samples.length) return 0;
  return Math.round(perfState.samples.reduce((a, b) => a + b, 0) / perfState.samples.length);
}
