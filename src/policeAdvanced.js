import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "policeAdvancedData";

export const policeAdvancedState = {
  wanted: 0,
  heat: 0,
  escapeTimer: 0,
  pursuitTimer: 0,
  cooldown: 0,
  backupCars: [],
  data: loadData()
};

export function setupPoliceAdvanced(state) {
  state.policeAdvanced = policeAdvancedState;
}

export function updatePoliceAdvanced(state, dt) {
  if (!state.car || !state.scene) return;

  updateHeat(state, dt);
  updateWantedLevel(state, dt);
  updateBackupCars(state, dt);
  updateEscape(state, dt);
  updateWantedHUD();
}

function updateHeat(state, dt) {
  const speed = Math.abs(state.speed || 0);
  const damaged = Number(state.damage || 0);

  if (speed > 1.15) policeAdvancedState.heat += dt * 7;
  if (speed > 1.65) policeAdvancedState.heat += dt * 10;
  if (damaged > 35) policeAdvancedState.heat += dt * 2;

  if (speed < 0.35) policeAdvancedState.heat -= dt * 8;
  policeAdvancedState.heat = THREE.MathUtils.clamp(policeAdvancedState.heat, 0, 160);

  if (policeAdvancedState.cooldown > 0) {
    policeAdvancedState.cooldown -= dt;
    policeAdvancedState.heat = Math.max(0, policeAdvancedState.heat - dt * 9);
  }
}

function updateWantedLevel(state, dt) {
  const old = policeAdvancedState.wanted;
  const heat = policeAdvancedState.heat;

  let level = 0;
  if (heat > 25) level = 1;
  if (heat > 50) level = 2;
  if (heat > 78) level = 3;
  if (heat > 108) level = 4;
  if (heat > 138) level = 5;

  policeAdvancedState.wanted = level;

  if (level > 0) {
    policeAdvancedState.pursuitTimer += dt;
    if (policeAdvancedState.escapeTimer <= 0) policeAdvancedState.escapeTimer = 12 + level * 4;
    document.body.classList.add("wanted-active");
  } else {
    document.body.classList.remove("wanted-active");
  }

  if (level > old) {
    window.showToast?.("Nivel de búsqueda " + level);
    spawnBackupIfNeeded(state);
  }
}

function spawnBackupIfNeeded(state) {
  const desired = Math.min(7, policeAdvancedState.wanted + 1);
  while (policeAdvancedState.backupCars.length < desired) {
    const car = createPoliceBackup();
    const angle = Math.random() * Math.PI * 2;
    const dist = 42 + Math.random() * 30;
    car.position.set(
      state.car.position.x + Math.sin(angle) * dist,
      0,
      state.car.position.z + Math.cos(angle) * dist
    );
    state.scene.add(car);
    policeAdvancedState.backupCars.push(car);
  }
}

function createPoliceBackup() {
  const group = new THREE.Group();
  group.name = "police_backup_car";

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.62, 3.25),
    new THREE.MeshStandardMaterial({ color: 0x0b1020, metalness: 0.25, roughness: 0.42 })
  );
  body.position.y = 0.45;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.5, 1.3),
    new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.15, roughness: 0.3 })
  );
  cabin.position.set(0, 0.95, -0.2);
  group.add(cabin);

  const lightBar = new THREE.Group();
  const red = new THREE.PointLight(0xff2233, 1.7, 12);
  const blue = new THREE.PointLight(0x2288ff, 1.7, 12);
  red.position.set(-0.45, 1.35, -0.25);
  blue.position.set(0.45, 1.35, -0.25);
  lightBar.add(red, blue);
  group.add(lightBar);

  const barMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.12, 0.25),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  barMesh.position.set(0, 1.34, -0.25);
  group.add(barMesh);

  group.userData.speed = 0.75 + Math.random() * 0.28;
  group.userData.red = red;
  group.userData.blue = blue;
  return group;
}

