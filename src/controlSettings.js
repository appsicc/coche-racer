export const controlSettings = {
  steerSensitivity: Number(localStorage.getItem("steerSensitivity") || 100),
  buttonScale: Number(localStorage.getItem("buttonScale") || 100),
  vibration: localStorage.getItem("vibration") !== "off",
  cameraMode: localStorage.getItem("cameraMode") || "normal"
};

export const CAMERA_PRESETS = {
  close: { label: "Cerca", distance: 6.2, height: 3.2, fov: 70 },
  normal: { label: "Normal", distance: 8.5, height: 4.2, fov: 65 },
  far: { label: "Lejos", distance: 11.5, height: 5.5, fov: 60 }
};

export function setupControlSettingsUI(state) {
  const steer = document.getElementById("steerSensitivity");
  const scale = document.getElementById("buttonScale");
  const vibration = document.getElementById("vibrationToggle");

  if (steer) {
    steer.value = controlSettings.steerSensitivity;
    steer.oninput = () => {
      controlSettings.steerSensitivity = Number(steer.value);
      localStorage.setItem("steerSensitivity", String(controlSettings.steerSensitivity));
    };
  }

  if (scale) {
    scale.value = controlSettings.buttonScale;
    scale.oninput = () => {
      controlSettings.buttonScale = Number(scale.value);
      localStorage.setItem("buttonScale", String(controlSettings.buttonScale));
      applyButtonScale();
    };
  }

  if (vibration) {
    vibration.onclick = () => {
      controlSettings.vibration = !controlSettings.vibration;
      localStorage.setItem("vibration", controlSettings.vibration ? "on" : "off");
      updateControlSettingsUI();
    };
  }

  document.getElementById("cameraClose").onclick = () => setCameraMode(state, "close");
  document.getElementById("cameraNormal").onclick = () => setCameraMode(state, "normal");
  document.getElementById("cameraFar").onclick = () => setCameraMode(state, "far");

  applyButtonScale();
  updateControlSettingsUI();
  applyCameraPreset(state);
}

export function setCameraMode(state, mode) {
  if (!CAMERA_PRESETS[mode]) mode = "normal";
  controlSettings.cameraMode = mode;
  localStorage.setItem("cameraMode", mode);
  applyCameraPreset(state);
  updateControlSettingsUI();
  window.showToast?.("Cámara: " + CAMERA_PRESETS[mode].label);
}

export function applyCameraPreset(state) {
  const preset = CAMERA_PRESETS[controlSettings.cameraMode] || CAMERA_PRESETS.normal;
  if (state?.camera) {
    state.camera.fov = preset.fov;
    state.camera.updateProjectionMatrix();
  }
}

export function getCameraPreset() {
  return CAMERA_PRESETS[controlSettings.cameraMode] || CAMERA_PRESETS.normal;
}

export function getSteerMultiplier() {
  return controlSettings.steerSensitivity / 100;
}

export function vibrate(ms = 40) {
  if (!controlSettings.vibration) return;
  if (navigator.vibrate) navigator.vibrate(ms);
}

export function applyButtonScale() {
  const scale = controlSettings.buttonScale / 100;
  document.documentElement.style.setProperty("--mobile-control-scale", String(scale));
  const mobile = document.getElementById("mobileControls");
  if (mobile) mobile.classList.toggle("big-buttons", controlSettings.buttonScale > 115);
}

export function updateControlSettingsUI() {
  const vibration = document.getElementById("vibrationToggle");
  if (vibration) vibration.textContent = "VIBRACIÓN: " + (controlSettings.vibration ? "ON" : "OFF");

  const preset = CAMERA_PRESETS[controlSettings.cameraMode] || CAMERA_PRESETS.normal;
  const label = document.getElementById("cameraLabel");
  if (label) label.textContent = preset.label;

  const buttons = {
    close: document.getElementById("cameraClose"),
    normal: document.getElementById("cameraNormal"),
    far: document.getElementById("cameraFar")
  };

  Object.entries(buttons).forEach(([key, btn]) => {
    if (btn) btn.classList.toggle("active-camera", key === controlSettings.cameraMode);
  });
}
