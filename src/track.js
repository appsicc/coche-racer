import * as THREE from "https://esm.sh/three@0.160.0";

export const TRACK = {
  halfWidth: 5.6,
  points: [
    { x: 0, z: 8 },
    { x: 2.4, z: -12 },
    { x: 5.2, z: -34 },
    { x: 1.8, z: -58 },
    { x: -4.8, z: -82 },
    { x: -2.8, z: -108 },
    { x: 4.5, z: -132 },
    { x: 1.2, z: -160 },
    { x: 0, z: -178 }
  ]
};

export function getTrackPoint(t) {
  const points = TRACK.points;
  const max = points.length - 1;
  const scaled = THREE.MathUtils.clamp(t, 0, 1) * max;
  const i = Math.min(Math.floor(scaled), max - 1);
  const local = scaled - i;
  const a = points[i];
  const b = points[i + 1];
  return {
    x: THREE.MathUtils.lerp(a.x, b.x, smooth(local)),
    z: THREE.MathUtils.lerp(a.z, b.z, smooth(local))
  };
}

export function getTrackAngle(t) {
  const p1 = getTrackPoint(Math.max(0, t - 0.01));
  const p2 = getTrackPoint(Math.min(1, t + 0.01));
  return Math.atan2(p2.x - p1.x, p2.z - p1.z);
}

export function getNearestTrackInfo(position) {
  let best = {
    distance: Infinity,
    t: 0,
    center: { x: 0, z: 0 }
  };

  const steps = 180;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = getTrackPoint(t);
    const d = Math.hypot(position.x - p.x, position.z - p.z);
    if (d < best.distance) {
      best.distance = d;
      best.t = t;
      best.center = p;
    }
  }

  best.onTrack = best.distance <= TRACK.halfWidth;
  best.edgeAmount = THREE.MathUtils.clamp((best.distance - TRACK.halfWidth) / 3.5, 0, 1);
  return best;
}

export function createCurvedTrackVisual(scene) {
  const group = new THREE.Group();
  group.name = "curved_track_v4";

  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x15171c,
    roughness: 0.32,
    metalness: 0.12
  });

  const shoulderMat = new THREE.MeshStandardMaterial({
    color: 0x262a30,
    roughness: 0.55,
    metalness: 0.08
  });

  const lineMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2dd,
    emissive: 0x777755,
    emissiveIntensity: 0.15
  });

  const guardMat = new THREE.MeshStandardMaterial({
    color: 0x00aaff,
    emissive: 0x0077ff,
    emissiveIntensity: 1.1
  });

  const warningMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: 0xff9900,
    emissiveIntensity: 0.6
  });

  const segmentCount = 120;
  for (let i = 0; i < segmentCount; i++) {
    const t1 = i / segmentCount;
    const t2 = (i + 1) / segmentCount;
    const p1 = getTrackPoint(t1);
    const p2 = getTrackPoint(t2);
    const mid = {
      x: (p1.x + p2.x) / 2,
      z: (p1.z + p2.z) / 2
    };
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);

    const road = new THREE.Mesh(new THREE.BoxGeometry(TRACK.halfWidth * 2, 0.055, len + 0.16), asphaltMat);
    road.position.set(mid.x, 0.005, mid.z);
    road.rotation.y = angle;
    road.receiveShadow = true;
    group.add(road);

    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(TRACK.halfWidth * 2 + 1.2, 0.035, len + 0.16), shoulderMat);
    shoulder.position.set(mid.x, -0.015, mid.z);
    shoulder.rotation.y = angle;
    shoulder.receiveShadow = true;
    group.add(shoulder);

    if (i % 2 === 0) {
      const centerLine = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.065, len * 0.45), lineMat);
      centerLine.position.set(mid.x, 0.052, mid.z);
      centerLine.rotation.y = angle;
      group.add(centerLine);
    }

    const left = offsetPoint(mid, angle, -TRACK.halfWidth);
    const right = offsetPoint(mid, angle, TRACK.halfWidth);

    if (i % 3 === 0) {
      const lGuard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.20, len + 0.10), guardMat);
      lGuard.position.set(left.x, 0.18, left.z);
      lGuard.rotation.y = angle;
      group.add(lGuard);

      const rGuard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.20, len + 0.10), guardMat);
      rGuard.position.set(right.x, 0.18, right.z);
      rGuard.rotation.y = angle;
      group.add(rGuard);
    }

    if (i % 8 === 0) {
      const warn = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.25), warningMat);
      const side = i % 16 === 0 ? -TRACK.halfWidth - 0.7 : TRACK.halfWidth + 0.7;
      const pos = offsetPoint(mid, angle, side);
      warn.position.set(pos.x, 0.18, pos.z);
      warn.rotation.y = angle + Math.PI / 2;
      group.add(warn);
    }
  }

  scene.add(group);
  return group;
}

export function getCheckpointsForTrack() {
  return [0.16, 0.34, 0.52, 0.72, 0.92].map(t => {
    const p = getTrackPoint(t);
    return { x: p.x, z: p.z, radius: TRACK.halfWidth + 0.8, t };
  });
}

export function getStartPositionForLane(lane = 0) {
  const t = 0.02;
  const p = getTrackPoint(t);
  const angle = getTrackAngle(t);
  const side = lane * 2.2;
  const pos = offsetPoint(p, angle, side);
  return { x: pos.x, z: pos.z, angle };
}

function offsetPoint(p, angle, offset) {
  return {
    x: p.x + Math.cos(angle) * offset,
    z: p.z - Math.sin(angle) * offset
  };
}

function smooth(x) {
  return x * x * (3 - 2 * x);
}
