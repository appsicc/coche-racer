import * as THREE from "https://esm.sh/three@0.160.0";
import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "customRoutesData";

export const customRoutesState = {
  data: loadData(),
  currentPoints: [],
  markers: [],
  active: false,
  activeRoute: null,
  currentIndex: 0,
  timer: 0,
  selectedSaved: 0
};

export function setupCustomRoutes(state, showScreen) {
  state.customRoutes = customRoutesState;

  document.getElementById("customRoutesBtn").onclick = () => {
    syncRouteUI(state);
    showScreen("customRoutesScreen");
  };

  document.getElementById("addRoutePoint").onclick = () => addPointFromCar(state);
  document.getElementById("undoRoutePoint").onclick = () => undoPoint(state);
  document.getElementById("clearRoutePoints").onclick = () => clearCurrentRoute(state);
  document.getElementById("saveCustomRoute").onclick = () => saveCurrentRoute(state);
  document.getElementById("startCustomRoute").onclick = () => startCustomRoute(state);
  document.getElementById("stopCustomRoute").onclick = () => stopCustomRoute(state, false);

  syncRouteUI(state);
}

export function updateCustomRoutes(state, dt) {
  if (!state.car) {
    updateRouteHUD();
    return;
  }

  if (customRoutesState.active) {
    customRoutesState.timer += dt;
    checkRouteProgress(state);
  }

  animateMarkers(dt);
  updateRouteHUD();
}

function addPointFromCar(state) {
  if (!state.car) {
    window.showToast?.("Coche no listo");
    return;
  }

  const p = state.car.position;
  const point = {
    x: Number(p.x.toFixed(2)),
    y: Number((p.y || 0).toFixed(2)),
    z: Number(p.z.toFixed(2))
  };

  customRoutesState.currentPoints.push(point);
  addMarker(state, point, customRoutesState.currentPoints.length - 1);
  syncRouteUI(state);
  window.showToast?.("Checkpoint añadido");
}

function undoPoint(state) {
  customRoutesState.currentPoints.pop();
  rebuildMarkers(state);
  syncRouteUI(state);
}

function clearCurrentRoute(state) {
  if (!confirm("¿Limpiar checkpoints actuales?")) return;
  customRoutesState.currentPoints = [];
  rebuildMarkers(state);
  syncRouteUI(state);
}

function saveCurrentRoute(state) {
  const name = (document.getElementById("routeNameInput")?.value || "Ruta personalizada").trim().slice(0, 24) || "Ruta personalizada";

  if (customRoutesState.currentPoints.length < 2) {
    window.showToast?.("Necesitas mínimo 2 checkpoints");
    return;
  }

  const route = {
    id: Date.now(),
    name,
    points: customRoutesState.currentPoints.map(p => ({ ...p })),
    bestTime: null,
    runs: 0
  };

  customRoutesState.data.routes.unshift(route);
  customRoutesState.data.routes = customRoutesState.data.routes.slice(0, 12);
  customRoutesState.selectedSaved = 0;
  saveData();
  syncRouteUI(state);
  window.showToast?.("Ruta guardada");
}

function startCustomRoute(state) {
  let points = customRoutesState.currentPoints;

  if (points.length < 2 && customRoutesState.data.routes[customRoutesState.selectedSaved]) {
    const route = customRoutesState.data.routes[customRoutesState.selectedSaved];
    points = route.points;
    customRoutesState.currentPoints = route.points.map(p => ({ ...p }));
    customRoutesState.activeRoute = route;
    rebuildMarkers(state);
  }

  if (points.length < 2) {
    window.showToast?.("Crea o selecciona una ruta con mínimo 2 puntos");
    return;
  }

  customRoutesState.active = true;
  customRoutesState.currentIndex = 0;
  customRoutesState.timer = 0;
  document.body.classList.add("custom-route-active");
  syncRouteUI(state);
  window.showToast?.("Ruta iniciada");
}

