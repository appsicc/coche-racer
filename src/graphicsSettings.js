const STORAGE_KEY = "graphicsSettingsData";

const PRESETS = {
  mobile: {
    preset: "mobile",
    targetFPS: 30,
    resolution: 65,
    renderDistance: 55,
    trafficDensity: 35,
    particles: false,
    weatherFX: false,
    shadows: false,
    reflections: false
  },
  balanced: {
    preset: "balanced",
    targetFPS: 45,
    resolution: 85,
    renderDistance: 90,
    trafficDensity: 65,
    particles: true,
    weatherFX: true,
    shadows: false,
    reflections: false
  },
  quality: {
    preset: "quality",
    targetFPS: 60,
    resolution: 100,
    renderDistance: 125,
    trafficDensity: 85,
    particles: true,
    weatherFX: true,
    shadows: true,
    reflections: false
  },
  ultra: {
    preset: "ultra",
    targetFPS: 60,
    resolution: 125,
    renderDistance: 160,
    trafficDensity: 100,
    particles: true,
    weatherFX: true,
    shadows: true,
    reflections: true
  }
};

export const graphicsState = {
  data: loadData(),
  fpsTimer: 0,
  frameCount: 0,
  estimatedFPS: 0
};

export function setupGraphicsSettings(state, showScreen) {
  state.graphicsSettings = graphicsState;

  document.getElementById("graphicsBtn").onclick = () => {
    syncGraphicsForm();
    updateGraphicsUI(state);
    showScreen("graphicsScreen");
  };

  document.getElementById("applyGraphicsPreset").onclick = () => {
    const preset = document.getElementById("graphicsPreset")?.value || "balanced";
    applyPreset(preset, state);
  };

  document.getElementById("saveGraphicsSettings").onclick = () => {
    readForm();
    graphicsState.data.preset = "custom";
    saveData();
    applyGraphicsToGame(state);
    updateGraphicsUI(state);
    window.showToast?.("Ajustes gráficos guardados");
  };

  [
    "graphicsTargetFPS",
    "graphicsResolution",
    "graphicsRenderDistance",
    "graphicsTrafficDensity",
    "graphicsParticles",
    "graphicsWeatherFX",
    "graphicsShadows",
    "graphicsReflections"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = () => {
        readForm();
        graphicsState.data.preset = "custom";
        applyGraphicsToGame(state);
        updateGraphicsUI(state);
      };
    }
  });

  applyGraphicsToGame(state);
  updateGraphicsUI(state);
}

export function updateGraphicsSettings(state, dt) {
  graphicsState.frameCount++;
  graphicsState.fpsTimer += dt;

  if (graphicsState.fpsTimer >= 1) {
    graphicsState.estimatedFPS = Math.round(graphicsState.frameCount / graphicsState.fpsTimer);
    graphicsState.frameCount = 0;
    graphicsState.fpsTimer = 0;
    autoProtectPerformance(state);
    updateGraphicsUI(state);
  }

  updateGraphicsHUD();
}

function applyPreset(name, state) {
  const preset = PRESETS[name] || PRESETS.balanced;
  graphicsState.data = { ...preset };
  syncGraphicsForm();
  saveData();
  applyGraphicsToGame(state);
  updateGraphicsUI(state);
  window.showToast?.("Perfil aplicado: " + presetLabel(name));
}

function readForm() {
  graphicsState.data = {
    preset: document.getElementById("graphicsPreset")?.value || "custom",
    targetFPS: Number(document.getElementById("graphicsTargetFPS")?.value || 45),
    resolution: Number(document.getElementById("graphicsResolution")?.value || 85),
    renderDistance: Number(document.getElementById("graphicsRenderDistance")?.value || 90),
    trafficDensity: Number(document.getElementById("graphicsTrafficDensity")?.value || 65),
    particles: !!document.getElementById("graphicsParticles")?.checked,
    weatherFX: !!document.getElementById("graphicsWeatherFX")?.checked,
    shadows: !!document.getElementById("graphicsShadows")?.checked,
    reflections: !!document.getElementById("graphicsReflections")?.checked
  };
}

