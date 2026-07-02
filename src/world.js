import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { createCurvedTrackVisual } from "./track.js";
import { getNitroMax } from "./shop.js";
import { addStat, completeMission } from "./progress.js";
import { vibrate } from "./controlSettings.js";
import { unlockAchievement } from "./achievements.js";

let coins = [];
let obstacles = [];
let particles = null;

export function createWorld(state) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.85);
  state.scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(7, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  state.scene.add(sun);

  const blue = new THREE.PointLight(0x00aaff, 4, 70);
  blue.position.set(-7, 5, 3);
  state.scene.add(blue);

  const pink = new THREE.PointLight(0xff00cc, 3, 70);
  pink.position.set(7, 5, -14);
  state.scene.add(pink);

  state.curvedTrack = createCurvedTrackVisual(state.scene);
  createCollectibles(state);
  createParticles(state);

  window.addEventListener("qualitychange", event => {
    if (particles) {
      particles.material.opacity = event.detail.particleMultiplier <= 0.35 ? 0.22 : 0.45;
      particles.visible = event.detail.particleMultiplier > 0.2;
    }
  });
}

export async function loadMap(loader, file) {
  return new Promise((resolve, reject) => {
    loader.load(file, gltf => {
      const map = gltf.scene;
      map.traverse(obj => {
        if (obj.isMesh) {
          obj.receiveShadow = true;
          obj.castShadow = true;
        }
      });
      resolve(map);
    }, undefined, reject);
  });
}

function createCollectibles(state) {
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    emissive: 0xff9900,
    emissiveIntensity: 1.0,
    roughness: 0.25,
    metalness: 0.8
  });

  const obstacleMat = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    roughness: 0.45,
    metalness: 0.3
  });

  for (let i = 0; i < 45; i++) {
    const coin = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 12, 28), coinMat);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(randomLane(), 0.65, -10 - i * 6.8);
    coin.visible = false;
    coins.push(coin);
    state.scene.add(coin);
  }

  for (let i = 0; i < 26; i++) {
    const obs = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.85, 1.0), obstacleMat);
    obs.position.set(randomLane(), 0.42, -18 - i * 11.5);
    obs.visible = false;
    obstacles.push(obs);
    state.scene.add(obs);
  }
}

function createParticles(state) {
  const geo = new THREE.BufferGeometry();
  const quality = localStorage.getItem("quality") || "medium";
  const mult = quality === "low" ? 0.35 : quality === "high" ? 1.0 : 0.65;
  const count = Math.floor(500 * mult);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 70;
    positions[i * 3 + 1] = Math.random() * 22;
    positions[i * 3 + 2] = 15 - Math.random() * 160;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x8fd8ff,
    size: 0.07,
    transparent: true,
    opacity: 0.45
  });
  particles = new THREE.Points(geo, mat);
  state.scene.add(particles);
}

export function updateWorld(state, dt) {
  if (!state.car) return;

  coins.forEach(coin => {
    coin.visible = true;
    coin.rotation.z += dt * 4;
    if (coin.position.z > state.car.position.z + 16) {
      coin.position.z -= 310;
      coin.position.x = randomLane();
      coin.visible = true;
    }

    if (coin.visible && coin.position.distanceTo(state.car.position) < 1.4) {
      coin.visible = false;
      state.coins++;
      addStat(state, "coinsCollected", 1);
      if (state.coins >= 25) completeMission(state, "collect_25");
      if ((state.progress?.stats?.coinsCollected || 0) >= 50) unlockAchievement(state, "collector_50");
      state.nitro = Math.min(getNitroMax(state), state.nitro + 7);
      state.audio?.coin();
      vibrate(25);
    }
  });

  obstacles.forEach(obs => {
    obs.visible = true;
    if (obs.position.z > state.car.position.z + 20) {
      obs.position.z -= 320;
      obs.position.x = randomLane();
      obs.visible = true;
    }

    if (obs.visible && obs.position.distanceTo(state.car.position) < 1.35) {
      obs.visible = false;
      state.speed *= -0.3;
      state.audio?.crash();
      vibrate(70);
    }
  });

  if (particles) {
    const arr = particles.geometry.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] -= dt * 4.5;
      arr[i + 2] += dt * 8;
      if (arr[i + 1] < 0 || arr[i + 2] > state.car.position.z + 25) {
        arr[i] = state.car.position.x + (Math.random() - 0.5) * 70;
        arr[i + 1] = Math.random() * 22;
        arr[i + 2] = state.car.position.z + 12 - Math.random() * 160;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }
}

function randomLane() {
  const lanes = [-4.5, -2.2, 0, 2.2, 4.5];
  return lanes[Math.floor(Math.random() * lanes.length)];
}

function createCurveGuidesUnused(state) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x00d4ff,
    emissive: 0x008cff,
    emissiveIntensity: 1.1,
    transparent: true,
    opacity: 0.55
  });

  for (let i = 0; i < 80; i++) {
    const z = 8 - i * 2.2;
    const x = Math.sin(i * 0.22) * 3.2;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.9), mat);
    marker.position.set(x, 0.055, z);
    marker.rotation.y = Math.sin(i * 0.22) * 0.18;
    state.scene.add(marker);
  }
}
