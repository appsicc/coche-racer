const STORAGE_KEY = "posterCreatorData";

const TEMPLATES = {
  neon: {
    label: "Neón gamer",
    a: "#08111f",
    b: "#00d4ff",
    c: "#ff33cc",
    tag: "NEON"
  },
  storm: {
    label: "Tormenta épica",
    a: "#05070f",
    b: "#4f8cff",
    c: "#ffd166",
    tag: "STORM"
  },
  champion: {
    label: "Campeón",
    a: "#120b05",
    b: "#ffd166",
    c: "#ff8a00",
    tag: "WINNER"
  },
  minimal: {
    label: "Minimalista",
    a: "#10131a",
    b: "#cdd7e6",
    c: "#44ff88",
    tag: "CLEAN"
  },
  wanted: {
    label: "Persecución",
    a: "#110509",
    b: "#ff3355",
    c: "#00d4ff",
    tag: "WANTED"
  }
};

export const posterCreatorState = {
  data: loadData(),
  lastDataURL: ""
};

export function setupPosterCreator(state, showScreen) {
  state.posterCreator = posterCreatorState;

  document.getElementById("posterBtn").onclick = () => {
    updatePosterInfo(state);
    generatePoster(state);
    showScreen("posterScreen");
  };

  document.getElementById("generatePoster").onclick = () => generatePoster(state);
  document.getElementById("downloadPoster").onclick = () => downloadPoster();
  document.getElementById("clearPosterHistory").onclick = () => {
    posterCreatorState.data.history = [];
    saveData();
    updatePosterInfo(state);
    window.showToast?.("Historial de pósters borrado");
  };

  ["posterTitle","posterSubtitle","posterTemplate","posterShowCar","posterShowStats","posterShowName","posterWide"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.oninput = () => generatePoster(state, false);
  });

  updatePosterInfo(state);
}

export function updatePosterCreator(state) {
  updatePosterHUD();
}

function generatePoster(state, addHistory = true) {
  const canvas = document.getElementById("posterCanvas");
  if (!canvas) return;

  const wide = !!document.getElementById("posterWide")?.checked;
  canvas.width = wide ? 1280 : 1080;
  canvas.height = wide ? 720 : 1080;

  const ctx = canvas.getContext("2d");
  const templateKey = document.getElementById("posterTemplate")?.value || "neon";
  const tpl = TEMPLATES[templateKey] || TEMPLATES.neon;

  const title = (document.getElementById("posterTitle")?.value || "CARRERA EXTREMA").toUpperCase();
  const subtitle = document.getElementById("posterSubtitle")?.value || "Neon City Challenge";
  const showCar = !!document.getElementById("posterShowCar")?.checked;
  const showStats = !!document.getElementById("posterShowStats")?.checked;
  const showName = !!document.getElementById("posterShowName")?.checked;

  drawBackground(ctx, canvas, tpl);
  drawSpeedLines(ctx, canvas, tpl);

  if (showCar) drawCarPoster(ctx, canvas, tpl, state);
  drawTitle(ctx, canvas, title, subtitle, tpl);
  drawBadges(ctx, canvas, tpl, state);

  if (showStats) drawStats(ctx, canvas, tpl, state);
  if (showName) drawCarName(ctx, canvas, tpl, state);

  drawFooter(ctx, canvas, tpl);

  posterCreatorState.lastDataURL = canvas.toDataURL("image/png");

  if (addHistory) {
    posterCreatorState.data.generated += 1;
    posterCreatorState.data.history.unshift({
      id: Date.now(),
      title,
      template: tpl.label,
      car: getCarName(state),
      date: new Date().toISOString()
    });
    posterCreatorState.data.history = posterCreatorState.data.history.slice(0, 12);
    saveData();
    window.showToast?.("Póster generado");
  }

  updatePosterInfo(state);
}

