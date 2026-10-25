// Original procedural cues: no external audio, speech synthesis or autoplay.
let context = null;
let enabled = true;
const activeVoices = new Set();

export function setAudioActive(value) {
  enabled = Boolean(value);
  if (!enabled) {
    for (const voice of activeVoices) {
      try { voice.stop(); } catch {}
    }
    activeVoices.clear();
    context?.suspend().catch(() => {});
  }
}

export function playCue(kind = 'click', settings = {}) {
  if (!enabled || settings.sound === false || globalThis.document?.hidden) return;
  try {
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContext) return;
    context ??= new AudioContext();
    context.resume().catch(() => {});
    const volume = Math.min(1, Math.max(0, Number(settings.volume ?? 0.55)));
    const notes = kind === 'call' ? [[370, 0, .16], [494, .2, .24]]
      : kind === 'result' ? [[330, 0, .2], [440, .12, .3], [554, .24, .4]]
      : kind === 'warning' ? [[262, 0, .12], [220, .14, .2]] : [[540, 0, .075]];
    for (const [frequency, delay, length] of notes) {
      const tone = context.createOscillator(), gain = context.createGain();
      const start = context.currentTime + delay;
      tone.type = 'sine'; tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.05 * volume, start + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, start + length);
      tone.connect(gain); gain.connect(context.destination);
      activeVoices.add(tone);
      tone.onended = () => { activeVoices.delete(tone); tone.disconnect(); gain.disconnect(); };
      tone.start(start); tone.stop(start + length + .02);
    }
  } catch { /* Sound is optional; unavailable hardware must not block play. */ }
}
