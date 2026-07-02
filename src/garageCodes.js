const STORAGE_KEY = "garageCodesData";
const CODE_PREFIX = "RACEGARAGE-V58:";

export const garageCodesState = {
  data: loadData(),
  lastCode: ""
};

export function setupGarageCodes(state, showScreen) {
  state.garageCodes = garageCodesState;

  document.getElementById("garageCodesBtn").onclick = () => {
    updateGarageCodesUI(state);
    showScreen("garageCodesScreen");
  };

  document.getElementById("generateGarageCode").onclick = () => generateCode(state);
  document.getElementById("copyGarageCode").onclick = () => copyCode();
  document.getElementById("importGarageCode").onclick = () => importCode(state);
  document.getElementById("clearGarageCodes").onclick = () => {
    garageCodesState.data.history = [];
    saveData();
    updateGarageCodesUI(state);
    window.showToast?.("Historial borrado");
  };

  updateGarageCodesUI(state);
}

export function updateGarageCodes(state) {
  updateGarageCodeHUD();
}

function generateCode(state) {
  const payload = collectPayload(state);
  const code = CODE_PREFIX + encodePayload(payload);

  garageCodesState.lastCode = code;
  garageCodesState.data.generated += 1;
  garageCodesState.data.history.unshift({
    id: Date.now(),
    car: payload.carName,
    date: new Date().toISOString(),
    code
  });
  garageCodesState.data.history = garageCodesState.data.history.slice(0, 10);

  const out = document.getElementById("garageCodeOutput");
  if (out) out.value = code;

  setText("garageCodeStatus", "Código generado correctamente.");
  saveData();
  updateGarageCodesUI(state);
  window.showToast?.("Código de garaje generado");
}

async function copyCode() {
  const code = document.getElementById("garageCodeOutput")?.value || garageCodesState.lastCode;
  if (!code) {
    window.showToast?.("No hay código para copiar");
    return;
  }

  try {
    await navigator.clipboard.writeText(code);
    window.showToast?.("Código copiado");
  } catch {
    const out = document.getElementById("garageCodeOutput");
    if (out) {
      out.focus();
      out.select();
    }
    window.showToast?.("Selecciona y copia el código");
  }
}

function importCode(state) {
  const raw = (document.getElementById("garageCodeInput")?.value || "").trim();
  if (!raw.startsWith(CODE_PREFIX)) {
    setText("garageCodeStatus", "Código no válido.");
    window.showToast?.("Código no válido");
    return;
  }

  try {
    const payload = decodePayload(raw.slice(CODE_PREFIX.length));
    applyPayload(state, payload);

    garageCodesState.data.imported += 1;
    garageCodesState.data.lastImport = new Date().toISOString();
    saveData();

    setText("garageCodeStatus", "Importado: " + (payload.carName || "configuración"));
    updateGarageCodesUI(state);
    window.showToast?.("Configuración importada");
  } catch (err) {
    console.error(err);
    setText("garageCodeStatus", "Error al importar el código.");
    window.showToast?.("Error al importar");
  }
}

function collectPayload(state) {
  const selectedCarIndex = Number(state.selectedCarIndex || localStorage.getItem("selectedCarIndex") || 0);
  const car = state.manifest?.cars?.[selectedCarIndex] || {};

  return {
    version: 58,
    createdAt: new Date().toISOString(),
    carIndex: selectedCarIndex,
    carName: car.name || "Coche",
    selectedMapIndex: Number(state.selectedMapIndex || localStorage.getItem("selectedMapIndex") || 0),
    customizationData: safeJSON(localStorage.getItem("customizationData"), null),
    liveryEditorData: safeJSON(localStorage.getItem("liveryEditorData"), null),
    hudEditorData: safeJSON(localStorage.getItem("hudEditorData"), null),
    graphicsSettingsData: safeJSON(localStorage.getItem("graphicsSettingsData"), null),
    engineAudioProData: safeJSON(localStorage.getItem("engineAudioProData"), null),
    controlSettingsData: safeJSON(localStorage.getItem("controlSettingsData"), null)
  };
}

function applyPayload(state, payload) {
  if (typeof payload.carIndex === "number") {
    state.selectedCarIndex = payload.carIndex;
    localStorage.setItem("selectedCarIndex", String(payload.carIndex));
  }

  if (typeof payload.selectedMapIndex === "number") {
    state.selectedMapIndex = payload.selectedMapIndex;
    localStorage.setItem("selectedMapIndex", String(payload.selectedMapIndex));
  }

  setJSON("customizationData", payload.customizationData);
  setJSON("liveryEditorData", payload.liveryEditorData);
  setJSON("hudEditorData", payload.hudEditorData);
  setJSON("graphicsSettingsData", payload.graphicsSettingsData);
  setJSON("engineAudioProData", payload.engineAudioProData);
  setJSON("controlSettingsData", payload.controlSettingsData);
}

function updateGarageCodesUI(state) {
  const selectedCarIndex = Number(state.selectedCarIndex || localStorage.getItem("selectedCarIndex") || 0);
  const car = state.manifest?.cars?.[selectedCarIndex] || {};
  setText("codesCarName", car.name || "Coche");
  renderHistory();
  updateGarageCodeHUD();
}

function renderHistory() {
  const list = document.getElementById("garageCodesHistory");
  if (!list) return;

  if (!garageCodesState.data.history.length) {
    list.innerHTML = "<p>No hay códigos generados todavía.</p>";
    return;
  }

  list.innerHTML = "";
  garageCodesState.data.history.forEach(item => {
    const row = document.createElement("div");
    row.className = "code-row";
    row.innerHTML = `
      <b>${escapeHTML(item.car)}</b>
      <p>${formatDate(item.date)}</p>
      <button data-action="load">USAR</button>
    `;
    row.querySelector('[data-action="load"]').onclick = () => {
      const out = document.getElementById("garageCodeOutput");
      if (out) out.value = item.code;
      garageCodesState.lastCode = item.code;
      setText("garageCodeStatus", "Código cargado desde historial.");
    };
    list.appendChild(row);
  });
}

function updateGarageCodeHUD() {
  const hud = document.getElementById("hudGarageCode");
  if (!hud) return;
  hud.textContent = garageCodesState.data.generated
    ? garageCodesState.data.generated + " gen"
    : "--";
}

function encodePayload(payload) {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

function decodePayload(code) {
  const json = decodeURIComponent(escape(atob(code)));
  return JSON.parse(json);
}

function safeJSON(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setJSON(key, value) {
  if (value === undefined || value === null) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && Array.isArray(data.history) ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    generated: 0,
    imported: 0,
    lastImport: null,
    history: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(garageCodesState.data));
}

function formatDate(date) {
  try {
    return new Date(date).toLocaleString();
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
