export const languages = {
  es: {
    label: "Español",
    mainSubtitle: "V66: perfil de piloto, tarjeta compartible, estadísticas destacadas, temporada, patrocinadores, piezas, economía y PWA.",
    modeRace: "CARRERA",
    modeFree: "MUNDO LIBRE",
    modeChase: "PERSECUCIÓN",
    modeRaceDesc: "3 vueltas · Rivales IA · Recompensa alta",
    modeFreeDesc: "Ciudad · Misiones · Recompensas urbanas",
    modeChaseDesc: "Policía · Daños · Aguanta el máximo",
    garage: "GARAJE",
    customize: "PERSONALIZAR",
    shop: "TIENDA / MEJORAS",
    profile: "PERFIL / MISIONES",
    achievements: "LOGROS",
    dev: "DEV / DIAGNÓSTICO",
    save: "GUARDADO",
    settings: "AJUSTES",
    help: "AYUDA",
    languageTitle: "Idioma",
    languageDesc: "Cambia los textos principales del juego.",
    currentLanguage: "Actual",
    helpGoal: "Objetivo de esta V66: crear y compartir tu perfil de piloto con estadísticas destacadas."
  },
  en: {
    label: "English",
    mainSubtitle: "V66: pilot profile, shareable card, highlighted stats, season, sponsors, parts, economy and PWA.",
    modeRace: "RACE",
    modeFree: "FREE ROAM",
    modeChase: "CHASE",
    modeRaceDesc: "3 laps · AI rivals · High reward",
    modeFreeDesc: "City · Missions · Urban rewards",
    modeChaseDesc: "Police · Damage · Survive as long as possible",
    garage: "GARAGE",
    customize: "CUSTOMIZE",
    shop: "SHOP / UPGRADES",
    profile: "PROFILE / MISSIONS",
    achievements: "ACHIEVEMENTS",
    dev: "DEV / DIAGNOSTICS",
    save: "SAVE DATA",
    settings: "SETTINGS",
    help: "HELP",
    languageTitle: "Language",
    languageDesc: "Change the main game texts.",
    currentLanguage: "Current",
    helpGoal: "Goal of V66: create and share your pilot profile with highlighted stats."
  },
  ca: {
    label: "Català",
    mainSubtitle: "V18: selector d'idioma, menú de modes, estadístiques, diagnòstic, PWA, ciutat i progrés.",
    modeRace: "CURSA",
    modeFree: "MÓN LLIURE",
    modeChase: "PERSECUCIÓ",
    modeRaceDesc: "3 voltes · Rivals IA · Recompensa alta",
    modeFreeDesc: "Ciutat · Missions · Recompenses urbanes",
    modeChaseDesc: "Policia · Danys · Aguanta el màxim",
    garage: "GARATGE",
    customize: "PERSONALITZAR",
    shop: "BOTIGA / MILLORES",
    profile: "PERFIL / MISSIONS",
    achievements: "ASSOLIMENTS",
    dev: "DEV / DIAGNÒSTIC",
    save: "DESAT",
    settings: "AJUSTOS",
    help: "AJUDA",
    languageTitle: "Idioma",
    languageDesc: "Canvia els textos principals del joc.",
    currentLanguage: "Actual",
    helpGoal: "Objectiu de la V18: canviar l'idioma i preparar el joc per a més jugadors."
  }
};

export const languageState = {
  current: localStorage.getItem("language") || "es"
};

export function setupLanguageUI() {
  document.getElementById("langES").onclick = () => setLanguage("es");
  document.getElementById("langEN").onclick = () => setLanguage("en");
  document.getElementById("langCA").onclick = () => setLanguage("ca");
  applyLanguage();
}

export function setLanguage(code) {
  if (!languages[code]) code = "es";
  languageState.current = code;
  localStorage.setItem("language", code);
  applyLanguage();
  window.showToast?.("Idioma: " + languages[code].label);
}

export function applyLanguage() {
  const dict = languages[languageState.current] || languages.es;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) el.textContent = dict[key];
  });

  const label = document.getElementById("languageLabel");
  if (label) label.textContent = dict.label;

  const buttons = {
    es: document.getElementById("langES"),
    en: document.getElementById("langEN"),
    ca: document.getElementById("langCA")
  };

  Object.entries(buttons).forEach(([key, btn]) => {
    if (btn) btn.classList.toggle("active-language", key === languageState.current);
  });
}
