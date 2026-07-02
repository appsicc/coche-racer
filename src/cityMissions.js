import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { addCoins } from "./shop.js";
import { addXP, addStat, completeMission } from "./progress.js";
import { unlockAchievement } from "./achievements.js";

let missionMarkers = [];
let activeMission = null;

const MISSIONS = [
  {
    id: "delivery",
    name: "Entrega rápida",
    start: { x: -52, z: -22, label: "Garaje" },
    target: { x: 48, z: -90, label: "Distrito industrial" },
    rewardCoins: 120,
    rewardXP: 70,
    timeLimit: 55000
  },
  {
    id: "street_race",
    name: "Carrera callejera",
    start: { x: 42, z: -82, label: "Zona Sprint" },
    target: { x: -42, z: -82, label: "Zona Drift" },
    rewardCoins: 150,
    rewardXP: 90,
    timeLimit: 45000
  },
  {
    id: "drift",
    name: "Desafío drift",
    start: { x: -42, z: -82, label: "Zona Drift" },
    target: { x: -42, z: -82, label: "Zona Drift" },
    rewardCoins: 100,
    rewardXP: 80,
    targetScore: 100
  },
  {
    id: "police_escape",
    name: "Escape urbano",
    start: { x: 0, z: 10, label: "Zona Bonus" },
    target: { x: 0, z: 10, label: "Zona Bonus" },
    rewardCoins: 160,
    rewardXP: 100,
    surviveTime: 40000
  }
];

export function setupCityMissions(state) {
  state.cityMission = {
    active: null,
    progressText: "--",
    driftScore: 0,
    missionStartTime: 0
  };
}

export function createMissionMarkers(state) {
  clearMissionMarkers(state);

  const startMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: 0xff9900,
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.68
  });

  MISSIONS.forEach((mission, index) => {
    const marker = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.18, 48), startMat.clone());
    marker.position.set(mission.start.x, 0.26 + index * 0.02, mission.start.z);
    marker.name = "city_mission_marker_" + mission.id;
    marker.userData.cityMission = mission.id;

    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.12, 12, 48), startMat.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2;
    marker.add(ring);

    state.scene.add(marker);
    missionMarkers.push(marker);
  });
}

export function clearMissionMarkers(state) {
  missionMarkers.forEach(m => state.scene.remove(m));
  missionMarkers = [];
}

export function updateCityMissions(state, dt) {
  if (!state.cityMission || !state.car) return;

  missionMarkers.forEach(m => {
    m.rotation.y += dt * 0.9;
    m.scale.setScalar(1 + Math.sin(performance.now() * 0.004) * 0.04);
  });

  if (!activeMission) {
    checkMissionStart(state);
  } else {
    updateActiveMission(state, dt);
  }

  state.cityMission.active = activeMission;
}

function checkMissionStart(state) {
  for (const marker of missionMarkers) {
    const id = marker.userData.cityMission;
    const mission = MISSIONS.find(m => m.id === id);
    if (!mission) continue;

    const dist = Math.hypot(state.car.position.x - mission.start.x, state.car.position.z - mission.start.z);
    if (dist < 4.6) {
      startMission(state, mission);
      return;
    }
  }
}

function startMission(state, mission) {
  activeMission = {
    ...mission,
    startedAt: performance.now(),
    completed: false,
    driftScore: 0,
    lastAngle: state.car.rotation.y,
    lastProgress: 0
  };

  state.cityMission.missionStartTime = performance.now();
  state.cityMission.progressText = "Iniciada";
  state.objectiveText = mission.name;
  window.showToast?.("Misión iniciada: " + mission.name);
}

function updateActiveMission(state, dt) {
  const mission = activeMission;
  const elapsed = performance.now() - mission.startedAt;

  if (mission.id === "delivery" || mission.id === "street_race") {
    const dist = Math.hypot(state.car.position.x - mission.target.x, state.car.position.z - mission.target.z);
    const left = Math.max(0, mission.timeLimit - elapsed);
    state.cityMission.progressText = Math.ceil(left / 1000) + "s · destino " + Math.round(dist) + "m";

    if (dist < 5.2) {
      completeCityMission(state, mission);
      return;
    }

    if (left <= 0) {
      failCityMission(state, "Tiempo agotado");
      return;
    }
  }

  if (mission.id === "drift") {
    const turnAmount = Math.abs((state.car.rotation.y - mission.lastAngle) * 100);
    const speed = Math.abs(state.speed || 0);
    mission.driftScore += Math.min(3.5, turnAmount * speed * 0.12);
    mission.lastAngle = state.car.rotation.y;

    state.cityMission.progressText = Math.floor(mission.driftScore) + "/" + mission.targetScore + " drift";

    if (mission.driftScore >= mission.targetScore) {
      completeCityMission(state, mission);
      return;
    }

    if (elapsed > 60000) {
      failCityMission(state, "Drift fallido");
      return;
    }
  }

  if (mission.id === "police_escape") {
    const left = Math.max(0, mission.surviveTime - elapsed);
    state.cityMission.progressText = "Escapa " + Math.ceil(left / 1000) + "s";

    if (left <= 0) {
      completeCityMission(state, mission);
      return;
    }

    if ((state.damage || 0) >= 100) {
      failCityMission(state, "Te atraparon");
      return;
    }
  }
}

function completeCityMission(state, mission) {
  addCoins(state, mission.rewardCoins);
  addXP(state, mission.rewardXP);
  addStat(state, "cityMissions", 1);
  unlockAchievement(state, "urban_driver");
  state.objectiveText = "Misión completada";
  state.cityMission.progressText = "+" + mission.rewardCoins + " monedas";
  window.showToast?.("Misión completada: " + mission.name);
  activeMission = null;
}

function failCityMission(state, reason) {
  state.objectiveText = "Misión fallida";
  state.cityMission.progressText = reason;
  window.showToast?.("Misión fallida: " + reason);
  activeMission = null;
}
