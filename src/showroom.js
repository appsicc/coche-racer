import * as THREE from "https://esm.sh/three@0.160.0";
import { getCarStats } from "./shop.js";
import { isCarUnlocked } from "./progress.js";

export const showroomState = {
  renderer: null,
  scene: null,
  camera: null,
  carGroup: null,
  rotate: localStorage.getItem("showroomRotate") !== "off",
  index: Number(localStorage.getItem("selectedCarIndex") || 0),
  running: false
};

export function setupShowroom(state, showScreen) {
  document.getElementById("showroomBtn").onclick = () => {
    showroomState.index = Number(localStorage.getItem("selectedCarIndex") || state.selectedCarIndex || 0);
    initShowroom(state);
    updateShowroomCar(state);
    showScreen("showroomScreen");
  };

  document.getElementById("showroomRotate").onclick = () => {
    showroomState.rotate = !showroomState.rotate;
    localStorage.setItem("showroomRotate", showroomState.rotate ? "on" : "off");
    updateShowroomUI(state);
  };

  document.getElementById("showroomPrev").onclick = () => {
    showroomState.index = (showroomState.index - 1 + state.manifest.cars.length) % state.manifest.cars.length;
    updateShowroomCar(state);
  };

  document.getElementById("showroomNext").onclick = () => {
    showroomState.index = (showroomState.index + 1) % state.manifest.cars.length;
    updateShowroomCar(state);
  };

  document.getElementById("showroomSelect").onclick = () => {
    if (!isCarUnlocked(state, showroomState.index)) {
      window.showToast?.("Coche bloqueado");
      return;
    }
    state.selectedCarIndex = showroomState.index;
    localStorage.setItem("selectedCarIndex", String(showroomState.index));
    window.showToast?.("Coche seleccionado");
    updateShowroomUI(state);
  };

  document.getElementById("showroomTestDrive").onclick = () => {
    if (!isCarUnlocked(state, showroomState.index)) {
      window.showToast?.("Coche bloqueado");
      return;
    }
    state.selectedCarIndex = showroomState.index;
    localStorage.setItem("selectedCarIndex", String(showroomState.index));
    document.getElementById("freeModeBtn")?.click();
  };
}

export function updateShowroom(state, dt) {
  if (!showroomState.running || !showroomState.renderer) return;

  const screen = document.getElementById("showroomScreen");
  if (!screen || !screen.classList.contains("active")) return;

  if (showroomState.carGroup && showroomState.rotate) {
    showroomState.carGroup.rotation.y += dt * 0.65;
  }

  showroomState.renderer.render(showroomState.scene, showroomState.camera);
}

function initShowroom(state) {
  if (showroomState.renderer) {
    showroomState.running = true;
    return;
  }

  const canvas = document.getElementById("showroomCanvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060812);

  const camera = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.1, 100);
  camera.position.set(4.8, 2.6, 6.2);
  camera.lookAt(0, 0.6, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(canvas.width, canvas.height, false);

  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0x9fe8ff, 2.1);
  key.position.set(4, 5, 4);
  scene.add(key);

  const rim = new THREE.PointLight(0xff33cc, 1.4, 12);
  rim.position.set(-3, 2.3, -2.5);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 64),
    new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.2,
      roughness: 0.38
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  scene.add(floor);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.65, 0.025, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x00d4ff })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.015;
  scene.add(ring);

  showroomState.renderer = renderer;
  showroomState.scene = scene;
  showroomState.camera = camera;
  showroomState.running = true;
}

function updateShowroomCar(state) {
  if (!showroomState.scene) return;

  if (showroomState.carGroup) {
    showroomState.scene.remove(showroomState.carGroup);
  }

  showroomState.carGroup = buildShowroomCar(state, showroomState.index);
  showroomState.scene.add(showroomState.carGroup);
  updateShowroomUI(state);
}

