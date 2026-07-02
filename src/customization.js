import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { unlockAchievement } from "./achievements.js";

const PAINTS = {
  red: 0xd41820,
  blue: 0x1260d8,
  yellow: 0xf4c21f,
  black: 0x050507,
  white: 0xe8edf2,
  purple: 0x8a22e8
};

const NEONS = {
  none: null,
  cyan: 0x00eaff,
  pink: 0xff33cc,
  orange: 0xff8a00,
  green: 0x33ff88
};

export function setupCustomization(state) {
  state.customizations = loadCustomizations();
}

export function getCustomizationKey(state) {
  return state.manifest.cars[state.selectedCarIndex]?.id || "default_car";
}

export function getCurrentCustomization(state) {
  const key = getCustomizationKey(state);
  if (!state.customizations[key]) {
    state.customizations[key] = {
      paint: "red",
      neon: "cyan",
      spoiler: "none"
    };
  }
  return state.customizations[key];
}

export function setCustomization(state, type, value) {
  const current = getCurrentCustomization(state);
  current[type] = value;
  applyCustomizationToCar(state);
  updateCustomizationUI(state);
}

export function saveCustomization(state) {
  localStorage.setItem("carCustomizations", JSON.stringify(state.customizations));
  unlockAchievement(state, "custom_ride");
  window.showToast?.("Estilo guardado");
}

export function applyCustomizationToCar(state) {
  if (!state.car) return;
  const custom = getCurrentCustomization(state);
  const paintColor = PAINTS[custom.paint] ?? PAINTS.red;

  state.car.traverse(obj => {
    if (!obj.isMesh || !obj.material) return;

    const name = (obj.name || "").toLowerCase();
    const isWheel = name.includes("wheel") || name.includes("tire");
    const isGlass = name.includes("glass") || name.includes("window");

    obj.material = obj.material.clone();

    if (!isWheel && !isGlass) {
      obj.material.color?.setHex(paintColor);
      obj.material.metalness = Math.max(obj.material.metalness || 0.25, 0.45);
      obj.material.roughness = Math.min(obj.material.roughness || 0.55, 0.38);
    }
  });

  removeCustomParts(state.car);
  addNeon(state.car, custom.neon);
  addSpoiler(state.car, custom.spoiler);
}

function addNeon(car, neon) {
  const color = NEONS[neon];
  if (!color) return;

  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 2.4,
    transparent: true,
    opacity: 0.9
  });

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 3.6), mat);
  left.name = "custom_part_neon_left";
  left.position.set(-1.18, 0.12, 0);
  car.add(left);

  const right = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 3.6), mat);
  right.name = "custom_part_neon_right";
  right.position.set(1.18, 0.12, 0);
  car.add(right);

  const light = new THREE.PointLight(color, 1.6, 6);
  light.name = "custom_part_neon_light";
  light.position.set(0, 0.3, 0);
  car.add(light);
}

function addSpoiler(car, spoiler) {
  if (spoiler === "none") return;

  const mat = new THREE.MeshStandardMaterial({
    color: 0x101014,
    roughness: 0.28,
    metalness: 0.65
  });

  const width = spoiler === "racing" ? 1.85 : 1.35;
  const height = spoiler === "racing" ? 0.58 : 0.38;

  const wing = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.28), mat);
  wing.name = "custom_part_spoiler_wing";
  wing.position.set(0, 1.08 + height * 0.12, -2.05);
  car.add(wing);

  const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, height, 0.09), mat);
  l.name = "custom_part_spoiler_left";
  l.position.set(-width * 0.38, 0.78, -2.02);
  car.add(l);

  const r = new THREE.Mesh(new THREE.BoxGeometry(0.07, height, 0.09), mat);
  r.name = "custom_part_spoiler_right";
  r.position.set(width * 0.38, 0.78, -2.02);
  car.add(r);
}

function removeCustomParts(car) {
  const toRemove = [];
  car.traverse(obj => {
    if (obj.name?.startsWith("custom_part_")) toRemove.push(obj);
  });
  toRemove.forEach(obj => obj.parent?.remove(obj));
}

export function setupCustomizationUI(state, showScreen) {
  document.getElementById("customBtn").onclick = () => {
    updateCustomizationUI(state);
    showScreen("customScreen");
  };

  document.querySelectorAll(".paintBtn").forEach(btn => {
    btn.onclick = () => setCustomization(state, "paint", btn.dataset.paint);
  });

  document.querySelectorAll(".neonBtn").forEach(btn => {
    btn.onclick = () => setCustomization(state, "neon", btn.dataset.neon);
  });

  document.querySelectorAll(".spoilerBtn").forEach(btn => {
    btn.onclick = () => setCustomization(state, "spoiler", btn.dataset.spoiler);
  });

  document.getElementById("saveCustom").onclick = () => saveCustomization(state);
  updateCustomizationUI(state);
}

export function updateCustomizationUI(state) {
  const car = state.manifest?.cars?.[state.selectedCarIndex];
  const current = getCurrentCustomization(state);

  const name = document.getElementById("customCarName");
  if (name) name.textContent = car?.name || "Coche";

  document.querySelectorAll(".paintBtn").forEach(btn => {
    btn.classList.toggle("active-custom", btn.dataset.paint === current.paint);
  });

  document.querySelectorAll(".neonBtn").forEach(btn => {
    btn.classList.toggle("active-custom", btn.dataset.neon === current.neon);
  });

  document.querySelectorAll(".spoilerBtn").forEach(btn => {
    btn.classList.toggle("active-custom", btn.dataset.spoiler === current.spoiler);
  });

  const summary = document.getElementById("customSummary");
  if (summary) {
    summary.textContent = `Color: ${current.paint} · Neón: ${current.neon} · Alerón: ${current.spoiler}`;
  }
}

function loadCustomizations() {
  try {
    return JSON.parse(localStorage.getItem("carCustomizations") || "{}");
  } catch {
    return {};
  }
}
