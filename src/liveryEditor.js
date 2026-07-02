const STORAGE_KEY = "liveryData";

const DEFAULT_LIVERY = {
  primary: "#ff3333",
  secondary: "#00d4ff",
  finish: "gloss",
  pattern: "stripe",
  intensity: 80,
  neon: "off",
  plate: "ATENEA"
};

export const liveryState = {
  data: loadData()
};

export function setupLiveryEditor(state, showScreen) {
  state.liveryEditor = liveryState;

  document.getElementById("liveryBtn").onclick = () => {
    syncForm(state);
    drawLiveryPreview(state);
    showScreen("liveryScreen");
  };

  ["liveryPrimary", "liverySecondary", "liveryFinish", "liveryPattern", "liveryIntensity", "liveryNeon", "liveryPlate"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = () => {
        readFormToData(state);
        applyLiveryClasses();
        drawLiveryPreview(state);
      };
    }
  });

  document.getElementById("saveLivery").onclick = () => {
    readFormToData(state);
    saveData();
    applyLiveryClasses();
    drawLiveryPreview(state);
    window.showToast?.("Vinilo guardado");
  };

  document.getElementById("resetLivery").onclick = () => {
    const key = getCarKey(state);
    liveryState.data[key] = { ...DEFAULT_LIVERY };
    saveData();
    syncForm(state);
    applyLiveryClasses();
    drawLiveryPreview(state);
    window.showToast?.("Vinilo restaurado");
  };

  applyLiveryClasses();
}

export function updateLiveryEditor(state) {
  applyLiveryClasses();
}

export function getCurrentLivery(state) {
  const key = getCarKey(state);
  if (!liveryState.data[key]) liveryState.data[key] = { ...DEFAULT_LIVERY };
  return liveryState.data[key];
}

function syncForm(state) {
  const livery = getCurrentLivery(state);

  setValue("liveryPrimary", livery.primary);
  setValue("liverySecondary", livery.secondary);
  setValue("liveryFinish", livery.finish);
  setValue("liveryPattern", livery.pattern);
  setValue("liveryIntensity", livery.intensity);
  setValue("liveryNeon", livery.neon);
  setValue("liveryPlate", livery.plate);

  const car = state.manifest?.cars?.[state.selectedCarIndex];
  setText("liveryCurrentCar", car?.name || "Coche seleccionado");
}

function readFormToData(state) {
  const key = getCarKey(state);
  liveryState.data[key] = {
    primary: getValue("liveryPrimary", DEFAULT_LIVERY.primary),
    secondary: getValue("liverySecondary", DEFAULT_LIVERY.secondary),
    finish: getValue("liveryFinish", DEFAULT_LIVERY.finish),
    pattern: getValue("liveryPattern", DEFAULT_LIVERY.pattern),
    intensity: Number(getValue("liveryIntensity", DEFAULT_LIVERY.intensity)),
    neon: getValue("liveryNeon", DEFAULT_LIVERY.neon),
    plate: String(getValue("liveryPlate", DEFAULT_LIVERY.plate)).toUpperCase().slice(0, 10)
  };
}

function drawLiveryPreview(state) {
  const canvas = document.getElementById("liveryPreview");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const l = getCurrentLivery(state);
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#070a14";
  ctx.fillRect(0, 0, w, h);

  drawBackground(ctx, w, h, l);
  drawCar(ctx, w, h, l);
  drawPattern(ctx, w, h, l);
  drawPlate(ctx, w, h, l);
  drawFinishBadge(ctx, l);
}

function drawBackground(ctx, w, h, l) {
  const g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * .65);
  g.addColorStop(0, hexToRgba(l.secondary, .22));
  g.addColorStop(1, "rgba(0,0,0,.15)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = hexToRgba(l.secondary, .22);
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 80, h);
    ctx.stroke();
  }
}

