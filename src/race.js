import * as THREE from "https://esm.sh/three@0.160.0";
import { getCheckpointsForTrack, getStartPositionForLane } from "./track.js";
import { addCoins } from "./shop.js";
import { addXP, addStat, completeMission } from "./progress.js";
import { unlockAchievement } from "./achievements.js";
import { updateResultStats } from "./resultStats.js";
import { recordRaceResult } from "./ranking.js";

const TOTAL_LAPS = 3;

export function setupRace(state) {
  state.race = {
    totalLaps: TOTAL_LAPS,
    lap: 1,
    checkpointIndex: 0,
    checkpointCount: 5,
    startTime: 0,
    elapsed: 0,
    finished: false,
    position: 1,
    bestKey: "",
    checkpoints: [],
    checkpointMeshes: []
  };
}

export function startRaceTimer(state) {
  const map = state.manifest.maps[state.selectedMapIndex];
  const car = state.manifest.cars[state.selectedCarIndex];
  state.race.lap = 1;
  state.race.checkpointIndex = 0;
  state.race.elapsed = 0;
  state.race.finished = false;
  state.race.startTime = performance.now();
  state.race.bestKey = `best_${map.id}_${car.id}`;
  createCheckpointMeshes(state);
}

export function updateRace(state) {
  if (!state.race || state.race.finished || !state.car) return;

  state.race.elapsed = performance.now() - state.race.startTime;

  const next = state.race.checkpoints[state.race.checkpointIndex];
  if (!next) return;

  const carPos = state.car.position;
  const distance = Math.hypot(carPos.x - next.x, carPos.z - next.z);

  if (distance < next.radius) {
    passCheckpoint(state);
  }

  updateCheckpointVisuals(state);
  updateMinimap(state);
}

function createCheckpointMeshes(state) {
  clearCheckpointMeshes(state);

  // Puntos longitudinales para el circuito actual. El coche avanza hacia Z negativo.
  state.race.checkpoints = getCheckpointsForTrack();

  const activeMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: 0xffaa00,
    emissiveIntensity: 1.8,
    transparent: true,
    opacity: 0.72
  });

  const inactiveMat = new THREE.MeshStandardMaterial({
    color: 0x00aaff,
    emissive: 0x005dff,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.28
  });

  state.race.checkpoints.forEach((cp, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(cp.radius, 0.08, 12, 80), index === 0 ? activeMat.clone() : inactiveMat.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.set(cp.x, 0.12, cp.z);
    ring.name = "checkpoint_ring_" + index;
    state.scene.add(ring);
    state.race.checkpointMeshes.push(ring);

    const gateLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.18), index === 0 ? activeMat.clone() : inactiveMat.clone());
    gateLeft.position.set(cp.x - cp.radius, 1.2, cp.z);
    state.scene.add(gateLeft);
    state.race.checkpointMeshes.push(gateLeft);

    const gateRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.18), index === 0 ? activeMat.clone() : inactiveMat.clone());
    gateRight.position.set(cp.x + cp.radius, 1.2, cp.z);
    state.scene.add(gateRight);
    state.race.checkpointMeshes.push(gateRight);
  });
}

function clearCheckpointMeshes(state) {
  if (!state.race?.checkpointMeshes) return;
  state.race.checkpointMeshes.forEach(mesh => state.scene.remove(mesh));
  state.race.checkpointMeshes = [];
}

function passCheckpoint(state) {
  state.race.checkpointIndex++;
  state.audio?.coin();

  if (state.race.checkpointIndex >= state.race.checkpointCount) {
    state.race.checkpointIndex = 0;
    state.race.lap++;

    // Reposiciona algunos objetivos para simular siguiente vuelta en el mismo tramo largo.
    if (state.car) {
      const start = getStartPositionForLane(0);
      state.car.position.x = start.x;
      state.car.position.z = start.z;
      state.car.rotation.y = Math.PI - start.angle;
      state.speed *= 0.75;
    }

    if (state.race.lap > state.race.totalLaps) {
      finishRace(state);
      return;
    }
  }
}

function finishRace(state) {
  state.race.finished = true;
  state.speed = 0;
  const elapsed = state.race.elapsed;
  const prev = Number(localStorage.getItem(state.race.bestKey) || 0);

  let best = prev;
  if (!prev || elapsed < prev) {
    best = elapsed;
    localStorage.setItem(state.race.bestKey, String(elapsed));
  }

  document.getElementById("resultTime").textContent = formatTime(elapsed);
  document.getElementById("resultBest").textContent = formatTime(best);
  document.getElementById("resultPosition").textContent = (state.race.position || 1) + "/4";
  const reward = Math.max(25, 120 - ((state.race.position || 1) - 1) * 25 + (state.coins || 0));
  addCoins(state, reward);
  addXP(state, 60);
  addStat(state, "races", 1);
  if ((state.race.position || 1) === 1) {
    addStat(state, "wins", 1);
    completeMission(state, "win_race");
  }
  completeMission(state, "race_finish");
  unlockAchievement(state, "first_race");
  if ((state.coins || 0) >= 25) completeMission(state, "collect_25");
  document.getElementById("resultReward").textContent = reward + " monedas";
  updateResultStats(state, { reward });
  recordRaceResult(state, {
    time: state.race.elapsed,
    position: state.race.position || 1,
    reward
  });
  document.getElementById("raceResult").classList.remove("hidden");
  state.audio?.button();
}

function updateCheckpointVisuals(state) {
  const activeIndex = state.race.checkpointIndex;

  state.race.checkpointMeshes.forEach((mesh, i) => {
    const cpIndex = Math.floor(i / 3);
    if (!mesh.material) return;
    if (cpIndex === activeIndex) {
      mesh.material.opacity = 0.76;
      mesh.material.emissiveIntensity = 1.8;
      mesh.scale.setScalar(1 + Math.sin(performance.now() * 0.006) * 0.025);
    } else {
      mesh.material.opacity = 0.24;
      mesh.material.emissiveIntensity = 0.7;
      mesh.scale.setScalar(1);
    }
  });
}

function updateMinimap(state) {
  const mini = document.getElementById("miniCar");
  if (!mini || !state.car) return;
  const progress = state.trackInfo ? state.trackInfo.t : THREE.MathUtils.clamp((-state.car.position.z) / 165, 0, 1);
  const top = 144 - progress * 124;
  const left = 58 + Math.sin(progress * Math.PI * 2) * 26;
  mini.style.top = top + "px";
  mini.style.left = left + "px";
}

export function updateRaceHUD(state) {
  if (!state.race) return;
  document.getElementById("hudLap").textContent = Math.min(state.race.lap, state.race.totalLaps);
  document.getElementById("hudTotalLaps").textContent = state.race.totalLaps;
  document.getElementById("hudCheckpoint").textContent = state.race.checkpointIndex;
  document.getElementById("hudTotalCheckpoints").textContent = state.race.checkpointCount;
  document.getElementById("hudTimer").textContent = formatTime(state.race.elapsed || 0);
  const best = Number(localStorage.getItem(state.race.bestKey || "") || 0);
  document.getElementById("hudBest").textContent = best ? formatTime(best) : "--:--.---";
}

export function hideRaceResult() {
  document.getElementById("raceResult").classList.add("hidden");
}

export function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const milli = total % 1000;
  return String(minutes).padStart(2, "0") + ":" +
    String(seconds).padStart(2, "0") + "." +
    String(milli).padStart(3, "0");
}
