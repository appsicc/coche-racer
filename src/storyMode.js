import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "storyModeData";

const CHAPTERS = [
  {
    id: "arrival",
    title: "Capítulo 1: Llegada a Neon City",
    desc: "Empieza como piloto nuevo y demuestra que sabes controlar el coche.",
    rewardCoins: 250,
    rewardXP: 150,
    objectives: [
      { label: "Completa 1 carrera", stat: "races", target: 1 },
      { label: "Recoge 30 monedas", stat: "coinsCollected", target: 30 }
    ]
  },
  {
    id: "garage",
    title: "Capítulo 2: Garaje clandestino",
    desc: "La crew te pide mejorar tu reputación y preparar el coche.",
    rewardCoins: 350,
    rewardXP: 210,
    coupon: 1,
    objectives: [
      { label: "Completa 1 misión de taller", stat: "workshopMissions", target: 1 },
      { label: "Completa 1 misión de crew", stat: "crewMissions", target: 1 }
    ]
  },
  {
    id: "drift",
    title: "Capítulo 3: Curvas bajo neón",
    desc: "Entra al modo drift y gana respeto en las calles.",
    rewardCoins: 450,
    rewardXP: 260,
    objectives: [
      { label: "Termina 1 sesión de drift", stat: "driftRuns", target: 1 },
      { label: "Consigue 1500 puntos drift totales", stat: "driftScore", target: 1500 }
    ]
  },
  {
    id: "heat",
    title: "Capítulo 4: Luces rojas y azules",
    desc: "La policía empieza a fijarse en ti. Escapa y sube tu fama.",
    rewardCoins: 550,
    rewardXP: 330,
    objectives: [
      { label: "Escapa 1 vez de la policía", stat: "policeEscapes", target: 1 },
      { label: "Completa 1 evento diario", stat: "dailyEvents", target: 1 }
    ]
  },
  {
    id: "champion",
    title: "Capítulo 5: Copa Neon",
    desc: "Compite oficialmente y demuestra que puedes ser campeón.",
    rewardCoins: 900,
    rewardXP: 520,
    coupon: 2,
    objectives: [
      { label: "Termina 1 campeonato", stat: "championshipsFinished", target: 1 },
      { label: "Completa 1 reto semanal", stat: "weeklyChallenges", target: 1 }
    ]
  }
];

export const storyState = {
  data: loadData()
};

export function setupStoryMode(state, showScreen) {
  state.storyMode = storyState;

  document.getElementById("storyBtn").onclick = () => {
    updateStoryMode(state);
    showScreen("storyScreen");
  };

  document.getElementById("startStoryMode").onclick = () => {
    if (!storyState.data.started) {
      storyState.data.started = true;
      storyState.data.chapterIndex = 0;
      prepareChapterStarts(state);
      saveData();
      window.showToast?.("Modo historia iniciado");
    }
    updateStoryMode(state);
  };

  document.getElementById("claimStoryReward").onclick = () => {
    claimChapterReward(state);
  };

  document.getElementById("resetStoryMode").onclick = () => {
    if (!confirm("¿Reiniciar todo el modo historia?")) return;
    storyState.data = createData();
    saveData();
    updateStoryMode(state);
    window.showToast?.("Historia reiniciada");
  };

  updateStoryMode(state);
}

export function updateStoryMode(state) {
  if (storyState.data.started) {
    ensureChapterStarts(state);
  }

  updateStoryUI(state);
  updateStoryHUD();
  saveData();
}

function prepareChapterStarts(state) {
  const chapter = getCurrentChapter();
  if (!chapter) return;

  storyState.data.starts[chapter.id] = {};
  const stats = state.progress?.stats || {};
  chapter.objectives.forEach(obj => {
    storyState.data.starts[chapter.id][obj.stat] = Number(stats[obj.stat] || 0);
  });
}

function ensureChapterStarts(state) {
  const chapter = getCurrentChapter();
  if (!chapter) return;
  if (!storyState.data.starts[chapter.id]) prepareChapterStarts(state);
}

function getCurrentChapter() {
  return CHAPTERS[storyState.data.chapterIndex] || null;
}

function getObjectiveProgress(state, chapter, obj) {
  const stats = state.progress?.stats || {};
  const start = storyState.data.starts?.[chapter.id]?.[obj.stat] || 0;
  return Math.max(0, Number(stats[obj.stat] || 0) - start);
}

function isChapterComplete(state, chapter) {
  if (!chapter) return false;
  return chapter.objectives.every(obj => getObjectiveProgress(state, chapter, obj) >= obj.target);
}

