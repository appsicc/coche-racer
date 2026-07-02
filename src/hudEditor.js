const STORAGE_KEY = "hudEditorData";

const PRESETS = {
  default: { preset: "default", x: "left", y: "top", scale: 100, opacity: 86, compact: false, glow: true, safeArea: true },
  mobile: { preset: "mobile", x: "left", y: "top", scale: 122, opacity: 92, compact: true, glow: true, safeArea: true },
  stream: { preset: "stream", x: "right", y: "top", scale: 108, opacity: 84, compact: false, glow: true, safeArea: true },
  minimal: { preset: "minimal", x: "left", y: "top", scale: 86, opacity: 62, compact: true, glow: false, safeArea: true },
  cinematic: { preset: "cinematic", x: "center", y: "bottom", scale: 82, opacity: 48, compact: true, glow: false, safeArea: true }
};

export const hudEditorState = {
  data: loadData()
};

export function setupHudEditor(state, showScreen) {
  state.hudEditor = hudEditorState;

  document.getElementById("hudEditorBtn").onclick = () => {
    syncForm();
    applyHud();
    updateHudEditorUI();
    showScreen("hudEditorScreen");
  };

  document.getElementById("applyHudPreset").onclick = () => {
    const preset = document.getElementById("hudPreset")?.value || "default";
    hudEditorState.data = { ...(PRESETS[preset] || PRESETS.default) };
    saveData();
    syncForm();
    applyHud();
    updateHudEditorUI();
    window.showToast?.("Preset HUD aplicado");
  };

  document.getElementById("resetHudEditor").onclick = () => {
    hudEditorState.data = { ...PRESETS.default };
    saveData();
    syncForm();
    applyHud();
    updateHudEditorUI();
    window.showToast?.("HUD restaurado");
  };

  document.getElementById("saveHudEditor").onclick = () => {
    readForm();
    hudEditorState.data.preset = "custom";
    saveData();
    applyHud();
    updateHudEditorUI();
    window.showToast?.("HUD guardado");
  };

  ["hudPreset","hudPositionX","hudPositionY","hudScale","hudOpacity","hudCompact","hudGlow","hudSafeArea"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = () => {
        readForm();
        if (id !== "hudPreset") hudEditorState.data.preset = "custom";
        applyHud();
        updateHudEditorUI();
      };
    }
  });

  syncForm();
  applyHud();
  updateHudEditorUI();
}

export function updateHudEditor() {
  applyHud();
}

function readForm() {
  hudEditorState.data = {
    preset: document.getElementById("hudPreset")?.value || "custom",
    x: document.getElementById("hudPositionX")?.value || "left",
    y: document.getElementById("hudPositionY")?.value || "top",
    scale: Number(document.getElementById("hudScale")?.value || 100),
    opacity: Number(document.getElementById("hudOpacity")?.value || 86),
    compact: !!document.getElementById("hudCompact")?.checked,
    glow: !!document.getElementById("hudGlow")?.checked,
    safeArea: !!document.getElementById("hudSafeArea")?.checked
  };
}

function syncForm() {
  const d = hudEditorState.data;
  setValue("hudPreset", d.preset || "custom");
  setValue("hudPositionX", d.x || "left");
  setValue("hudPositionY", d.y || "top");
  setValue("hudScale", d.scale ?? 100);
  setValue("hudOpacity", d.opacity ?? 86);
  setChecked("hudCompact", d.compact);
  setChecked("hudGlow", d.glow);
  setChecked("hudSafeArea", d.safeArea);
}

function applyHud() {
  const d = hudEditorState.data;
  const body = document.body;
  const hud = document.getElementById("hud");

  body.classList.remove(
    "hud-pos-left","hud-pos-center","hud-pos-right",
    "hud-pos-top","hud-pos-middle","hud-pos-bottom",
    "hud-compact","hud-no-glow","hud-safe-area"
  );

  body.classList.add("hud-pos-" + (d.x || "left"));
  body.classList.add("hud-pos-" + (d.y || "top"));
  if (d.compact) body.classList.add("hud-compact");
  if (!d.glow) body.classList.add("hud-no-glow");
  if (d.safeArea) body.classList.add("hud-safe-area");

  if (hud) {
    hud.style.fontSize = (d.scale || 100) + "%";
    hud.style.opacity = String((d.opacity || 86) / 100);
  }
}

function updateHudEditorUI() {
  const d = hudEditorState.data;
  setText("hudScaleValue", (d.scale || 100) + "%");
  setText("hudOpacityValue", (d.opacity || 86) + "%");
  setText("hudEditorStatus", `Preset ${label(d.preset)} · ${label(d.x)} · ${label(d.y)} · ${d.scale}% · ${d.opacity}%`);
}

function label(value) {
  return {
    default: "Normal",
    mobile: "Móvil",
    stream: "Stream",
    minimal: "Minimal",
    cinematic: "Cine",
    custom: "Custom",
    left: "Izquierda",
    center: "Centro",
    right: "Derecha",
    top: "Arriba",
    middle: "Medio",
    bottom: "Abajo"
  }[value] || value;
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.scale === "number" ? data : { ...PRESETS.default };
  } catch {
    return { ...PRESETS.default };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hudEditorState.data));
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
