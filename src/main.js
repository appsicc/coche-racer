import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { createWorld, loadMap, updateWorld } from "./world.js";
import { loadCar, createPlaceholderCar, setCarStats } from "./car.js";
import { createControls, controls } from "./controls.js";
import { updateCarPhysics, resetPhysics } from "./carPhysics.js";
import { setupRivals, createRivals, updateRivals, calculatePosition, clearRivals } from "./rivals.js";
import { runCountdown } from "./countdown.js";
import { getStartPositionForLane } from "./track.js";
import { applyQuality, setupSettingsUI, settings } from "./settings.js";
import { setupTraffic, createTraffic, createPolice, clearTraffic, clearPolice, updateTraffic, updatePolice, updateModeObjectives } from "./traffic.js";
import { setupShop, setupShopUI, addCoins, applyUpgradeStats, getNitroMax, updateShopUI } from "./shop.js";
import { setupProgress, setupProfileUI, isCarUnlocked, isMapUnlocked, tryUnlockCar, tryUnlockMap, completeMission, addStat, addXP, updateProfileUI } from "./progress.js";
import { setupCustomization, setupCustomizationUI, applyCustomizationToCar, updateCustomizationUI } from "./customization.js";
import { createUrbanWorld, updateUrbanWorld } from "./urbanWorld.js";
import { setupCityMissions, createMissionMarkers, updateCityMissions, clearMissionMarkers } from "./cityMissions.js";
import { setupSaveSystem, setupSaveUI, updateSaveSummary } from "./saveSystem.js";
import { setupControlSettingsUI, applyCameraPreset } from "./controlSettings.js";
import { setupTutorial } from "./tutorial.js";
import { setupAchievements, setupAchievementsUI, unlockAchievement } from "./achievements.js";
import { setupPWA } from "./pwa.js";
import { setupDevTools, tickDevTools } from "./devTools.js";
import { setupLanguageUI, applyLanguage } from "./language.js";
import { setupPhotoMode, updatePhotoMode } from "./photoMode.js";
import { setupWeather, setupWeatherUI, updateWeather } from "./weather.js";
import { setupAmbientAudio, updateAmbientAudio, unlockAmbient } from "./ambientAudio.js";
import { setupLocalMultiplayer, startDuelMode, updateLocalMultiplayer, stopDuelMode } from "./localMultiplayer.js";
import { setupRanking, setupRankingUI } from "./ranking.js";
import { setupWorkshop, setupWorkshopUI, updateWorkshopUI, saveDamageSnapshot } from "./workshop.js";
import { setupWorkshopMissions, setupWorkshopMissionsUI, updateWorkshopMissions, clearWorkshopMission } from "./workshopMissions.js";
import { setupCareer, setupCareerUI, updateCareer } from "./career.js";
import { setupAdvancedGarage, setupAdvancedGarageUI, updateAdvancedGarageUI } from "./advancedGarage.js";
import { setupDailyEvents, setupDailyEventsUI, updateDailyEvents } from "./dailyEvents.js";
import { setupMapGPS, updateMapGPS } from "./mapGPS.js";
import { setupCarRadio, updateCarRadio, unlockRadio } from "./radio.js";
import { setupVisualEffects, updateVisualEffects } from "./visualEffects.js";
import { setupCityLife, updateCityLife } from "./cityLife.js";
import { setupIntelligentTraffic, updateIntelligentTraffic } from "./intelligentTraffic.js";
import { setupPerformanceOptimizer, updatePerformanceOptimizer } from "./performanceOptimizer.js";
import { setupAccessibility, installPressedKeyTracker, remapControls } from "./accessibility.js";
import { setupSaveSlots, updateSaveSlots } from "./saveSlots.js";
import { setupGuidedTutorial, updateGuidedTutorial } from "./guidedTutorial.js";
import { setupDriftMode, updateDriftMode } from "./driftMode.js";
import { setupPoliceAdvanced, updatePoliceAdvanced } from "./policeAdvanced.js";
import { setupChampionship, updateChampionship } from "./championship.js";
import { setupShowroom, updateShowroom } from "./showroom.js";
import { setupHighlights, updateHighlights } from "./highlights.js";
import { setupLiveryEditor, updateLiveryEditor } from "./liveryEditor.js";
import { setupCrewSystem, updateCrewSystem } from "./crewSystem.js";
import { setupWeeklyEvents, updateWeeklyEvents } from "./weeklyEvents.js";
import { setupStoryMode, updateStoryMode } from "./storyMode.js";
import { setupTrophies, updateTrophies } from "./trophies.js";
import { setupCarAlbum, updateCarAlbum } from "./carAlbum.js";
import { setupGraphicsSettings, updateGraphicsSettings } from "./graphicsSettings.js";
import { setupEngineAudioPro, updateEngineAudioPro } from "./engineAudioPro.js";
import { setupTelemetryPro, updateTelemetryPro } from "./telemetryPro.js";
import { setupDamagePro, updateDamagePro } from "./damagePro.js";
import { setupExtremeWeather, updateExtremeWeather } from "./extremeWeather.js";
import { setupHudEditor, updateHudEditor } from "./hudEditor.js";
import { setupCustomRoutes, updateCustomRoutes } from "./customRoutes.js";
import { setupReplayMode, updateReplayMode } from "./replayMode.js";
import { setupSkillChallenges, updateSkillChallenges } from "./skillChallenges.js";
import { setupGarageCodes, updateGarageCodes } from "./garageCodes.js";
import { setupPosterCreator, updatePosterCreator } from "./posterCreator.js";
import { setupTrailerMode, updateTrailerMode } from "./trailerMode.js";
import { setupShowroomPro, updateShowroomPro } from "./showroomPro.js";
import { setupEconomyAdvanced, updateEconomyAdvanced } from "./economyAdvanced.js";
import { setupPartsPro, updatePartsPro } from "./partsPro.js";
import { setupSponsors, updateSponsors } from "./sponsors.js";
import { setupSeasonPass, updateSeasonPass } from "./seasonPass.js";
import { setupPilotProfile, updatePilotProfile } from "./pilotProfile.js";
import { updateFollowCamera } from "./camera.js";
import { createAudioSystem } from "./audio.js";
import { setupUI, showScreen, showToast } from "./ui.js";
import { setupRace, startRaceTimer, updateRace, updateRaceHUD, hideRaceResult } from "./race.js";

