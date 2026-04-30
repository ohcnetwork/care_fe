/**
 * Tiny singleton usage tracker for the Ambient Scribe POC.
 *
 * Records every OpenAI call (token + audio usage) and exposes two views:
 *   - session: counters since the last `resetSession()` (i.e. since the
 *     panel mounted, or until the doctor explicitly clears them).
 *   - account: cumulative across the lifetime of this browser profile,
 *     persisted to localStorage so it survives reloads.
 *
 * This is dev-tooling only — the data never leaves the browser.
 */

export type UsageSource = "diarize" | "form_fill" | "realtime";

export interface UsageRecord {
  ts: number;
  source: UsageSource;
  model: string;
  promptTokens: number;
  completionTokens: number;
  /** Audio fed to the realtime transcription session, in seconds. */
  audioInputSeconds?: number;
  /** USD estimate using `PRICING` below. */
  costUsd: number;
}

export interface UsageBucket {
  requests: number;
  promptTokens: number;
  completionTokens: number;
  audioInputSeconds: number;
  costUsd: number;
}

export interface UsageSummary extends UsageBucket {
  totalTokens: number;
  bySource: Partial<Record<UsageSource, UsageBucket>>;
}

// Public list pricing (USD), normalized to per-token / per-second. Keep in
// sync with the model strings used by the call sites — anything missing
// here just contributes $0 to the cost estimate.
const PRICING: Record<
  string,
  { inPerToken?: number; outPerToken?: number; audioPerSec?: number }
> = {
  // chat.completions
  "gpt-4o": {
    inPerToken: 2.5 / 1_000_000,
    outPerToken: 10 / 1_000_000,
  },
  "gpt-4o-mini": {
    inPerToken: 0.15 / 1_000_000,
    outPerToken: 0.6 / 1_000_000,
  },
  // realtime transcription (audio-only billing)
  "gpt-4o-mini-transcribe": {
    audioPerSec: 0.003 / 60,
  },
};

const ACCOUNT_STORAGE_KEY = "ambient_scribe_usage_account_v1";

function emptyBucket(): UsageBucket {
  return {
    requests: 0,
    promptTokens: 0,
    completionTokens: 0,
    audioInputSeconds: 0,
    costUsd: 0,
  };
}

function emptySummary(): UsageSummary {
  return { ...emptyBucket(), totalTokens: 0, bySource: {} };
}

function addInto(target: UsageSummary, r: UsageRecord) {
  target.requests += 1;
  target.promptTokens += r.promptTokens;
  target.completionTokens += r.completionTokens;
  target.totalTokens += r.promptTokens + r.completionTokens;
  target.audioInputSeconds += r.audioInputSeconds ?? 0;
  target.costUsd += r.costUsd;

  const existing = target.bySource[r.source] ?? emptyBucket();
  existing.requests += 1;
  existing.promptTokens += r.promptTokens;
  existing.completionTokens += r.completionTokens;
  existing.audioInputSeconds += r.audioInputSeconds ?? 0;
  existing.costUsd += r.costUsd;
  target.bySource[r.source] = existing;
}

function loadAccount(): UsageSummary {
  if (typeof window === "undefined") return emptySummary();
  try {
    const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return emptySummary();
    const parsed = JSON.parse(raw) as UsageSummary;
    // Defensive: ensure shape — older versions may be missing fields.
    return {
      ...emptySummary(),
      ...parsed,
      bySource: parsed.bySource ?? {},
    };
  } catch {
    return emptySummary();
  }
}

function persistAccount(summary: UsageSummary) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(summary));
  } catch {
    // QuotaExceeded etc. — non-fatal.
  }
}

function estimateCost(input: {
  model: string;
  promptTokens: number;
  completionTokens: number;
  audioInputSeconds?: number;
}): number {
  const p = PRICING[input.model];
  if (!p) return 0;
  let cost = 0;
  if (p.inPerToken) cost += input.promptTokens * p.inPerToken;
  if (p.outPerToken) cost += input.completionTokens * p.outPerToken;
  if (p.audioPerSec) cost += (input.audioInputSeconds ?? 0) * p.audioPerSec;
  return cost;
}

let session: UsageSummary = emptySummary();
let account: UsageSummary = loadAccount();
const subscribers = new Set<() => void>();

function notify() {
  for (const cb of subscribers) cb();
}

export interface RecordInput {
  source: UsageSource;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  audioInputSeconds?: number;
  /** Override the pricing-derived cost (USD). Optional. */
  costUsd?: number;
}

export function recordUsage(input: RecordInput) {
  const promptTokens = input.promptTokens ?? 0;
  const completionTokens = input.completionTokens ?? 0;
  const audioInputSeconds = input.audioInputSeconds;
  const costUsd =
    input.costUsd ??
    estimateCost({
      model: input.model,
      promptTokens,
      completionTokens,
      audioInputSeconds,
    });

  const record: UsageRecord = {
    ts: Date.now(),
    source: input.source,
    model: input.model,
    promptTokens,
    completionTokens,
    audioInputSeconds,
    costUsd,
  };

  addInto(session, record);
  addInto(account, record);
  persistAccount(account);
  notify();
}

export function resetSession() {
  session = emptySummary();
  notify();
}

export function clearAccount() {
  account = emptySummary();
  persistAccount(account);
  notify();
}

export function getSessionSummary(): UsageSummary {
  return session;
}

export function getAccountSummary(): UsageSummary {
  return account;
}

export function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}