function stopCustomRoute(state, completed) {
  if (!customRoutesState.active) return;

  const seconds = Math.max(1, Math.round(customRoutesState.timer));
  const points = customRoutesState.currentPoints.length;
  const coins = completed ? points * 55 + Math.max(0, 220 - seconds) : Math.round(points * 18);
  const xp = completed ? points * 28 + Math.max(0, 110 - Math.round(seconds / 2)) : Math.round(points * 10);

  if (completed) {
    addCoins(state, coins);
    addXP(state, xp);
    addStat(state, "customRoutesCompleted", 1);

    if (customRoutesState.activeRoute) {
      customRoutesState.activeRoute.runs += 1;
      if (!customRoutesState.activeRoute.bestTime || seconds < customRoutesState.activeRoute.bestTime) {
        customRoutesState.activeRoute.bestTime = seconds;
      }
    }

    customRoutesState.data.completed += 1;
    customRoutesState.data.bestPoints = Math.max(customRoutesState.data.bestPoints, points);
    window.showToast?.("Ruta completada: +" + coins + " monedas");
  } else {
    window.showToast?.("Ruta parada");
  }

  customRoutesState.active = false;
  customRoutesState.currentIndex = 0;
  customRoutesState.timer = 0;
  document.body.classList.remove("custom-route-active");
  saveData();
  syncRouteUI(state);
}

function checkRouteProgress(state) {
  const point = customRoutesState.currentPoints[customRoutesState.currentIndex];
  if (!point) {
    stopCustomRoute(state, true);
    return;
  }

  const carPos = state.car.position;
  const dist = Math.hypot(carPos.x - point.x, carPos.z - point.z);

  if (dist < 5.5) {
    highlightMarker(customRoutesState.currentIndex);
    customRoutesState.currentIndex += 1;
    if (customRoutesState.currentIndex >= customRoutesState.currentPoints.length) {
      stopCustomRoute(state, true);
    } else {
      window.showToast?.("Checkpoint " + customRoutesState.currentIndex + "/" + customRoutesState.currentPoints.length);
    }
  }

  syncRouteUI(state);
}

function addMarker(state, point, index) {
  if (!state.scene) return;

  const group = new THREE.Group();
  group.name = "custom_route_marker";
  group.userData.index = index;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.08, 8, 48),
    new THREE.MeshBasicMaterial({ color: index === 0 ? 0x44ff88 : 0x00d4ff })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  group.add(ring);

  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 2.8, 12),
    new THREE.MeshBasicMaterial({ color: index === 0 ? 0x44ff88 : 0x00d4ff, transparent: true, opacity: 0.55 })
  );
  pillar.position.y = 1.4;
  group.add(pillar);

  const glow = new THREE.PointLight(index === 0 ? 0x44ff88 : 0x00d4ff, 1.2, 12);
  glow.position.y = 1.6;
  group.add(glow);

  group.position.set(point.x, point.y || 0, point.z);
  state.scene.add(group);
  customRoutesState.markers.push(group);
}

function rebuildMarkers(state) {
  customRoutesState.markers.forEach(marker => state.scene?.remove(marker));
  customRoutesState.markers = [];
  customRoutesState.currentPoints.forEach((point, index) => addMarker(state, point, index));
}

function highlightMarker(index) {
  const marker = customRoutesState.markers[index];
  if (!marker) return;
  marker.scale.set(1.45, 1.45, 1.45);
  marker.userData.hitFlash = 0.55;
}

function animateMarkers(dt) {
  customRoutesState.markers.forEach((marker, index) => {
    marker.rotation.y += dt * 0.8;
    marker.position.y = Math.sin(performance.now() * 0.002 + index) * 0.18;

    if (marker.userData.hitFlash) {
      marker.userData.hitFlash -= dt;
      marker.scale.lerp(new THREE.Vector3(1, 1, 1), 0.12);
      if (marker.userData.hitFlash <= 0) {
        marker.userData.hitFlash = 0;
      }
    }

    const isNext = customRoutesState.active && index === customRoutesState.currentIndex;
    marker.visible = !customRoutesState.active || index >= customRoutesState.currentIndex;
    marker.traverse(obj => {
      if (obj.material && obj.material.color) {
        obj.material.color.setHex(isNext ? 0xffd166 : index === 0 ? 0x44ff88 : 0x00d4ff);
      }
    });
  });
}

