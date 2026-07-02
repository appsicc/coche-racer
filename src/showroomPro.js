const STORAGE_KEY = "showroomProData";

const ROLES = ["Aceleración", "Drift", "Control", "Velocidad punta", "Equilibrado", "Persecución"];
const RARITIES = ["Común", "Raro", "Épico", "Legendario"];

export const showroomProState = {
  data: loadData(),
  selectedIndex: 0
};

export function setupShowroomPro(state, showScreen) {
  state.showroomPro = showroomProState;
  showroomProState.selectedIndex = Number(state.selectedCarIndex || localStorage.getItem("selectedCarIndex") || 0);

  document.getElementById("showroomProBtn").onclick = () => {
    updateShowroomProUI(state);
    showScreen("showroomProScreen");
  };

  document.getElementById("showroomProPrev").onclick = () => {
    moveSelection(state, -1);
  };

  document.getElementById("showroomProNext").onclick = () => {
    moveSelection(state, 1);
  };

  document.getElementById("showroomProSelect").onclick = () => {
    state.selectedCarIndex = showroomProState.selectedIndex;
    localStorage.setItem("selectedCarIndex", String(showroomProState.selectedIndex));
    updateShowroomProUI(state);
    window.showToast?.("Coche seleccionado");
  };

  document.getElementById("showroomProFavorite").onclick = () => {
    toggleFavorite(state);
  };

  document.getElementById("showroomProQuickTest").onclick = () => {
    state.selectedCarIndex = showroomProState.selectedIndex;
    localStorage.setItem("selectedCarIndex", String(showroomProState.selectedIndex));
    showScreen("gameScreen");
    window.showToast?.("Prueba rápida iniciada");
  };

  document.getElementById("showroomProOpenCodes").onclick = () => {
    state.selectedCarIndex = showroomProState.selectedIndex;
    localStorage.setItem("selectedCarIndex", String(showroomProState.selectedIndex));
    document.getElementById("garageCodesBtn")?.click();
  };

  updateShowroomProUI(state);
}

export function updateShowroomPro(state) {
  updateShowroomProHUD(state);
}

function moveSelection(state, delta) {
  const total = state.manifest?.cars?.length || 1;
  showroomProState.selectedIndex = (showroomProState.selectedIndex + delta + total) % total;
  updateShowroomProUI(state);
}

function toggleFavorite(state) {
  const id = String(showroomProState.selectedIndex);
  if (showroomProState.data.favorites.includes(id)) {
    showroomProState.data.favorites = showroomProState.data.favorites.filter(x => x !== id);
    window.showToast?.("Favorito quitado");
  } else {
    showroomProState.data.favorites.push(id);
    window.showToast?.("Favorito añadido");
  }
  saveData();
  updateShowroomProUI(state);
}

function updateShowroomProUI(state) {
  const car = getSelectedCar(state);
  const stats = getStats(showroomProState.selectedIndex);
  const rating = getRating(stats);
  const rarity = RARITIES[showroomProState.selectedIndex % RARITIES.length];
  const role = ROLES[showroomProState.selectedIndex % ROLES.length];

  setText("showroomProCarName", car.name || "Coche");
  setText("showroomProRarity", rarity);
  setText("showroomProRole", role);
  setText("showroomProRating", rating + "/100");
  setText("showroomProRecommendation", getRecommendation(stats, role));

  const favBtn = document.getElementById("showroomProFavorite");
  if (favBtn) {
    favBtn.textContent = isFavorite(showroomProState.selectedIndex) ? "QUITAR FAVORITO" : "MARCAR FAVORITO";
  }

  renderStats(stats);
  renderFavorites(state);
  renderNotes(stats, car, role, rarity);
  updateShowroomProHUD(state);
}

function renderStats(stats) {
  const box = document.getElementById("showroomProStats");
  if (!box) return;

  const rows = [
    ["Velocidad", stats.speed],
    ["Aceleración", stats.accel],
    ["Manejo", stats.handling],
    ["Nitro", stats.nitro],
    ["Frenada", stats.brake],
    ["Resistencia", stats.armor]
  ];

  box.innerHTML = rows.map(([label, value]) => `
    <div class="showroom-stat-row">
      <div class="showroom-stat-label"><span>${label}</span><span>${value}/100</span></div>
      <div class="showroom-stat-bar"><div class="showroom-stat-fill" style="width:${value}%"></div></div>
    </div>
  `).join("");
}

