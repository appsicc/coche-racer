const STORAGE_KEY = "trailerModeData";

const SCENES = [
  { id: "intro", name: "Intro ciudad", duration: 7, tip: "Plano abierto con presentación del coche." },
  { id: "speed", name: "Aceleración", duration: 9, tip: "Muestra velocidad, nitro y sensación de potencia." },
  { id: "drift", name: "Derrape", duration: 8, tip: "Curva agresiva, humo y estilo." },
  { id: "garage", name: "Garaje", duration: 8, tip: "Enfoca personalización, vinilos y coche elegido." },
  { id: "police", name: "Persecución", duration: 9, tip: "Luces, tensión y escape." },
  { id: "final", name: "Plano final", duration: 7, tip: "Cierre épico con título del juego." }
];

const STYLE_LINES = {
  cinematic: ["Un juego de coches realista creado en web.", "Explora, compite, mejora y domina la ciudad.", "Tu coche. Tu estilo. Tu carrera."],
  action: ["Velocidad, drift, persecuciones y retos.", "Cada curva cuenta. Cada segundo importa.", "Acelera y demuestra quién manda."],
  garage: ["Personaliza tu coche, guarda tu estilo y compártelo.", "Vinilos, HUD, audio, gráficos y configuración.", "Tu garaje, tus reglas."],
  police: ["La ciudad te busca. La policía no perdona.", "Escapa, gana reputación y sobrevive al caos.", "El asfalto decide quién es leyenda."],
  storm: ["Corre bajo tormenta, niebla y viento extremo.", "Sobrevive al clima y gana recompensas.", "Cuando el mundo se pone difícil, acelera."]
};

export const trailerModeState = {
  data: loadData(),
  active: false,
  sceneIndex: 0,
  sceneTimer: 0,
  totalTimer: 0,
  lastCameraMode: null
};

export function setupTrailerMode(state, showScreen) {
  state.trailerMode = trailerModeState;

  document.getElementById("trailerBtn").onclick = () => {
    syncTrailerForm();
    updateTrailerUI(state);
    showScreen("trailerScreen");
  };

  document.getElementById("startTrailerMode").onclick = () => startTrailer(state);
  document.getElementById("stopTrailerMode").onclick = () => stopTrailer(state, false);
  document.getElementById("saveTrailerSettings").onclick = () => {
    readTrailerForm();
    saveData();
    applyTrailerClasses();
    updateTrailerUI(state);
    window.showToast?.("Opciones de tráiler guardadas");
  };

  document.getElementById("copyTrailerScript").onclick = async () => {
    const text = document.getElementById("trailerScript")?.value || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      window.showToast?.("Guion copiado");
    } catch {
      const area = document.getElementById("trailerScript");
      area?.focus();
      area?.select();
      window.showToast?.("Selecciona y copia el guion");
    }
  };

  document.getElementById("clearTrailerHistory").onclick = () => {
    trailerModeState.data.history = [];
    saveData();
    updateTrailerUI(state);
    window.showToast?.("Historial borrado");
  };

  ["trailerStyle","trailerAutoCamera","trailerHideHUD","trailerSlowMotion","trailerUseWeather"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = () => {
        readTrailerForm();
        saveData();
        applyTrailerClasses();
        updateTrailerUI(state);
      };
    }
  });

  syncTrailerForm();
  updateTrailerUI(state);
}

export function updateTrailerMode(state, dt) {
  if (!trailerModeState.active) {
    updateTrailerHUD();
    return;
  }

  trailerModeState.sceneTimer += dt;
  trailerModeState.totalTimer += dt;

  const scene = SCENES[trailerModeState.sceneIndex];
  if (scene && trailerModeState.sceneTimer >= scene.duration) {
    trailerModeState.sceneIndex += 1;
    trailerModeState.sceneTimer = 0;

    if (trailerModeState.sceneIndex >= SCENES.length) {
      stopTrailer(state, true);
      return;
    }

    window.showToast?.("Escena: " + SCENES[trailerModeState.sceneIndex].name);
  }

  applySceneEffects(state, dt);
  updateTrailerUI(state);
  updateTrailerHUD();
}

