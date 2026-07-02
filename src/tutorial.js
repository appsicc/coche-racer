const STEPS = [
  {
    title: "Bienvenido a Racing Realista",
    text: "Elige un modo: Carrera, Mundo libre o Persecución. Puedes cambiar coche, mapa y mejoras desde el menú."
  },
  {
    title: "Controles",
    text: "PC: W acelerar, S frenar, A/D girar y Espacio para nitro. En móvil usa los botones táctiles."
  },
  {
    title: "Progreso",
    text: "Gana monedas y XP completando carreras, misiones urbanas y persecuciones."
  },
  {
    title: "Tienda y personalización",
    text: "Compra mejoras, cambia colores, añade neones y guarda estilos por coche."
  },
  {
    title: "Guardado",
    text: "Exporta tu progreso en Guardado para conservarlo al probar nuevas versiones."
  }
];

let step = 0;

export function setupTutorial(state, showScreen) {
  const seen = localStorage.getItem("tutorialSeen") === "yes";

  document.getElementById("tutorialPrev").onclick = () => {
    step = Math.max(0, step - 1);
    updateTutorialUI();
  };

  document.getElementById("tutorialNext").onclick = () => {
    if (step >= STEPS.length - 1) {
      finishTutorial(showScreen);
    } else {
      step++;
      updateTutorialUI();
    }
  };

  document.getElementById("skipTutorial").onclick = () => finishTutorial(showScreen);

  updateTutorialUI();

  if (!seen) {
    setTimeout(() => showScreen("tutorialScreen"), 650);
  }
}

function updateTutorialUI() {
  const data = STEPS[step];
  document.getElementById("tutorialTitle").textContent = data.title;
  document.getElementById("tutorialText").textContent = data.text;
  document.getElementById("tutorialProgress").style.width = ((step + 1) / STEPS.length * 100) + "%";
  document.getElementById("tutorialPrev").disabled = step === 0;
  document.getElementById("tutorialNext").textContent = step >= STEPS.length - 1 ? "TERMINAR" : "SIGUIENTE →";
}

function finishTutorial(showScreen) {
  localStorage.setItem("tutorialSeen", "yes");
  showScreen("mainMenu");
  window.showToast?.("Tutorial completado");
}
