import * as THREE from "https://esm.sh/three@0.160.0";
import { createPlaceholderCar } from "./car.js";
import { getStartPositionForLane, getNearestTrackInfo } from "./track.js";
import { addCoins } from "./shop.js";
import { addXP } from "./progress.js";
import { recordDuelResult } from "./ranking.js";

export const multiplayer = {
  enabled: false,
  p2: null,
  p2Speed: 0,
  p2Nitro: 100,
  p2Progress: 0,
  p1Progress: 0,
  winner: null,
  keys: {}
};

export function setupLocalMultiplayer(state) {
  window.addEventListener("keydown", e => {
    multiplayer.keys[e.code] = true;
  });

  window.addEventListener("keyup", e => {
    multiplayer.keys[e.code] = false;
  });
}

export function startDuelMode(state) {
  multiplayer.enabled = true;
  multiplayer.winner = null;
  multiplayer.p2Speed = 0;
  multiplayer.p2Nitro = 100;
  multiplayer.p1Progress = 0;
  multiplayer.p2Progress = 0;

  if (multiplayer.p2) state.scene.remove(multiplayer.p2);

  const p2 = createPlaceholderCar();
  p2.scale.set(0.92, 0.92, 0.92);
  recolorP2(p2);

  const start1 = getStartPositionForLane(-0.8);
  const start2 = getStartPositionForLane(0.8);

  if (state.car) {
    state.car.position.set(start1.x, 0.12, start1.z);
    state.car.rotation.set(0, Math.PI - start1.angle, 0);
  }

  p2.position.set(start2.x, 0.12, start2.z);
  p2.rotation.set(0, Math.PI - start2.angle, 0);

  state.scene.add(p2);
  multiplayer.p2 = p2;

  state.gameMode = "duel";
  state.paused = false;
  state.objectiveText = "Duelo local: llega al final";
  document.getElementById("hudMode").textContent = "Duelo local";
  document.getElementById("hudP2").textContent = "Listo";
}

export function stopDuelMode(state) {
  multiplayer.enabled = false;
  if (multiplayer.p2) {
    state.scene.remove(multiplayer.p2);
    multiplayer.p2 = null;
  }
}

export function updateLocalMultiplayer(state, dt) {
  if (!multiplayer.enabled || !multiplayer.p2 || !state.car || multiplayer.winner) return;

  updateP2Physics(state, dt);
  updateProgress(state);

  const hud = document.getElementById("hudP2");
  if (hud) {
    hud.textContent = Math.round(multiplayer.p2Progress * 100) + "% · Nitro " + Math.round(multiplayer.p2Nitro);
  }

  if (multiplayer.p1Progress >= 0.98) {
    finishDuel(state, "Jugador 1");
  } else if (multiplayer.p2Progress >= 0.98) {
    finishDuel(state, "Jugador 2");
  }
}

function updateP2Physics(state, dt) {
  const car = multiplayer.p2;
  const keys = multiplayer.keys;

  const forward = keys["ArrowUp"];
  const brake = keys["ArrowDown"];
  const left = keys["ArrowLeft"];
  const right = keys["ArrowRight"];
  const nitro = keys["ShiftRight"] && multiplayer.p2Nitro > 0 && multiplayer.p2Speed > 0.25;

  const accel = 1.05;
  const maxSpeed = nitro ? 1.8 : 1.35;

  if (forward) multiplayer.p2Speed += accel * dt;
  if (brake) multiplayer.p2Speed -= 1.7 * dt;

  if (!forward && !brake) {
    multiplayer.p2Speed = THREE.MathUtils.lerp(multiplayer.p2Speed, 0, 0.85 * dt);
  }

  if (nitro) {
    multiplayer.p2Speed += 1.25 * dt;
    multiplayer.p2Nitro = Math.max(0, multiplayer.p2Nitro - 25 * dt);
  } else {
    multiplayer.p2Nitro = Math.min(100, multiplayer.p2Nitro + 5 * dt);
  }

  const trackInfo = getNearestTrackInfo(car.position);
  const offTrackPenalty = trackInfo.onTrack ? 1 : 0.55;
  multiplayer.p2Speed = THREE.MathUtils.clamp(multiplayer.p2Speed, -0.35, maxSpeed * offTrackPenalty);

  const speedFactor = THREE.MathUtils.clamp(Math.abs(multiplayer.p2Speed) / maxSpeed, 0, 1);
  const turn = (left ? 1 : 0) + (right ? -1 : 0);
  car.rotation.y += turn * 1.65 * speedFactor * dt * Math.sign(multiplayer.p2Speed || 1);

  const forwardVec = new THREE.Vector3(Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y));
  car.position.x -= forwardVec.x * multiplayer.p2Speed;
  car.position.z -= forwardVec.z * multiplayer.p2Speed;

  if (trackInfo.distance > 7.8) {
    car.position.x = THREE.MathUtils.lerp(car.position.x, trackInfo.center.x, 1.6 * dt);
    car.position.z = THREE.MathUtils.lerp(car.position.z, trackInfo.center.z, 1.6 * dt);
  }

  car.rotation.z = THREE.MathUtils.lerp(car.rotation.z, -turn * 0.08 * speedFactor, 5 * dt);
}

function updateProgress(state) {
  const p1 = state.trackInfo?.t || 0;
  const p2 = getNearestTrackInfo(multiplayer.p2.position).t || 0;
  multiplayer.p1Progress = p1;
  multiplayer.p2Progress = p2;
}

function finishDuel(state, winner) {
  multiplayer.winner = winner;
  state.paused = true;

  const reward = winner === "Jugador 1" ? 180 : 60;
  addCoins(state, reward);
  addXP(state, winner === "Jugador 1" ? 100 : 35);

  document.getElementById("resultTime").textContent = "Duelo";
  document.getElementById("resultBest").textContent = "--:--.---";
  document.getElementById("resultPosition").textContent = winner;
  document.getElementById("resultReward").textContent = reward + " monedas";
  document.getElementById("resultCoins").textContent = state.coins || 0;
  document.getElementById("resultDamage").textContent = Math.round(state.damage || 0) + "%";
  document.getElementById("raceResult").classList.remove("hidden");

  recordDuelResult(state, { winner, reward });
  window.showToast?.("Ganador: " + winner);
}

function recolorP2(car) {
  car.traverse(obj => {
    if (!obj.isMesh || !obj.material) return;
    obj.material = obj.material.clone();
    if (obj.material.color) obj.material.color.setHex(0xff8a00);
    if (obj.material.emissive) {
      obj.material.emissive.setHex(0xff5500);
      obj.material.emissiveIntensity = 1.5;
    }
  });
}
