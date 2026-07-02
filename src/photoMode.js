import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const photoState = {
  enabled: false,
  filter: localStorage.getItem("photoFilter") || "none",
  hideUI: false,
  yaw: 0,
  pitch: 0.25,
  distance: 8,
  height: 3,
  keys: {}
};

export function setupPhotoMode(state, showScreen) {
  document.getElementById("photoBtn").onclick = () => {
    updatePhotoUI();
    showScreen("photoScreen");
  };

  document.getElementById("photoEnable").onclick = () => {
    photoState.enabled = true;
    if (state.car) {
      photoState.yaw = state.car.rotation.y;
      photoState.distance = 8;
      photoState.height = 3;
    }
    window.showToast?.("Modo foto activado");
  };

  document.getElementById("photoDisable").onclick = () => {
    photoState.enabled = false;
    window.showToast?.("Modo foto desactivado");
  };

  document.getElementById("togglePhotoHUD").onclick = () => {
    photoState.hideUI = !photoState.hideUI;
    document.body.classList.toggle("photo-hide-ui", photoState.hideUI);
    updatePhotoUI();
  };

  document.getElementById("takeScreenshot").onclick = () => takeScreenshot(state);

  document.querySelectorAll(".filterBtn").forEach(btn => {
    btn.onclick = () => setPhotoFilter(btn.dataset.filter);
  });

  window.addEventListener("keydown", e => {
    photoState.keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener("keyup", e => {
    photoState.keys[e.key.toLowerCase()] = false;
  });

  setPhotoFilter(photoState.filter);
  updatePhotoUI();
}

export function updatePhotoMode(state, dt) {
  if (!photoState.enabled || !state.car) return false;

  const keys = photoState.keys;
  const move = dt * 2.2;

  if (keys["arrowleft"]) photoState.yaw += move;
  if (keys["arrowright"]) photoState.yaw -= move;
  if (keys["arrowup"]) photoState.pitch = Math.min(1.0, photoState.pitch + dt);
  if (keys["arrowdown"]) photoState.pitch = Math.max(-0.15, photoState.pitch - dt);
  if (keys["w"]) photoState.distance = Math.max(3.5, photoState.distance - dt * 6);
  if (keys["s"]) photoState.distance = Math.min(16, photoState.distance + dt * 6);
  if (keys["q"]) photoState.height = Math.min(9, photoState.height + dt * 5);
  if (keys["e"]) photoState.height = Math.max(0.8, photoState.height - dt * 5);

  const target = state.car.position.clone();
  target.y += 0.75;

  const x = Math.sin(photoState.yaw) * photoState.distance;
  const z = Math.cos(photoState.yaw) * photoState.distance;
  const y = photoState.height + Math.sin(photoState.pitch) * 2;

  state.camera.position.lerp(new THREE.Vector3(target.x + x, target.y + y, target.z + z), 0.12);
  state.camera.lookAt(target);

  return true;
}

export function setPhotoFilter(filter) {
  photoState.filter = filter || "none";
  localStorage.setItem("photoFilter", photoState.filter);

  const overlay = document.getElementById("photoOverlay");
  if (overlay) {
    overlay.className = "hidden";
    if (photoState.filter !== "none") {
      overlay.classList.remove("hidden");
      overlay.classList.add(photoState.filter);
    }
  }

  updatePhotoUI();
}

function takeScreenshot(state) {
  try {
    const oldHide = photoState.hideUI;
    document.body.classList.add("photo-hide-ui");
    state.renderer.render(state.scene, state.camera);

    const url = state.renderer.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    const date = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = "racing_realista_foto_" + date + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();

    document.body.classList.toggle("photo-hide-ui", oldHide);
    window.showToast?.("Captura guardada");
  } catch (err) {
    console.error(err);
    window.showToast?.("No se pudo guardar captura");
  }
}

function updatePhotoUI() {
  const hudBtn = document.getElementById("togglePhotoHUD");
  if (hudBtn) hudBtn.textContent = photoState.hideUI ? "MOSTRAR HUD" : "OCULTAR HUD";

  document.querySelectorAll(".filterBtn").forEach(btn => {
    btn.classList.toggle("active-filter", btn.dataset.filter === photoState.filter);
  });
}
