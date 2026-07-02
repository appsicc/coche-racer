import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { getTrafficBudget, shouldSkipHeavyFrame } from "./performanceOptimizer.js";

export const intelligentTrafficState = {
  created: false,
  cars: [],
  enabled: true,
  timer: 0
};

const ROAD_LINES = [-76, -38, 0, 38, 76];
const COLORS = [0x2d9cff, 0xff4444, 0x44ff88, 0xffd166, 0xffffff, 0x9b5cff];

export function setupIntelligentTraffic(state) {
  if (intelligentTrafficState.created || !state.scene) return;

  for (let i = 0; i < 18; i++) {
    const car = createCivilianCar(i);
    resetCivilianCar(car, i);
    state.scene.add(car.group);
    intelligentTrafficState.cars.push(car);
  }

  intelligentTrafficState.created = true;
}

export function updateIntelligentTraffic(state, dt) {
  if (!intelligentTrafficState.created || !intelligentTrafficState.enabled) return;

  intelligentTrafficState.timer += dt;

  if (shouldSkipHeavyFrame()) return;
  const budget = getTrafficBudget(intelligentTrafficState.cars.length);
  for (let i = 0; i < intelligentTrafficState.cars.length; i++) {
    const car = intelligentTrafficState.cars[i];
    car.group.visible = i < budget;
    if (i < budget) updateCivilianCar(state, car, dt);
  }
}

function createCivilianCar(index) {
  const group = new THREE.Group();
  group.name = "civilian_traffic_car";

  const color = COLORS[index % COLORS.length];

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.55, 3.0),
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.25,
      roughness: 0.45
    })
  );
  body.position.y = 0.45;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.42, 1.25),
    new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.1,
      roughness: 0.25
    })
  );
  cabin.position.set(0, 0.92, -0.25);
  group.add(cabin);

  const frontLights = new THREE.PointLight(0xfff2b0, 0.5, 8);
  frontLights.position.set(0, 0.55, -1.65);
  group.add(frontLights);

  const brakeLight = new THREE.PointLight(0xff0000, 0.0, 7);
  brakeLight.position.set(0, 0.55, 1.65);
  group.add(brakeLight);

  for (const x of [-0.82, 0.82]) {
    for (const z of [-1.05, 1.05]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.18, 14),
        new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.55 })
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.25, z);
      group.add(wheel);
    }
  }

  return {
    group,
    direction: "x",
    lane: 0,
    sign: 1,
    speed: 0.45 + Math.random() * 0.35,
    targetSpeed: 0.45 + Math.random() * 0.35,
    brakeLight,
    waitTimer: 0
  };
}

function resetCivilianCar(car, index) {
  car.direction = Math.random() > 0.5 ? "x" : "z";
  car.lane = ROAD_LINES[index % ROAD_LINES.length] + (Math.random() > 0.5 ? 2.2 : -2.2);
  car.sign = Math.random() > 0.5 ? 1 : -1;
  car.speed = 0.35 + Math.random() * 0.35;
  car.targetSpeed = 0.45 + Math.random() * 0.55;

  if (car.direction === "x") {
    car.group.position.set(-car.sign * (115 + Math.random() * 50), 0, car.lane);
    car.group.rotation.y = car.sign > 0 ? -Math.PI / 2 : Math.PI / 2;
  } else {
    car.group.position.set(car.lane, 0, -car.sign * (115 + Math.random() * 50));
    car.group.rotation.y = car.sign > 0 ? 0 : Math.PI;
  }
}

function updateCivilianCar(state, car, dt) {
  const shouldBrake = shouldCarBrake(state, car);
  const target = shouldBrake ? 0 : car.targetSpeed;

  car.speed = THREE.MathUtils.lerp(car.speed, target, shouldBrake ? 4.5 * dt : 0.9 * dt);
  car.brakeLight.intensity = shouldBrake ? 1.6 : 0.15;

  const move = car.speed * car.sign * dt * 18;

  if (car.direction === "x") {
    car.group.position.x += move;
    car.group.position.z = THREE.MathUtils.lerp(car.group.position.z, car.lane, 3 * dt);
  } else {
    car.group.position.z += move;
    car.group.position.x = THREE.MathUtils.lerp(car.group.position.x, car.lane, 3 * dt);
  }

  avoidPlayer(state, car, dt);

  if (Math.abs(car.group.position.x) > 145 || Math.abs(car.group.position.z) > 145) {
    resetCivilianCar(car, Math.floor(Math.random() * 99));
  }
}

function shouldCarBrake(state, car) {
  if (!state.car) return false;

  const distPlayer = car.group.position.distanceTo(state.car.position);
  if (distPlayer < 9) return true;

  const nextIntersection = getNextIntersection(car);
  if (!nextIntersection) return false;

  const distanceToIntersection = car.group.position.distanceTo(nextIntersection);
  if (distanceToIntersection > 10) return false;

  return isRedLightForCar(car, nextIntersection);
}

function getNextIntersection(car) {
  if (car.direction === "x") {
    const ahead = ROAD_LINES
      .map(x => new THREE.Vector3(x, 0, car.lane))
      .filter(p => car.sign > 0 ? p.x > car.group.position.x : p.x < car.group.position.x)
      .sort((a, b) => car.sign > 0 ? a.x - b.x : b.x - a.x)[0];
    return ahead || null;
  }

  const ahead = ROAD_LINES
    .map(z => new THREE.Vector3(car.lane, 0, z))
    .filter(p => car.sign > 0 ? p.z > car.group.position.z : p.z < car.group.position.z)
    .sort((a, b) => car.sign > 0 ? a.z - b.z : b.z - a.z)[0];

  return ahead || null;
}

function isRedLightForCar(car, point) {
  const cycle = (performance.now() / 1000 + Math.abs(point.x + point.z) * 0.03) % 12;

  // X direction gets green first half, Z direction gets green second half.
  if (car.direction === "x") {
    return cycle >= 5 && cycle < 12;
  }

  return cycle < 7;
}

function avoidPlayer(state, car, dt) {
  if (!state.car) return;

  const dist = car.group.position.distanceTo(state.car.position);
  if (dist > 7 || dist < 0.01) return;

  const away = car.group.position.clone().sub(state.car.position).normalize();
  car.group.position.addScaledVector(away, (7 - dist) * dt * 1.8);

  // Small damage if player hits civilian traffic.
  if (dist < 3.0 && Math.abs(state.speed || 0) > 0.35) {
    state.damage = Math.min(100, (state.damage || 0) + dt * 9);
  }
}
