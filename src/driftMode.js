import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "driftData";

export const driftState = {
  active: false,
  score: 0,
  combo: 1,
  bestCombo: Number(localStorage.getItem("driftBestCombo") || 1),
  timer: 0,
  maxTime: 90,
  comboLife: 0,
  lastReward: 0,
  data: loadDriftData()
};

export function setupDriftMode(state, showScreen) {
  state.driftMode = driftState;

  document.getElementById("driftBtn").onclick = () => {
    updateDriftUI();
    showScreen("driftScreen");
  };

  document.getElementById("startDriftMode").onclick = () => {
    startDriftMode(state);
  };

  document.getElementById("endDriftMode").onclick = () => {
    finishDriftMode(state, true);
  };

  document.getElementById("resetDriftBest").onclick = () => {
    if (!confirm("¿Borrar récords de drift?")) return;
    driftState.data.bestScore = 0;
    driftState.bestCombo = 1;
    localStorage.setItem("driftBestCombo", "1");
    saveDriftData();
    updateDriftUI();
    window.showToast?.("Récord drift borrado");
  };

  updateDriftUI();
}

export function updateDriftMode(state, dt) {
  if (!driftState.active) {
    updateDriftHUD();
    return;
  }

  driftState.timer -= dt;
  if (driftState.timer <= 0) {
    finishDriftMode(state, true);
    return;
  }

  const points = calculateDriftPoints(state, dt);

  if (points > 0) {
    driftState.score += points * driftState.combo;
    driftState.comboLife = 1.45;
    driftState.combo = Math.min(8, driftState.combo + dt * 0.55);
    driftState.bestCombo = Math.max(driftState.bestCombo, driftState.combo);
    localStorage.setItem("driftBestCombo", String(driftState.bestCombo));
  } else {
    driftState.comboLife -= dt;
    if (driftState.comboLife <= 0) {
      driftState.combo = Math.max(1, driftState.combo - dt * 1.8);
    }
  }

  updateDriftUI();
  updateDriftHUD();
}

function startDriftMode(state) {
  driftState.active = true;
  driftState.score = 0;
  driftState.combo = 1;
  driftState.timer = driftState.maxTime;
  driftState.comboLife = 0;
  driftState.lastReward = 0;

  document.body.classList.add("drift-active");
  window.showToast?.("Modo drift iniciado");
  updateDriftUI();
}

function finishDriftMode(state, reward) {
  if (!driftState.active && !reward) return;

  driftState.active = false;
  document.body.classList.remove("drift-active");

  const finalScore = Math.floor(driftState.score);
  driftState.data.runs += 1;
  driftState.data.totalScore += finalScore;

  if (finalScore > driftState.data.bestScore) {
    driftState.data.bestScore = finalScore;
    window.showToast?.("Nuevo récord drift: " + finalScore);
  }

  if (reward && finalScore > 0) {
    const coins = Math.min(900, Math.floor(finalScore / 65));
    const xp = Math.min(450, Math.floor(finalScore / 90));
    driftState.lastReward = coins;

    addCoins(state, coins);
    addXP(state, xp);
    addStat(state, "driftRuns", 1);
    addStat(state, "driftScore", finalScore);

    window.showToast?.("Drift terminado: +" + coins + " monedas");
  }

  saveDriftData();
  updateDriftUI();
  updateDriftHUD();
}

function calculateDriftPoints(state, dt) {
  const speed = Math.abs(state.speed || 0);
  const controls = state.controls || {};
  const steer = Math.abs(controls.steer || 0);
  const turning = steer > 0.45 || controls.left || controls.right;

  if (!turning || speed < 0.55) return 0;

  const brakingBonus = controls.brake || controls.down ? 1.25 : 1;
  const speedFactor = Math.min(2.25, speed);
  const turnFactor = Math.max(0.5, steer || 0.75);

  return dt * 105 * speedFactor * turnFactor * brakingBonus;
}

function updateDriftUI() {
  setText("driftScore", Math.floor(driftState.score));
  setText("driftCombo", "x" + driftState.combo.toFixed(1));
  setText("driftTimer", driftState.active ? Math.ceil(driftState.timer) + "s" : "--");
  setText("driftBest", driftState.data.bestScore || 0);
  setText("driftBestCombo", "x" + Number(driftState.bestCombo || 1).toFixed(1));
  setText("driftReward", Math.min(900, Math.floor(driftState.score / 65)) + " monedas");

  const fill = document.getElementById("driftComboFill");
  if (fill) fill.style.width = Math.min(100, (driftState.combo / 8) * 100) + "%";
}

function updateDriftHUD() {
  const hud = document.getElementById("hudDrift");
  if (!hud) return;

  if (!driftState.active) {
    hud.textContent = driftState.data.bestScore ? "Récord " + driftState.data.bestScore : "--";
    return;
  }

  hud.textContent = Math.floor(driftState.score) + " · x" + driftState.combo.toFixed(1);
}

function loadDriftData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.bestScore === "number" ? data : createDriftData();
  } catch {
    return createDriftData();
  }
}

function createDriftData() {
  return {
    bestScore: 0,
    runs: 0,
    totalScore: 0
  };
}

function saveDriftData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(driftState.data));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