export const state = {
  manifest: null,
  selectedCarIndex: 0,
  selectedMapIndex: 0,
  scene: null,
  camera: null,
  renderer: null,
  loader: null,
  car: null,
  map: null,
  gameMode: "menu",
  paused: false,
  coins: 0,
  nitro: 100,
  speed: 0,
  audio: null,
  clock: new THREE.Clock()
};

init();

async function init() {
  setLoading(25, "Cargando perfil...", "Consejo: mejora el nitro para escapar de la policía.");

  state.manifest = await fetch("manifest.json").then(r => r.json());
  state.selectedCarIndex = Number(localStorage.getItem("selectedCarIndex") || 0);
  state.selectedMapIndex = Number(localStorage.getItem("selectedMapIndex") || 0);

  setLoading(45, "Preparando garaje...", "Consejo: cada coche guarda sus mejoras y estilo.");

  setupRenderer();
  createWorld(state);
  createControls();
  state.audio = createAudioSystem();
  state.audio.setEnabled(settings.sound);
  applyQuality(state, settings.quality);
  setupRace(state);
  setupRivals(state);
  setupTraffic(state);
  setupShop(state);
  setupProgress(state);
  setupCustomization(state);
  setupCityMissions(state);
  setupSaveSystem(state);
  setupAchievements(state);
  setupWeather(state);
  setupAmbientAudio(state);
  setupLocalMultiplayer(state);
  setupRanking(state);
  setupWorkshop(state);
  setupWorkshopMissions(state);
  setupCareer(state);
  setupAdvancedGarage(state);
  setupDailyEvents(state);

  setLoading(65, "Construyendo ciudad...", "Consejo: entra en zonas urbanas para ganar recompensas.");

  setupUI(state, {
    startRace,
    startFreeMode,
    startChaseMode,
    startDuel,
    openGaragePreview,
    openMapPreview,
    changeCar,
    chooseCar,
    changeMap,
    chooseMap,
    pauseGame,
    resumeGame,
    restartRace,
    exitToMenu
  });

  setupSettingsUI(state, showScreen);
  setupShopUI(state, showScreen);
  setupProfileUI(state, showScreen);
  setupCustomizationUI(state, showScreen);
  setupSaveUI(state, showScreen);
  setupControlSettingsUI(state);
  setupTutorial(state, showScreen);
  setupAchievementsUI(state, showScreen);
  setupPWA();
  setupDevTools(state, showScreen);
  setupLanguageUI();
  setupPhotoMode(state, showScreen);
  setupWeatherUI(state, showScreen);
  setupRankingUI(state, showScreen);
  setupWorkshopUI(state, showScreen);
  setupWorkshopMissionsUI(state, showScreen);
  setupCareerUI(state, showScreen);
  setupAdvancedGarageUI(state);
  setupDailyEventsUI(state, showScreen);
  setupMapGPS(state, showScreen);
  setupCarRadio(state, showScreen);
  setupVisualEffects(state);
  setupCityLife(state);
  setupIntelligentTraffic(state);
  setupPerformanceOptimizer(state);
  installPressedKeyTracker();
  setupAccessibility(state, showScreen);
  setupSaveSlots(state);
  setupGuidedTutorial(state, showScreen);
  setupDriftMode(state, showScreen);
  setupPoliceAdvanced(state);
  setupChampionship(state, showScreen);
  setupShowroom(state, showScreen);
  setupHighlights(state, showScreen);
  setupLiveryEditor(state, showScreen);
  setupCrewSystem(state, showScreen);
  setupWeeklyEvents(state, showScreen);
  setupStoryMode(state, showScreen);
  setupTrophies(state, showScreen);
  setupCarAlbum(state, showScreen);
  setupGraphicsSettings(state, showScreen);
  setupEngineAudioPro(state, showScreen);
  setupTelemetryPro(state, showScreen);
  setupDamagePro(state, showScreen);
  setupExtremeWeather(state, showScreen);
  setupHudEditor(state, showScreen);
  setupCustomRoutes(state, showScreen);
  setupReplayMode(state, showScreen);
  setupSkillChallenges(state, showScreen);
  setupGarageCodes(state, showScreen);
  setupPosterCreator(state, showScreen);
  setupTrailerMode(state, showScreen);
  setupShowroomPro(state, showScreen);
  setupEconomyAdvanced(state, showScreen);
  setupPartsPro(state, showScreen);
  setupSponsors(state, showScreen);
  setupSeasonPass(state, showScreen);
  setupPilotProfile(state, showScreen);
  applyLanguage();
  window.showToast = showToast;

  document.getElementById("resultRestart").onclick = restartRace;
  document.getElementById("resultMenu").onclick = exitToMenu;

  await openGaragePreview(false);
  await openMapPreview(false);

  setLoading(100, "Todo listo.", "Consejo: exporta tu progreso antes de probar otra versión.");
  setTimeout(() => {
    document.getElementById("loadingScreen").classList.add("hidden");
    showScreen("mainMenu");
  }, 250);

  animate();
}