function drawCar(ctx, w, h, l) {
  const cx = w / 2;
  const cy = h / 2 + 18;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.shadowColor = l.neon === "off" ? "transparent" : neonColor(l.neon);
  ctx.shadowBlur = l.neon === "off" ? 0 : 28;

  const bodyGrad = ctx.createLinearGradient(-180, -40, 180, 40);
  bodyGrad.addColorStop(0, shade(l.primary, -18));
  bodyGrad.addColorStop(.5, l.primary);
  bodyGrad.addColorStop(1, shade(l.primary, l.finish === "metal" ? 30 : 8));

  ctx.fillStyle = bodyGrad;
  roundRect(ctx, -190, -42, 380, 82, 28);
  ctx.fill();

  ctx.fillStyle = shade(l.primary, -25);
  roundRect(ctx, -120, -86, 210, 58, 20);
  ctx.fill();

  ctx.fillStyle = "rgba(10,18,30,.92)";
  roundRect(ctx, -86, -76, 138, 42, 16);
  ctx.fill();

  // wheels
  for (const x of [-125, 125]) {
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.arc(x, 48, 31, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d8e0ea";
    ctx.beginPath();
    ctx.arc(x, 48, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  // headlights
  ctx.fillStyle = "#dff9ff";
  roundRect(ctx, -184, -14, 32, 16, 8);
  ctx.fill();
  roundRect(ctx, 152, -14, 32, 16, 8);
  ctx.fill();

  ctx.restore();
}

function drawPattern(ctx, w, h, l) {
  const cx = w / 2;
  const cy = h / 2 + 18;
  const a = Math.max(.2, Math.min(1, l.intensity / 100));

  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = a;
  ctx.fillStyle = l.secondary;
  ctx.strokeStyle = l.secondary;
  ctx.lineWidth = 13;

  if (l.pattern === "stripe") {
    roundRect(ctx, -18, -90, 36, 130, 8);
    ctx.fill();
  } else if (l.pattern === "double") {
    roundRect(ctx, -42, -90, 20, 130, 6);
    ctx.fill();
    roundRect(ctx, 22, -90, 20, 130, 6);
    ctx.fill();
  } else if (l.pattern === "lightning") {
    ctx.beginPath();
    ctx.moveTo(-120, -38);
    ctx.lineTo(-12, -38);
    ctx.lineTo(-52, 12);
    ctx.lineTo(118, 12);
    ctx.lineTo(10, 62);
    ctx.lineTo(38, 24);
    ctx.lineTo(-118, 24);
    ctx.closePath();
    ctx.fill();
  } else if (l.pattern === "racing") {
    ctx.beginPath();
    ctx.moveTo(-190, 25);
    ctx.lineTo(190, -25);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-190, 45);
    ctx.lineTo(190, -5);
    ctx.stroke();
  } else if (l.pattern === "cyber") {
    for (let i = -150; i <= 150; i += 45) {
      ctx.strokeRect(i, -48, 26, 96);
    }
  }

  ctx.restore();
}

function drawPlate(ctx, w, h, l) {
  ctx.save();
  ctx.translate(w / 2, h / 2 + 18);
  ctx.fillStyle = "#f8fafc";
  roundRect(ctx, -48, 30, 96, 24, 5);
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(l.plate || "ATENEA", 0, 42);
  ctx.restore();
}

function drawFinishBadge(ctx, l) {
  ctx.fillStyle = "rgba(0,0,0,.42)";
  roundRect(ctx, 16, 16, 150, 34, 12);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px Arial";
  ctx.fillText("Acabado: " + finishLabel(l.finish), 28, 38);
}

function applyLiveryClasses() {
  document.body.classList.remove("neon-blue", "neon-pink", "neon-green", "neon-orange");
  const any = Object.values(liveryState.data)[0];
  if (!any || any.neon === "off") return;
  document.body.classList.add("neon-" + any.neon);
}

function getCarKey(state) {
  return "car_" + Number(state.selectedCarIndex || 0);
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(liveryState.data));
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function getValue(id, fallback) {
  const el = document.getElementById(id);
  return el ? el.value : fallback;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexToRgba(hex, alpha) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function shade(hex, percent) {
  const n = parseInt(String(hex).replace("#", ""), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.max(0, Math.min(255, r + percent));
  g = Math.max(0, Math.min(255, g + percent));
  b = Math.max(0, Math.min(255, b + percent));
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function neonColor(neon) {
  return {
    blue: "#00d4ff",
    pink: "#ff33cc",
    green: "#44ff88",
    orange: "#ff8a00"
  }[neon] || "transparent";
}

function finishLabel(finish) {
  return {
    gloss: "Brillante",
    matte: "Mate",
    metal: "Metalizado",
    carbon: "Carbono"
  }[finish] || finish;
}
