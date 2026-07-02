export function createAudioSystem() {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;
  let lastNitro = 0;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();

      engineOsc = ctx.createOscillator();
      engineGain = ctx.createGain();
      engineOsc.type = "sawtooth";
      engineOsc.frequency.value = 70;
      engineGain.gain.value = 0.0;
      engineOsc.connect(engineGain);
      engineGain.connect(ctx.destination);
      engineOsc.start();
    }
    if (ctx.state === "suspended") ctx.resume();
  }

  function blip(freq = 440, duration = 0.08, volume = 0.08, type = "sine") {
    ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  }

  let enabled = localStorage.getItem("sound") !== "off";

  return {
    setEnabled(value) {
      enabled = value;
      if (!enabled && engineGain) engineGain.gain.value = 0;
    },
    unlock: ensure,
    engine(speed) {
      if (!enabled) return;
      ensure();
      if (!engineOsc || !engineGain) return;
      const s = Math.min(Math.abs(speed), 2.4);
      engineOsc.frequency.setTargetAtTime(65 + s * 95, ctx.currentTime, 0.05);
      engineGain.gain.setTargetAtTime(0.018 + s * 0.025, ctx.currentTime, 0.08);
    },
    nitro() {
      if (!enabled) return;
      if (performance.now() - lastNitro < 120) return;
      lastNitro = performance.now();
      blip(160, 0.05, 0.035, "square");
    },
    crash() {
      if (!enabled) return;
      blip(90, 0.18, 0.12, "sawtooth");
    },
    coin() {
      if (!enabled) return;
      blip(880, 0.08, 0.07, "sine");
      setTimeout(() => blip(1180, 0.07, 0.06, "sine"), 70);
    },
    button() {
      if (!enabled) return;
      blip(520, 0.07, 0.05, "triangle");
    }
  };
}
