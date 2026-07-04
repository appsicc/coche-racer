const CACHE_NAME = "racing-realista-v66-fix2";
const LOCAL_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./manifest.json",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./src/main.js",
  "./src/world.js",
  "./src/car.js",
  "./src/controls.js",
  "./src/carPhysics.js",
  "./src/camera.js",
  "./src/audio.js",
  "./src/ui.js",
  "./src/race.js",
  "./src/rivals.js",
  "./src/countdown.js",
  "./src/track.js",
  "./src/settings.js",
  "./src/traffic.js",
  "./src/shop.js",
  "./src/progress.js",
  "./src/customization.js",
  "./src/urbanWorld.js",
  "./src/cityMissions.js",
  "./src/saveSystem.js",
  "./src/controlSettings.js",
  "./src/tutorial.js",
  "./src/achievements.js",
  "./src/pwa.js",
  "./src/devTools.js",
  "./src/resultStats.js",
  "./src/language.js",
  "./src/photoMode.js",
  "./src/weather.js",
  "./src/ambientAudio.js",
  "./src/localMultiplayer.js",
  "./src/ranking.js",
  "./src/workshop.js",
  "./src/workshopMissions.js",
  "./src/career.js",
  "./src/advancedGarage.js",
  "./src/dailyEvents.js",
  "./src/mapGPS.js",
  "./src/radio.js",
  "./src/visualEffects.js",
  "./src/cityLife.js",
  "./src/intelligentTraffic.js",
  "./src/performanceOptimizer.js",
  "./src/accessibility.js",
  "./src/saveSlots.js",
  "./src/guidedTutorial.js",
  "./src/driftMode.js",
  "./src/policeAdvanced.js",
  "./src/championship.js",
  "./src/showroom.js",
  "./src/highlights.js",
  "./src/liveryEditor.js",
  "./src/crewSystem.js",
  "./src/weeklyEvents.js",
  "./src/storyMode.js",
  "./src/trophies.js",
  "./src/carAlbum.js",
  "./src/graphicsSettings.js",
  "./src/engineAudioPro.js",
  "./src/telemetryPro.js",
  "./src/damagePro.js",
  "./src/extremeWeather.js",
  "./src/hudEditor.js",
  "./src/customRoutes.js",
  "./src/replayMode.js",
  "./src/skillChallenges.js",
  "./src/garageCodes.js",
  "./src/posterCreator.js",
  "./src/trailerMode.js",
  "./src/showroomPro.js",
  "./src/economyAdvanced.js",
  "./src/partsPro.js",
  "./src/sponsors.js",
  "./src/seasonPass.js",
  "./src/pilotProfile.js",
  "./assets/models/cars/rosso_gt_ferrari_style.glb",
  "./assets/models/cars/toro_v12_lambo_style.glb",
  "./assets/models/cars/silver_911_porsche_style.glb",
  "./assets/models/cars/blue_racer_mclaren_style.glb",
  "./assets/models/maps/city_neon_track.glb",
  "./assets/models/maps/desert_highway_track.glb",
  "./assets/models/maps/mountain_night_track.glb"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(LOCAL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (request.method === "GET" && response && response.status === 200 && request.url.startsWith(self.location.origin)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        if (request.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
