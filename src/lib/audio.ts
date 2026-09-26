// PRD 11.5: Web Audio synth, no sound files. Off by default. The AudioContext is only created
// from a user gesture (unlockAudio), and every call is best effort: audio never breaks the game.

type Ctx = AudioContext;
let ctx: Ctx | null = null;

/** Call from a click/tap handler. Creates or resumes the AudioContext. */
export function unlockAudio(): void {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

const ready = (): Ctx | null => (ctx && ctx.state === "running" ? ctx : null);

/**
 * Needle buzz: sawtooth 110 Hz through a 900 Hz lowpass, gain swung by a 32 Hz LFO around a
 * 0.08 peak. Returns a stop function (safe to call more than once).
 */
export function startNeedleBuzz(): () => void {
  const ac = ready();
  if (!ac) return () => {};
  try {
    const osc = ac.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 110;
    const lowpass = ac.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 900;
    const amp = ac.createGain();
    amp.gain.value = 0.04;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 32;
    const lfoDepth = ac.createGain();
    lfoDepth.gain.value = 0.04; // 0.04 +/- 0.04 -> peaks at 0.08
    lfo.connect(lfoDepth).connect(amp.gain);
    osc.connect(lowpass).connect(amp).connect(ac.destination);
    const t = ac.currentTime;
    osc.start(t);
    lfo.start(t);
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      try {
        const end = ac.currentTime + 0.08;
        amp.gain.cancelScheduledValues(ac.currentTime);
        amp.gain.setTargetAtTime(0, ac.currentTime, 0.02);
        osc.stop(end);
        lfo.stop(end);
      } catch {
        /* already stopped */
      }
    };
  } catch {
    return () => {};
  }
}

/** Verdict stamp: a short noise burst with a fast decay. */
export function playStamp(): void {
  const ac = ready();
  if (!ac) return;
  try {
    const length = Math.floor(ac.sampleRate * 0.18);
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const lowpass = ac.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 1800;
    const amp = ac.createGain();
    amp.gain.setValueAtTime(0.35, ac.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
    src.connect(lowpass).connect(amp).connect(ac.destination);
    src.start();
  } catch {
    /* no sound is fine */
  }
}
