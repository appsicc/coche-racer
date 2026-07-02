let deferredInstallPrompt = null;

export function setupPWA() {
  const installBtn = document.getElementById("installBtn");
  const offlineBadge = document.getElementById("offlineBadge");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js")
        .then(() => console.log("Service Worker registrado"))
        .catch(err => console.warn("Service Worker error", err));
    });
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installBtn) installBtn.classList.remove("hidden");
  });

  if (installBtn) {
    installBtn.onclick = async () => {
      if (!deferredInstallPrompt) {
        window.showToast?.("Instalación no disponible en este navegador");
        return;
      }

      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installBtn.classList.add("hidden");
    };
  }

  function updateOnlineStatus() {
    if (!offlineBadge) return;
    offlineBadge.classList.toggle("hidden", navigator.onLine);
    if (!navigator.onLine) window.showToast?.("Estás en modo offline");
  }

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();
}