function syncGraphicsForm() {
  const d = graphicsState.data;
  setValue("graphicsPreset", d.preset || "balanced");
  setValue("graphicsTargetFPS", d.targetFPS || 45);
  setValue("graphicsResolution", d.resolution || 85);
  setValue("graphicsRenderDistance", d.renderDistance || 90);
  setValue("graphicsTrafficDensity", d.trafficDensity || 65);
  setChecked("graphicsParticles", d.particles);
  setChecked("graphicsWeatherFX", d.weatherFX);
  setChecked("graphicsShadows", d.shadows);
  setChecked("graphicsReflections", d.reflections);
}

function applyGraphicsToGame(state) {
  const d = graphicsState.data;

  document.body.classList.remove("gfx-low", "gfx-mobile", "gfx-ultra");
  if (d.preset === "mobile" || d.resolution <= 70) document.body.classList.add("gfx-low", "gfx-mobile");
  if (d.preset === "ultra") document.body.classList.add("gfx-ultra");

  state.graphicsQuality = {
    preset: d.preset,
    targetFPS: d.targetFPS,
    resolutionScale: d.resolution / 100,
    renderDistance: d.renderDistance,
    trafficDensity: d.trafficDensity / 100,
    particles: d.particles,
    weatherFX: d.weatherFX,
    shadows: d.shadows,
    reflections: d.reflections
  };

  if (state.renderer && state.renderer.setPixelRatio) {
    const baseRatio = Math.min(window.devicePixelRatio || 1, 2);
    state.renderer.setPixelRatio(Math.max(0.55, Math.min(2, baseRatio * (d.resolution / 100))));
  }
}

function autoProtectPerformance(state) {
  const d = graphicsState.data;
  if (graphicsState.estimatedFPS <= 0) return;

  if (graphicsState.estimatedFPS < d.targetFPS - 12 && d.preset !== "mobile") {
    d.resolution = Math.max(60, d.resolution - 5);
    d.renderDistance = Math.max(55, d.renderDistance - 8);
    d.trafficDensity = Math.max(35, d.trafficDensity - 8);
    d.particles = d.resolution > 70 ? d.particles : false;
    d.preset = "custom";
    saveData();
    syncGraphicsForm();
    applyGraphicsToGame(state);
  }
}

function updateGraphicsUI(state) {
  const d = graphicsState.data;

  setText("graphicsResolutionValue", d.resolution + "%");
  setText("graphicsRenderDistanceValue", d.renderDistance + "m");
  setText("graphicsTrafficDensityValue", d.trafficDensity + "%");
  setText("graphicsStatus", `${presetLabel(d.preset)} · ${graphicsState.estimatedFPS || "--"} FPS`);

  const report = document.getElementById("graphicsReport");
  if (report) {
    const lines = [
      ["Perfil", presetLabel(d.preset)],
      ["FPS objetivo", d.targetFPS + " FPS"],
      ["FPS estimado", graphicsState.estimatedFPS ? graphicsState.estimatedFPS + " FPS" : "calculando"],
      ["Resolución", d.resolution + "%"],
      ["Render", d.renderDistance + "m"],
      ["Tráfico", d.trafficDensity + "%"],
      ["Partículas", d.particles ? "ON" : "OFF"],
      ["Clima visual", d.weatherFX ? "ON" : "OFF"],
      ["Sombras extra", d.shadows ? "ON" : "OFF"],
      ["Reflejos", d.reflections ? "ON" : "OFF"]
    ];

    report.innerHTML = lines.map(([k, v]) => `<div class="graphics-line"><b>${k}:</b> ${v}</div>`).join("");
  }

  updateGraphicsHUD();
}

function updateGraphicsHUD() {
  const hud = document.getElementById("hudGraphics");
  if (!hud) return;

  const d = graphicsState.data;
  hud.textContent = `${presetLabel(d.preset)} · ${graphicsState.estimatedFPS || "--"} FPS`;
}

function presetLabel(name) {
  return {
    mobile: "Móvil",
    balanced: "Equilibrado",
    quality: "Calidad",
    ultra: "Ultra",
    custom: "Custom"
  }[name] || "Custom";
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.resolution === "number" ? data : { ...PRESETS.balanced };
  } catch {
    return { ...PRESETS.balanced };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(graphicsState.data));
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
