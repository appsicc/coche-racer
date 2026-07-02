export function setupSaveSystem(state) {
  state.saveVersion = "v12";
}

export function collectSaveData(state) {
  return {
    version: "v12",
    exportedAt: new Date().toISOString(),
    walletCoins: Number(localStorage.getItem("walletCoins") || 0),
    playerProgress: safeJSON(localStorage.getItem("playerProgress"), {}),
    carUpgrades: safeJSON(localStorage.getItem("carUpgrades"), {}),
    carCustomizations: safeJSON(localStorage.getItem("carCustomizations"), {}),
    achievements: safeJSON(localStorage.getItem("achievements"), {}),
    localRanking: safeJSON(localStorage.getItem("localRanking"), { races: [], duels: [], recent: [] }),
    careerData: safeJSON(localStorage.getItem("careerData"), null),
    favoriteCars: safeJSON(localStorage.getItem("favoriteCars"), []),
    dailyEventsData: safeJSON(localStorage.getItem("dailyEventsData"), null),
    radioEnabled: localStorage.getItem("radioEnabled") || "off",
    radioStation: localStorage.getItem("radioStation") || "electro",
    radioVolume: localStorage.getItem("radioVolume") || "45",
    radioTrackIndex: localStorage.getItem("radioTrackIndex") || "0",
    autoPerformance: localStorage.getItem("autoPerformance") || "on",
    performanceMode: localStorage.getItem("performanceMode") || "off",
    highContrast: localStorage.getItem("highContrast") || "off",
    bigHud: localStorage.getItem("bigHud") || "off",
    reduceMotion: localStorage.getItem("reduceMotion") || "off",
    keybinds: safeJSON(localStorage.getItem("keybinds"), {}),
    autosaveEnabled: localStorage.getItem("autosaveEnabled") || "on",
    guidedTutorialData: safeJSON(localStorage.getItem("guidedTutorialData"), null),
    driftData: safeJSON(localStorage.getItem("driftData"), null),
    driftBestCombo: localStorage.getItem("driftBestCombo") || "1",
    policeAdvancedData: safeJSON(localStorage.getItem("policeAdvancedData"), null),
    championshipData: safeJSON(localStorage.getItem("championshipData"), null),
    showroomRotate: localStorage.getItem("showroomRotate") || "on",
    highlightsData: safeJSON(localStorage.getItem("highlightsData"), { items: [] }),
    liveryData: safeJSON(localStorage.getItem("liveryData"), {}),
    crewData: safeJSON(localStorage.getItem("crewData"), null),
    weeklyEventsData: safeJSON(localStorage.getItem("weeklyEventsData"), null),
    storyModeData: safeJSON(localStorage.getItem("storyModeData"), null),
    trophiesData: safeJSON(localStorage.getItem("trophiesData"), null),
    carAlbumData: safeJSON(localStorage.getItem("carAlbumData"), null),
    graphicsSettingsData: safeJSON(localStorage.getItem("graphicsSettingsData"), null),
    engineAudioProData: safeJSON(localStorage.getItem("engineAudioProData"), null),
    telemetryProData: safeJSON(localStorage.getItem("telemetryProData"), null),
    damageProData: safeJSON(localStorage.getItem("damageProData"), null),
    extremeWeatherData: safeJSON(localStorage.getItem("extremeWeatherData"), null),
    hudEditorData: safeJSON(localStorage.getItem("hudEditorData"), null),
    customRoutesData: safeJSON(localStorage.getItem("customRoutesData"), null),
    replayModeData: safeJSON(localStorage.getItem("replayModeData"), null),
    skillChallengesData: safeJSON(localStorage.getItem("skillChallengesData"), null),
    garageCodesData: safeJSON(localStorage.getItem("garageCodesData"), null),
    posterCreatorData: safeJSON(localStorage.getItem("posterCreatorData"), null),
    trailerModeData: safeJSON(localStorage.getItem("trailerModeData"), null),
    showroomProData: safeJSON(localStorage.getItem("showroomProData"), null),
    economyAdvancedData: safeJSON(localStorage.getItem("economyAdvancedData"), null),
    partsProData: safeJSON(localStorage.getItem("partsProData"), null),
    sponsorsData: safeJSON(localStorage.getItem("sponsorsData"), null),
    seasonPassData: safeJSON(localStorage.getItem("seasonPassData"), null),
    pilotProfileData: safeJSON(localStorage.getItem("pilotProfileData"), null),
    selectedCarIndex: Number(localStorage.getItem("selectedCarIndex") || 0),
    selectedMapIndex: Number(localStorage.getItem("selectedMapIndex") || 0),
    quality: localStorage.getItem("quality") || "medium",
    sound: localStorage.getItem("sound") || "on",
    steerSensitivity: localStorage.getItem("steerSensitivity") || "100",
    buttonScale: localStorage.getItem("buttonScale") || "100",
    vibration: localStorage.getItem("vibration") || "on",
    cameraMode: localStorage.getItem("cameraMode") || "normal",
    language: localStorage.getItem("language") || "es",
    photoFilter: localStorage.getItem("photoFilter") || "none",
    weather: localStorage.getItem("weather") || "clear",
    timeOfDay: localStorage.getItem("timeOfDay") || "night",
    weatherAuto: localStorage.getItem("weatherAuto") || "off",
    ambientVolume: localStorage.getItem("ambientVolume") || "55",
    lastDamage: localStorage.getItem("lastDamage") || "0",
    lastRepairAt: localStorage.getItem("lastRepairAt") || "",
    workshopCoupons: localStorage.getItem("workshopCoupons") || "0"
  };
}