function drawBackground(ctx, canvas, tpl) {
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0, tpl.a);
  g.addColorStop(0.55, "#050711");
  g.addColorStop(1, tpl.b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 80; i++) {
    ctx.globalAlpha = 0.08 + Math.random() * 0.14;
    ctx.fillStyle = i % 2 ? tpl.b : tpl.c;
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSpeedLines(ctx, canvas, tpl) {
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = tpl.b;
  ctx.lineWidth = 5;

  for (let i = 0; i < 20; i++) {
    const y = canvas.height * 0.35 + i * 38;
    ctx.beginPath();
    ctx.moveTo(-60, y);
    ctx.lineTo(canvas.width * (0.35 + Math.random() * 0.7), y - 130 - Math.random() * 260);
    ctx.stroke();
  }

  ctx.strokeStyle = tpl.c;
  ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    const y = canvas.height * 0.15 + i * 48;
    ctx.beginPath();
    ctx.moveTo(canvas.width + 80, y);
    ctx.lineTo(canvas.width * (0.25 + Math.random() * 0.7), y + 90 + Math.random() * 220);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCarPoster(ctx, canvas, tpl, state) {
  const cx = canvas.width * 0.55;
  const cy = canvas.height * 0.58;
  const scale = canvas.width > canvas.height ? 1 : 0.88;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.08);

  ctx.shadowColor = tpl.c;
  ctx.shadowBlur = 38;

  const carColor = getCarColor(state);
  ctx.fillStyle = "rgba(0,0,0,.55)";
  roundRect(ctx, -270 * scale, 90 * scale, 560 * scale, 46 * scale, 30 * scale);
  ctx.fill();

  const carGrad = ctx.createLinearGradient(-260 * scale, -20, 260 * scale, 90);
  carGrad.addColorStop(0, shade(carColor, -30));
  carGrad.addColorStop(0.45, carColor);
  carGrad.addColorStop(1, shade(carColor, 45));

  ctx.fillStyle = carGrad;
  roundRect(ctx, -300 * scale, -20 * scale, 610 * scale, 125 * scale, 42 * scale);
  ctx.fill();

  ctx.fillStyle = "rgba(6,12,22,.9)";
  roundRect(ctx, -120 * scale, -92 * scale, 245 * scale, 95 * scale, 34 * scale);
  ctx.fill();

  ctx.fillStyle = "rgba(0,212,255,.55)";
  roundRect(ctx, -88 * scale, -74 * scale, 76 * scale, 52 * scale, 18 * scale);
  ctx.fill();
  roundRect(ctx, 20 * scale, -74 * scale, 76 * scale, 52 * scale, 18 * scale);
  ctx.fill();

  ctx.fillStyle = "#06070b";
  ctx.beginPath();
  ctx.arc(-195 * scale, 95 * scale, 54 * scale, 0, Math.PI * 2);
  ctx.arc(205 * scale, 95 * scale, 54 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#cdd7e6";
  ctx.beginPath();
  ctx.arc(-195 * scale, 95 * scale, 24 * scale, 0, Math.PI * 2);
  ctx.arc(205 * scale, 95 * scale, 24 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = tpl.c;
  roundRect(ctx, 245 * scale, 8 * scale, 70 * scale, 28 * scale, 14 * scale);
  ctx.fill();

  ctx.restore();
}

function drawTitle(ctx, canvas, title, subtitle, tpl) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.shadowColor = tpl.c;
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${Math.round(canvas.width * 0.07)}px Arial Black, Impact, Arial`;
  wrapTitle(ctx, title, 54, canvas.height * 0.18, canvas.width * 0.72, Math.round(canvas.width * 0.073));

  ctx.shadowBlur = 8;
  ctx.fillStyle = tpl.b;
  ctx.font = `800 ${Math.round(canvas.width * 0.028)}px Arial`;
  ctx.fillText(subtitle, 60, canvas.height * 0.33);

  ctx.restore();
}

function drawBadges(ctx, canvas, tpl, state) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = tpl.c;
  roundRect(ctx, canvas.width - 260, 44, 205, 58, 20);
  ctx.fill();

  ctx.fillStyle = "#06111b";
  ctx.font = "900 26px Arial";
  ctx.fillText(tpl.tag, canvas.width - 158, 82);

  const wanted = Number(state.policeAdvanced?.wanted || 0);
  if (wanted > 0) {
    ctx.fillStyle = "#ff3355";
    roundRect(ctx, canvas.width - 255, 122, 200, 50, 18);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "900 22px Arial";
    ctx.fillText("BUSCADO " + wanted + "★", canvas.width - 155, 154);
  }
  ctx.restore();
}

function drawStats(ctx, canvas, tpl, state) {
  const speed = Math.round(Math.abs(state.speed || 0) * 180);
  const damage = Math.round(Number(state.damage || 0));
  const bestRank = safeJSON(localStorage.getItem("skillChallengesData"), {})?.bestRank || "--";

  const stats = [
    ["VEL", speed + " KM/H"],
    ["DAÑO", damage + "%"],
    ["RANGO", bestRank]
  ];

  const x = 60;
  let y = canvas.height - 170;

  ctx.save();
  stats.forEach(([k, v]) => {
    ctx.fillStyle = "rgba(0,0,0,.55)";
    roundRect(ctx, x, y, 250, 48, 16);
    ctx.fill();
    ctx.fillStyle = tpl.b;
    ctx.font = "900 17px Arial";
    ctx.fillText(k, x + 18, y + 31);
    ctx.fillStyle = "#fff";
    ctx.font = "900 21px Arial";
    ctx.fillText(v, x + 92, y + 31);
    y += 58;
  });
  ctx.restore();
}

function drawCarName(ctx, canvas, tpl, state) {
  ctx.save();
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(0,0,0,.50)";
  roundRect(ctx, canvas.width - 430, canvas.height - 92, 370, 50, 18);
  ctx.fill();

  ctx.fillStyle = tpl.b;
  ctx.font = "900 22px Arial";
  ctx.fillText(getCarName(state), canvas.width - 80, canvas.height - 60);
  ctx.restore();
}

function drawFooter(ctx, canvas, tpl) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.font = "700 16px Arial";
  ctx.fillText("RACING REALISTA · V59", 60, canvas.height - 28);

  ctx.textAlign = "right";
  ctx.fillStyle = tpl.c;
  ctx.font = "900 16px Arial";
  ctx.fillText("POSTER CREATOR", canvas.width - 60, canvas.height - 28);
  ctx.restore();
}

function downloadPoster() {
  const canvas = document.getElementById("posterCanvas");
  if (!canvas) {
    window.showToast?.("No hay póster");
    return;
  }

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "poster_racing_realista_v59.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function updatePosterInfo(state) {
  const info = document.getElementById("posterInfo");
  if (info) {
    const skill = safeJSON(localStorage.getItem("skillChallengesData"), {});
    const routes = safeJSON(localStorage.getItem("customRoutesData"), {});
    const codes = safeJSON(localStorage.getItem("garageCodesData"), {});

    const lines = [
      ["Coche", getCarName(state)],
      ["Mapa", state.manifest?.maps?.[state.selectedMapIndex]?.name || "Mapa"],
      ["Rango skill", skill.bestRank || "--"],
      ["Rutas guardadas", routes.routes?.length || 0],
      ["Códigos generados", codes.generated || 0]
    ];

    info.innerHTML = lines.map(([k, v]) => `<div class="poster-row"><b>${k}:</b> ${escapeHTML(v)}</div>`).join("");
  }

  const history = document.getElementById("posterHistory");
  if (history) {
    if (!posterCreatorState.data.history.length) {
      history.innerHTML = "<p>No hay pósters generados todavía.</p>";
    } else {
      history.innerHTML = posterCreatorState.data.history.map(item => `
        <div class="poster-row">
          <b>${escapeHTML(item.title)}</b>
          <p>${escapeHTML(item.template)} · ${escapeHTML(item.car)}</p>
          <p>${formatDate(item.date)}</p>
        </div>
      `).join("");
    }
  }

  updatePosterHUD();
}

function updatePosterHUD() {
  const hud = document.getElementById("hudPoster");
  if (!hud) return;
  hud.textContent = posterCreatorState.data.generated ? posterCreatorState.data.generated + " PNG" : "--";
}

function getCarName(state) {
  return state.manifest?.cars?.[state.selectedCarIndex]?.name || "Coche";
}

function getCarColor(state) {
  const colors = ["#ff3333", "#ff8a00", "#cdd7e6", "#2288ff", "#44ff88", "#ff33cc", "#ffd166"];
  return colors[Number(state.selectedCarIndex || 0) % colors.length];
}

function wrapTitle(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }

  ctx.fillText(line, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt;
  let g = ((n >> 8) & 255) + amt;
  let b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return "#" + (b | (g << 8) | (r << 16)).toString(16).padStart(6, "0");
}

function safeJSON(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
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
    history: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posterCreatorState.data));
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