function startTrailer(state) {
  readTrailerForm();

  trailerModeState.active = true;
  trailerModeState.sceneIndex = 0;
  trailerModeState.sceneTimer = 0;
  trailerModeState.totalTimer = 0;
  trailerModeState.lastCameraMode = state.cameraMode || localStorage.getItem("cameraMode") || "normal";

  document.body.classList.add("trailer-mode");
  applyTrailerClasses();

  if (trailerModeState.data.autoCamera) {
    state.cameraMode = "cinematic";
    localStorage.setItem("cameraMode", "cinematic");
  }

  updateTrailerUI(state);
  window.showToast?.("Modo tráiler iniciado");
}

function stopTrailer(state, completed) {
  if (!trailerModeState.active) return;

  const style = trailerModeState.data.style || "cinematic";
  const total = Math.round(trailerModeState.totalTimer);

  trailerModeState.active = false;
  document.body.classList.remove("trailer-mode", "trailer-slow", "trailer-weather", "trailer-keep-hud");

  if (trailerModeState.lastCameraMode) {
    state.cameraMode = trailerModeState.lastCameraMode;
    localStorage.setItem("cameraMode", trailerModeState.lastCameraMode);
  }

  trailerModeState.data.created += completed ? 1 : 0;
  if (completed) {
    trailerModeState.data.history.unshift({
      id: Date.now(),
      style,
      duration: total,
      car: getCarName(state),
      date: new Date().toISOString()
    });
    trailerModeState.data.history = trailerModeState.data.history.slice(0, 12);
    window.showToast?.("Tráiler completado");
  } else {
    window.showToast?.("Tráiler parado");
  }

  saveData();
  updateTrailerUI(state);
}

function applySceneEffects(state, dt) {
  const scene = SCENES[trailerModeState.sceneIndex];
  if (!scene) return;

  if (scene.id === "speed") {
    state._trailerHint = "Usa nitro y mantén la línea recta.";
  } else if (scene.id === "drift") {
    state._trailerHint = "Busca curva y derrapa para escena épica.";
  } else if (scene.id === "police") {
    state._trailerHint = "Activa persecución o conduce agresivo.";
  } else {
    state._trailerHint = scene.tip;
  }

  if (trailerModeState.data.slowMotion && scene.id === "drift") {
    document.body.classList.add("trailer-slow");
  } else {
    document.body.classList.remove("trailer-slow");
  }

  if (trailerModeState.data.useWeather && (scene.id === "police" || scene.id === "final")) {
    document.body.classList.add("trailer-weather");
  } else if (!trailerModeState.data.useWeather) {
    document.body.classList.remove("trailer-weather");
  }
}

function applyTrailerClasses() {
  document.body.classList.toggle("trailer-keep-hud", !trailerModeState.data.hideHUD);
  document.body.classList.toggle("trailer-slow", !!trailerModeState.data.slowMotion);
  document.body.classList.toggle("trailer-weather", !!trailerModeState.data.useWeather && trailerModeState.active);
}

function updateTrailerUI(state) {
  const scene = SCENES[trailerModeState.sceneIndex] || null;
  const duration = scene ? scene.duration : 1;
  const progress = scene ? Math.round((trailerModeState.sceneTimer / duration) * 100) : 0;

  setText("trailerSceneName", scene ? scene.name : "Ninguna");
  setText("trailerTimer", Math.round(trailerModeState.totalTimer) + "s");
  setText("trailerStatus", trailerModeState.active ? "Grabando escenas" : "Parado");

  const fill = document.getElementById("trailerFill");
  if (fill) fill.style.width = Math.min(100, progress) + "%";

  const script = document.getElementById("trailerScript");
  if (script) script.value = buildScript(state);

  renderScenes();
  renderHistory();
  updateTrailerHUD();
}

function renderScenes() {
  const list = document.getElementById("trailerScenesList");
  if (!list) return;

  list.innerHTML = SCENES.map((scene, index) => `
    <div class="trailer-row ${trailerModeState.active && index === trailerModeState.sceneIndex ? "active" : ""}">
      <b>${index + 1}. ${scene.name}</b>
      <p>${scene.duration}s · ${scene.tip}</p>
    </div>
  `).join("");
}