export function exportSave(state) {
  const data = collectSaveData(state);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = "racing_realista_guardado_" + date + ".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  window.showToast?.("Guardado exportado");
  updateSaveSummary(state);
}

export async function importSave(state, file) {
  if (!file) {
    window.showToast?.("Elige un archivo primero");
    return false;
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data || typeof data !== "object") {
      throw new Error("Archivo inválido");
    }

    importSaveObject(data);
    return true;
  } catch (err) {
    console.error(err);
    window.showToast?.("No se pudo importar el guardado");
    return false;
  }
}

export function resetSave(state) {
  const ok = confirm("¿Seguro que quieres borrar TODO el progreso?");
  if (!ok) return;

  [
    "walletCoins",
    "playerProgress",
    "carUpgrades",
    "carCustomizations",
    "achievements",
    "localRanking",
    "careerData",
    "favoriteCars",
    "dailyEventsData",
    "radioEnabled",
    "radioStation",
    "radioVolume",
    "radioTrackIndex",
    "autoPerformance",
    "performanceMode",
    "highContrast",
    "bigHud",
    "reduceMotion",
    "keybinds",
    "autosaveEnabled",
    "guidedTutorialData",
    "driftData",
    "driftBestCombo",
    "policeAdvancedData",
    "championshipData",
    "showroomRotate",
    "highlightsData",
    "liveryData",
    "crewData",
    "weeklyEventsData",
    "storyModeData",
    "trophiesData",
    "carAlbumData",
    "graphicsSettingsData",
    "engineAudioProData",
    "telemetryProData",
    "damageProData",
    "extremeWeatherData",
    "hudEditorData",
    "customRoutesData",
    "replayModeData",
    "skillChallengesData",
    "garageCodesData",
    "posterCreatorData",
    "trailerModeData",
    "showroomProData",
    "economyAdvancedData",
    "partsProData",
    "sponsorsData",
    "seasonPassData",
    "pilotProfileData",
    "selectedCarIndex",
    "selectedMapIndex",
    "steerSensitivity",
    "buttonScale",
    "vibration",
    "cameraMode",
    "language",
    "photoFilter",
    "weather",
    "timeOfDay",
    "weatherAuto",
    "ambientVolume",
    "lastDamage",
    "lastRepairAt",
    "workshopCoupons"
  ].forEach(key => localStorage.removeItem(key));

  window.showToast?.("Partida reseteada");
  setTimeout(() => location.reload(), 700);
}

