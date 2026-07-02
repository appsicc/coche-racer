const STORAGE_KEY = "damageProData";

export const damageProState = {
  data: loadData(),
  lastDamage: 0,
  lastLogAt: 0
};

export function setupDamagePro(state, showScreen) {
  state.damagePro = damageProState;

  document.getElementById("damageProBtn").onclick = () => {
    updateDamagePro(state);
    showScreen("damageProScreen");
  };

  document.getElementById("useRepairKit").onclick = () => {
    useRepairKit(state);
  };

  document.getElementById("buyRepairKit").onclick = () => {
    buyRepairKit(state);
  };

  document.getElementById("upgradeCarArmor").onclick = () => {
    upgradeArmor(state);
  };

  document.getElementById("clearDamageLog").onclick = () => {
    damageProState.data.log = [];
    saveData();
    updateDamageProUI(state);
    window.showToast?.("Registro de daños borrado");
  };

  updateDamageProUI(state);
}

export function updateDamagePro(state) {
  applyArmorEffect(state);
  detectDamageChanges(state);
  updateDamageClasses(state);
  updateDamageProUI(state);
  updateDamageProHUD(state);
}

function applyArmorEffect(state) {
  const armor = damageProState.data.armorLevel || 0;
  if (!armor || state._damageProArmorApplied) return;

  state._damageProArmorApplied = true;
  state.damageResistance = Math.min(0.45, armor * 0.06);
}

function detectDamageChanges(state) {
  const damage = Math.round(Number(state.damage || 0));
  const diff = damage - damageProState.lastDamage;

  if (diff >= 8 && performance.now() - damageProState.lastLogAt > 1200) {
    addLog("Impacto fuerte", "+" + diff + "% daño");
    damageProState.lastLogAt = performance.now();
  }

  if (damage >= 75 && damageProState.lastDamage < 75) {
    addLog("Daño crítico", "Busca reparación urgente");
    window.showToast?.("Daño crítico: usa un kit");
  } else if (damage >= 45 && damageProState.lastDamage < 45) {
    addLog("Daño medio", "El coche empieza a sufrir");
  }

  damageProState.lastDamage = damage;
}

function useRepairKit(state) {
  if (damageProState.data.repairKits <= 0) {
    window.showToast?.("No tienes kits de reparación");
    return;
  }

  const damage = Number(state.damage || 0);
  if (damage <= 3) {
    window.showToast?.("El coche ya está casi perfecto");
    return;
  }

  damageProState.data.repairKits -= 1;
  state.damage = Math.max(0, damage - 42);
  addLog("Kit usado", "Daño reducido a " + Math.round(state.damage) + "%");
  saveData();
  updateDamageProUI(state);
  window.showToast?.("Kit usado: reparación rápida");
}

function buyRepairKit(state) {
  const price = 180 + damageProState.data.repairKits * 25;
  const coins = Number(localStorage.getItem("walletCoins") || 0);

  if (coins < price) {
    window.showToast?.("Faltan monedas: " + price);
    return;
  }

  localStorage.setItem("walletCoins", String(coins - price));
  damageProState.data.repairKits += 1;
  addLog("Kit comprado", "-" + price + " monedas");
  saveData();
  updateDamageProUI(state);
  window.showToast?.("Kit comprado");
}

function upgradeArmor(state) {
  const level = damageProState.data.armorLevel || 0;
  if (level >= 5) {
    window.showToast?.("Resistencia al máximo");
    return;
  }

  const price = 350 + level * 260;
  const coins = Number(localStorage.getItem("walletCoins") || 0);

  if (coins < price) {
    window.showToast?.("Faltan monedas: " + price);
    return;
  }

  localStorage.setItem("walletCoins", String(coins - price));
  damageProState.data.armorLevel += 1;
  state._damageProArmorApplied = false;
  addLog("Resistencia mejorada", "Nivel " + damageProState.data.armorLevel);
  saveData();
  updateDamageProUI(state);
  window.showToast?.("Resistencia mejorada");
}

function updateDamageProUI(state) {
  const damage = Math.round(Number(state.damage || 0));
  const status = getDamageStatus(damage);

  setText("damageProValue", damage + "%");
  setText("damageProStatus", status.label);
  setText("repairKitCount", damageProState.data.repairKits);
  setText("carArmorLevel", "Nv. " + damageProState.data.armorLevel);
  setText("damageProAdvice", getAdvice(damage));

  const fill = document.getElementById("damageProFill");
  if (fill) fill.style.width = damage + "%";

  const log = document.getElementById("damageProLog");
  if (log) {
    if (!damageProState.data.log.length) {
      log.innerHTML = "<p>Sin daños registrados todavía.</p>";
    } else {
      log.innerHTML = damageProState.data.log.map(item => `
        <div class="damage-log-row">
          <b>${escapeHTML(item.title)}</b>
          <p>${escapeHTML(item.text)} · ${formatTime(item.time)}</p>
        </div>
      `).join("");
    }
  }
}

function updateDamageClasses(state) {
  const damage = Number(state.damage || 0);
  document.body.classList.toggle("damage-warning", damage >= 45 && damage < 75);
  document.body.classList.toggle("damage-critical", damage >= 75);
}

function updateDamageProHUD(state) {
  const hud = document.getElementById("hudDamagePro");
  if (!hud) return;

  const damage = Math.round(Number(state.damage || 0));
  hud.textContent = damage + "% · kits " + damageProState.data.repairKits;
}

function getDamageStatus(damage) {
  if (damage >= 85) return { label: "Crítico" };
  if (damage >= 60) return { label: "Grave" };
  if (damage >= 35) return { label: "Medio" };
  if (damage >= 10) return { label: "Leve" };
  return { label: "Perfecto" };
}

function getAdvice(damage) {
  if (damage >= 85) return "El coche está al límite. Usa un kit o ve al taller cuanto antes.";
  if (damage >= 60) return "Con este daño perderás control en curvas y persecuciones.";
  if (damage >= 35) return "Daño medio. Puedes seguir, pero evita choques fuertes.";
  if (damage >= 10) return "Daño leve. Mantén conducción limpia para no empeorar.";
  return "Coche perfecto. Ideal para carreras, drift y persecuciones.";
}

function addLog(title, text) {
  damageProState.data.log.unshift({
    title,
    text,
    time: new Date().toISOString()
  });
  damageProState.data.log = damageProState.data.log.slice(0, 25);
  saveData();
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.repairKits === "number" ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    repairKits: 2,
    armorLevel: 0,
    log: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(damageProState.data));
}

function formatTime(date) {
  try {
    return new Date(date).toLocaleTimeString();
  } catch {
    return "--";
  }
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
