export function updateResultStats(state, extra = {}) {
  const coins = state.coins || 0;
  const damage = Math.round(state.damage || 0);

  setText("resultCoins", coins);
  setText("resultDamage", damage + "%");

  if (extra.reward != null) {
    setText("resultReward", extra.reward + " monedas");
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
