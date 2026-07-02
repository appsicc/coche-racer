import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const gpsState = {
  target: null,
  label: "Sin destino",
  knownPoints: {
    garage: { label: "Garaje", pos: new THREE.Vector3(0, 0, 0), color: "#44ff88" },
    workshop: { label: "Taller", pos: new THREE.Vector3(38, 0, -26), color: "#44ff88" },
    drift: { label: "Zona Drift", pos: new THREE.Vector3(-55, 0, 42), color: "#c77dff" },
    bonus: { label: "Zona Bonus", pos: new THREE.Vector3(62, 0, 58), color: "#ffd166" }
  }
};

export function setupMapGPS(state, showScreen) {
  const btn = document.getElementById("mapBtn");
  if (btn) {
    btn.onclick = () => {
      drawBigMap(state);
      showScreen("mapScreen");
    };
  }

  document.querySelectorAll(".gpsTarget").forEach(button => {
    button.onclick = () => {
      const id = button.dataset.target;
      setGPSTarget(id);
      updateGPSUI(state);
      window.showToast?.("GPS: " + gpsState.label);
    };
  });

  const clear = document.getElementById("clearGPS");
  if (clear) {
    clear.onclick = () => {
      gpsState.target = null;
      gpsState.label = "Sin destino";
      updateGPSUI(state);
      window.showToast?.("GPS desactivado");
    };
  }

  updateGPSUI(state);
}

export function updateMapGPS(state, dt) {
  updateGPSFromActiveMissions(state);
  updateGPSArrow(state);
  updateGPSUI(state);

  const mapScreen = document.getElementById("mapScreen");
  if (mapScreen && mapScreen.classList.contains("active")) {
    drawBigMap(state);
  }
}

export function setGPSTarget(id) {
  const point = gpsState.knownPoints[id];
  if (!point) return;
  gpsState.target = point.pos.clone();
  gpsState.label = point.label;
}

function updateGPSFromActiveMissions(state) {
  if (gpsState.target) return;

  // Try to auto-guide to visible mission markers from other systems.
  const candidates = [];
  state.scene?.traverse(obj => {
    if (!obj.visible) return;
    if (
      obj.name?.toLowerCase?.().includes("mission") ||
      obj.name?.toLowerCase?.().includes("marker") ||
      obj.name?.toLowerCase?.().includes("target")
    ) {
      candidates.push(obj);
    }
  });

  if (candidates.length) {
    gpsState.target = candidates[0].position.clone();
    gpsState.label = "Objetivo";
  }
}

function updateGPSArrow(state) {
  const arrow = document.getElementById("gpsArrow");
  if (!arrow || !state.car || !gpsState.target) {
    if (arrow) arrow.classList.add("hidden");
    return;
  }

  const dx = gpsState.target.x - state.car.position.x;
  const dz = gpsState.target.z - state.car.position.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance < 7) {
    arrow.classList.add("hidden");
    return;
  }

  arrow.classList.remove("hidden");
  const targetAngle = Math.atan2(dx, dz);
  const carAngle = state.car.rotation.y;
  const relative = targetAngle - carAngle;
  arrow.style.transform = `rotate(${relative}rad)`;
}

function updateGPSUI(state) {
  const hud = document.getElementById("hudGPS");
  const label = document.getElementById("gpsTargetLabel");
  const dist = document.getElementById("gpsDistance");

  let distanceText = "--";
  if (state.car && gpsState.target) {
    distanceText = Math.round(state.car.position.distanceTo(gpsState.target)) + " m";
  }

  if (hud) hud.textContent = gpsState.target ? gpsState.label + " · " + distanceText : "--";
  if (label) label.textContent = gpsState.label;
  if (dist) dist.textContent = distanceText;
}

function drawBigMap(state) {
  const canvas = document.getElementById("bigMap");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "#060812";
  ctx.fillRect(0, 0, w, h);

  drawGrid(ctx, w, h);
  drawRoads(ctx, w, h);
  drawKnownPoints(ctx, w, h);
  drawPolice(ctx, state, w, h);
  drawTarget(ctx, state, w, h);
  drawPlayer(ctx, state, w, h);
}

function drawGrid(ctx, w, h) {
  ctx.strokeStyle = "rgba(255,255,255,.06)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  for (let y = 0; y <= h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawRoads(ctx, w, h) {
  ctx.strokeStyle = "rgba(0,212,255,.22)";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";

  for (let i = -2; i <= 2; i++) {
    const a = worldToMap(new THREE.Vector3(-110,0,i*38), w, h);
    const b = worldToMap(new THREE.Vector3(110,0,i*38), w, h);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  for (let i = -2; i <= 2; i++) {
    const a = worldToMap(new THREE.Vector3(i*38,0,-110), w, h);
    const b = worldToMap(new THREE.Vector3(i*38,0,110), w, h);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function drawKnownPoints(ctx, w, h) {
  Object.values(gpsState.knownPoints).forEach(point => {
    const p = worldToMap(point.pos, w, h);
    drawDot(ctx, p.x, p.y, 8, point.color);
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.font = "12px sans-serif";
    ctx.fillText(point.label, p.x + 10, p.y - 8);
  });
}

function drawPlayer(ctx, state, w, h) {
  if (!state.car) return;
  const p = worldToMap(state.car.position, w, h);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-state.car.rotation.y);
  ctx.fillStyle = "#00d4ff";
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(8, 10);
  ctx.lineTo(0, 5);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTarget(ctx, state, w, h) {
  if (!gpsState.target) return;
  const p = worldToMap(gpsState.target, w, h);
  drawDot(ctx, p.x, p.y, 10, "#ff8a00");
}

function drawPolice(ctx, state, w, h) {
  state.scene?.traverse(obj => {
    if (!obj.visible) return;
    if (obj.name?.toLowerCase?.().includes("police")) {
      const p = worldToMap(obj.position, w, h);
      drawDot(ctx, p.x, p.y, 6, "#ff5555");
    }
  });
}

function drawDot(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,.8)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function worldToMap(pos, w, h) {
  const scale = 2.05;
  return {
    x: w / 2 + pos.x * scale,
    y: h / 2 + pos.z * scale
  };
}