function loadSavedRoute(state, index) {
  const route = customRoutesState.data.routes[index];
  if (!route) return;

  customRoutesState.selectedSaved = index;
  customRoutesState.activeRoute = route;
  customRoutesState.currentPoints = route.points.map(p => ({ ...p }));
  const input = document.getElementById("routeNameInput");
  if (input) input.value = route.name;
  rebuildMarkers(state);
  syncRouteUI(state);
  window.showToast?.("Ruta cargada");
}

function deleteSavedRoute(state, index) {
  if (!confirm("¿Borrar esta ruta guardada?")) return;
  customRoutesState.data.routes.splice(index, 1);
  customRoutesState.selectedSaved = 0;
  saveData();
  syncRouteUI(state);
}

function syncRouteUI(state) {
  const count = customRoutesState.currentPoints.length;
  const progress = count ? Math.round((customRoutesState.currentIndex / count) * 100) : 0;
  const reward = count * 55 + Math.max(0, 220 - Math.round(customRoutesState.timer));

  setText("routePointCount", count);
  setText("routeStatus", customRoutesState.active ? "Corriendo" : "Editando");
  setText("routeNextPoint", customRoutesState.active ? (customRoutesState.currentIndex + 1) + "/" + count : "--");
  setText("routeTimer", Math.round(customRoutesState.timer) + "s");
  setText("routeReward", Math.max(0, reward) + " monedas");

  const fill = document.getElementById("routeProgressFill");
  if (fill) fill.style.width = progress + "%";

  renderPoints();
  renderSavedRoutes(state);
  updateRouteHUD();
}

function renderPoints() {
  const list = document.getElementById("routePointsList");
  if (!list) return;

  if (!customRoutesState.currentPoints.length) {
    list.innerHTML = "<p>No hay checkpoints todavía.</p>";
    return;
  }

  list.innerHTML = customRoutesState.currentPoints.map((p, i) => `
    <div class="route-row ${customRoutesState.active && i === customRoutesState.currentIndex ? "active" : ""}">
      <b>#${i + 1}</b>
      <p>X ${p.x} · Z ${p.z}</p>
    </div>
  `).join("");
}

function renderSavedRoutes(state) {
  const list = document.getElementById("savedRoutesList");
  if (!list) return;

  if (!customRoutesState.data.routes.length) {
    list.innerHTML = "<p>No hay rutas guardadas.</p>";
    return;
  }

  list.innerHTML = "";
  customRoutesState.data.routes.forEach((route, index) => {
    const row = document.createElement("div");
    row.className = "route-row " + (index === customRoutesState.selectedSaved ? "active" : "");
    row.innerHTML = `
      <b>${escapeHTML(route.name)}</b>
      <p>${route.points.length} checkpoints · récord ${route.bestTime ? route.bestTime + "s" : "--"}</p>
      <button data-action="load">CARGAR</button>
      <button data-action="delete">BORRAR</button>
    `;

    row.querySelector('[data-action="load"]').onclick = () => loadSavedRoute(state, index);
    row.querySelector('[data-action="delete"]').onclick = () => deleteSavedRoute(state, index);
    list.appendChild(row);
  });
}

function updateRouteHUD() {
  const hud = document.getElementById("hudCustomRoute");
  if (!hud) return;

  if (customRoutesState.active) {
    hud.textContent = (customRoutesState.currentIndex + 1) + "/" + customRoutesState.currentPoints.length + " · " + Math.round(customRoutesState.timer) + "s";
  } else {
    hud.textContent = customRoutesState.data.routes.length ? customRoutesState.data.routes.length + " rutas" : "--";
  }
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && Array.isArray(data.routes) ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    routes: [],
    completed: 0,
    bestPoints: 0
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customRoutesState.data));
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
