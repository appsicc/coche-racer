import * as THREE from "https://esm.sh/three@0.160.0";
import { shouldSkipHeavyFrame } from "./performanceOptimizer.js";

export const cityLifeState = {
  created: false,
  trafficLights: [],
  signs: [],
  decor: [],
  timer: 0
};

const INTERSECTIONS = [
  [-76, -76], [-38, -76], [0, -76], [38, -76], [76, -76],
  [-76, -38], [-38, -38], [0, -38], [38, -38], [76, -38],
  [-76, 0], [-38, 0], [0, 0], [38, 0], [76, 0],
  [-76, 38], [-38, 38], [0, 38], [38, 38], [76, 38],
  [-76, 76], [-38, 76], [0, 76], [38, 76], [76, 76]
];

const SIGN_POINTS = [
  [-92, -50, "DRIFT"], [84, 60, "BONUS"], [42, -30, "TALLER"],
  [-62, 82, "SPEED"], [6, -92, "GARAGE"], [94, -2, "CITY"],
  [-18, 56, "RACE"], [-96, 14, "NITRO"]
];

export function setupCityLife(state) {
  if (cityLifeState.created || !state.scene) return;
  createTrafficLights(state);
  createSigns(state);
  createStreetDecor(state);
  cityLifeState.created = true;
}

export function updateCityLife(state, dt) {
  if (!cityLifeState.created) return;
  cityLifeState.timer += dt;

  if (shouldSkipHeavyFrame()) return;
  updateTrafficLights(dt);
  animateDecor(dt);
}

function createTrafficLights(state) {
  INTERSECTIONS.forEach(([x, z], i) => {
    if (i % 2 === 0) {
      addTrafficLight(state, x + 4.8, z + 4.8, i);
      addTrafficLight(state, x - 4.8, z - 4.8, i + 1);
    }
  });
}

function addTrafficLight(state, x, z, phase) {
  const group = new THREE.Group();
  group.name = "city_life_traffic_light";

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 4.2, 10),
    new THREE.MeshStandardMaterial({ color: 0x22252d, metalness: 0.5, roughness: 0.45 })
  );
  pole.position.y = 2.1;
  group.add(pole);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 1.35, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x08090c, metalness: 0.35, roughness: 0.35 })
  );
  box.position.y = 4.0;
  group.add(box);

  const lights = [];
  [
    [0xff2222, 4.38, "red"],
    [0xffd166, 4.0, "yellow"],
    [0x44ff88, 3.62, "green"]
  ].forEach(([color, y, name]) => {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22 })
    );
    bulb.position.set(0, y, -0.19);
    bulb.name = name;
    group.add(bulb);
    lights.push(bulb);

    const glow = new THREE.PointLight(color, 0, 7);
    glow.position.set(0, y, -0.3);
    group.add(glow);
    lights.push(glow);
  });

  group.position.set(x, 0, z);
  group.rotation.y = (phase % 4) * Math.PI / 2;
  group.userData.phase = phase;
  group.userData.lights = lights;

  state.scene.add(group);
  cityLifeState.trafficLights.push(group);
}

function updateTrafficLights(dt) {
  const t = performance.now() / 1000;

  cityLifeState.trafficLights.forEach(light => {
    const cycle = (t + light.userData.phase * 1.7) % 12;
    const mode = cycle < 5 ? "green" : cycle < 7 ? "yellow" : "red";

    light.userData.lights.forEach(obj => {
      if (obj.isPointLight) {
        const parentName = obj.position.y > 4.2 ? "red" : obj.position.y > 3.8 ? "yellow" : "green";
        obj.intensity = parentName === mode ? 1.8 : 0;
      } else if (obj.material) {
        obj.material.opacity = obj.name === mode ? 0.95 : 0.2;
      }
    });
  });
}

function createSigns(state) {
  SIGN_POINTS.forEach(([x, z, text], i) => {
    const group = new THREE.Group();
    group.name = "city_life_sign";

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.45, roughness: 0.35 })
    );
    pole.position.y = 1.2;
    group.add(pole);

    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.85, 0.12),
      new THREE.MeshStandardMaterial({
        color: i % 2 ? 0x00d4ff : 0xff8a00,
        emissive: i % 2 ? 0x003344 : 0x442000,
        emissiveIntensity: 0.65
      })
    );
    panel.position.y = 2.45;
    group.add(panel);

    const label = createTextSprite(text);
    label.position.y = 2.46;
    label.position.z = -0.09;
    label.scale.set(2.2, 0.55, 1);
    group.add(label);

    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;

    state.scene.add(group);
    cityLifeState.signs.push(group);
  });
}

function createStreetDecor(state) {
  for (let i = 0; i < 46; i++) {
    const x = (Math.random() - 0.5) * 190;
    const z = (Math.random() - 0.5) * 190;

    if (Math.abs(x % 38) < 8 || Math.abs(z % 38) < 8) {
      const lamp = createStreetLamp(i);
      lamp.position.set(x, 0, z);
      state.scene.add(lamp);
      cityLifeState.decor.push(lamp);
    }
  }

  for (let i = 0; i < 34; i++) {
    const cone = createTrafficCone();
    cone.position.set((Math.random() - 0.5) * 180, 0.25, (Math.random() - 0.5) * 180);
    cone.rotation.y = Math.random() * Math.PI * 2;
    state.scene.add(cone);
    cityLifeState.decor.push(cone);
  }
}

function createStreetLamp(i) {
  const group = new THREE.Group();
  group.name = "city_life_street_lamp";

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 4.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x2b2f38, metalness: 0.6, roughness: 0.35 })
  );
  pole.position.y = 2.3;
  group.add(pole);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0 })
  );
  head.position.y = 4.7;
  group.add(head);

  const light = new THREE.PointLight(i % 3 === 0 ? 0x8fd8ff : 0xfff2b0, 0.9, 18);
  light.position.y = 4.65;
  group.add(light);
  group.userData.light = light;

  return group;
}

function createTrafficCone() {
  const group = new THREE.Group();
  group.name = "city_life_cone";

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.72, 12),
    new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.6 })
  );
  cone.position.y = 0.36;
  group.add(cone);

  const stripe = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.025, 6, 18),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  stripe.position.y = 0.42;
  stripe.rotation.x = Math.PI / 2;
  group.add(stripe);

  return group;
}

function animateDecor(dt) {
  const t = performance.now() / 1000;
  cityLifeState.decor.forEach((obj, i) => {
    if (obj.userData.light) {
      obj.userData.light.intensity = 0.75 + Math.sin(t * 2 + i) * 0.15;
    }
  });
}

function createTextSprite(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 6;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  return new THREE.Sprite(material);
}
