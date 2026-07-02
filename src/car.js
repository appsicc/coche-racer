import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export async function loadCar(loader, file) {
  return new Promise((resolve, reject) => {
    loader.load(file, gltf => {
      const car = gltf.scene;
      car.scale.set(1, 1, 1);
      car.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (obj.material) {
            obj.material.roughness = Math.min(obj.material.roughness ?? 0.4, 0.55);
            obj.material.metalness = Math.max(obj.material.metalness ?? 0.2, 0.25);
          }
        }
      });
      resolve(car);
    }, undefined, reject);
  });
}

export function createPlaceholderCar() {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.25, metalness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x162033, roughness: 0.1, metalness: 0.2 });
  const neonMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 2 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.4, metalness: 0.6 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 4.0), bodyMat);
  body.position.y = 0.55;
  group.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.48, 1.35), glassMat);
  cabin.position.set(0, 0.96, -0.25);
  group.add(cabin);

  const light = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.06), neonMat);
  light.position.set(0, 0.68, 2.05);
  group.add(light);

  const wheelPositions = [[-1.05,.25,1.15],[1.05,.25,1.15],[-1.05,.25,-1.15],[1.05,.25,-1.15]];
  wheelPositions.forEach(p => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.25,24), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(...p);
    group.add(w);
  });

  return group;
}

export function setCarStats(state, carInfo) {
  state.carStats = {
    maxSpeed: 1.35 + carInfo.speed * 0.055,
    acceleration: 0.75 + carInfo.acceleration * 0.055,
    handling: 0.85 + carInfo.handling * 0.04
  };
}
