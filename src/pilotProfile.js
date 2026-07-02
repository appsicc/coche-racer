const STORAGE_KEY = "pilotProfileData";

export const pilotProfileState = {
  data: loadData()
};

export function setupPilotProfile(state, showScreen) {
  state.pilotProfile = pilotProfileState;

  document.getElementById("pilotProfileBtn").onclick = () => {
    syncPilotForm();
    updatePilotProfile(state);
    showScreen("pilotProfileScreen");
  };

  document.getElementById("savePilotProfile").onclick = () => {
    readPilotForm();
    saveData();
    updatePilotProfile(state);
    window.showToast?.("Perfil de piloto guardado");
  };

  document.getElementById("generatePilotCard").onclick = () => {
    readPilotForm();
    saveData();
    drawPilotCard(state);
    updatePilotProfile(state);
    window.showToast?.("Tarjeta generada");
  };

  document.getElementById("copyPilotSummary").onclick = async () => {
    const text = buildShareText(state);
    const area = document.getElementById("pilotShareText");
    if (area) area.value = text;

    try {
      await navigator.clipboard.writeText(text);
      window.showToast?.("Resumen copiado");
    } catch {
      area?.focus();
      area?.select();
      window.showToast?.("Selecciona y copia el resumen");
    }
  };

  document.getElementById("exportPilotProfile").onclick = () => exportProfile(state);

  ["pilotNameInput","pilotMottoInput"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.oninput = () => {
      readPilotForm();
      updatePilotProfile(state);
    };
  });

  syncPilotForm();
  updatePilotProfile(state);
}

export function updatePilotProfile(state) {
  const rating = calculateRating(state);
  const rank = getRank(rating);

  setText("pilotRank", rank);
  setText("pilotRating", rating);
  renderHighlights(state);
  drawPilotCard(state);

  const area = document.getElementById("pilotShareText");
  if (area) area.value = buildShareText(state);

  updatePilotHUD(rank);
}

function renderHighlights(state) {
  const box = document.getElementById("pilotHighlights");
  if (!box) return;

  const h = getHighlights(state);
  box.innerHTML = h.map(item => `
    <div class="pilot-row">
      <b>${escapeHTML(item.label)}</b>
      <p>${escapeHTML(item.value)}</p>
    </div>
  `).join("");
}

