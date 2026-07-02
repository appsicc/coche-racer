import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { getNearestTrackInfo, TRACK } from "./track.js";
import { getNitroMax } from "./shop.js";
import { getSteerMultiplier } from "./controlSettings.js";

export function resetPhysics(state) {
  state.speed = 0;
  state.velocityY = 0;
  state.drift = 0;
}

export function updateCarPhysics(state, controls, dt) {
  const car = state.car;
  const stats = state.carStats || { maxSpeed: 1.55, acceleration: 1.1, handling: 1.05 };
  if (!car) return;

  const accel = 1.05 * stats.acceleration;
  const brakePower = 1.8;
  const friction = 0.78;
  const reverseMax = -0.42;
  const nitroBoost = controls.nitro && state.nitro > 0 && state.speed > 0.25;
  const maxSpeed = stats.maxSpeed * (nitroBoost ? 1.42 : 1);

  if (controls.forward) {
    state.speed += accel * dt;
  }

  if (controls.brake) {
    state.speed -= brakePower * dt;
  }

  if (!controls.forward && !controls.brake) {
    state.speed = THREE.MathUtils.lerp(state.speed, 0, friction * dt);
  }

  if (nitroBoost) {
    state.speed += 1.35 * dt;
    state.nitro = Math.max(0, state.nitro - 28 * dt);
    state.audio?.nitro();
  } else {
    state.nitro = Math.min(getNitroMax(state), state.nitro + 5.5 * dt);
  }

  const trackInfo = getNearestTrackInfo(car.position);
  state.trackInfo = trackInfo;

  const offTrackPenalty = trackInfo.onTrack ? 1 : 0.55;
  state.speed = THREE.MathUtils.clamp(state.speed, reverseMax, maxSpeed * offTrackPenalty);

  if (!trackInfo.onTrack && state.speed > 0.35) {
    state.speed -= 1.25 * trackInfo.edgeAmount * dt;
  }

  const speedFactor = THREE.MathUtils.clamp(Math.abs(state.speed) / maxSpeed, 0, 1);
  const turnAmount = (controls.left ? 1 : 0) + (controls.right ? -1 : 0);
  const turnStrength = 1.85 * stats.handling * speedFactor * getSteerMultiplier();

  car.rotation.y += turnAmount * turnStrength * dt * Math.sign(state.speed || 1);

  const driftTarget = turnAmount !== 0 && speedFactor > 0.55 ? turnAmount * 0.18 : 0;
  state.drift = THREE.MathUtils.lerp(state.drift || 0, driftTarget, 4 * dt);

  const forward = new THREE.Vector3(Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y));
  car.position.x -= forward.x * state.speed;
  car.position.z -= forward.z * state.speed;

  // Si se sale mucho, empuja suavemente hacia el centro de la pista.
  if (trackInfo.distance > TRACK.halfWidth + 2.2) {
    car.position.x = THREE.MathUtils.lerp(car.position.x, trackInfo.center.x, 1.8 * dt);
    car.position.z = THREE.MathUtils.lerp(car.position.z, trackInfo.center.z, 1.8 * dt);
  }

  // inclinación visual y derrape
  car.rotation.z = THREE.MathUtils.lerp(car.rotation.z, -turnAmount * 0.08 * speedFactor, 5 * dt);
  car.rotation.x = THREE.MathUtils.lerp(car.rotation.x, nitroBoost ? -0.045 : 0, 3 * dt);

  // efecto de ligera suspensión
  car.position.y = 0.12 + Math.sin(performance.now() * 0.008) * 0.012 * speedFactor;
}
