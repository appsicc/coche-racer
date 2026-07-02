export const settings = {
  quality: localStorage.getItem("quality") || "medium",
  sound: localStorage.getItem("sound") !== "off"
};

export const QUALITY_PRESETS = {
  low: {
    label: "Baja",
    pixelRatio: 1.0,
    shadows: false,
    particleMultiplier: 0.35,
    drawDistance: 115,
    description: "Sombras desactivadas, menos partículas y menor resolución. Recomendado para móvil."
  },
  medium: {
    label: "Media",
    pixelRatio: 1.35,
    shadows: true,
    particleMultiplier: 0.65,
    drawDistance: 155,
    description: "Sombras medias, partículas normales y resolución equilibrada."
  },
  high: {
    label: "Alta",
    pixelRatio: 1.8,
    shadows: true,
    particleMultiplier: 1.0,
    drawDistance: 210,
    description: "Más resolución, sombras y mayor distancia visual. Recomendado para PC."
  }
};

export function applyQuality(state, quality = settings.quality) {
  if (!QUALITY_PRESETS[quality]) quality = "medium";
  settings.quality = quality;
  localStorage.setItem("quality", quality);

  const preset = QUALITY_PRESETS[quality];
  document.body.classList.toggle("low-quality", quality === "low");

  if (state?.renderer) {
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatio));
    state.renderer.shadowMap.enabled = preset.shadows;
  }

  if (state?.scene) {
    state.scene.traverse(obj => {
      if (obj.isLight && obj.shadow) {
        obj.castShadow = preset.shadows;
      }
      if (obj.isMesh) {
        obj.castShadow = preset.shadows;
        obj.receiveShadow = preset.shadows;
      }
    });

    if (state.scene.fog) {
      state.scene.fog.far = preset.drawDistance;
    }
  }

  updateSettingsUI();
  window.dispatchEvent(new CustomEvent("qualitychange", { detail: preset }));
}

export function toggleSound(state) {
  settings.sound = !settings.sound;
  localStorage.setItem("sound", settings.sound ? "on" : "off");
  if (state?.audio) state.audio.setEnabled(settings.sound);
  updateSettingsUI();
}

export function updateSettingsUI() {
  const preset = QUALITY_PRESETS[settings.quality] || QUALITY_PRESETS.medium;

  const label = document.getElementById("qualityLabel");
  if (label) label.textContent = preset.label;

  const desc = document.getElementById("qualityDescription");
  if (desc) desc.textContent = preset.description;

  const sound = document.getElementById("soundToggle");
  if (sound) sound.textContent = "SONIDO: " + (settings.sound ? "ON" : "OFF");

  const buttons = {
    low: document.getElementById("qualityLow"),
    medium: document.getElementById("qualityMedium"),
    high: document.getElementById("qualityHigh")
  };

  Object.entries(buttons).forEach(([key, btn]) => {
    if (!btn) return;
    btn.classList.toggle("active-quality", key === settings.quality);
  });
}

export function setupSettingsUI(state, showScreen) {
  document.getElementById("settingsBtn").onclick = () => {
    updateSettingsUI();
    showScreen("settingsScreen");
  };

  const pauseSettings = document.getElementById("pauseSettingsBtn");
  if (pauseSettings) {
    pauseSettings.onclick = () => {
      document.getElementById("pauseMenu").classList.add("hidden");
      updateSettingsUI();
      showScreen("settingsScreen");
    };
  }

  document.getElementById("qualityLow").onclick = () => applyQuality(state, "low");
  document.getElementById("qualityMedium").onclick = () => applyQuality(state, "medium");
  document.getElementById("qualityHigh").onclick = () => applyQuality(state, "high");
  document.getElementById("soundToggle").onclick = () => toggleSound(state);

  updateSettingsUI();
}
