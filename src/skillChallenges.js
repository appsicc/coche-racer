import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "skillChallengesData";

const CHALLENGES = {
  speed: {
    label: "Velocidad",
    duration: 45,
    objective: "Mantén velocidad alta sin chocar.",
    baseReward: 240
  },
  precision: {
    label: "Precisión",
    duration: 50,
    objective: "Conduce rápido con el menor daño posible.",
    baseReward: 260
  },
  control: {
    label: "Control",
    duration: 55,
    objective: "Combina velocidad, drift y estabilidad.",
    baseReward: 300
  }
};

const RANKS = [
  { id: "S", label: "S", min: 900, mult: 2.2 },
  { id: "A", label: "A", min: 700, mult: 1.7 },
  { id: "B", label: "B", min: 500, mult: 1.3 },
  { id: "C", label: "C", min: 300, mult: 1.0 },
  { id: "D", label: "D", min: 0, mult: 0.55 }
];

export const skillChallengesState = {
  data: loadData(),
  active: false,
  type: null,
  timer: 0,
  score: 0,
  speedSum: 0,
  samples: 0,
  startDamage: 0,
  maxSpeed: 0,
  bestDrift: 0,
  cleanTicks: 0
};

export function setupSkillChallenges(state, showScreen) {
  state.skillChallenges = skillChallengesState;

  document.getElementById("skillChallengesBtn").onclick = () => {
    updateSkillUI(state);
    showScreen("skillChallengesScreen");
  };

  document.getElementById("startSpeedChallenge").onclick = () => startChallenge(state, "speed");
  document.getElementById("startPrecisionChallenge").onclick = () => startChallenge(state, "precision");
  document.getElementById("startControlChallenge").onclick = () => startChallenge(state, "control");
  document.getElementById("stopSkillChallenge").onclick = () => finishChallenge(state, false);

  updateSkillUI(state);
}

export function updateSkillChallenges(state, dt) {
  if (!skillChallengesState.active) {
    updateSkillHUD();
    return;
  }

  skillChallengesState.timer -= dt;
  sampleDriving(state, dt);
  calculateScore(state);

  if (skillChallengesState.timer <= 0) {
    finishChallenge(state, true);
  }

  updateSkillUI(state);
  updateSkillHUD();
}

function startChallenge(state, type) {
  const challenge = CHALLENGES[type];
  if (!challenge) return;

  skillChallengesState.active = true;
  skillChallengesState.type = type;
  skillChallengesState.timer = challenge.duration;
  skillChallengesState.score = 0;
  skillChallengesState.speedSum = 0;
  skillChallengesState.samples = 0;
  skillChallengesState.startDamage = Number(state.damage || 0);
  skillChallengesState.maxSpeed = 0;
  skillChallengesState.bestDrift = Math.floor(state.driftMode?.score || 0);
  skillChallengesState.cleanTicks = 0;

  document.body.classList.add("skill-active");
  updateSkillUI(state);
  window.showToast?.("Reto iniciado: " + challenge.label);
}

function sampleDriving(state, dt) {
  const speed = Math.round(Math.abs(state.speed || 0) * 180);
  const damage = Number(state.damage || 0);
  const drift = Math.floor(state.driftMode?.score || 0);
  const damageDelta = Math.max(0, damage - skillChallengesState.startDamage);

  skillChallengesState.speedSum += speed;
  skillChallengesState.samples += 1;
  skillChallengesState.maxSpeed = Math.max(skillChallengesState.maxSpeed, speed);
  skillChallengesState.bestDrift = Math.max(skillChallengesState.bestDrift, drift);

  if (damageDelta < 4 && speed > 40) {
    skillChallengesState.cleanTicks += dt;
  }
}

function calculateScore(state) {
  const type = skillChallengesState.type;
  const avgSpeed = getAverageSpeed();
  const damage = Number(state.damage || 0);
  const damageDelta = Math.max(0, damage - skillChallengesState.startDamage);
  const driftGain = Math.max(0, skillChallengesState.bestDrift - Math.floor(state._skillStartDrift || 0));

  let score = 0;

  if (type === "speed") {
    score = avgSpeed * 5 + skillChallengesState.maxSpeed * 2 - damageDelta * 18;
  } else if (type === "precision") {
    score = avgSpeed * 4 + skillChallengesState.cleanTicks * 18 - damageDelta * 45;
  } else if (type === "control") {
    score = avgSpeed * 3.5 + skillChallengesState.cleanTicks * 12 + Math.min(300, driftGain / 18) - damageDelta * 30;
  }

  skillChallengesState.score = Math.max(0, Math.round(score));
}

