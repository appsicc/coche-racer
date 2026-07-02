import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { getCameraPreset } from "./controlSettings.js";

export function updateFollowCamera(state, dt) {
  const car = state.car;
  if (!car) return;

  const preset = getCameraPreset();
  const backDistance = preset.distance;
  const height = preset.height;
  const side = 0;

  const offset = new THREE.Vector3(
    Math.sin(car.rotation.y) * backDistance + side,
    height,
    Math.cos(car.rotation.y) * backDistance
  );

  const desired = car.position.clone().add(offset);
  state.camera.position.lerp(desired, 1 - Math.pow(0.001, dt));

  const lookAt = car.position.clone();
  lookAt.y += 0.85;
  lookAt.z -= Math.cos(car.rotation.y) * 2.2;
  lookAt.x -= Math.sin(car.rotation.y) * 2.2;

  state.camera.lookAt(lookAt);
}
