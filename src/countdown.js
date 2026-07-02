export async function runCountdown() {
  const el = document.getElementById("countdown");
  el.classList.remove("hidden");

  for (const value of ["3", "2", "1", "GO!"]) {
    el.textContent = value;
    await wait(700);
  }

  el.classList.add("hidden");
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
