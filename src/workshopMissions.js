import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { addCoins, spendCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

export const workshopMissions = {
  active: null,
  marker: null,
  coupons: Number(localStorage.getItem("workshopCoupons") || 0)
};

const MISSIONS = {
  parts: {
    title: "Entrega de piezas",
    description: "Lleva las piezas al punto marcado de la ciudad.",
    reward: 140,
    xp: 80,
    couponChance: 0.45,
    time: 95
  },
  repair: {
    title: "Reparación contrarreloj",
    description: "Conduce hasta el taller auxiliar antes de que acabe el tiempo.",
    reward: 110,
    xp: 70,
    couponChance: 0.65,
    time: 70
  }
};

export function setupWorkshopMissions(state) {
  workshopMissions.coupons = Number(localStorage.getItem("workshopCoupons") || 0);
}

export function setupWorkshopMissionsUI(state, showScreen) {
  document.getElementById("startPartsMission").onclick = () => startWorkshopMission(state, "parts", showScreen);
  document.getElementById("startRepairMission").onclick = () => startWorkshopMission(state, "repair", showScreen);
  document.getElementById("useWorkshopCoupon").onclick = () => useWorkshopCoupon(state);

  updateWorkshopMissionUI(state);
}

export function startWorkshopMission(state, type, showScreen) {
  if (workshopMissions.active) {
    window.showToast?.("Ya hay una misión de taller activa");
    return;
  }

  const config = MISSIONS[type];
  if (!config) return;

  if (!state.car) {
    showScreen(null);
  }

  const target = createTargetNearCity(state, type);

  workshopMissions.active = {
    type,
    title: config.title,
    reward: config.reward,
    xp: config.xp,
    couponChance: config.couponChance,
    timeLeft: config.time,
    target
  };

  createMissionMarker(state, target, type);

  state.gameMode = "free";
  state.paused = false;
  state.objectiveText = config.description;

  document.getElementById("hud").classList.remove("hidden");
  document.getElementById("mobileControls").classList.remove("hidden");
  document.getElementById("minimap").classList.remove("hidden");
  document.getElementById("hudMode").textContent = "Misión taller";

  updateWorkshopMissionUI(state);
  window.showToast?.(config.title + " iniciada");
}

export function updateWorkshopMissions(state, dt) {
  const mission = workshopMissions.active;
  const hud = document.getElementById("hudWorkshopMission");

  if (!mission || !state.car) {
    if (hud) hud.textContent = "--";
    return;
  }

  mission.timeLeft -= dt;

  const dist = state.car.position.distanceTo(mission.target);
  if (hud) hud.textContent = mission.title + " · " + Math.ceil(mission.timeLeft) + "s · " + Math.round(dist) + "m";

  if (workshopMissions.marker) {
    workshopMissions.marker.rotation.y += dt * 1.6;
    workshopMissions.marker.position.y = 0.7 + Math.sin(performance.now() * 0.004) * 0.12;
  }

  if (dist < 5.2) {
    completeWorkshopMission(state);
    return;
  }

  if (mission.timeLeft <= 0) {
    failWorkshopMission(state);
  }
}

export function clearWorkshopMission(state) {
  if (workshopMissions.marker && state.scene) {
    state.scene.remove(workshopMissions.marker);
  }

  workshopMissions.marker = null;
  workshopMissions.active = null;
  updateWorkshopMissionUI(state);
}

function completeWorkshopMission(state) {
  const mission = workshopMissions.active;
  if (!mission) return;

  addCoins(state, mission.reward);
  addXP(state, mission.xp);
  addStat(state, "workshopMissions", 1);

  let gotCoupon = Math.random() < mission.couponChance;
  if (gotCoupon) {
    workshopMissions.coupons += 1;
    localStorage.setItem("workshopCoupons", String(workshopMissions.coupons));
  }

  window.showToast?.("Misión completada: +" + mission.reward + " monedas" + (gotCoupon ? " + bono" : ""));
  clearWorkshopMission(state);
}

function failWorkshopMission(state) {
  window.showToast?.("Misión de taller fallida");
  clearWorkshopMission(state);
}

function useWorkshopCoupon(state) {
  if (workshopMissions.coupons <= 0) {
    window.showToast?.("No tienes bonos de taller");
    updateWorkshopMissionUI(state);
    return;
  }

  const damage = Math.round(state.damage || Number(localStorage.getItem("lastDamage") || 0));
  if (damage <= 0) {
    window.showToast?.("El coche ya está perfecto");
    return;
  }

  workshopMissions.coupons -= 1;
  localStorage.setItem("workshopCoupons", String(workshopMissions.coupons));

  const discountedCost = Math.max(0, Math.round(damage * 0.7));
  if (!spendCoins(state, discountedCost)) {
    workshopMissions.coupons += 1;
    localStorage.setItem("workshopCoupons", String(workshopMissions.coupons));
    window.showToast?.("No tienes monedas suficientes");
    return;
  }

  state.damage = Math.max(0, damage - 75);
  localStorage.setItem("lastDamage", String(Math.round(state.damage)));
  window.showToast?.("Bono usado: gran reparación aplicada");
  updateWorkshopMissionUI(state);
}

function createTargetNearCity(state, type) {
  const baseX = state.car?.position?.x || 0;
  const baseZ = state.car?.position?.z || 0;
  const angle = Math.random() * Math.PI * 2;
  const dist = type === "repair" ? 65 : 95;

  return new THREE.Vector3(
    baseX + Math.cos(angle) * dist,
    0.8,
    baseZ + Math.sin(angle) * dist
  );
}

function createMissionMarker(state, pos, type) {
  if (workshopMissions.marker) state.scene.remove(workshopMissions.marker);

  const group = new THREE.Group();

  const geo = new THREE.CylinderGeometry(2.3, 2.3, 0.22, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: type === "repair" ? 0x44ff88 : 0xffd166,
    emissive: type === "repair" ? 0x115522 : 0x553300,
    emissiveIntensity: 1.2
  });

  const base = new THREE.Mesh(geo, mat);
  base.position.y = 0.12;
  group.add(base);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 1.2, 2.0),
    new THREE.MeshStandardMaterial({
      color: type === "repair" ? 0x00d4ff : 0xff8a00,
      emissive: type === "repair" ? 0x004466 : 0x552200,
      emissiveIntensity: 0.8
    })
  );
  box.position.y = 1.1;
  group.add(box);

  group.position.copy(pos);
  state.scene.add(group);
  workshopMissions.marker = group;
}

function updateWorkshopMissionUI(state) {
  const text = document.getElementById("workshopMissionText");
  const coupons = document.getElementById("workshopCoupons");

  if (text) {
    text.textContent = workshopMissions.active
      ? workshopMissions.active.title + " activa · " + Math.ceil(workshopMissions.active.timeLeft) + "s"
      : "Sin misión activa.";
  }

  if (coupons) coupons.textContent = workshopMissions.coupons;
}