function updateBackupCars(state, dt) {
  const wanted = policeAdvancedState.wanted;
  const t = performance.now() / 1000;

  for (let i = policeAdvancedState.backupCars.length - 1; i >= 0; i--) {
    const car = policeAdvancedState.backupCars[i];

    if (wanted <= 0) {
      car.userData.fade = (car.userData.fade || 1) - dt;
      if (car.userData.fade <= 0) {
        state.scene.remove(car);
        policeAdvancedState.backupCars.splice(i, 1);
      }
      continue;
    }

    const target = state.car.position.clone();
    const dir = target.sub(car.position);
    const dist = dir.length();

    if (dist > 0.1) {
      dir.normalize();
      const speed = car.userData.speed * (1 + wanted * 0.16);
      car.position.addScaledVector(dir, dt * speed * 13);
      car.rotation.y = Math.atan2(dir.x, dir.z);
    }

    car.userData.red.intensity = Math.sin(t * 12 + i) > 0 ? 2.1 : 0.35;
    car.userData.blue.intensity = Math.sin(t * 12 + i) <= 0 ? 2.1 : 0.35;

    if (dist < 4.2 && Math.abs(state.speed || 0) > 0.28) {
      state.damage = Math.min(100, (state.damage || 0) + dt * (5 + wanted * 1.4));
      policeAdvancedState.heat += dt * 4;
    }

    if (dist > 165) {
      state.scene.remove(car);
      policeAdvancedState.backupCars.splice(i, 1);
    }
  }

  if (wanted > 0) spawnBackupIfNeeded(state);
}

function updateEscape(state, dt) {
  if (policeAdvancedState.wanted <= 0) return;

  const nearest = nearestPoliceDistance(state);
  const slow = Math.abs(state.speed || 0) < 0.55;

  if (nearest > 42 && slow) {
    policeAdvancedState.escapeTimer -= dt;
  } else {
    policeAdvancedState.escapeTimer = Math.min(24, policeAdvancedState.escapeTimer + dt * 0.8);
  }

  if (policeAdvancedState.escapeTimer <= 0) {
    rewardEscape(state);
  }
}

function rewardEscape(state) {
  const level = policeAdvancedState.wanted;
  const seconds = Math.floor(policeAdvancedState.pursuitTimer);
  const coins = Math.min(900, 120 * level + seconds * 4);
  const xp = Math.min(450, 70 * level + seconds * 2);

  addCoins(state, coins);
  addXP(state, xp);
  addStat(state, "policeEscapes", 1);
  addStat(state, "chases", 1);

  policeAdvancedState.data.escapes += 1;
  policeAdvancedState.data.bestWanted = Math.max(policeAdvancedState.data.bestWanted, level);
  policeAdvancedState.data.longestPursuit = Math.max(policeAdvancedState.data.longestPursuit, seconds);
  saveData();

  policeAdvancedState.wanted = 0;
  policeAdvancedState.heat = 0;
  policeAdvancedState.escapeTimer = 0;
  policeAdvancedState.pursuitTimer = 0;
  policeAdvancedState.cooldown = 12;

  window.showToast?.("Escapaste: +" + coins + " monedas");
}

function nearestPoliceDistance(state) {
  if (!policeAdvancedState.backupCars.length) return 999;
  return Math.min(...policeAdvancedState.backupCars.map(car => car.position.distanceTo(state.car.position)));
}

function updateWantedHUD() {
  const hud = document.getElementById("hudWanted");
  const overlay = document.getElementById("wantedOverlay");
  const stars = document.getElementById("wantedStars");
  const text = document.getElementById("wantedText");

  const level = policeAdvancedState.wanted;

  if (hud) {
    hud.textContent = level > 0
      ? "★".repeat(level) + " · escapar " + Math.max(0, Math.ceil(policeAdvancedState.escapeTimer)) + "s"
      : "--";
  }

  if (!overlay || !stars || !text) return;

  if (level <= 0) {
    overlay.classList.add("hidden");
    return;
  }

  overlay.classList.remove("hidden");
  stars.textContent = "★".repeat(level) + "☆".repeat(5 - level);
  text.textContent = "Mantente lejos y baja velocidad para escapar";
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.escapes === "number" ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    escapes: 0,
    bestWanted: 0,
    longestPursuit: 0
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(policeAdvancedState.data));
}
