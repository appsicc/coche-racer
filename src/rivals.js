import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { createPlaceholderCar } from "./car.js";
import { getTrackPoint, getTrackAngle, getStartPositionForLane } from "./track.js";

const RIVAL_COUNT = 3;

export function setupRivals(state) {
  state.rivals = [];
}

export function createRivals(state) {
  clearRivals(state);
  const colors = [0xff8a00, 0x33ff88, 0xff33cc];
  const names = ["Rival Naranja", "Rival Verde", "Rival Rosa"];

  for (let i = 0; i < RIVAL_COUNT; i++) {
    const rival = createPlaceholderCar();
    rival.scale.set(0.92, 0.92, 0.92);
    recolorRival(rival, colors[i]);
    const start = getStartPositionForLane(i - 1);
    rival.position.set(start.x, 0.12, start.z + i * 1.8);
    rival.rotation.y = Math.PI - start.angle;
    rival.userData.racer = {
      name: names[i],
      progress: 0,
      lap: 1,
      checkpointIndex: 0,
      speed: 1.08 + i * 0.05,
      offset: (i - 1) * 2.2,
      finished: false,
      finishTime: 0
    };
    state.scene.add(rival);
    state.rivals.push(rival);
  }
}

export function clearRivals(state) {
  if (!state.rivals) state.rivals = [];
  state.rivals.forEach(r => state.scene.remove(r));
  state.rivals.length = 0;
}

function recolorRival(rival, color) {
  rival.traverse(obj => {
    if (!obj.isMesh || !obj.material) return;
    if (obj.material.emissive) {
      obj.material = obj.material.clone();
      obj.material.color.setHex(color);
      obj.material.emissive.setHex(color);
      obj.material.emissiveIntensity = 1.8;
    }
  });
}

export function updateRivals(state, dt) {
  if (!state.rivals || !state.race || state.race.finished) return;

  for (const rival of state.rivals) {
    const r = rival.userData.racer;
    if (r.finished) continue;

    // IA simple: sigue el trazado curvo real usando el parámetro t del circuito.
    const speedBoost = 1 + Math.sin(performance.now() * 0.001 + r.offset) * 0.04;
    r.progress += r.speed * speedBoost * dt * 0.095;

    if (r.progress >= 1) {
      r.progress = 0;
      r.lap++;
      if (r.lap > state.race.totalLaps) {
        r.finished = true;
        r.finishTime = state.race.elapsed + Math.random() * 2200;
      }
    }

    const p = getTrackPoint(r.progress);
    const angle = getTrackAngle(r.progress);
    const laneWave = Math.sin(r.progress * Math.PI * 8 + r.offset) * 0.7 + r.offset;
    const x = p.x + Math.cos(angle) * laneWave;
    const z = p.z - Math.sin(angle) * laneWave;

    rival.position.x = THREE.MathUtils.lerp(rival.position.x, x, 0.09);
    rival.position.z = THREE.MathUtils.lerp(rival.position.z, z, 0.09);
    rival.rotation.y = Math.PI - angle;
    rival.rotation.z = -Math.sin(r.progress * Math.PI * 8) * 0.04;
  }
}

export function calculatePosition(state) {
  if (!state.race || !state.car) return 1;

  const playerProgress = getPlayerRaceProgress(state);
  let position = 1;

  for (const rival of state.rivals || []) {
    const r = rival.userData.racer;
    const rivalProgress = (Math.min(r.lap, state.race.totalLaps + 1) - 1) + r.progress;
    if (rivalProgress > playerProgress) position++;
  }

  state.race.position = position;
  return position;
}

export function getPlayerRaceProgress(state) {
  if (!state.race || !state.car) return 0;
  const lapBase = (Math.min(state.race.lap, state.race.totalLaps + 1) - 1);
  const trackProgress = state.trackInfo ? state.trackInfo.t : THREE.MathUtils.clamp(-state.car.position.z + 6, 0, 165) / 165;
  return lapBase + trackProgress;
}