function setLoading(percent, text, tip) {
  const fill = document.getElementById("loadingFill");
  const loadingText = document.getElementById("loadingText");
  const loadingTip = document.getElementById("loadingTip");
  if (fill) fill.style.width = percent + "%";
  if (loadingText) loadingText.textContent = text;
  if (loadingTip) loadingTip.textContent = tip;
}

function setupRenderer() {
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0x050610);
  state.scene.fog = new THREE.Fog(0x050610, 32, 170);

  state.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  state.camera.position.set(6, 4.5, 10);

  state.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
  state.renderer.shadowMap.enabled = true;
  state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(state.renderer.domElement);

  state.loader = new GLTFLoader();
  applyCameraPreset(state);

  window.addEventListener("resize", () => {
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener("keydown", e => {
    if (e.code === "Escape" && state.gameMode === "race") {
      pauseGame();
    }
  });
}

async function openGaragePreview(show = true) {
  const carInfo = state.manifest.cars[state.selectedCarIndex];
  if (state.car) state.scene.remove(state.car);

  try {
    state.car = await loadCar(state.loader, carInfo.file);
  } catch (err) {
    console.warn("No se pudo cargar GLB, usando placeholder", err);
    state.car = createPlaceholderCar();
  }

  state.car.position.set(0, 0.12, 3.5);
  state.car.rotation.set(0, Math.PI, 0);
  state.scene.add(state.car);
  setCarStats(state, carInfo);
  applyUpgradeStats(state);
  applyCustomizationToCar(state);
  updateShopUI(state);
  updateCustomizationUI(state);

  if (show) {
    showScreen("garageScreen");
    showToast("Coche cargado: " + carInfo.name);
  }
}

async function openMapPreview(show = true) {
  const mapInfo = state.manifest.maps[state.selectedMapIndex];
  if (state.map) state.scene.remove(state.map);

  try {
    state.map = await loadMap(state.loader, mapInfo.file);
    state.scene.add(state.map);
  } catch (err) {
    console.warn("No se pudo cargar mapa GLB", err);
  }

  if (mapInfo.fogColor) {
    state.scene.background = new THREE.Color(mapInfo.fogColor);
    state.scene.fog = new THREE.Fog(mapInfo.fogColor, 35, 175);
    applyQuality(state, settings.quality);
  }

  if (show) {
    showScreen("mapsScreen");
    showToast("Mapa cargado: " + mapInfo.name);
  }
}

async function changeCar(direction) {
  const total = state.manifest.cars.length;
  state.selectedCarIndex = (state.selectedCarIndex + direction + total) % total;
  await openGaragePreview(false);
  window.updateGarageUI?.();
}

async function chooseCar() {
  if (!tryUnlockCar(state, state.selectedCarIndex)) return;
  localStorage.setItem("selectedCarIndex", String(state.selectedCarIndex));
  showToast("Coche seleccionado");
  updateShopUI(state);
  updateProfileUI(state);
  updateCustomizationUI(state);
}

async function changeMap(direction) {
  const total = state.manifest.maps.length;
  state.selectedMapIndex = (state.selectedMapIndex + direction + total) % total;
  await openMapPreview(false);
  window.updateMapUI?.();
}

async function chooseMap() {
  if (!tryUnlockMap(state, state.selectedMapIndex)) return;
  localStorage.setItem("selectedMapIndex", String(state.selectedMapIndex));
  showToast("Circuito seleccionado");
  updateProfileUI(state);
}

async function startRace() {
  if (!isCarUnlocked(state, state.selectedCarIndex) || !isMapUnlocked(state, state.selectedMapIndex)) {
    showToast("Desbloquea el coche y el circuito primero");
    return;
  }
  showScreen(null);
  document.getElementById("hud").classList.remove("hidden");
  document.getElementById("mobileControls").classList.remove("hidden");
  document.getElementById("minimap").classList.remove("hidden");

  await openMapPreview(false);
  await openGaragePreview(false);

  const carInfo = state.manifest.cars[state.selectedCarIndex];
  const mapInfo = state.manifest.maps[state.selectedMapIndex];

  const startPos = getStartPositionForLane(0);
  state.car.position.set(startPos.x, 0.12, startPos.z);
  state.car.rotation.set(0, Math.PI - startPos.angle, 0);
  state.coins = 0;
  state.damage = 0;
  state.modeTimer = 0;
  state.objectiveText = "Completa 3 vueltas";
  state.nitro = getNitroMax(state);
  resetPhysics(state);
  startRaceTimer(state);
  hideRaceResult();

  document.getElementById("hudCar").textContent = carInfo.name;
  document.getElementById("hudMap").textContent = mapInfo.name;

  clearTraffic(state);
  clearPolice(state);
  createRivals(state);

  state.gameMode = "race";
  state.paused = true;
  state.audio.unlock();
  unlockAmbient();
  unlockRadio();
  state.audio.button();
  unlockAchievement(state, "first_drive");
  showToast("Prepárate para la salida");

  await runCountdown();
  state.paused = false;
  showToast("¡GO!");
}

async function startFreeMode() {
  if (!isCarUnlocked(state, state.selectedCarIndex) || !isMapUnlocked(state, state.selectedMapIndex)) {
    showToast("Desbloquea el coche y el circuito primero");
    return;
  }
  showScreen(null);
  document.getElementById("hud").classList.remove("hidden");
  document.getElementById("mobileControls").classList.remove("hidden");
  document.getElementById("minimap").classList.remove("hidden");

  await openMapPreview(false);
  await openGaragePreview(false);

  const startPos = getStartPositionForLane(0);
  state.car.position.set(startPos.x, 0.12, startPos.z);
  state.car.rotation.set(0, Math.PI - startPos.angle, 0);

  clearRivals(state);
  clearPolice(state);
  createUrbanWorld(state);
  createMissionMarkers(state);
  createTraffic(state);

  state.coins = 0;
  state.damage = 0;
  state.modeTimer = 0;
  state.objectiveText = "Conduce y recoge 20 monedas";
  state.nitro = getNitroMax(state);
  resetPhysics(state);
  startRaceTimer(state);
  hideRaceResult();

  document.getElementById("hudCar").textContent = state.manifest.cars[state.selectedCarIndex].name;
  document.getElementById("hudMap").textContent = state.manifest.maps[state.selectedMapIndex].name;
  document.getElementById("hudMode").textContent = "Mundo libre";

  state.gameMode = "free";
  state.paused = false;
  state.audio.unlock();
  unlockAmbient();
  unlockRadio();
  state.audio.button();
  unlockAchievement(state, "first_drive");
  showToast("Mundo libre iniciado");
}

async function startChaseMode() {
  if (!isCarUnlocked(state, state.selectedCarIndex) || !isMapUnlocked(state, state.selectedMapIndex)) {
    showToast("Desbloquea el coche y el circuito primero");
    return;
  }
  showScreen(null);
  document.getElementById("hud").classList.remove("hidden");
  document.getElementById("mobileControls").classList.remove("hidden");
  document.getElementById("minimap").classList.remove("hidden");

  await openMapPreview(false);
  await openGaragePreview(false);

  const startPos = getStartPositionForLane(0);
  state.car.position.set(startPos.x, 0.12, startPos.z);
  state.car.rotation.set(0, Math.PI - startPos.angle, 0);

  clearRivals(state);
  createUrbanWorld(state);
  createMissionMarkers(state);
  createTraffic(state);
  createPolice(state);

  state.coins = 0;
  state.damage = 0;
  state.modeTimer = 0;
  state.objectiveText = "Escapa de la policía";
  state.nitro = getNitroMax(state);
  resetPhysics(state);
  startRaceTimer(state);
  hideRaceResult();

  document.getElementById("hudCar").textContent = state.manifest.cars[state.selectedCarIndex].name;
  document.getElementById("hudMap").textContent = state.manifest.maps[state.selectedMapIndex].name;
  document.getElementById("hudMode").textContent = "Persecución";

  state.gameMode = "chase";
  state.paused = true;
  state.audio.unlock();
  unlockAmbient();
  unlockRadio();
  state.audio.button();
  unlockAchievement(state, "first_drive");

  await runCountdown();
  state.paused = false;
  showToast("¡Escapa!");
}

async function startDuel() {
  if (!isCarUnlocked(state, state.selectedCarIndex) || !isMapUnlocked(state, state.selectedMapIndex)) {
    showToast("Desbloquea el coche y el circuito primero");
    return;
  }

  showScreen(null);
  document.getElementById("hud").classList.remove("hidden");
  document.getElementById("mobileControls").classList.add("hidden");
  document.getElementById("minimap").classList.remove("hidden");

  await openMapPreview(false);
  await openGaragePreview(false);

  clearRivals(state);
  clearTraffic(state);
  clearPolice(state);
  clearMissionMarkers(state);
  clearWorkshopMission(state);
  stopDuelMode(state);

  state.coins = 0;
  state.damage = 0;
  state.modeTimer = 0;
  state.nitro = getNitroMax(state);
  resetPhysics(state);
  startRaceTimer(state);
  hideRaceResult();

  document.getElementById("hudCar").textContent = state.manifest.cars[state.selectedCarIndex].name;
  document.getElementById("hudMap").textContent = state.manifest.maps[state.selectedMapIndex].name;

  state.audio.unlock();
  unlockAmbient();
  unlockRadio();
  state.audio.button();
  unlockAchievement(state, "first_drive");

  await runCountdown();
  startDuelMode(state);
  showToast("Duelo local iniciado");
}


function pauseGame() {
  if (!(state.gameMode === "race" || state.gameMode === "free" || state.gameMode === "chase" || state.gameMode === "duel")) return;
  state.paused = true;
  document.getElementById("pauseMenu").classList.remove("hidden");
}

function resumeGame() {
  state.paused = false;
  document.getElementById("pauseMenu").classList.add("hidden");
}

async function restartRace() {
  document.getElementById("pauseMenu").classList.add("hidden");
  await startRace();
}

function exitToMenu() {
  state.gameMode = "menu";
  state.paused = false;
  document.getElementById("pauseMenu").classList.add("hidden");
  document.getElementById("hud").classList.add("hidden");
  document.getElementById("mobileControls").classList.add("hidden");
  document.getElementById("minimap").classList.add("hidden");
  hideRaceResult();
  clearRivals(state);
  clearTraffic(state);
  clearPolice(state);
  clearMissionMarkers(state);
  clearWorkshopMission(state);
  stopDuelMode(state);
  showScreen("mainMenu");
}

function animate() {
  requestAnimationFrame(animate);
  tickDevTools(state);
  const dt = Math.min(state.clock.getDelta(), 0.033);

  updateWeather(state, dt);
  updateAmbientAudio(state, dt);
  updateCareer(state);
  updateAdvancedGarageUI(state);
  updateDailyEvents(state);
  updateMapGPS(state, dt);
  updateCarRadio(state, dt);
  updateVisualEffects(state, dt);
  updateCityLife(state, dt);
  updateIntelligentTraffic(state, dt);
  updatePerformanceOptimizer(state, dt);
  updateSaveSlots(state, dt);
  updateGuidedTutorial(state);
  updateDriftMode(state, dt);
  updatePoliceAdvanced(state, dt);
  updateChampionship(state);
  updateShowroom(state, dt);
  updateHighlights(state, dt);
  updateLiveryEditor(state);
  updateCrewSystem(state);
  updateWeeklyEvents(state);
  updateStoryMode(state);
  updateTrophies(state);
  updateCarAlbum(state);
  updateGraphicsSettings(state, dt);
  updateEngineAudioPro(state, dt);
  updateTelemetryPro(state, dt);
  updateDamagePro(state);
  updateExtremeWeather(state, dt);
  updateHudEditor(state);
  updateCustomRoutes(state, dt);
  updateReplayMode(state, dt);
  updateSkillChallenges(state, dt);
  updateGarageCodes(state);
  updatePosterCreator(state);
  updateTrailerMode(state, dt);
  updateShowroomPro(state);
  updateEconomyAdvanced(state);
  updatePartsPro(state);
  updateSponsors(state);
  updateSeasonPass(state);
  updatePilotProfile(state);

  if ((state.gameMode === "race" || state.gameMode === "free" || state.gameMode === "chase" || state.gameMode === "duel") && !state.paused && state.car) {
    updateCarPhysics(state, controls, dt);
    updateWorld(state, dt);
    updateTraffic(state, dt);
    if (state.gameMode === "free" || state.gameMode === "chase") {
      updateUrbanWorld(state, dt);
      updateCityMissions(state, dt);
    }
    if (state.gameMode === "chase") updatePolice(state, dt);
    if (state.gameMode === "duel") updateLocalMultiplayer(state, dt);
    if (state.gameMode === "race") {
      updateRivals(state, dt);
      calculatePosition(state);
      updateRace(state);
    }
    updateModeObjectives(state, dt);
    if (!updatePhotoMode(state, dt)) updateFollowCamera(state, dt);
    state.audio.engine(Math.abs(state.speed));
  } else if (state.gameMode === "menu" && state.car) {
    state.car.rotation.y += dt * 0.45;
    if (!updatePhotoMode(state, dt)) {
      state.camera.position.lerp(new THREE.Vector3(5.8, 3.2, 8), 0.08);
      state.camera.lookAt(0, 0.7, 0);
    }
  }

  updateHUD();
  state.renderer.render(state.scene, state.camera);
}

function updateHUD() {
  document.getElementById("hudSpeed").textContent = Math.round(Math.abs(state.speed) * 120);
  document.getElementById("hudNitro").textContent = Math.round(state.nitro);
  document.getElementById("hudCoins").textContent = state.coins;
  const walletEl = document.getElementById("hudWallet");
  if (walletEl) walletEl.textContent = state.wallet || 0;
  updateSaveSummary(state);
  document.getElementById("hudPosition").textContent = state.gameMode === "race" ? (state.race?.position || 1) : "-";
  const p2Block = document.getElementById("hudP2Block");
  if (p2Block) p2Block.style.display = state.gameMode === "duel" ? "block" : "none";
  document.getElementById("hudRacers").textContent = state.gameMode === "race" ? 4 : "-";
  const statusEl = document.getElementById("hudTrackStatus");
  if (statusEl && state.trackInfo) {
    statusEl.textContent = state.trackInfo.onTrack ? "En pista" : "Fuera de pista";
    statusEl.style.color = state.trackInfo.onTrack ? "#d8f5ff" : "#ff8a00";
  }
  const damageEl = document.getElementById("hudDamage");
  if (damageEl) {
    damageEl.textContent = Math.round(state.damage || 0);
    damageEl.style.color = (state.damage || 0) > 65 ? "#ff3333" : "#ffd166";
  }
  const objectiveEl = document.getElementById("hudObjective");
  if (objectiveEl) objectiveEl.textContent = state.objectiveText || "--";
  const zoneEl = document.getElementById("hudZone");
  if (zoneEl) zoneEl.textContent = state.currentZone || "--";
  const cityMissionEl = document.getElementById("hudCityMission");
  if (cityMissionEl) cityMissionEl.textContent = state.cityMission?.active?.name || "--";
  const missionProgressEl = document.getElementById("hudMissionProgress");
  if (missionProgressEl) missionProgressEl.textContent = state.cityMission?.progressText || "--";
  updateRaceHUD(state);
}
