import { addCoins, spendCoins, getNitroMax } from "./shop.js";
import { addXP } from "./progress.js";

export function setupWorkshop(state) {
  state.workshop = {
    lastRepairAt: localStorage.getItem("lastRepairAt") || null
  };
}

export function setupWorkshopUI(state, showScreen) {
  document.getElementById("workshopBtn").onclick = () => {
    updateWorkshopUI(state);
    showScreen("workshopScreen");
  };

  document.getElementById("repairCar").onclick = () => repairCar(state, false);
  document.getElementById("fullService").onclick = () => repairCar(state, true);

  updateWorkshopUI(state);
}

export function updateWorkshopUI(state) {
  const damage = Math.round(state.damage || Number(localStorage.getItem("lastDamage") || 0));
  const health = Math.max(0, 100 - damage);
  const cost = getRepairCost(damage, false);
  const fullCost = getRepairCost(damage, true);

  const ring = document.querySelector(".car-health-ring");
  const healthText = document.getElementById("workshopHealth");
  const status = document.getElementById("workshopStatus");
  const repairCost = document.getElementById("repairCost");
  const advice = document.getElementById("workshopAdvice");

  if (ring) {
    const color = health > 70 ? "#44ff88" : health > 35 ? "#ffd166" : "#ff5555";
    ring.style.background = `conic-gradient(${color} ${health}%, rgba(255,255,255,.12) 0%)`;
    ring.style.boxShadow = `0 0 24px ${color}55`;
  }

  if (healthText) healthText.textContent = health + "%";
  if (repairCost) repairCost.textContent = cost + " monedas / revisión " + fullCost + " monedas";

  if (status) {
    status.textContent =
      damage <= 0 ? "Coche perfecto." :
      damage < 25 ? "Daños leves." :
      damage < 60 ? "Daños medios. Recomendado reparar." :
      "Daños graves. El coche necesita taller.";
  }

  if (advice) {
    advice.textContent =
      damage <= 0 ? "Puedes salir a correr sin tocar nada." :
      damage < 25 ? "Puedes seguir, pero perderás estabilidad si acumulas más golpes." :
      damage < 60 ? "Repara antes de carreras importantes o persecuciones." :
      "Reparación urgente: con daños altos el coche será más difícil de controlar.";
  }
}

export function saveDamageSnapshot(state) {
  localStorage.setItem("lastDamage", String(Math.round(state.damage || 0)));
}

function repairCar(state, fullService) {
  const damage = Math.round(state.damage || Number(localStorage.getItem("lastDamage") || 0));

  if (damage <= 0 && !fullService) {
    window.showToast?.("El coche ya está perfecto");
    updateWorkshopUI(state);
    return;
  }

  const cost = getRepairCost(damage, fullService);

  if (!spendCoins(state, cost)) {
    window.showToast?.("No tienes monedas suficientes");
    return;
  }

  state.damage = 0;
  state.nitro = getNitroMax(state);
  localStorage.setItem("lastDamage", "0");
  localStorage.setItem("lastRepairAt", new Date().toISOString());

  if (fullService) addXP(state, 30);

  window.showToast?.(fullService ? "Revisión completa hecha" : "Coche reparado");
  updateWorkshopUI(state);
}

function getRepairCost(damage, fullService) {
  const base = Math.max(0, Math.round(damage * 3));
  return fullService ? Math.max(80, base + 80) : base;
}
