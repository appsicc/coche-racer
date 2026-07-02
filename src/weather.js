import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const weatherState = {
  weather: localStorage.getItem("weather") || "clear",
  time: localStorage.getItem("timeOfDay") || "night",
  auto: localStorage.getItem("weatherAuto") === "on",
  timer: 0,
  rain: null,
  lightning: null,
  lightningTimer: 0
};

const WEATHER_LABELS = {
  clear: "Despejado",
  rain: "Lluvia",
  fog: "Niebla",
  storm: "Tormenta"
};

const TIME_LABELS = {
  day: "Día",
  sunset: "Atardecer",
  night: "Noche"
};

export function setupWeather(state) {
  createRain(state);
  createLightning(state);
  applyWeather(state);
}

export function setupWeatherUI(state, showScreen) {
  document.getElementById("weatherBtn").onclick = () => {
    updateWeatherUI();
    showScreen("weatherScreen");
  };

  document.querySelectorAll(".weatherBtn").forEach(btn => {
    btn.onclick = () => {
      weatherState.weather = btn.dataset.weather;
      localStorage.setItem("weather", weatherState.weather);
      applyWeather(state);
      updateWeatherUI();
      window.showToast?.("Clima: " + WEATHER_LABELS[weatherState.weather]);
    };
  });

  document.querySelectorAll(".timeBtn").forEach(btn => {
    btn.onclick = () => {
      weatherState.time = btn.dataset.time;
      localStorage.setItem("timeOfDay", weatherState.time);
      applyWeather(state);
      updateWeatherUI();
      window.showToast?.("Hora: " + TIME_LABELS[weatherState.time]);
    };
  });

  document.getElementById("weatherAuto").onclick = () => {
    weatherState.auto = !weatherState.auto;
    localStorage.setItem("weatherAuto", weatherState.auto ? "on" : "off");
    updateWeatherUI();
  };

  updateWeatherUI();
}

export function updateWeather(state, dt) {
  if (!state.scene) return;

  if (weatherState.auto) {
    weatherState.timer += dt;
    if (weatherState.timer > 28) {
      weatherState.timer = 0;
      cycleWeather(state);
    }
  }

  updateRain(state, dt);
  updateLightning(state, dt);

  const hud = document.getElementById("hudWeather");
  if (hud) hud.textContent = WEATHER_LABELS[weatherState.weather] + " · " + TIME_LABELS[weatherState.time];
}

function createRain(state) {
  const count = 750;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = Math.random() * 35 + 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x8fd8ff,
    size: 0.08,
    transparent: true,
    opacity: 0.58
  });

  weatherState.rain = new THREE.Points(geo, mat);
  weatherState.rain.name = "weather_rain";
  state.scene.add(weatherState.rain);
}

function createLightning(state) {
  weatherState.lightning = new THREE.PointLight(0xd8f5ff, 0, 180);
  weatherState.lightning.position.set(0, 28, -35);
  state.scene.add(weatherState.lightning);
}

function updateRain(state, dt) {
  const rain = weatherState.rain;
  if (!rain || !state.car) return;

  const enabled = weatherState.weather === "rain" || weatherState.weather === "storm";
  rain.visible = enabled;
  if (!enabled) return;

  const arr = rain.geometry.attributes.position.array;
  const speed = weatherState.weather === "storm" ? 34 : 22;

  for (let i = 0; i < arr.length; i += 3) {
    arr[i + 1] -= speed * dt;
    arr[i + 2] += (weatherState.weather === "storm" ? 11 : 6) * dt;

    if (arr[i + 1] < 0) {
      arr[i] = state.car.position.x + (Math.random() - 0.5) * 120;
      arr[i + 1] = Math.random() * 35 + 8;
      arr[i + 2] = state.car.position.z + (Math.random() - 0.5) * 120;
    }
  }

  rain.geometry.attributes.position.needsUpdate = true;
}

function updateLightning(state, dt) {
  const light = weatherState.lightning;
  if (!light) return;

  if (weatherState.weather !== "storm") {
    light.intensity = THREE.MathUtils.lerp(light.intensity, 0, 0.15);
    return;
  }

  weatherState.lightningTimer -= dt;

  if (weatherState.lightningTimer <= 0) {
    weatherState.lightningTimer = 3 + Math.random() * 6;
    light.position.set((Math.random() - 0.5) * 60, 30, -20 - Math.random() * 80);
    light.intensity = 12 + Math.random() * 10;
    state.audio?.button?.();
  } else {
    light.intensity = THREE.MathUtils.lerp(light.intensity, 0, 0.12);
  }
}

function applyWeather(state) {
  if (!state.scene) return;

  const colors = {
    day: 0x87bfff,
    sunset: 0xff8a55,
    night: 0x050610
  };

  const fogColors = {
    day: 0x9ecfff,
    sunset: 0xff9a5c,
    night: 0x050610
  };

  state.scene.background = new THREE.Color(colors[weatherState.time] || colors.night);

  let near = 35;
  let far = 180;

  if (weatherState.weather === "fog") {
    near = 8;
    far = 80;
  }

  if (weatherState.weather === "rain") {
    near = 18;
    far = 125;
  }

  if (weatherState.weather === "storm") {
    near = 12;
    far = 95;
  }

  state.scene.fog = new THREE.Fog(fogColors[weatherState.time] || fogColors.night, near, far);

  state.scene.traverse(obj => {
    if (!obj.isLight) return;

    if (obj.type === "AmbientLight") {
      obj.intensity = weatherState.time === "day" ? 1.15 : weatherState.time === "sunset" ? 0.82 : 0.58;
    }

    if (obj.type === "DirectionalLight") {
      obj.intensity = weatherState.time === "day" ? 2.2 : weatherState.time === "sunset" ? 1.25 : 0.65;
    }
  });

  if (weatherState.rain) {
    weatherState.rain.visible = weatherState.weather === "rain" || weatherState.weather === "storm";
  }
}

function cycleWeather(state) {
  const times = ["day", "sunset", "night"];
  const weathers = ["clear", "rain", "fog", "storm"];

  weatherState.time = times[(times.indexOf(weatherState.time) + 1) % times.length];
  weatherState.weather = weathers[(weathers.indexOf(weatherState.weather) + 1) % weathers.length];

  localStorage.setItem("timeOfDay", weatherState.time);
  localStorage.setItem("weather", weatherState.weather);
  applyWeather(state);
  updateWeatherUI();
}

function updateWeatherUI() {
  document.querySelectorAll(".weatherBtn").forEach(btn => {
    btn.classList.toggle("active-weather", btn.dataset.weather === weatherState.weather);
  });

  document.querySelectorAll(".timeBtn").forEach(btn => {
    btn.classList.toggle("active-weather", btn.dataset.time === weatherState.time);
  });

  const auto = document.getElementById("weatherAuto");
  if (auto) auto.textContent = "CICLO AUTO: " + (weatherState.auto ? "ON" : "OFF");
}
