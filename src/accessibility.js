export const accessState = {
  highContrast: localStorage.getItem("highContrast") === "on",
  bigHud: localStorage.getItem("bigHud") === "on",
  reduceMotion: localStorage.getItem("reduceMotion") === "on",
  listeningAction: null,
  keybinds: loadKeybinds()
};

const DEFAULT_BINDS = {
  forward: "KeyW",
  brake: "KeyS",
  left: "KeyA",
  right: "KeyD",
  nitro: "Space"
};

const ACTION_LABELS = {
  forward: "Acelerar",
  brake: "Frenar",
  left: "Izquierda",
  right: "Derecha",
  nitro: "Nitro"
};

export function setupAccessibility(state, showScreen) {
  document.getElementById("accessibilityBtn").onclick = () => {
    updateAccessibilityUI();
    showScreen("accessibilityScreen");
  };

  document.getElementById("highContrastToggle").onclick = () => {
    accessState.highContrast = !accessState.highContrast;
    localStorage.setItem("highContrast", accessState.highContrast ? "on" : "off");
    applyAccessibility();
    updateAccessibilityUI();
  };

  document.getElementById("bigHudToggle").onclick = () => {
    accessState.bigHud = !accessState.bigHud;
    localStorage.setItem("bigHud", accessState.bigHud ? "on" : "off");
    applyAccessibility();
    updateAccessibilityUI();
  };

  document.getElementById("reduceMotionToggle").onclick = () => {
    accessState.reduceMotion = !accessState.reduceMotion;
    localStorage.setItem("reduceMotion", accessState.reduceMotion ? "on" : "off");
    applyAccessibility();
    updateAccessibilityUI();
  };

  document.querySelectorAll(".bindBtn").forEach(btn => {
    btn.onclick = () => {
      accessState.listeningAction = btn.dataset.action;
      updateAccessibilityUI();
      const status = document.getElementById("accessStatus");
      if (status) status.textContent = "Pulsa una tecla para: " + ACTION_LABELS[accessState.listeningAction];
    };
  });

  document.getElementById("resetKeybinds").onclick = () => {
    accessState.keybinds = { ...DEFAULT_BINDS };
    saveKeybinds();
    updateAccessibilityUI();
    window.showToast?.("Teclas restauradas");
  };

  window.addEventListener("keydown", event => {
    if (!accessState.listeningAction) return;
    event.preventDefault();
    accessState.keybinds[accessState.listeningAction] = event.code;
    accessState.listeningAction = null;
    saveKeybinds();
    updateAccessibilityUI();
    window.showToast?.("Tecla guardada");
  }, true);

  applyAccessibility();
  updateAccessibilityUI();
}

export function applyAccessibility() {
  document.body.classList.toggle("high-contrast", accessState.highContrast);
  document.body.classList.toggle("big-hud", accessState.bigHud);
  document.body.classList.toggle("reduce-motion", accessState.reduceMotion);
}

export function remapControls(state) {
  if (!state.controls) return;

  // Keyboard state from the original controls module usually exposes key states.
  // This layer adds alternate remapped keys without breaking the defaults.
  const keys = window.__pressedKeys || {};
  state.controls.forward = !!keys[accessState.keybinds.forward] || state.controls.forward;
  state.controls.brake = !!keys[accessState.keybinds.brake] || state.controls.brake;
  state.controls.left = !!keys[accessState.keybinds.left] || state.controls.left;
  state.controls.right = !!keys[accessState.keybinds.right] || state.controls.right;
  state.controls.nitro = !!keys[accessState.keybinds.nitro] || state.controls.nitro;
}

export function installPressedKeyTracker() {
  if (window.__pressedKeyTrackerInstalled) return;
  window.__pressedKeyTrackerInstalled = true;
  window.__pressedKeys = {};

  window.addEventListener("keydown", e => {
    window.__pressedKeys[e.code] = true;
  });

  window.addEventListener("keyup", e => {
    window.__pressedKeys[e.code] = false;
  });

  window.addEventListener("blur", () => {
    window.__pressedKeys = {};
  });
}

function updateAccessibilityUI() {
  setButton("highContrastToggle", "ALTO CONTRASTE", accessState.highContrast);
  setButton("bigHudToggle", "HUD GRANDE", accessState.bigHud);
  setButton("reduceMotionToggle", "REDUCIR ANIMACIONES", accessState.reduceMotion);

  Object.keys(DEFAULT_BINDS).forEach(action => {
    const el = document.getElementById("bind_" + action);
    if (el) el.textContent = prettyKey(accessState.keybinds[action]);
  });

  document.querySelectorAll(".bindBtn").forEach(btn => {
    btn.classList.toggle("listening", btn.dataset.action === accessState.listeningAction);
  });

  const status = document.getElementById("accessStatus");
  if (status && !accessState.listeningAction) {
    status.textContent = "Preferencias guardadas automáticamente.";
  }
}

function setButton(id, label, enabled) {
  const btn = document.getElementById(id);
  if (btn) btn.textContent = label + ": " + (enabled ? "ON" : "OFF");
}

function prettyKey(code) {
  if (!code) return "--";
  return code
    .replace("Key", "")
    .replace("Digit", "")
    .replace("Space", "Espacio")
    .replace("Arrow", "Flecha ");
}

function loadKeybinds() {
  try {
    return { ...DEFAULT_BINDS, ...JSON.parse(localStorage.getItem("keybinds") || "{}") };
  } catch {
    return { ...DEFAULT_BINDS };
  }
}

function saveKeybinds() {
  localStorage.setItem("keybinds", JSON.stringify(accessState.keybinds));
}
