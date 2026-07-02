import { isCarUnlocked } from "./progress.js";
import { getCarStats } from "./shop.js";

export const garageAdvanced = {
  favorites: loadFavorites()
};

export function setupAdvancedGarage(state) {
  state.garageAdvanced = garageAdvanced;
}

export function setupAdvancedGarageUI(state) {
  const fav = document.getElementById("favoriteCar");
  const race = document.getElementById("recommendRaceCar");
  const chase = document.getElementById("recommendChaseCar");

  if (fav) fav.onclick = () => toggleFavorite(state);
  if (race) race.onclick = () => recommendCar(state, "race");
  if (chase) chase.onclick = () => recommendCar(state, "chase");

  updateAdvancedGarageUI(state);
}

export function updateAdvancedGarageUI(state) {
  const car = state.manifest?.cars?.[state.selectedCarIndex];
  if (!car) return;

  const stats = getCarStats(state, state.selectedCarIndex);
  const speed = normalize(stats.maxSpeed, 1.0, 2.4);
  const accel = normalize(stats.acceleration, 0.6, 1.8);
  const handling = normalize(stats.handling, 0.65, 1.7);
  const nitro = normalize(stats.nitroMax || 100, 80, 180);

  setWidth("statSpeed", speed);
  setWidth("statAccel", accel);
  setWidth("statHandling", handling);
  setWidth("statNitro", nitro);

  const favorite = isFavorite(state.selectedCarIndex);
  const favBtn = document.getElementById("favoriteCar");
  if (favBtn) favBtn.textContent = favorite ? "⭐ QUITAR FAVORITO" : "☆ FAVORITO";

  const advice = document.getElementById("garageAdvice");
  if (advice) advice.textContent = buildAdvice(car, stats, favorite);

  markFavoriteCards(state);
}

export function toggleFavorite(state) {
  const id = String(state.selectedCarIndex);
  if (garageAdvanced.favorites.includes(id)) {
    garageAdvanced.favorites = garageAdvanced.favorites.filter(x => x !== id);
    window.showToast?.("Quitado de favoritos");
  } else {
    garageAdvanced.favorites.push(id);
    window.showToast?.("Añadido a favoritos");
  }

  saveFavorites();
  updateAdvancedGarageUI(state);
}

export function recommendCar(state, mode) {
  const candidates = state.manifest.cars
    .map((car, index) => ({ car, index, stats: getCarStats(state, index) }))
    .filter(item => isCarUnlocked(state, item.index));

  if (!candidates.length) {
    window.showToast?.("No hay coches desbloqueados");
    return;
  }

  candidates.forEach(item => {
    const s = item.stats;
    item.score = mode === "chase"
      ? s.maxSpeed * 0.35 + s.acceleration * 0.25 + s.handling * 0.25 + (s.nitroMax || 100) / 160 * 0.15
      : s.maxSpeed * 0.45 + s.acceleration * 0.25 + s.handling * 0.2 + (s.nitroMax || 100) / 160 * 0.1;

    if (garageAdvanced.favorites.includes(String(item.index))) item.score += 0.08;
  });

  candidates.sort((a, b) => b.score - a.score);
  state.selectedCarIndex = candidates[0].index;
  localStorage.setItem("selectedCarIndex", String(state.selectedCarIndex));

  window.showToast?.("Recomendado: " + candidates[0].car.name);
  updateAdvancedGarageUI(state);
  window.renderGarage?.();
}

function buildAdvice(car, stats, favorite) {
  const best = [];
  if (stats.maxSpeed > 1.75) best.push("muy rápido");
  if (stats.acceleration > 1.15) best.push("buena salida");
  if (stats.handling > 1.12) best.push("manejo preciso");
  if ((stats.nitroMax || 100) > 120) best.push("nitro fuerte");

  return `${favorite ? "⭐ Favorito. " : ""}${car.name}: ${best.length ? best.join(", ") : "equilibrado para empezar"}.`;
}

function markFavoriteCards(state) {
  const cards = document.querySelectorAll("#carList .car-card, #carList .list-item, #carList > div");
  cards.forEach((card, index) => {
    card.classList.toggle("favorite-car", isFavorite(index));
  });
}

function normalize(value, min, max) {
  return Math.max(8, Math.min(100, ((value - min) / (max - min)) * 100));
}

function setWidth(id, percent) {
  const el = document.getElementById(id);
  if (el) el.style.width = percent + "%";
}

function isFavorite(index) {
  return garageAdvanced.favorites.includes(String(index));
}

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem("favoriteCars") || "[]");
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem("favoriteCars", JSON.stringify(garageAdvanced.favorites));
}
