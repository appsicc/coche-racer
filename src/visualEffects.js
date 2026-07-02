import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { getEffectBudget, shouldSkipHeavyFrame } from "./performanceOptimizer.js";

export const effectsState = {
  skidMarks: [],
  sparks: [],
  smoke: [],
  nitroFlames: [],
  lastDamage: 0,
  skidTimer: 0,
  smokeTimer: 0
};

export function setupVisualEffects(state) {
  state.visualEffects = effectsState;
}

export function updateVisualEffects(state, dt) {
  if (!state.scene || !state.car) return;

  if (shouldSkipHeavyFrame()) return;
  updateSmoke(state, dt);
  updateSkidMarks(state, dt);
  updateNitroFlame(state, dt);
  updateSparks(state, dt);
  detectImpactSparks(state);
}

function updateSmoke(state, dt) {
  effectsState.smokeTimer -= dt;

  const damaged = (state.damage || 0) > 35;
  const hardAcceleration = Math.abs(state.speed || 0) > 0.8;
  const shouldSmoke = damaged || hardAcceleration;

  if (shouldSmoke && effectsState.smokeTimer <= 0) {
    effectsState.smokeTimer = damaged ? 0.055 : 0.11;
    spawnSmoke(state, damaged);
  }

  for (let i = effectsState.smoke.length - 1; i >= 0; i--) {
    const puff = effectsState.smoke[i];
    puff.life -= dt;
    puff.mesh.position.y += dt * 1.2;
    puff.mesh.position.x += puff.vel.x * dt;
    puff.mesh.position.z += puff.vel.z * dt;
    puff.mesh.scale.multiplyScalar(1 + dt * 1.15);
    puff.mesh.material.opacity = Math.max(0, puff.life / puff.maxLife * 0.34);

    if (puff.life <= 0) {
      state.scene.remove(puff.mesh);
      effectsState.smoke.splice(i, 1);
    }
  }
}

