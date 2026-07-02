import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { addCoins } from "./shop.js";
import { addXP, completeMission } from "./progress.js";

let urbanGroup = null;
let zones = [];

export function createUrbanWorld(state) {
  if (urbanGroup) state.scene.remove(urbanGroup);

  urbanGroup = new THREE.Group();
  urbanGroup.name = "urban_world_v10";

  const groundMat = new THREE.MeshStandardMaterial({ color: 0x11151b, roughness: 0.7, metalness: 0.05 });
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x202229, roughness: 0.42, metalness: 0.08 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf5f0cf, emissive: 0x665500, emissiveIntensity: 0.25 });
  const buildingMats = [
    new THREE.MeshStandardMaterial({ color: 0x172033, roughness: 0.45, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ color: 0x251832, roughness: 0.45, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ color: 0x1e2a2f, roughness: 0.45, metalness: 0.1 })
  ];

  const ground = new THREE.Mesh(new THREE.BoxGeometry(150, 0.12, 150), groundMat);
  ground.position.y = -0.09;
  ground.receiveShadow = true;
  urbanGroup.add(ground);

  // grid de calles
  for (let i = -2; i <= 2; i++) {
    const xRoad = new THREE.Mesh(new THREE.BoxGeometry(9, 0.05, 145), roadMat);
    xRoad.position.set(i * 26, 0.005, -45);
    xRoad.receiveShadow = true;
    urbanGroup.add(xRoad);

    const zRoad = new THREE.Mesh(new THREE.BoxGeometry(145, 0.055, 9), roadMat);
    zRoad.position.set(0, 0.01, -45 + i * 26);
    zRoad.receiveShadow = true;
    urbanGroup.add(zRoad);

    // líneas centrales
    for (let j = -12; j <= 12; j++) {
      const line1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 2.2), lineMat);
      line1.position.set(i * 26, 0.06, -45 + j * 5);
      urbanGroup.add(line1);

      const line2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.07, 0.18), lineMat);
      line2.position.set(j * 5, 0.06, -45 + i * 26);
      urbanGroup.add(line2);
    }
  }

  // edificios
  let idx = 0;
  for (let gx = -3; gx <= 3; gx++) {
    for (let gz = -4; gz <= 2; gz++) {
      const x = gx * 18 + ((gz % 2) * 5);
      const z = -45 + gz * 18 + ((gx % 2) * 4);

      if (Math.abs(x % 26) < 8 || Math.abs((z + 45) % 26) < 8) continue;

      const h = 5 + ((gx * gx + gz * 3 + 11) % 11);
      const w = 7 + ((gx + gz + 8) % 4);
      const d = 7 + ((gx * 2 + gz + 9) % 4);

      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMats[idx % buildingMats.length]);
      b.position.set(x, h / 2, z);
      b.castShadow = true;
      b.receiveShadow = true;
      urbanGroup.add(b);

      // luces en fachada
      const neonColor = idx % 3 === 0 ? 0x00aaff : idx % 3 === 1 ? 0xff33cc : 0xff8a00;
      const neonMat = new THREE.MeshStandardMaterial({
        color: neonColor,
        emissive: neonColor,
        emissiveIntensity: 1.3
      });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.28, 0.08), neonMat);
      sign.position.set(x, Math.min(h - 1, 4.5), z + d / 2 + 0.06);
      urbanGroup.add(sign);

      idx++;
    }
  }

  // zonas de actividad
  zones = [
    createZone("DRIFT", -42, -82, 0xff33cc, "Zona Drift"),
    createZone("SPRINT", 42, -82, 0x00d4ff, "Zona Sprint"),
    createZone("BONUS", 0, 10, 0x44ff88, "Zona Bonus"),
    createZone("GARAGE", -52, -22, 0xffd166, "Zona Garaje")
  ];

  zones.forEach(z => urbanGroup.add(z.mesh));

  state.scene.add(urbanGroup);
}

function createZone(id, x, z, color, label) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.6,
    transparent: true,
    opacity: 0.45
  });

  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 0.12, 48), mat);
  mesh.position.set(x, 0.12, z);
  mesh.name = "activity_zone_" + id;

  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.12, 12, 60), mat.clone());
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.12;
  mesh.add(ring);

  mesh.userData.zone = { id, label, cooldown: 0 };
  return { id, x, z, radius: 6.2, label, mesh };
}

export function updateUrbanWorld(state, dt) {
  if (!urbanGroup || !state.car) return;

  let active = "--";

  for (const zone of zones) {
    const data = zone.mesh.userData.zone;
    data.cooldown = Math.max(0, data.cooldown - dt);

    zone.mesh.rotation.y += dt * 0.45;

    const dist = Math.hypot(state.car.position.x - zone.x, state.car.position.z - zone.z);
    if (dist < zone.radius) {
      active = zone.label;

      if (data.cooldown <= 0) {
        data.cooldown = 6;
        triggerZoneReward(state, zone.id, zone.label);
      }
    }
  }

  state.currentZone = active;
}

function triggerZoneReward(state, id, label) {
  if (id === "DRIFT") {
    addCoins(state, 25);
    addXP(state, 12);
    state.objectiveText = "Drift bonus +25";
    window.showToast?.("Zona Drift: +25 monedas");
  }

  if (id === "SPRINT") {
    addCoins(state, 35);
    addXP(state, 15);
    state.objectiveText = "Sprint bonus +35";
    window.showToast?.("Zona Sprint: +35 monedas");
  }

  if (id === "BONUS") {
    addCoins(state, 50);
    addXP(state, 20);
    state.objectiveText = "Bonus urbano +50";
    window.showToast?.("Zona Bonus: +50 monedas");
  }

  if (id === "GARAGE") {
    state.nitro = Math.max(state.nitro, 100);
    state.damage = Math.max(0, (state.damage || 0) - 20);
    state.objectiveText = "Reparación + nitro";
    window.showToast?.("Zona Garaje: reparación y nitro");
  }
}