function finishChallenge(state, completed) {
  if (!skillChallengesState.active) return;

  calculateScore(state);

  const challenge = CHALLENGES[skillChallengesState.type];
  const rank = getRank(skillChallengesState.score);
  const coins = completed ? Math.round(challenge.baseReward * rank.mult) : Math.round(challenge.baseReward * 0.25);
  const xp = completed ? Math.round((challenge.baseReward * rank.mult) * 0.55) : Math.round(challenge.baseReward * 0.14);

  const result = {
    id: Date.now(),
    type: skillChallengesState.type,
    label: challenge.label,
    score: skillChallengesState.score,
    rank: completed ? rank.label : "X",
    coins,
    xp,
    maxSpeed: skillChallengesState.maxSpeed,
    avgSpeed: getAverageSpeed(),
    cleanTime: Math.round(skillChallengesState.cleanTicks),
    date: new Date().toISOString()
  };

  if (completed) {
    addCoins(state, coins);
    addXP(state, xp);
    addStat(state, "skillChallengesCompleted", 1);

    const record = skillChallengesState.data.records[skillChallengesState.type] || { score: 0, rank: "--" };
    if (result.score > record.score) {
      skillChallengesState.data.records[skillChallengesState.type] = {
        score: result.score,
        rank: result.rank,
        date: result.date
      };
      window.showToast?.("Nuevo récord: rango " + result.rank);
    }

    skillChallengesState.data.streak += 1;
  } else {
    skillChallengesState.data.streak = 0;
  }

  skillChallengesState.data.lastRank = result.rank;
  skillChallengesState.data.bestRank = bestRank(skillChallengesState.data.bestRank, result.rank);
  skillChallengesState.data.history.unshift(result);
  skillChallengesState.data.history = skillChallengesState.data.history.slice(0, 18);

  skillChallengesState.active = false;
  skillChallengesState.type = null;
  skillChallengesState.timer = 0;
  document.body.classList.remove("skill-active");

  saveData();
  updateSkillUI(state);
  window.showToast?.(completed ? "Reto terminado: +" + coins + " monedas" : "Reto parado");
}

function updateSkillUI(state) {
  const challenge = skillChallengesState.type ? CHALLENGES[skillChallengesState.type] : null;
  const score = skillChallengesState.score;
  const rank = getRank(score);
  const reward = challenge ? Math.round(challenge.baseReward * rank.mult) : 0;
  const duration = challenge ? challenge.duration : 1;
  const progress = skillChallengesState.active ? Math.round(((duration - skillChallengesState.timer) / duration) * 100) : 0;

  setText("skillActiveType", challenge ? challenge.label : "Ninguno");
  setText("skillObjective", challenge ? challenge.objective : "--");
  setText("skillTimer", Math.max(0, Math.ceil(skillChallengesState.timer)) + "s");
  setText("skillScore", score);
  setText("skillLastRank", skillChallengesState.data.lastRank || "--");
  setText("skillBestRank", skillChallengesState.data.bestRank || "--");
  setText("skillReward", reward + " monedas");
  setText("skillStreak", skillChallengesState.data.streak || 0);

  const fill = document.getElementById("skillProgressFill");
  if (fill) fill.style.width = progress + "%";

  renderRecords();
  renderHistory();
}

function renderRecords() {
  const list = document.getElementById("skillRecords");
  if (!list) return;

  list.innerHTML = Object.keys(CHALLENGES).map(type => {
    const record = skillChallengesState.data.records[type] || { score: 0, rank: "--" };
    return `
      <div class="skill-row ${rankClass(record.rank)}">
        <b>${CHALLENGES[type].label}</b>
        <p>Récord: ${record.score} pts · rango ${record.rank}</p>
      </div>
    `;
  }).join("");
}

function renderHistory() {
  const list = document.getElementById("skillHistory");
  if (!list) return;

  if (!skillChallengesState.data.history.length) {
    list.innerHTML = "<p>No hay retos completados todavía.</p>";
    return;
  }

  list.innerHTML = skillChallengesState.data.history.map(item => `
    <div class="skill-row ${rankClass(item.rank)}">
      <b>${item.label} · Rango ${item.rank}</b>
      <p>${item.score} pts · ${item.coins} monedas · ${item.xp} XP</p>
      <p>${item.maxSpeed} km/h máx · ${item.avgSpeed} km/h media · limpio ${item.cleanTime}s</p>
    </div>
  `).join("");
}

function updateSkillHUD() {
  const hud = document.getElementById("hudSkill");
  if (!hud) return;

  if (skillChallengesState.active) {
    hud.textContent = getRank(skillChallengesState.score).label + " · " + Math.max(0, Math.ceil(skillChallengesState.timer)) + "s";
  } else {
    hud.textContent = skillChallengesState.data.bestRank ? "Best " + skillChallengesState.data.bestRank : "--";
  }
}

function getAverageSpeed() {
  if (!skillChallengesState.samples) return 0;
  return Math.round(skillChallengesState.speedSum / skillChallengesState.samples);
}

function getRank(score) {
  return RANKS.find(rank => score >= rank.min) || RANKS[RANKS.length - 1];
}

function bestRank(current, next) {
  const order = ["--", "X", "D", "C", "B", "A", "S"];
  if (!current) return next;
  return order.indexOf(next) > order.indexOf(current) ? next : current;
}

function rankClass(rank) {
  if (rank === "S" || rank === "A") return "gold";
  if (rank === "B") return "silver";
  if (rank === "C") return "bronze";
  return "";
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
    records: {},
    history: [],
    lastRank: "--",
    bestRank: "--",
    streak: 0
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(skillChallengesState.data));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