function spawnSmoke(state, dark) {
  const geo = new THREE.SphereGeometry(0.35 + Math.random() * 0.22, 8, 8);
  const mat = new THREE.MeshBasicMaterial({
    color: dark ? 0x222222 : 0xb7c4d3,
    transparent: true,
    opacity: dark ? 0.38 : 0.24,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geo, mat);
  const back = getCarBackPosition(state, 1.8);
  mesh.position.copy(back);
  mesh.position.y += 0.45 + Math.random() * 0.25;

  state.scene.add(mesh);

  effectsState.smoke.push({
    mesh,
    vel: new THREE.Vector3((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8),
    life: dark ? 1.4 : 0.7,
    maxLife: dark ? 1.4 : 0.7
  });

  if (effectsState.smoke.length > getEffectBudget(70)) {
    const old = effectsState.smoke.shift();
    state.scene.remove(old.mesh);
  }
}

function updateSkidMarks(state, dt) {
  effectsState.skidTimer -= dt;

  const controls = state.controls || {};
  const turning = Math.abs(controls.steer || 0) > 0.55 || controls.left || controls.right;
  const braking = controls.brake || controls.down || controls.reverse;
  const speed = Math.abs(state.speed || 0);

  if ((turning || braking) && speed > 0.75 && effectsState.skidTimer <= 0) {
    effectsState.skidTimer = 0.075;
    spawnSkidMark(state, -0.55);
    spawnSkidMark(state, 0.55);
  }

  for (let i = effectsState.skidMarks.length - 1; i >= 0; i--) {
    const mark = effectsState.skidMarks[i];
    mark.life -= dt;
    mark.mesh.material.opacity = Math.max(0, mark.life / mark.maxLife * 0.36);

    if (mark.life <= 0) {
      state.scene.remove(mark.mesh);
      effectsState.skidMarks.splice(i, 1);
    }
  }
}

function spawnSkidMark(state, side) {
  const geo = new THREE.PlaneGeometry(0.22, 1.65);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x050505,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geo, mat);
  const pos = getCarBackPosition(state, 1.05);
  const right = new THREE.Vector3(Math.cos(state.car.rotation.y), 0, -Math.sin(state.car.rotation.y));

  mesh.position.copy(pos).add(right.multiplyScalar(side));
  mesh.position.y = 0.025;
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = -state.car.rotation.y;

  state.scene.add(mesh);

  effectsState.skidMarks.push({
    mesh,
    life: 5.5,
    maxLife: 5.5
  });

  if (effectsState.skidMarks.length > getEffectBudget(90)) {
    const old = effectsState.skidMarks.shift();
    state.scene.remove(old.mesh);
  }
}

function updateNitroFlame(state, dt) {
  const controls = state.controls || {};
  const nitroActive = (controls.nitro || controls.boost || controls.space) && (state.nitro || 0) > 0 && Math.abs(state.speed || 0) > 0.25;

  if (nitroActive) {
    spawnNitroFlame(state);
  }

  for (let i = effectsState.nitroFlames.length - 1; i >= 0; i--) {
    const flame = effectsState.nitroFlames[i];
    flame.life -= dt;
    flame.mesh.scale.multiplyScalar(1 + dt * 2.8);
    flame.mesh.material.opacity = Math.max(0, flame.life / flame.maxLife * 0.85);

    if (flame.life <= 0) {
      state.scene.remove(flame.mesh);
      effectsState.nitroFlames.splice(i, 1);
    }
  }
}

function spawnNitroFlame(state) {
  if (effectsState.nitroFlames.length > getEffectBudget(18)) return;

  const geo = new THREE.ConeGeometry(0.22, 1.1, 10);
  const mat = new THREE.MeshBasicMaterial({
    color: Math.random() > 0.5 ? 0x00d4ff : 0xff33cc,
    transparent: true,
    opacity: 0.75,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geo, mat);
  const back = getCarBackPosition(state, 1.9);
  mesh.position.copy(back);
  mesh.position.y += 0.25;
  mesh.rotation.x = Math.PI / 2;
  mesh.rotation.z = -state.car.rotation.y + Math.PI;

  state.scene.add(mesh);

  effectsState.nitroFlames.push({
    mesh,
    life: 0.16,
    maxLife: 0.16
  });
}

function detectImpactSparks(state) {
  const damage = state.damage || 0;
  if (damage > effectsState.lastDamage + 2.5) {
    spawnSparks(state, 16 + Math.round((damage - effectsState.lastDamage) * 1.2));
  }
  effectsState.lastDamage = damage;
}

function spawnSparks(state, count = 18) {
  for (let i = 0; i < count; i++) {
    const geo = new THREE.SphereGeometry(0.055 + Math.random() * 0.035, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.3 ? 0xffd166 : 0xff5500,
      transparent: true,
      opacity: 1
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(state.car.position);
    mesh.position.y += 0.45 + Math.random() * 0.5;
    state.scene.add(mesh);

    effectsState.sparks.push({
      mesh,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 3.5,
        (Math.random() - 0.5) * 8
      ),
      life: 0.55 + Math.random() * 0.25,
      maxLife: 0.75
    });
  }
}

function updateSparks(state, dt) {
  for (let i = effectsState.sparks.length - 1; i >= 0; i--) {
    const spark = effectsState.sparks[i];
    spark.life -= dt;
    spark.vel.y -= 6.5 * dt;
    spark.mesh.position.addScaledVector(spark.vel, dt);
    spark.mesh.material.opacity = Math.max(0, spark.life / spark.maxLife);

    if (spark.life <= 0 || spark.mesh.position.y < 0) {
      state.scene.remove(spark.mesh);
      effectsState.sparks.splice(i, 1);
    }
  }
}

function getCarBackPosition(state, distance) {
  const forward = new THREE.Vector3(Math.sin(state.car.rotation.y), 0, Math.cos(state.car.rotation.y));
  return state.car.position.clone().addScaledVector(forward, distance);
}