function renderHistory() {
  const list = document.getElementById("trailerHistory");
  if (!list) return;

  if (!trailerModeState.data.history.length) {
    list.innerHTML = "<p>No hay tráileres completados todavía.</p>";
    return;
  }

  list.innerHTML = trailerModeState.data.history.map(item => `
    <div class="trailer-row">
      <b>${styleLabel(item.style)} · ${escapeHTML(item.car)}</b>
      <p>${item.duration}s · ${formatDate(item.date)}</p>
    </div>
  `).join("");
}

function buildScript(state) {
  const style = trailerModeState.data.style || "cinematic";
  const lines = STYLE_LINES[style] || STYLE_LINES.cinematic;
  const car = getCarName(state);
  const map = state.manifest?.maps?.[state.selectedMapIndex]?.name || "Neon City";
  const bestRank = safeJSON(localStorage.getItem("skillChallengesData"), {})?.bestRank || "--";

  return [
    "GUION TRÁILER - RACING REALISTA V60",
    "",
    "0-7s: Plano de entrada del coche " + car + " en " + map + ".",
    "7-16s: Aceleración, nitro y cámara baja mostrando velocidad.",
    "16-24s: Derrape o curva cerrada con enfoque cinemático.",
    "24-32s: Garaje, vinilos, HUD y personalización.",
    "32-41s: Persecución, clima o tensión urbana.",
    "41-48s: Plano final con título grande y llamada a jugar.",
    "",
    "FRASES PARA VOZ/TEXTO:",
    "1. " + lines[0],
    "2. " + lines[1],
    "3. " + lines[2],
    "",
    "DATOS DEL GAMEPLAY:",
    "- Coche: " + car,
    "- Mapa: " + map,
    "- Mejor rango de habilidad: " + bestRank,
    "- Estilo del tráiler: " + styleLabel(style),
    "",
    "TÍTULO SUGERIDO:",
    "Probando mi juego de coches realista en HTML y JavaScript",
    "",
    "DESCRIPCIÓN SUGERIDA:",
    "Nuevo gameplay con coches, drift, persecuciones, clima, rutas personalizadas, pósters y modo tráiler. Vidas solo hay una, así que a disfrutarla al máximo."
  ].join("\\n");
}

function updateTrailerHUD() {
  const hud = document.getElementById("hudTrailer");
  if (!hud) return;

  if (trailerModeState.active) {
    const scene = SCENES[trailerModeState.sceneIndex];
    hud.textContent = scene ? scene.name + " · " + Math.round(trailerModeState.sceneTimer) + "s" : "ON";
  } else {
    hud.textContent = trailerModeState.data.created ? trailerModeState.data.created + " hechos" : "--";
  }
}

function readTrailerForm() {
  trailerModeState.data.style = document.getElementById("trailerStyle")?.value || "cinematic";
  trailerModeState.data.autoCamera = !!document.getElementById("trailerAutoCamera")?.checked;
  trailerModeState.data.hideHUD = !!document.getElementById("trailerHideHUD")?.checked;
  trailerModeState.data.slowMotion = !!document.getElementById("trailerSlowMotion")?.checked;
  trailerModeState.data.useWeather = !!document.getElementById("trailerUseWeather")?.checked;
}

function syncTrailerForm() {
  setValue("trailerStyle", trailerModeState.data.style || "cinematic");
  setChecked("trailerAutoCamera", trailerModeState.data.autoCamera);
  setChecked("trailerHideHUD", trailerModeState.data.hideHUD);
  setChecked("trailerSlowMotion", trailerModeState.data.slowMotion);
  setChecked("trailerUseWeather", trailerModeState.data.useWeather);
}

function getCarName(state) {
  return state.manifest?.cars?.[state.selectedCarIndex]?.name || "Coche";
}

function styleLabel(style) {
  return {
    cinematic: "Cinemático",
    action: "Acción",
    garage: "Garaje",
    police: "Persecución",
    storm: "Tormenta"
  }[style] || "Cinemático";
}

function safeJSON(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.created === "number" ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    style: "cinematic",
    autoCamera: true,
    hideHUD: true,
    slowMotion: false,
    useWeather: true,
    created: 0,
    history: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trailerModeState.data));
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
