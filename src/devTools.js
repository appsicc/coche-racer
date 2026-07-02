import { applyQuality, settings } from "./settings.js";

const errorLog = [];
let fpsVisible = localStorage.getItem("showFPS") === "yes";
let frameCount = 0;
let lastFPSUpdate = performance.now();
let currentFPS = 0;

export function setupDevTools(state, showScreen) {
  installErrorHooks();

  const devBtn = document.getElementById("devBtn");
  if (devBtn) {
    devBtn.onclick = () => {
      updateDevUI(state);
      showScreen("devScreen");
    };
  }

  document.getElementById("toggleFPS").onclick = () => {
    fpsVisible = !fpsVisible;
    localStorage.setItem("showFPS", fpsVisible ? "yes" : "no");
    updateFPSVisibility();
    updateDevUI(state);
  };

  document.getElementById("forceLowQuality").onclick = () => {
    applyQuality(state, "low");
    updateDevUI(state);
    window.showToast?.("Calidad baja activada");
  };

  document.getElementById("clearErrors").onclick = () => {
    errorLog.length = 0;
    updateDevUI(state);
    window.showToast?.("Errores limpiados");
  };

  document.getElementById("copyDiagnostics").onclick = async () => {
    const text = buildDiagnostics(state);
    try {
      await navigator.clipboard.writeText(text);
      window.showToast?.("Diagnóstico copiado");
    } catch {
      window.showToast?.("No se pudo copiar");
    }
  };

  updateFPSVisibility();
  updateDevUI(state);
}

export function tickDevTools(state) {
  frameCount++;
  const now = performance.now();

  if (now - lastFPSUpdate >= 500) {
    currentFPS = Math.round(frameCount * 1000 / (now - lastFPSUpdate));
    frameCount = 0;
    lastFPSUpdate = now;

    const fps = document.getElementById("fpsCounter");
    if (fps) {
      fps.textContent = "FPS: " + currentFPS;
      fps.style.color = currentFPS < 25 ? "#ff5555" : currentFPS < 45 ? "#ffd166" : "#44ff88";
    }

    const devFPS = document.getElementById("devFPS");
    if (devFPS) devFPS.textContent = currentFPS;
  }
}

export function updateDevUI(state) {
  setText("devFPS", currentFPS);
  setText("devQuality", settings.quality || "--");
  setText("devObjects", countSceneObjects(state));
  setText("devWebGL", checkWebGL() ? "OK" : "NO");
  setText("devPWA", isStandalone() ? "Instalada/standalone" : "Navegador");
  setText("devSW", "serviceWorker" in navigator ? "Compatible" : "No compatible");
  setText("devOnline", navigator.onLine ? "Online" : "Offline");

  const toggle = document.getElementById("toggleFPS");
  if (toggle) toggle.textContent = fpsVisible ? "OCULTAR FPS" : "MOSTRAR FPS";

  const errors = document.getElementById("devErrors");
  if (errors) {
    errors.textContent = errorLog.length ? errorLog.slice(-12).join("\n\n") : "Sin errores.";
  }
}

function installErrorHooks() {
  if (window.__devToolsErrorHooksInstalled) return;
  window.__devToolsErrorHooksInstalled = true;

  window.addEventListener("error", event => {
    errorLog.push(`[ERROR] ${event.message}\n${event.filename || ""}:${event.lineno || 0}:${event.colno || 0}`);
  });

  window.addEventListener("unhandledrejection", event => {
    errorLog.push(`[PROMISE] ${event.reason?.message || event.reason || "Error desconocido"}`);
  });
}

function updateFPSVisibility() {
  const fps = document.getElementById("fpsCounter");
  if (fps) fps.classList.toggle("hidden", !fpsVisible);
}

function buildDiagnostics(state) {
  return [
    "Racing Realista V16 Diagnóstico",
    "FPS: " + currentFPS,
    "Calidad: " + (settings.quality || "--"),
    "Objetos escena: " + countSceneObjects(state),
    "WebGL: " + (checkWebGL() ? "OK" : "NO"),
    "PWA: " + (isStandalone() ? "Standalone" : "Browser"),
    "ServiceWorker: " + ("serviceWorker" in navigator),
    "Online: " + navigator.onLine,
    "UserAgent: " + navigator.userAgent,
    "Errores:",
    errorLog.length ? errorLog.join("\n") : "Sin errores"
  ].join("\n");
}

function countSceneObjects(state) {
  let count = 0;
  if (state?.scene) {
    state.scene.traverse(() => count++);
  }
  return count;
}

function checkWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