export function setupSaveUI(state, showScreen) {
  document.getElementById("saveBtn").onclick = () => {
    updateSaveSummary(state);
    showScreen("saveScreen");
  };

  document.getElementById("exportSave").onclick = () => exportSave(state);

  document.getElementById("importSave").onclick = () => {
    const input = document.getElementById("importSaveFile");
    importSave(state, input.files?.[0]);
  };

  document.getElementById("resetSave").onclick = () => resetSave(state);

  updateSaveSummary(state);
}

export function updateSaveSummary(state) {
  const data = collectSaveData(state);
  const progress = data.playerProgress || {};
  const el = document.getElementById("saveSummary");
  if (!el) return;

  el.innerHTML = `
    Nivel: <b>${progress.level || 1}</b><br>
    XP: <b>${progress.xp || 0}</b><br>
    Monedas: <b>${data.walletCoins || 0}</b><br>
    Coches mejorados: <b>${Object.keys(data.carUpgrades || {}).length}</b><br>
    Personalizaciones: <b>${Object.keys(data.carCustomizations || {}).length}</b>
  `;
}

function safeJSON(text, fallback) {
  try {
    return JSON.parse(text || "");
  } catch {
    return fallback;
  }
}


export function importSaveObject(data) {
  try {
    if (!data || typeof data !== "object") throw new Error("Guardado inválido");

    localStorage.setItem("walletCoins", String(Number(data.walletCoins || 0)));
    localStorage.setItem("playerProgress", JSON.stringify(data.playerProgress || {}));
    localStorage.setItem("carUpgrades", JSON.stringify(data.carUpgrades || {}));
    localStorage.setItem("carCustomizations", JSON.stringify(data.carCustomizations || {}));
    localStorage.setItem("achievements", JSON.stringify(data.achievements || {}));
    localStorage.setItem("localRanking", JSON.stringify(data.localRanking || { races: [], duels: [], recent: [] }));
    if (data.careerData) localStorage.setItem("careerData", JSON.stringify(data.careerData));
    localStorage.setItem("favoriteCars", JSON.stringify(data.favoriteCars || []));
    if (data.dailyEventsData) localStorage.setItem("dailyEventsData", JSON.stringify(data.dailyEventsData));

    localStorage.setItem("selectedCarIndex", String(Number(data.selectedCarIndex || 0)));
    localStorage.setItem("selectedMapIndex", String(Number(data.selectedMapIndex || 0)));
    localStorage.setItem("quality", data.quality || "medium");
    localStorage.setItem("sound", data.sound || "on");
    localStorage.setItem("steerSensitivity", data.steerSensitivity || "100");
    localStorage.setItem("buttonScale", data.buttonScale || "100");
    localStorage.setItem("vibration", data.vibration || "on");
    localStorage.setItem("cameraMode", data.cameraMode || "normal");
    localStorage.setItem("language", data.language || "es");
    localStorage.setItem("photoFilter", data.photoFilter || "none");
    localStorage.setItem("weather", data.weather || "clear");
    localStorage.setItem("timeOfDay", data.timeOfDay || "night");
    localStorage.setItem("weatherAuto", data.weatherAuto || "off");
    localStorage.setItem("ambientVolume", data.ambientVolume || "55");
    localStorage.setItem("lastDamage", data.lastDamage || "0");
    localStorage.setItem("lastRepairAt", data.lastRepairAt || "");
    localStorage.setItem("workshopCoupons", data.workshopCoupons || "0");
    localStorage.setItem("radioEnabled", data.radioEnabled || "off");
    localStorage.setItem("radioStation", data.radioStation || "electro");
    localStorage.setItem("radioVolume", data.radioVolume || "45");
    localStorage.setItem("radioTrackIndex", data.radioTrackIndex || "0");
    localStorage.setItem("autoPerformance", data.autoPerformance || "on");
    localStorage.setItem("performanceMode", data.performanceMode || "off");
    localStorage.setItem("highContrast", data.highContrast || "off");
    localStorage.setItem("bigHud", data.bigHud || "off");
    localStorage.setItem("reduceMotion", data.reduceMotion || "off");
    localStorage.setItem("keybinds", JSON.stringify(data.keybinds || {}));
    localStorage.setItem("autosaveEnabled", data.autosaveEnabled || "on");
    if (data.guidedTutorialData) localStorage.setItem("guidedTutorialData", JSON.stringify(data.guidedTutorialData));
    if (data.driftData) localStorage.setItem("driftData", JSON.stringify(data.driftData));
    localStorage.setItem("driftBestCombo", data.driftBestCombo || "1");
    if (data.policeAdvancedData) localStorage.setItem("policeAdvancedData", JSON.stringify(data.policeAdvancedData));
    if (data.championshipData) localStorage.setItem("championshipData", JSON.stringify(data.championshipData));
    localStorage.setItem("showroomRotate", data.showroomRotate || "on");
    localStorage.setItem("highlightsData", JSON.stringify(data.highlightsData || { items: [] }));
    localStorage.setItem("liveryData", JSON.stringify(data.liveryData || {}));
    if (data.crewData) localStorage.setItem("crewData", JSON.stringify(data.crewData));
    if (data.weeklyEventsData) localStorage.setItem("weeklyEventsData", JSON.stringify(data.weeklyEventsData));
    if (data.storyModeData) localStorage.setItem("storyModeData", JSON.stringify(data.storyModeData));
    if (data.trophiesData) localStorage.setItem("trophiesData", JSON.stringify(data.trophiesData));
    if (data.carAlbumData) localStorage.setItem("carAlbumData", JSON.stringify(data.carAlbumData));
    if (data.graphicsSettingsData) localStorage.setItem("graphicsSettingsData", JSON.stringify(data.graphicsSettingsData));
    if (data.engineAudioProData) localStorage.setItem("engineAudioProData", JSON.stringify(data.engineAudioProData));
    if (data.telemetryProData) localStorage.setItem("telemetryProData", JSON.stringify(data.telemetryProData));
    if (data.damageProData) localStorage.setItem("damageProData", JSON.stringify(data.damageProData));
    if (data.extremeWeatherData) localStorage.setItem("extremeWeatherData", JSON.stringify(data.extremeWeatherData));
    if (data.hudEditorData) localStorage.setItem("hudEditorData", JSON.stringify(data.hudEditorData));
    if (data.customRoutesData) localStorage.setItem("customRoutesData", JSON.stringify(data.customRoutesData));
    if (data.replayModeData) localStorage.setItem("replayModeData", JSON.stringify(data.replayModeData));
    if (data.skillChallengesData) localStorage.setItem("skillChallengesData", JSON.stringify(data.skillChallengesData));
    if (data.garageCodesData) localStorage.setItem("garageCodesData", JSON.stringify(data.garageCodesData));
    if (data.posterCreatorData) localStorage.setItem("posterCreatorData", JSON.stringify(data.posterCreatorData));
    if (data.trailerModeData) localStorage.setItem("trailerModeData", JSON.stringify(data.trailerModeData));
    if (data.showroomProData) localStorage.setItem("showroomProData", JSON.stringify(data.showroomProData));
    if (data.economyAdvancedData) localStorage.setItem("economyAdvancedData", JSON.stringify(data.economyAdvancedData));
    if (data.partsProData) localStorage.setItem("partsProData", JSON.stringify(data.partsProData));
    if (data.sponsorsData) localStorage.setItem("sponsorsData", JSON.stringify(data.sponsorsData));
    if (data.seasonPassData) localStorage.setItem("seasonPassData", JSON.stringify(data.seasonPassData));
    if (data.pilotProfileData) localStorage.setItem("pilotProfileData", JSON.stringify(data.pilotProfileData));
    if (data.guidedTutorialData) localStorage.setItem("guidedTutorialData", JSON.stringify(data.guidedTutorialData));
    if (data.driftData) localStorage.setItem("driftData", JSON.stringify(data.driftData));
    localStorage.setItem("driftBestCombo", data.driftBestCombo || "1");
    if (data.policeAdvancedData) localStorage.setItem("policeAdvancedData", JSON.stringify(data.policeAdvancedData));
    if (data.championshipData) localStorage.setItem("championshipData", JSON.stringify(data.championshipData));
    localStorage.setItem("showroomRotate", data.showroomRotate || "on");
    localStorage.setItem("highlightsData", JSON.stringify(data.highlightsData || { items: [] }));
    localStorage.setItem("liveryData", JSON.stringify(data.liveryData || {}));
    if (data.crewData) localStorage.setItem("crewData", JSON.stringify(data.crewData));
    if (data.weeklyEventsData) localStorage.setItem("weeklyEventsData", JSON.stringify(data.weeklyEventsData));
    if (data.storyModeData) localStorage.setItem("storyModeData", JSON.stringify(data.storyModeData));
    if (data.trophiesData) localStorage.setItem("trophiesData", JSON.stringify(data.trophiesData));
    if (data.carAlbumData) localStorage.setItem("carAlbumData", JSON.stringify(data.carAlbumData));
    if (data.graphicsSettingsData) localStorage.setItem("graphicsSettingsData", JSON.stringify(data.graphicsSettingsData));
    if (data.engineAudioProData) localStorage.setItem("engineAudioProData", JSON.stringify(data.engineAudioProData));
    if (data.telemetryProData) localStorage.setItem("telemetryProData", JSON.stringify(data.telemetryProData));
    if (data.damageProData) localStorage.setItem("damageProData", JSON.stringify(data.damageProData));
    if (data.extremeWeatherData) localStorage.setItem("extremeWeatherData", JSON.stringify(data.extremeWeatherData));
    if (data.hudEditorData) localStorage.setItem("hudEditorData", JSON.stringify(data.hudEditorData));
    if (data.customRoutesData) localStorage.setItem("customRoutesData", JSON.stringify(data.customRoutesData));
    if (data.replayModeData) localStorage.setItem("replayModeData", JSON.stringify(data.replayModeData));
    if (data.skillChallengesData) localStorage.setItem("skillChallengesData", JSON.stringify(data.skillChallengesData));
    if (data.garageCodesData) localStorage.setItem("garageCodesData", JSON.stringify(data.garageCodesData));
    if (data.posterCreatorData) localStorage.setItem("posterCreatorData", JSON.stringify(data.posterCreatorData));
    if (data.trailerModeData) localStorage.setItem("trailerModeData", JSON.stringify(data.trailerModeData));
    if (data.showroomProData) localStorage.setItem("showroomProData", JSON.stringify(data.showroomProData));
    if (data.economyAdvancedData) localStorage.setItem("economyAdvancedData", JSON.stringify(data.economyAdvancedData));
    if (data.partsProData) localStorage.setItem("partsProData", JSON.stringify(data.partsProData));
    if (data.sponsorsData) localStorage.setItem("sponsorsData", JSON.stringify(data.sponsorsData));
    if (data.seasonPassData) localStorage.setItem("seasonPassData", JSON.stringify(data.seasonPassData));
    if (data.pilotProfileData) localStorage.setItem("pilotProfileData", JSON.stringify(data.pilotProfileData));

    alert("Guardado cargado. El juego se reiniciará.");
    location.reload();
    return true;
  } catch (err) {
    console.error(err);
    alert("No se pudo cargar el guardado.");
    return false;
  }
}
