/**
 * Synthesized UI audio cues for the Ambient Scribe.
 *
 * We synthesize tones with the Web Audio API rather than ship audio assets:
 * cues are tiny, deterministic, and don't add a network round-trip the way
 * `<audio src="…">` would. The cue context is shared across cues and lives
 * for the lifetime of the tab — recreating it per cue causes audible clicks
 * on Safari and iOS.
 *
 * Cues use the speakers, not the microphone, and they cooperate with the
 * existing capture pipeline because:
 *   - The mic stream's `echoCancellation: true` constraint suppresses our
 *     own cues from leaking into the transcription.
 *   - Cue tones are short (<300 ms) and gated to user-intended transitions
 *     (start success, stop, fatal error) so reconnects don't cause phantom
 *     dings.
 */

let cueContext: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (cueContext && cueContext.state !== "closed") return cueContext;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  cueContext = new Ctor();
  return cueContext;
}

interface ToneSpec {
  /** Frequency in Hz. */
  freq: number;
  /** Start offset from "now", in seconds. */
  start: number;
  /** Tone length in seconds. */
  duration: number;
  /** Peak gain (0..1). Defaults to 1 — masterGain controls overall loudness. */
  gain?: number;
  type?: OscillatorType;
}

const MASTER_GAIN = 0.18;
const ATTACK = 0.012;
const RELEASE = 0.06;

function playSequence(tones: ToneSpec[]) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  // Browsers may suspend the context until a user gesture; the scribe
  // start button counts as one, so resuming here just unlocks any later
  // cues that fire from non-gesture code paths.
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }

  const master = ctx.createGain();
  master.gain.value = MASTER_GAIN;
  master.connect(ctx.destination);

  const now = ctx.currentTime;
  for (const t of tones) {
    const osc = ctx.createOscillator();
    osc.type = t.type ?? "sine";
    osc.frequency.value = t.freq;

    const env = ctx.createGain();
    const peak = t.gain ?? 1;
    const startAt = now + t.start;
    const endAt = startAt + t.duration;
    env.gain.setValueAtTime(0, startAt);
    env.gain.linearRampToValueAtTime(peak, startAt + ATTACK);
    env.gain.setValueAtTime(peak, Math.max(startAt + ATTACK, endAt - RELEASE));
    env.gain.exponentialRampToValueAtTime(0.0001, endAt);

    osc.connect(env).connect(master);
    osc.start(startAt);
    osc.stop(endAt + 0.05);
  }
}

/** Bright ascending two-note: C5 → G5. Plays when listening starts. */
export function playStartCue() {
  playSequence([
    { freq: 523.25, start: 0, duration: 0.1 },
    { freq: 783.99, start: 0.085, duration: 0.18 },
  ]);
}

/** Soft descending two-note: G5 → C5. Plays when listening stops. */
export function playStopCue() {
  playSequence([
    { freq: 783.99, start: 0, duration: 0.09 },
    { freq: 523.25, start: 0.075, duration: 0.2 },
  ]);
}

/** Two short low triangles at A3. Plays on fatal/give-up errors. */
export function playErrorCue() {
  playSequence([
    { freq: 220, start: 0, duration: 0.12, type: "triangle" },
    { freq: 196, start: 0.16, duration: 0.22, type: "triangle" },
  ]);
}

/**
 * Soft single mid-low tone. Plays when the session pauses to reconnect
 * (server-initiated close, ICE blip, heartbeat stall). Intentionally
 * quiet and brief — reconnects are usually transient, so the cue should
 * be a subtle "stand by", not an alarm.
 */
export function playReconnectStartCue() {
  playSequence([{ freq: 440, start: 0, duration: 0.14, gain: 0.65 }]);
}

/**
 * Two-note ascend, slightly quieter and tighter than `playStartCue` so it
 * reads as "we're back" rather than "fresh session start". Plays after a
 * successful reconnect.
 */
export function playReconnectSuccessCue() {
  playSequence([
    { freq: 587.33, start: 0, duration: 0.08, gain: 0.7 }, // D5
    { freq: 880, start: 0.07, duration: 0.14, gain: 0.7 }, // A5
  ]);
}

/**
 * Suppress / unsuppress all cues. Useful as a future user-facing toggle —
 * not currently surfaced in the UI.
 */
export function setCuesMuted(value: boolean) {
  muted = value;
}

export function areCuesMuted() {
  return muted;
}