function buildShowroomCar(state, index) {
  const carData = state.manifest.cars[index] || {};
  const stats = getCarStats(state, index);
  const group = new THREE.Group();

  const color = getColorForIndex(index);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.05, 0.55, 4.25),
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.45,
      roughness: 0.22
    })
  );
  body.position.y = 0.55;
  group.add(body);

  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.28, 1.55),
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.55,
      roughness: 0.18
    })
  );
  hood.position.set(0, 0.83, -1.02);
  group.add(hood);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.55, 1.55),
    new THREE.MeshStandardMaterial({
      color: 0x0b1020,
      metalness: 0.2,
      roughness: 0.12,
      transparent: true,
      opacity: 0.92
    })
  );
  cabin.position.set(0, 1.05, 0.28);
  group.add(cabin);

  const spoiler = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 0.12, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x07090f, metalness: 0.4, roughness: 0.25 })
  );
  spoiler.position.set(0, 1.08, 1.95);
  group.add(spoiler);

  for (const x of [-1.08, 1.08]) {
    for (const z of [-1.42, 1.42]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 0.28, 24),
        new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.5 })
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.35, z);
      group.add(wheel);

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.295, 18),
        new THREE.MeshStandardMaterial({ color: 0xcdd7e6, metalness: 0.8, roughness: 0.18 })
      );
      rim.rotation.z = Math.PI / 2;
      rim.position.set(x, 0.35, z);
      group.add(rim);
    }
  }

  const frontLight = new THREE.PointLight(0xaeefff, 1.2, 8);
  frontLight.position.set(0, 0.65, -2.35);
  group.add(frontLight);

  const locked = !isCarUnlocked(state, index);
  if (locked) {
    group.traverse(obj => {
      if (obj.material) obj.material.opacity = 0.45;
      if (obj.material) obj.material.transparent = true;
    });
  }

  group.userData.carName = carData.name || "Coche";
  return group;
}

function updateShowroomUI(state) {
  const car = state.manifest.cars[showroomState.index] || {};
  const stats = getCarStats(state, showroomState.index);
  const unlocked = isCarUnlocked(state, showroomState.index);
  const selected = Number(localStorage.getItem("selectedCarIndex") || 0) === showroomState.index;

  setText("showroomCarName", (selected ? "✅ " : "") + (car.name || "Coche") + (unlocked ? "" : " 🔒"));
  setText("showroomCarDesc", car.description || "Coche deportivo del juego.");
  setText("showroomAdvice", buildAdvice(stats, unlocked));

  setWidth("showroomSpeed", normalize(stats.maxSpeed, 1.0, 2.4));
  setWidth("showroomAccel", normalize(stats.acceleration, 0.6, 1.8));
  setWidth("showroomHandling", normalize(stats.handling, 0.65, 1.7));
  setWidth("showroomNitro", normalize(stats.nitroMax || 100, 80, 180));

  const rotate = document.getElementById("showroomRotate");
  if (rotate) rotate.textContent = "ROTACIÓN: " + (showroomState.rotate ? "ON" : "OFF");
}

function buildAdvice(stats, unlocked) {
  if (!unlocked) return "Este coche está bloqueado. Sube de nivel o progresa para desbloquearlo.";

  const parts = [];
  if (stats.maxSpeed > 1.75) parts.push("ideal para rectas");
  if (stats.acceleration > 1.15) parts.push("sale rápido");
  if (stats.handling > 1.12) parts.push("va bien para curvas");
  if ((stats.nitroMax || 100) > 120) parts.push("nitro potente");

  return parts.length ? "Recomendado: " + parts.join(", ") + "." : "Coche equilibrado para empezar.";
}

function getColorForIndex(index) {
  return [0xff3333, 0xff8a00, 0xcdd7e6, 0x2288ff, 0x44ff88, 0xff33cc][index % 6];
}

function normalize(value, min, max) {
  return Math.max(8, Math.min(100, ((value - min) / (max - min)) * 100));
}

function setWidth(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.width = value + "%";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
