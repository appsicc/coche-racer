import * as THREE from "https://esm.sh/three@0.160.0";
import { createPlaceholderCar } from "./car.js";
import { getTrackPoint, getTrackAngle } from "./track.js";
import { getDamageMultiplier, addCoins } from "./shop.js";
import { addXP, addStat, completeMission } from "./progress.js";
import { vibrate } from "./controlSettings.js";
import { unlockAchievement } from "./achievements.js";
import { updateResultStats } from "./resultStats.js";

const TRAFFIC_COUNT = 8;
const POLICE_COUNT = 2;

export function setupTraffic(state) {
  state.traffic = [];
  state.police = [];
  state.damage = 0;
}

export function createTraffic(state) {
  clearTraffic(state);

  const colors = [0x3366ff, 0xffffff, 0xffcc00, 0x44ff88, 0xff44aa, 0x999999, 0xff6633, 0x22ddff];

  for (let i = 0; i < TRAFFIC_COUNT; i++) {
    const car = createPlaceholderCar();
    car.scale.set(0.72, 0.72, 0.72);
    recolor(car, colors[i % colors.length], 0.3);

    const t = (i / TRAFFIC_COUNT) * 0.95 + 0.03;
    const p = getTrackPoint(t % 1);
    const angle = getTrackAngle(t % 1);
    const lane = i % 2 === 0 ? -2.2 : 2.2;

    car.position.set(p.x + Math.cos(angle) * lane, 0.12, p.z - Math.sin(angle) * lane);
    car.rotation.y = Math.PI - angle;

    car.userData.traffic = {
      t: t % 1,
      speed: 0.055 + (i % 3) * 0.012,
      lane,
      hitCooldown: 0
    };

    state.scene.add(car);
    state.traffic.push(car);
  }
}

export function createPolice(state) {
  clearPolice(state);

  for (let i = 0; i < POLICE_COUNT; i++) {
    const car = createPlaceholderCar();
    car.scale.set(0.82, 0.82, 0.82);
    recolor(car, 0xff2222, 1.2);

    const p = getTrackPoint(0.01);
    const angle = getTrackAngle(0.01);
    car.position.set(p.x + (i ? 3 : -3), 0.12, p.z + 7 + i * 3);
    car.rotation.y = Math.PI - angle;
    car.userData.police = {
      t: 0.01,
      speed: 0.075 + i * 0.01,
      caughtCooldown: 0
    };

    state.scene.add(car);
    state.police.push(car);
  }
}

export function clearTraffic(state) {
  if (!state.traffic) state.traffic = [];
  state.traffic.forEach(c => state.scene.remove(c));
  state.traffic.length = 0;
}

export function clearPolice(state) {
  if (!state.police) state.police = [];
  state.police.forEach(c => state.scene.remove(c));
  state.police.length = 0;
}

export function updateTraffic(state, dt) {
  if (!state.traffic) return;

  for (const car of state.traffic) {
    const data = car.userData.traffic;
    data.t += data.speed * dt;
    if (data.t > 1) data.t -= 1;

    const p = getTrackPoint(data.t);
    const angle = getTrackAngle(data.t);
    const wobble = Math.sin(performance.now() * 0.001 + data.t * 10) * 0.18;
    const lane = data.lane + wobble;

    car.position.x = p.x + Math.cos(angle) * lane;
    car.position.z = p.z - Math.sin(angle) * lane;
    car.rotation.y = Math.PI - angle;

    data.hitCooldown = Math.max(0, data.hitCooldown - dt);
    if (state.car && data.hitCooldown <= 0 && car.position.distanceTo(state.car.position) < 1.35) {
      data.hitCooldown = 1.2;
      state.damage = Math.min(100, (state.damage || 0) + 12 * getDamageMultiplier(state));
      state.speed *= -0.25;
      state.audio?.crash();
      vibrate(90);
      vibrate(70);
    }
  }
}

export function updatePolice(state, dt) {
  if (!state.police || !state.car) return;

  for (const police of state.police) {
    const data = police.userData.police;
    const target = state.car.position.clone();

    const dir = target.sub(police.position);
    const dist = dir.length();
    dir.normalize();

    const chaseSpeed = 6.5 * dt + Math.min(Math.abs(state.speed), 2) * 0.018;
    police.position.add(dir.multiplyScalar(chaseSpeed));
    police.position.y = 0.12;

    const angle = Math.atan2(
      state.car.position.x - police.position.x,
      state.car.position.z - police.position.z
    );
    police.rotation.y = Math.PI - angle;

    data.caughtCooldown = Math.max(0, data.caughtCooldown - dt);
    if (dist < 1.55 && data.caughtCooldown <= 0) {
      data.caughtCooldown = 1.1;
      state.damage = Math.min(100, (state.damage || 0) + 18 * getDamageMultiplier(state));
      state.speed *= -0.45;
      state.audio?.crash();
      vibrate(70);
    }
  }
}

export function updateModeObjectives(state, dt) {
  if (!state.modeTimer) state.modeTimer = 0;
  if (state.gameMode === "free" || state.gameMode === "chase") {
    state.modeTimer += dt * 1000;
  }

  if (state.gameMode === "free") {
    state.objectiveText = `Conduce libre · ${Math.floor(state.modeTimer / 1000)}s`;
    if (state.coins >= 20) {
      state.objectiveText = "Objetivo cumplido: 20 monedas";
    }
  }

  if (state.gameMode === "chase") {
    const seconds = Math.floor(state.modeTimer / 1000);
    state.objectiveText = `Escapa ${seconds}s`;
    if (state.damage >= 100) {
      finishChase(state);
    }
  }

  if (state.damage >= 100 && state.gameMode !== "menu") {
    state.objectiveText = "Coche destruido";
  }
}

function finishChase(state) {
  state.speed = 0;
  const reward = Math.max(10, Math.floor(state.modeTimer / 1000) * 2 + state.coins);
  document.getElementById("resultTime").textContent = formatMs(state.modeTimer);
  document.getElementById("resultBest").textContent = "--:--.---";
  document.getElementById("resultPosition").textContent = "Persecución";
  addCoins(state, reward);
  addXP(state, Math.floor(reward / 2));
  addStat(state, "chases", 1);
  unlockAchievement(state, "chase_survivor");
  if (state.modeTimer >= 45000) completeMission(state, "chase_45");
  if ((state.coins || 0) >= 25) completeMission(state, "collect_25");
  document.getElementById("resultReward").textContent = reward + " monedas";
  updateResultStats(state, { reward });
  document.getElementById("raceResult").classList.remove("hidden");
  state.paused = true;
}

function recolor(car, color, emissiveIntensity = 0.6) {
  car.traverse(obj => {
    if (!obj.isMesh || !obj.material) return;
    obj.material = obj.material.clone();
    if (obj.material.color) obj.material.color.setHex(color);
    if (obj.material.emissive) {
      obj.material.emissive.setHex(color);
      obj.material.emissiveIntensity = emissiveIntensity;
    }
  });
}

function formatMs(ms) {
  const total = Math.floor(ms);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const milli = total % 1000;
  return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0") + "." + String(milli).padStart(3, "0");
}