function drawPilotCard(state) {
  const canvas = document.getElementById("pilotCardCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const rating = calculateRating(state);
  const rank = getRank(rating);
  const name = pilotProfileState.data.name || "Piloto Neon";
  const motto = pilotProfileState.data.motto || "Vidas solo hay una, a disfrutarla al máximo";
  const car = getCarName(state);
  const season = safeJSON(localStorage.getItem("seasonPassData"), {});
  const sponsor = safeJSON(localStorage.getItem("sponsorsData"), {});
  const skill = safeJSON(localStorage.getItem("skillChallengesData"), {});

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#06111f");
  g.addColorStop(0.55, "#0a0716");
  g.addColorStop(1, "#24113a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = i % 2 ? "#00d4ff" : "#ff33cc";
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(255,255,255,.08)";
  roundRect(ctx, 40, 42, w - 80, h - 84, 30);
  ctx.fill();

  ctx.strokeStyle = "rgba(0,212,255,.55)";
  ctx.lineWidth = 3;
  roundRect(ctx, 40, 42, w - 80, h - 84, 30);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "900 56px Arial Black, Impact, Arial";
  ctx.fillText(name.toUpperCase(), 80, 122);

  ctx.fillStyle = "#00d4ff";
  ctx.font = "800 24px Arial";
  ctx.fillText(motto, 82, 162);

  ctx.fillStyle = "#ff33cc";
  ctx.font = "900 74px Arial Black, Impact, Arial";
  ctx.textAlign = "right";
  ctx.fillText(rank, w - 82, 128);
  ctx.font = "800 24px Arial";
  ctx.fillText("RANGO", w - 82, 160);
  ctx.textAlign = "left";

  drawMiniCar(ctx, w * 0.58, h * 0.48, state);

  const stats = [
    ["Coche", car],
    ["Valoración", String(rating)],
    ["Temporada", "Nv. " + (season.level || 1)],
    ["Sponsor rep", String(sponsor.reputation || 0)],
    ["Skill", skill.bestRank || "--"]
  ];

  let y = 230;
  stats.forEach(([k, v]) => {
    ctx.fillStyle = "rgba(0,0,0,.35)";
    roundRect(ctx, 82, y - 28, 350, 46, 14);
    ctx.fill();

    ctx.fillStyle = "#ffd166";
    ctx.font = "900 18px Arial";
    ctx.fillText(k.toUpperCase(), 102, y);
    ctx.fillStyle = "#fff";
    ctx.font = "800 20px Arial";
    ctx.fillText(v, 250, y);
    y += 58;
  });

  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.font = "700 16px Arial";
  ctx.fillText("RACING REALISTA · PERFIL DE PILOTO V66", 80, h - 72);

  ctx.textAlign = "right";
  ctx.fillStyle = "#44ff88";
  ctx.font = "900 18px Arial";
  ctx.fillText("PLAYER CARD", w - 80, h - 72);
  ctx.textAlign = "left";
}

function drawMiniCar(ctx, cx, cy, state) {
  const carColor = ["#ff3333", "#ff8a00", "#cdd7e6", "#2288ff", "#44ff88", "#ff33cc"][Number(state.selectedCarIndex || 0) % 6];

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.08);
  ctx.shadowColor = "#00d4ff";
  ctx.shadowBlur = 35;

  ctx.fillStyle = "rgba(0,0,0,.45)";
  roundRect(ctx, -210, 82, 430, 36, 20);
  ctx.fill();

  const grad = ctx.createLinearGradient(-230, 0, 230, 90);
  grad.addColorStop(0, carColor);
  grad.addColorStop(1, "#ffffff");
  ctx.fillStyle = grad;
  roundRect(ctx, -245, -10, 500, 110, 36);
  ctx.fill();

  ctx.fillStyle = "rgba(5,10,20,.88)";
  roundRect(ctx, -90, -75, 190, 85, 26);
  ctx.fill();

  ctx.fillStyle = "#05070c";
  ctx.beginPath();
  ctx.arc(-155, 92, 45, 0, Math.PI * 2);
  ctx.arc(165, 92, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#cdd7e6";
  ctx.beginPath();
  ctx.arc(-155, 92, 20, 0, Math.PI * 2);
  ctx.arc(165, 92, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function buildShareText(state) {
  const rating = calculateRating(state);
  const rank = getRank(rating);
  const h = getHighlights(state);

  return [
    "🏁 PERFIL DE PILOTO - RACING REALISTA V66",
    "",
    "Piloto: " + (pilotProfileState.data.name || "Piloto Neon"),
    "Lema: " + (pilotProfileState.data.motto || "Vidas solo hay una, a disfrutarla al máximo"),
    "Rango global: " + rank,
    "Valoración: " + rating,
    "",
    "DESTACADOS:",
    ...h.map(item => "- " + item.label + ": " + item.value),
    "",
    "Coche actual: " + getCarName(state)
  ].join("\\n");
}

function exportProfile(state) {
  const payload = {
    version: 66,
    exportedAt: new Date().toISOString(),
    profile: pilotProfileState.data,
    rating: calculateRating(state),
    rank: getRank(calculateRating(state)),
    highlights: getHighlights(state)
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "perfil_piloto_v66.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getHighlights(state) {
  const stats = state.progress?.stats || {};
  const season = safeJSON(localStorage.getItem("seasonPassData"), {});
  const sponsor = safeJSON(localStorage.getItem("sponsorsData"), {});
  const skill = safeJSON(localStorage.getItem("skillChallengesData"), {});
  const trophies = safeJSON(localStorage.getItem("trophiesData"), {});
  const routes = safeJSON(localStorage.getItem("customRoutesData"), {});

  return [
    { label: "Carreras", value: String(stats.races || 0) },
    { label: "Drift total", value: String(stats.driftScore || 0) },
    { label: "Rango habilidad", value: skill.bestRank || "--" },
    { label: "Temporada", value: "Nivel " + (season.level || 1) },
    { label: "Reputación sponsor", value: String(sponsor.reputation || 0) },
    { label: "Trofeos", value: String((trophies.unlocked || []).length || 0) },
    { label: "Rutas guardadas", value: String((routes.routes || []).length || 0) }
  ];
}

function calculateRating(state) {
  const stats = state.progress?.stats || {};
  const season = safeJSON(localStorage.getItem("seasonPassData"), {});
  const sponsor = safeJSON(localStorage.getItem("sponsorsData"), {});
  const skill = safeJSON(localStorage.getItem("skillChallengesData"), {});
  const trophies = safeJSON(localStorage.getItem("trophiesData"), {});

  const rankScore = { "--": 0, D: 10, C: 22, B: 38, A: 55, S: 75 }[skill.bestRank || "--"] || 0;

  const value =
    Math.min(80, Number(stats.races || 0) * 2) +
    Math.min(70, Number(stats.driftScore || 0) / 180) +
    Math.min(65, Number(season.level || 1) * 8) +
    Math.min(70, Number(sponsor.reputation || 0) / 2) +
    Math.min(70, (trophies.unlocked || []).length * 5) +
    rankScore;

  return Math.round(Math.min(999, value));
}

function getRank(rating) {
  if (rating >= 520) return "S+";
  if (rating >= 410) return "S";
  if (rating >= 310) return "A";
  if (rating >= 210) return "B";
  if (rating >= 120) return "C";
  return "D";
}

function getCarName(state) {
  return state.manifest?.cars?.[state.selectedCarIndex]?.name || "Coche";
}

function readPilotForm() {
  pilotProfileState.data.name = (document.getElementById("pilotNameInput")?.value || "Piloto Neon").trim().slice(0, 22);
  pilotProfileState.data.motto = (document.getElementById("pilotMottoInput")?.value || "").trim().slice(0, 48);
}

function syncPilotForm() {
  const name = document.getElementById("pilotNameInput");
  const motto = document.getElementById("pilotMottoInput");
  if (name) name.value = pilotProfileState.data.name || "Piloto Neon";
  if (motto) motto.value = pilotProfileState.data.motto || "Vidas solo hay una, a disfrutarla al máximo";
}

function updatePilotHUD(rank) {
  const hud = document.getElementById("hudPilotProfile");
  if (!hud) return;
  hud.textContent = rank || getRank(0);
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
    return data && typeof data.name === "string" ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    name: "Piloto Neon",
    motto: "Vidas solo hay una, a disfrutarla al máximo"
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pilotProfileState.data));
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