function claimChapterReward(state) {
  if (!storyState.data.started) {
    window.showToast?.("Empieza la historia primero");
    return;
  }

  const chapter = getCurrentChapter();
  if (!chapter) return;

  if (!isChapterComplete(state, chapter)) {
    window.showToast?.("Capítulo no completado");
    return;
  }

  if (storyState.data.claimed.includes(chapter.id)) {
    window.showToast?.("Capítulo ya cobrado");
    return;
  }

  storyState.data.claimed.push(chapter.id);
  addCoins(state, chapter.rewardCoins);
  addXP(state, chapter.rewardXP);
  addStat(state, "storyChapters", 1);

  if (chapter.coupon) {
    const coupons = Number(localStorage.getItem("workshopCoupons") || 0) + chapter.coupon;
    localStorage.setItem("workshopCoupons", String(coupons));
  }

  storyState.data.chapterIndex += 1;
  prepareChapterStarts(state);

  saveData();
  updateStoryMode(state);
  window.showToast?.("Capítulo completado: +" + chapter.rewardCoins + " monedas");
}

function updateStoryUI(state) {
  const chapter = getCurrentChapter();
  const started = storyState.data.started;

  if (!started) {
    setText("storyChapterTitle", "Historia no iniciada");
    setText("storyChapterDesc", "Pulsa empezar para iniciar el modo historia.");
    setText("storyProgress", "0/" + CHAPTERS.length);
  } else if (!chapter) {
    setText("storyChapterTitle", "Historia completada");
    setText("storyChapterDesc", "Has terminado todos los capítulos disponibles.");
    setText("storyProgress", CHAPTERS.length + "/" + CHAPTERS.length);
  } else {
    setText("storyChapterTitle", chapter.title);
    setText("storyChapterDesc", chapter.desc);
    const done = chapter.objectives.filter(obj => getObjectiveProgress(state, chapter, obj) >= obj.target).length;
    setText("storyProgress", done + "/" + chapter.objectives.length);
  }

  const fill = document.getElementById("storyFill");
  if (fill) {
    const percent = Math.min(100, (storyState.data.chapterIndex / CHAPTERS.length) * 100);
    fill.style.width = percent + "%";
  }

  const claim = document.getElementById("claimStoryReward");
  if (claim) claim.disabled = !chapter || !started || !isChapterComplete(state, chapter) || storyState.data.claimed.includes(chapter.id);

  renderChapters();
  renderObjectives(state);
}

function renderChapters() {
  const list = document.getElementById("storyChaptersList");
  if (!list) return;

  list.innerHTML = "";
  CHAPTERS.forEach((chapter, index) => {
    const done = storyState.data.claimed.includes(chapter.id);
    const active = storyState.data.started && index === storyState.data.chapterIndex;

    const row = document.createElement("div");
    row.className = "story-row " + (done ? "done" : active ? "active" : "");
    row.innerHTML = `
      <b>${done ? "✅ " : active ? "▶ " : "🔒 "}${chapter.title}</b>
      <p>${chapter.desc}</p>
      <p>Recompensa: ${chapter.rewardCoins} monedas + ${chapter.rewardXP} XP${chapter.coupon ? " + " + chapter.coupon + " bono taller" : ""}</p>
    `;
    list.appendChild(row);
  });
}

function renderObjectives(state) {
  const list = document.getElementById("storyObjectivesList");
  if (!list) return;

  const chapter = getCurrentChapter();
  list.innerHTML = "";

  if (!storyState.data.started || !chapter) {
    list.innerHTML = "<p>No hay objetivos activos.</p>";
    return;
  }

  chapter.objectives.forEach(obj => {
    const progress = getObjectiveProgress(state, chapter, obj);
    const done = progress >= obj.target;

    const row = document.createElement("div");
    row.className = "story-row " + (done ? "done" : "");
    row.innerHTML = `
      <b>${done ? "✅ " : "🎯 "}${obj.label}</b>
      <p>${Math.min(progress, obj.target)}/${obj.target}</p>
    `;
    list.appendChild(row);
  });
}

function updateStoryHUD() {
  const hud = document.getElementById("hudStory");
  if (!hud) return;

  if (!storyState.data.started) {
    hud.textContent = "--";
    return;
  }

  const chapter = getCurrentChapter();
  hud.textContent = chapter ? "Cap. " + (storyState.data.chapterIndex + 1) : "Completada";
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.chapterIndex === "number" ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    started: false,
    chapterIndex: 0,
    claimed: [],
    starts: {}
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storyState.data));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
