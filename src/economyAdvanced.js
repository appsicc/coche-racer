const STORAGE_KEY = "economyAdvancedData";

export const economyAdvancedState = {
  data: loadData(),
  lastWallet: null
};

export function setupEconomyAdvanced(state, showScreen) {
  state.economyAdvanced = economyAdvancedState;

  document.getElementById("economyBtn").onclick = () => {
    updateEconomyAdvanced(state);
    showScreen("economyScreen");
  };

  document.getElementById("claimBankDaily").onclick = () => claimDailyBonus(state);
  document.getElementById("economyStarterPack").onclick = () => addTransaction(state, "income", 500, "Pack de prueba");
  document.getElementById("economyRepairBudget").onclick = () => addTransaction(state, "expense", 220, "Presupuesto taller");
  document.getElementById("economyRaceGrant").onclick = () => addTransaction(state, "income", 180, "Bono carrera");

  document.getElementById("clearEconomyHistory").onclick = () => {
    if (!confirm("¿Borrar historial financiero?")) return;
    economyAdvancedState.data.history = [];
    saveData();
    updateEconomyUI(state);
    window.showToast?.("Historial financiero borrado");
  };

  updateEconomyAdvanced(state);
}

export function updateEconomyAdvanced(state) {
  detectWalletChanges();
  updateEconomyUI(state);
  updateEconomyHUD();
}

function detectWalletChanges() {
  const wallet = getWallet();
  if (economyAdvancedState.lastWallet === null) {
    economyAdvancedState.lastWallet = wallet;
    return;
  }

  const diff = wallet - economyAdvancedState.lastWallet;
  if (Math.abs(diff) >= 25) {
    if (diff > 0) registerTransaction("income", diff, "Ingreso detectado");
    else registerTransaction("expense", Math.abs(diff), "Gasto detectado");
  }

  economyAdvancedState.lastWallet = wallet;
}

function addTransaction(state, type, amount, label) {
  const current = getWallet();

  if (type === "expense" && current < amount) {
    window.showToast?.("No hay monedas suficientes");
    return;
  }

  const next = type === "income" ? current + amount : current - amount;
  setWallet(next);
  economyAdvancedState.lastWallet = next;
  registerTransaction(type, amount, label);
  updateEconomyUI(state);
  window.showToast?.((type === "income" ? "+" : "-") + amount + " monedas");
}

function registerTransaction(type, amount, label) {
  if (type === "income") economyAdvancedState.data.income += amount;
  if (type === "expense") economyAdvancedState.data.expenses += amount;

  economyAdvancedState.data.history.unshift({
    id: Date.now(),
    type,
    amount,
    label,
    date: new Date().toISOString()
  });

  economyAdvancedState.data.history = economyAdvancedState.data.history.slice(0, 30);
  saveData();
}

function claimDailyBonus(state) {
  const today = new Date().toISOString().slice(0, 10);

  if (economyAdvancedState.data.lastDaily === today) {
    window.showToast?.("Bonus diario ya cobrado");
    return;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (economyAdvancedState.data.lastDaily === yesterday) {
    economyAdvancedState.data.streak += 1;
  } else {
    economyAdvancedState.data.streak = 1;
  }

  const reward = getDailyReward();
  economyAdvancedState.data.lastDaily = today;
  addTransaction(state, "income", reward, "Bonus diario banco");
  updateEconomyUI(state);
}

function getDailyReward() {
  const streak = Math.max(1, economyAdvancedState.data.streak || 1);
  return 180 + Math.min(7, streak) * 35;
}

function updateEconomyUI(state) {
  const coins = getWallet();
  const income = economyAdvancedState.data.income;
  const expenses = economyAdvancedState.data.expenses;
  const balance = income - expenses;
  const fillPercent = Math.min(100, Math.max(0, coins / 40));

  setText("economyCoins", coins);
  setText("economyIncome", income);
  setText("economyExpenses", expenses);
  setText("economyBalance", balance);
  setText("bankStreak", economyAdvancedState.data.streak || 0);
  setText("bankDailyReward", getDailyReward());
  setText("economyAdvice", getAdvice(coins, income, expenses));

  const fill = document.getElementById("economyFill");
  if (fill) fill.style.width = fillPercent + "%";

  renderHistory();
}

function renderHistory() {
  const box = document.getElementById("economyHistory");
  if (!box) return;

  if (!economyAdvancedState.data.history.length) {
    box.innerHTML = "<p>No hay movimientos todavía.</p>";
    return;
  }

  box.innerHTML = economyAdvancedState.data.history.map(item => `
    <div class="economy-row ${item.type}">
      <b>${item.type === "income" ? "+" : "-"}${item.amount} monedas</b>
      <p>${escapeHTML(item.label)} · ${formatDate(item.date)}</p>
    </div>
  `).join("");
}

function updateEconomyHUD() {
  const hud = document.getElementById("hudEconomy");
  if (!hud) return;
  hud.textContent = getWallet() + " monedas";
}

function getAdvice(coins, income, expenses) {
  if (coins < 250) return "Ahorra para kits, mejoras y coches. Haz eventos diarios o rutas para recuperar monedas.";
  if (expenses > income * 0.75) return "Estás gastando bastante. Prioriza mejoras útiles antes de comprar extras.";
  if (coins > 2500) return "Buen ahorro. Puedes invertir en resistencia, taller, coches o estética.";
  return "Economía estable. Mantén ingresos con carreras, retos y eventos semanales.";
}

function getWallet() {
  return Number(localStorage.getItem("walletCoins") || 0);
}

function setWallet(value) {
  localStorage.setItem("walletCoins", String(Math.max(0, Math.round(value))));
}

function loadData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return data && Array.isArray(data.history) ? data : createData();
  } catch {
    return createData();
  }
}

function createData() {
  return {
    income: 0,
    expenses: 0,
    streak: 0,
    lastDaily: null,
    history: []
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(economyAdvancedState.data));
}

function formatDate(date) {
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "--";
  }
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
