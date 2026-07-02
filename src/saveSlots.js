import { collectSaveData, importSaveObject } from "./saveSystem.js";

const SLOT_PREFIX = "saveSlot_";
const AUTOSAVE_KEY = "saveSlot_auto";

export const saveSlotsState = {
  autosave: localStorage.getItem("autosaveEnabled") !== "off",
  timer: 0
};

export function setupSaveSlots(state) {
  updateSaveSlotsUI();

  document.querySelectorAll(".saveSlot").forEach(btn => {
    btn.onclick = () => saveToSlot(state, btn.dataset.slot);
  });

  document.querySelectorAll(".loadSlot").forEach(btn => {
    btn.onclick = () => loadFromSlot(btn.dataset.slot);
  });

  document.querySelectorAll(".deleteSlot").forEach(btn => {
    btn.onclick = () => deleteSlot(btn.dataset.slot);
  });

  const autoBtn = document.getElementById("toggleAutosave");
  if (autoBtn) {
    autoBtn.onclick = () => {
      saveSlotsState.autosave = !saveSlotsState.autosave;
      localStorage.setItem("autosaveEnabled", saveSlotsState.autosave ? "on" : "off");
      updateSaveSlotsUI();
      window.showToast?.("Autosave: " + (saveSlotsState.autosave ? "ON" : "OFF"));
    };
  }

  const loadAuto = document.getElementById("loadAutosave");
  if (loadAuto) loadAuto.onclick = () => loadAutosave();
}

export function updateSaveSlots(state, dt) {
  if (!saveSlotsState.autosave) return;

  saveSlotsState.timer += dt;
  if (saveSlotsState.timer > 25) {
    saveSlotsState.timer = 0;
    writeSave(AUTOSAVE_KEY, collectSaveData(state), true);
    updateSaveSlotsUI();
  }
}

export function saveToSlot(state, slot) {
  const data = collectSaveData(state);
  data.slot = slot;
  writeSave(SLOT_PREFIX + slot, data, false);
  updateSaveSlotsUI();
  window.showToast?.("Guardado en slot " + slot);
}

export function loadFromSlot(slot) {
  const data = readSave(SLOT_PREFIX + slot);
  if (!data) {
    window.showToast?.("Slot vacío");
    return;
  }

  if (!confirm("¿Cargar slot " + slot + "? Se reemplazará el progreso actual.")) return;
  importSaveObject(data);
}

export function deleteSlot(slot) {
  if (!confirm("¿Borrar slot " + slot + "?")) return;
  localStorage.removeItem(SLOT_PREFIX + slot);
  updateSaveSlotsUI();
  window.showToast?.("Slot borrado");
}

export function loadAutosave() {
  const data = readSave(AUTOSAVE_KEY);
  if (!data) {
    window.showToast?.("No hay autosave");
    return;
  }

  if (!confirm("¿Cargar autosave?")) return;
  importSaveObject(data);
}

export function updateSaveSlotsUI() {
  for (const slot of ["1", "2", "3"]) {
    const el = document.getElementById("slotSummary_" + slot);
    if (!el) continue;
    el.innerHTML = summarizeSave(readSave(SLOT_PREFIX + slot));
  }

  const auto = document.getElementById("autosaveSummary");
  if (auto) auto.innerHTML = summarizeSave(readSave(AUTOSAVE_KEY));

  const toggle = document.getElementById("toggleAutosave");
  if (toggle) toggle.textContent = "AUTOSAVE: " + (saveSlotsState.autosave ? "ON" : "OFF");
}

function writeSave(key, data, silent) {
  const wrapped = {
    ...data,
    savedAt: new Date().toISOString()
  };

  localStorage.setItem(key, JSON.stringify(wrapped));
  if (!silent) console.log("Saved", key, wrapped);
}

function readSave(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function summarizeSave(data) {
  if (!data) return "Vacío";

  const progress = data.playerProgress || {};
  const date = data.savedAt || data.exportedAt || data.createdAt;
  const coins = data.walletCoins ?? 0;

  return `
    Nivel: <b>${progress.level || 1}</b><br>
    Monedas: <b>${coins}</b><br>
    Fecha: <b>${formatDate(date)}</b>
  `;
}

function formatDate(date) {
  if (!date) return "--";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "--";
  }
}