function renderFavorites(state) {
  const box = document.getElementById("showroomProFavorites");
  if (!box) return;

  if (!showroomProState.data.favorites.length) {
    box.innerHTML = "<p>No tienes favoritos todavía.</p>";
    return;
  }

  box.innerHTML = "";
  showroomProState.data.favorites.forEach(id => {
    const index = Number(id);
    const car = state.manifest?.cars?.[index] || {};
    const row = document.createElement("div");
    row.className = "showroom-pro-row favorite";
    row.innerHTML = `
      <b>⭐ ${escapeHTML(car.name || "Coche")}</b>
      <p>Valoración ${getRating(getStats(index))}/100</p>
      <button>VER</button>
    `;
    row.querySelector("button").onclick = () => {
      showroomProState.selectedIndex = index;
      updateShowroomProUI(state);
    };
    box.appendChild(row);
  });
}

function renderNotes(stats, car, role, rarity) {
  const box = document.getElementById("showroomProNotes");
  if (!box) return;

  const notes = [
    ["Identidad", `${car.name || "Coche"} es de rareza ${rarity} y rol ${role}.`],
    ["Punto fuerte", getStrongPoint(stats)],
    ["Consejo", getDrivingTip(stats)],
    ["Ideal para", getIdealMode(stats)]
  ];

  box.innerHTML = notes.map(([title, text]) => `
    <div class="showroom-pro-row">
      <b>${title}</b>
      <p>${escapeHTML(text)}</p>
    </div>
  `).join("");
}

function updateShowroomProHUD(state) {
  const hud = document.getElementById("hudShowroomPro");
  if (!hud) return;
  const car = getSelectedCar(state);
  hud.textContent = car.name ? car.name.split(" ")[0] : "--";
}

function getSelectedCar(state) {
  return state.manifest?.cars?.[showroomProState.selectedIndex] || {};
}

function getStats(index) {
  const seed = index + 1;
  return {
    speed: clamp(58 + seed * 9 + (seed % 3) * 6),
    accel: clamp(62 + seed * 7 + (seed % 2) * 8),
    handling: clamp(60 + seed * 6 + ((seed + 1) % 3) * 9),
    nitro: clamp(55 + seed * 8 + (seed % 4) * 5),
    brake: clamp(58 + seed * 5 + ((seed + 2) % 3) * 7),
    armor: clamp(54 + seed * 4 + ((seed + 3) % 4) * 6)
  };
}

function getRating(stats) {
  return Math.round((stats.speed + stats.accel + stats.handling + stats.nitro + stats.brake + stats.armor) / 6);
}

function getStrongPoint(stats) {
  const entries = Object.entries(stats);
  entries.sort((a, b) => b[1] - a[1]);
  const label = {
    speed: "velocidad punta",
    accel: "aceleración",
    handling: "manejo",
    nitro: "nitro",
    brake: "frenada",
    armor: "resistencia"
  }[entries[0][0]];
  return "Su mejor punto es " + label + " con " + entries[0][1] + "/100.";
}

function getDrivingTip(stats) {
  if (stats.handling >= 82) return "Ataca curvas y prueba retos de drift/control.";
  if (stats.speed >= 82) return "Aprovecha rectas largas y usa nitro en salida.";
  if (stats.armor >= 78) return "Ideal para persecuciones y clima extremo.";
  if (stats.brake >= 80) return "Frena tarde, pero evita sobrevirar.";
  return "Es equilibrado: va bien para carreras y misiones urbanas.";
}

function getIdealMode(stats) {
  if (stats.handling > stats.speed && stats.handling > stats.armor) return "drift, rutas personalizadas y habilidad.";
  if (stats.speed > stats.handling && stats.speed > stats.armor) return "carreras, campeonato y retos de velocidad.";
  if (stats.armor > stats.speed) return "policía, clima extremo y mundo libre.";
  return "modo historia, eventos diarios y semanales.";
}

function getRecommendation(stats, role) {
  const rating = getRating(stats);
  if (rating >= 85) return "Recomendado para competición seria. Muy buen coche para avanzar rápido.";
  if (role === "Drift") return "Recomendado para derrapes, curvas y retos de control.";
  if (role === "Persecución") return "Recomendado para policía, daño y carreras caóticas.";
  return "Buen coche para progresar y probar distintos modos.";
}

function isFavorite(index) {
  return showroomProState.data.favorites.includes(String(index));
}

function clamp(value) {
  return Math.max(35, Math.min(100, Math.round(value)));
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && Array.isArray(data.favorites) ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    favorites: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(showroomProState.data));
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
