export function setupUI(state, actions) {
  const q = id => document.getElementById(id);

  q("playBtn").onclick = actions.startRace;
  q("freeBtn").onclick = actions.startFreeMode;
  q("chaseBtn").onclick = actions.startChaseMode;
  q("duelBtn").onclick = actions.startDuel;
  q("garageBtn").onclick = () => {
    actions.openGaragePreview(true);
    updateGarageUI(state);
  };
  q("mapsBtn").onclick = () => {
    actions.openMapPreview(true);
    updateMapUI(state);
  };
  q("helpBtn").onclick = () => showScreen("helpScreen");

  document.querySelectorAll(".backBtn").forEach(btn => {
    btn.onclick = () => showScreen("mainMenu");
  });

  q("prevCar").onclick = async () => { await actions.changeCar(-1); updateGarageUI(state); };
  q("nextCar").onclick = async () => { await actions.changeCar(1); updateGarageUI(state); };
  q("useCar").onclick = actions.chooseCar;

  q("prevMap").onclick = async () => { await actions.changeMap(-1); updateMapUI(state); };
  q("nextMap").onclick = async () => { await actions.changeMap(1); updateMapUI(state); };
  q("useMap").onclick = actions.chooseMap;

  q("resumeBtn").onclick = actions.resumeGame;
  q("restartBtn").onclick = actions.restartRace;
  q("exitBtn").onclick = actions.exitToMenu;

  window.updateGarageUI = () => updateGarageUI(state);
  window.updateMapUI = () => updateMapUI(state);

  updateGarageUI(state);
  updateMapUI(state);
}

export function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  if (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  }
}

export function updateGarageUI(state) {
  const car = state.manifest.cars[state.selectedCarIndex];
  document.getElementById("carName").textContent = car.name;
  document.getElementById("carStyle").textContent = car.style + " · " + car.color;
  document.getElementById("statSpeed").textContent = car.speed + "/10";
  document.getElementById("statAccel").textContent = car.acceleration + "/10";
  document.getElementById("statHandling").textContent = car.handling + "/10";

  const status = document.getElementById("carLockStatus");
  const btn = document.getElementById("useCar");
  if (status && btn) {
    const unlocked = !car.unlock || state.selectedCarIndex === 0 ||
      state.progress?.unlockedCars?.includes(car.id) ||
      (state.progress?.level || 1) >= car.unlock.level;

    if (unlocked) {
      status.textContent = "Disponible";
      status.className = "small unlocked-text";
      btn.textContent = "USAR COCHE";
    } else {
      status.textContent = `Bloqueado · Nivel ${car.unlock.level} o ${car.unlock.cost} monedas`;
      status.className = "small locked-text";
      btn.textContent = "DESBLOQUEAR";
    }
  }
}

export function updateMapUI(state) {
  const map = state.manifest.maps[state.selectedMapIndex];
  document.getElementById("mapName").textContent = map.name;
  document.getElementById("mapTheme").textContent = map.theme;

  const status = document.getElementById("mapLockStatus");
  const btn = document.getElementById("useMap");
  if (status && btn) {
    const unlocked = !map.unlock || state.selectedMapIndex === 0 ||
      state.progress?.unlockedMaps?.includes(map.id) ||
      (state.progress?.level || 1) >= map.unlock.level;

    if (unlocked) {
      status.textContent = "Disponible";
      status.className = "small unlocked-text";
      btn.textContent = "USAR MAPA";
    } else {
      status.textContent = `Bloqueado · Nivel ${map.unlock.level} o ${map.unlock.cost} monedas`;
      status.className = "small locked-text";
      btn.textContent = "DESBLOQUEAR";
    }
  }
}

export function showToast(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}
