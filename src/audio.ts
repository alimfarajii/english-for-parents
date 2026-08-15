// Pre-generated MP3s live in public/audio/: <id>.mp3 (word), <id>_ex.mp3
// (example sentence), g_<unit>_<n>.mp3 (grammar examples).
let current: HTMLAudioElement | null = null;

export function play(file: string): void {
  try {
    if (current) {
      current.pause();
      current = null;
    }
    const a = new Audio(`${import.meta.env.BASE_URL}audio/${file}.mp3`);
    current = a;
    void a.play().catch(() => {});
  } catch {
    /* audio is a nicety, never block the lesson */
  }
}

export const playWord = (id: string) => play(id);
export const playExample = (id: string) => play(`${id}_ex`);

// ------------------------------------------------ tiny feedback sounds
// Synthesized with WebAudio so no files are needed and they work offline.
let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, gain = 0.12): void {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

export function sfxCorrect(): void {
  tone(660, 0, 0.15);
  tone(880, 0.12, 0.22);
}

export function sfxWrong(): void {
  tone(220, 0, 0.25, 0.09);
}

export function sfxFanfare(): void {
  tone(523, 0, 0.18);
  tone(659, 0.14, 0.18);
  tone(784, 0.28, 0.18);
  tone(1047, 0.42, 0.4);
}
