import { addCoins } from "./shop.js";
import { addXP, addStat } from "./progress.js";

const STORAGE_KEY = "guidedTutorialData";

const STEPS = [
  {
    id: "accelerate",
    name: "Acelera",
    desc: "Pulsa acelerar y mueve el coche.",
    target: 1,
    check: state => Math.abs(state.speed || 0) > 0.35
  },
  {
    id: "turn",
    name: "Gira",
    desc: "Gira a izquierda o derecha mientras conduces.",
    target: 1,
    check: state => {
      const c = state.controls || {};
      return !!(c.left || c.right || Math.abs(c.steer || 0) > 0.35);
    }
  },
  {
    id: "nitro",
    name: "Usa nitro",
    desc: "Activa el nitro para ganar velocidad.",
    target: 1,
    check: state => {
      const c = state.controls || {};
      return !!(c.nitro || c.boost || c.space);
    }
  },
  {
    id: "coins",
    name: "Recoge monedas",
    desc: "Recoge 10 monedas en cualquier modo.",
    stat: "coinsCollected",
    target: 10
  },
  {
    id: "race",
    name: "Completa una carrera",
    desc: "Termina una carrera para desbloquear la siguiente parte.",
    stat: "races",
    target: 1
  },
  {
    id: "workshop",
    name: "Prueba el taller",
    desc: "Completa 1 misión de taller o entra en el taller.",
    stat: "workshopMissions",
    target: 1
  }
];

export const guidedTutorialState = {
  data: loadData()
};

export function setupGuidedTutorial(state, showScreen) {
  state.guidedTutorial = guidedTutorialState;

  document.getElementById("guidedTutorialBtn").onclick = () => {
    updateGuidedTutorial(state);
    showScreen("guidedTutorialScreen");
  };

  document.getElementById("startGuidedTutorial").onclick = () => {
    guidedTutorialState.data.active = true;
    saveData();
    updateGuidedTutorial(state);
    window.showToast?.("Tutorial guiado activado");
  };

  document.getElementById("skipGuidedStep").onclick = () => {
    skipStep(state);
  };

  document.getElementById("resetGuidedTutorial").onclick = () => {
    if (!confirm("¿Reiniciar tutorial guiado?")) return;
    guidedTutorialState.data = createData();
    saveData();
    updateGuidedTutorial(state);
    window.showToast?.("Tutorial reiniciado");
  };

  updateGuidedTutorial(state);
}

export function updateGuidedTutorial(state) {
  const data = guidedTutorialState.data;
  if (!data.active || data.completed) {
    updateGuidedUI(state);
    return;
  }

  const step = getCurrentStep();
  if (!step) {
    completeTutorial(state);
    return;
  }

  if (isStepDone(state, step)) {
    data.stepIndex += 1;
    data.stepProgress = 0;
    saveData();

    const next = getCurrentStep();
    if (next) {
      window.showToast?.("Tutorial: " + next.name);
    } else {
      completeTutorial(state);
    }
  }

  updateGuidedUI(state);
}

function isStepDone(state, step) {
  if (step.check) return step.check(state);

  if (step.stat) {
    const current = Number(state.progress?.stats?.[step.stat] || 0);
    if (step.startValue === undefined) {
      step.startValue = current;
    }
    return current - step.startValue >= step.target;
  }

  return false;
}

function skipStep(state) {
  if (!guidedTutorialState.data.active) {
    guidedTutorialState.data.active = true;
  }

  guidedTutorialState.data.stepIndex += 1;
  guidedTutorialState.data.stepProgress = 0;

  if (guidedTutorialState.data.stepIndex >= STEPS.length) {
    completeTutorial(state);
  } else {
    saveData();
    updateGuidedTutorial(state);
    window.showToast?.("Paso saltado");
  }
}

function completeTutorial(state) {
  const data = guidedTutorialState.data;
  if (data.completed) return;

  data.completed = true;
  data.active = false;
  data.rewardClaimed = true;

  addCoins(state, 500);
  addXP(state, 250);
  addStat(state, "tutorialsCompleted", 1);

  const coupons = Number(localStorage.getItem("workshopCoupons") || 0) + 1;
  localStorage.setItem("workshopCoupons", String(coupons));

  saveData();
  updateGuidedUI(state);
  window.showToast?.("Tutorial completado: +500 monedas");
}

function updateGuidedUI(state) {
  const data = guidedTutorialState.data;
  const step = getCurrentStep();
  const total = STEPS.length;
  const current = Math.min(data.stepIndex + 1, total);
  const percent = data.completed ? 100 : Math.round((data.stepIndex / total) * 100);

  setText("guidedStepName", data.completed ? "Completado" : step?.name || "--");
  setText("guidedStepDesc", data.completed ? "Ya has completado el tutorial guiado." : step?.desc || "Pulsa empezar para activar el tutorial.");
  setText("guidedTutorialProgress", data.completed ? total + "/" + total : current + "/" + total);
  setText("guidedRewardStatus", data.completed ? "Recompensa recibida" : "Pendiente");
  setText("hudGuidedTutorial", data.completed ? "Completado" : data.active && step ? step.name : "--");

  const fill = document.getElementById("guidedTutorialFill");
  if (fill) fill.style.width = percent + "%";

  updateOverlay(data, step, current, total);
}

function updateOverlay(data, step, current, total) {
  const overlay = document.getElementById("guidedTutorialOverlay");
  if (!overlay) return;

  if (!data.active || data.completed || !step) {
    overlay.classList.add("hidden");
    return;
  }

  overlay.classList.remove("hidden");
  setText("guidedOverlayTitle", step.name);
  setText("guidedOverlayText", step.desc);
  setText("guidedOverlayProgress", current + "/" + total);
}

function getCurrentStep() {
  return STEPS[guidedTutorialState.data.stepIndex] || null;
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && typeof data.stepIndex === "number" ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    active: false,
    completed: false,
    rewardClaimed: false,
    stepIndex: 0,
    stepProgress: 0
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(guidedTutorialState.data));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
