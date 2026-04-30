import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { QuestionnaireFormState } from "@/components/Questionnaire/QuestionnaireForm";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { playErrorCue, playStartCue, playStopCue } from "./audio/cues";
import { useAudioCapture } from "./audio/useAudioCapture";
import { FILLABLE_TYPES, collectFillable } from "./openai/buildAnswerSchema";
import { classifySpeaker } from "./openai/diarize";
import { runFormFill } from "./openai/formFiller";
import { translateToEnglish } from "./openai/translate";
import { useRealtimeTranscription } from "./openai/useRealtimeTranscription";
import type {
  FillUpdate,
  ProvenanceMap,
  ScribeHandle,
  ScribeStatus,
  SpeakerRole,
  TranscriptTurn,
} from "./types";
import { appendLog, recordUsage, resetSession } from "./usage/usageTracker";

const REALTIME_MODEL = "gpt-4o-mini-transcribe";
// How often (ms) we flush an incremental audio-seconds usage record while
// the realtime session is open. Smaller = smoother live cost graph in the
// debug toolbar; larger = fewer state-change ticks.
const REALTIME_USAGE_TICK_MS = 4000;

const DEBOUNCE_MS = 3000;
const MAX_FILL_INTERVAL_MS = 12000;
// Watchdog cadence: while listening, check every N ms whether new transcript
// content has arrived since the last fill and trigger one if so. Acts as a
// belt-and-braces fallback for missing `transcription.completed` events.
const WATCHDOG_INTERVAL_MS = 5000;

// --- Realtime session liveness ----------------------------------------------
// Heartbeat: how often (ms) we check whether the realtime data channel has
// gone silent. The OpenAI Realtime API caps transcription_session lifetime
// at ~30 minutes and ICE may drop on network changes — both can leave the
// peer half-alive (audio still flowing locally, but no more events arrive).
const HEARTBEAT_CHECK_INTERVAL_MS = 5000;
// Treat this many ms without ANY data-channel event as a stalled session.
// The server emits `speech_started`/`speech_stopped` events even on quiet
// audio, so going this long with absolute silence is a strong signal that
// the session is dead.
const HEARTBEAT_STALL_MS = 45000;
// Cap consecutive automatic reconnects so a hard failure (e.g. revoked key,
// rate-limit) doesn't loop forever. Resets after a stable period.
const MAX_CONSECUTIVE_RECONNECTS = 3;
// After this many ms of stable "listening" post-reconnect, the consecutive
// reconnect counter is reset to 0 — we treat the session as healthy again.
const RECONNECT_STABILITY_RESET_MS = 30000;

function makeTurnId() {
  return `turn_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function cloneValues(values: ResponseValue[]): ResponseValue[] {
  return values.map((v) => ({ ...v }));
}

function valuesEqual(a: ResponseValue[], b: ResponseValue[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const av = a[i];
    const bv = b[i];
    if (av.type !== bv.type) return false;
    if (av.value instanceof Date && bv.value instanceof Date) {
      if (av.value.getTime() !== bv.value.getTime()) return false;
    } else if (av.value !== bv.value) {
      return false;
    }
    const ac = av.coding?.code ?? null;
    const bc = bv.coding?.code ?? null;
    if (ac !== bc) return false;
  }
  return true;
}

/**
 * Convert a GPT-4o fill update into the ResponseValue[] shape the question
 * widget expects. Returns null if the update can't be coerced (e.g. choice
 * value does not match any answer_option).
 */
function fillToResponseValues(
  update: FillUpdate,
  question: Question,
): ResponseValue[] | null {
  switch (update.type) {
    case "string":
      if (typeof update.value !== "string") return null;
      return [{ type: "string", value: update.value }];
    case "number": {
      const n =
        typeof update.value === "number" ? update.value : Number(update.value);
      if (!Number.isFinite(n)) return null;
      // Decimal questions store numeric-as-string in NumberQuestion; keeping
      // a numeric here works because `String(value)` is applied at submit.
      return [{ type: "number", value: n }];
    }
    case "boolean":
      if (typeof update.value !== "boolean") return null;
      return [{ type: "boolean", value: update.value }];
    case "choice": {
      if (typeof update.value !== "string") return null;
      const option = question.answer_option?.find(
        (o) => o.value === update.value,
      );
      if (!option) return null;
      return [
        {
          type: "string",
          value: option.value,
          coding: option.code,
        },
      ];
    }
    case "date": {
      if (typeof update.value !== "string") return null;
      const d = new Date(update.value);
      if (Number.isNaN(d.getTime())) return null;
      return [{ type: "date", value: d }];
    }
    case "time": {
      if (typeof update.value !== "string") return null;
      const normalized =
        update.value.length === 5 ? `${update.value}:00` : update.value;
      return [{ type: "time", value: normalized }];
    }
    default:
      return null;
  }
}

interface UseAmbientScribeArgs {
  enabled: boolean;
  apiKey?: string;
  forms: QuestionnaireFormState[];
  setForms: React.Dispatch<React.SetStateAction<QuestionnaireFormState[]>>;
}

/**
 * Core orchestrator for the Ambient Scribe. Owns:
 * - session lifecycle state machine
 * - transcript state (with per-turn speaker labels)
 * - field provenance map ("ai" / "ai_edited")
 *
 * Consumers: `AmbientScribePanel` (UI) and `QuestionnaireForm` (uses
 * `provenance` to render badges and `markEdited` to track user overrides).
 */
export function useAmbientScribe({
  enabled,
  apiKey,
  forms,
  setForms,
}: UseAmbientScribeArgs): ScribeHandle {
  const [status, setStatus] = useState<ScribeStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [provenance, setProvenance] = useState<ProvenanceMap>({});
  const [sessionStartedAt, setSessionStartedAt] = useState<number>();

  const formsRef = useRef(forms);
  const provenanceRef = useRef(provenance);
  const pendingItemIdsRef = useRef<Map<string, string>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFillAtRef = useRef<number>(0);
  const inFlightAbortRef = useRef<AbortController | null>(null);
  const isStoppedRef = useRef(true);
  // Wall-clock (ms) we last flushed realtime audio seconds into the usage
  // tracker. `null` while no session is open.
  const lastAudioTickRef = useRef<number | null>(null);
  // Forward reference for runFillInternal so scheduleFill can call the latest
  // version without TDZ issues.
  const runFillRef = useRef<() => void>(() => {});
  // Wall-clock (ms) of the most recent realtime data-channel event. Bumped
  // by `handleActivity` for ANY event type. The heartbeat compares this
  // against `Date.now()` to detect a stalled session.
  const lastEventAtRef = useRef<number>(0);
  // Number of consecutive auto-reconnect attempts since the last healthy
  // window. Reset to 0 after RECONNECT_STABILITY_RESET_MS of "listening".
  const reconnectAttemptsRef = useRef(0);
  // Guards against re-entry: heartbeat may try to reconnect while another
  // reconnect is in flight (e.g. SDP exchange running).
  const reconnectingRef = useRef(false);
  // Forward reference for `reconnect` so callbacks defined before it (e.g.
  // the realtime-hook callbacks, the heartbeat) can invoke the latest
  // version without depending on its identity.
  const reconnectRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    formsRef.current = forms;
  }, [forms]);
  useEffect(() => {
    provenanceRef.current = provenance;
  }, [provenance]);

  const audio = useAudioCapture();

  const scheduleFill = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const since = Date.now() - lastFillAtRef.current;
    const wait = since > MAX_FILL_INTERVAL_MS ? 0 : DEBOUNCE_MS;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      runFillRef.current();
    }, wait);
  }, []);

  // Finalize the partial turn tied to `itemId` (or create one if none
  // exists) and schedule diarization, translation, and form-fill.
  //
  // The `finalized` turn is computed synchronously from the latest transcript
  // ref BEFORE calling setState, so we never depend on a side effect inside
  // the React updater (which can lag in concurrent / batched scenarios).
  //
  // Translation runs in parallel with diarization (gpt-4o-mini-transcribe
  // doesn't translate reliably). The form-fill is scheduled AFTER the
  // translation resolves so the rolling fill always operates on English
  // text — both for consistency in the LLM prompt and because the doctor
  // is reading the transcript in English in the side panel.
  const onCompleted = useCallback(
    (itemId: string, finalText: string) => {
      const existingTurnId = pendingItemIdsRef.current.get(itemId);
      pendingItemIdsRef.current.delete(itemId);

      const existing = existingTurnId
        ? transcriptRef.current.find((t) => t.id === existingTurnId)
        : undefined;

      const sourceText = finalText || existing?.text || "";
      const willTranslate = !!apiKey && !!sourceText.trim();
      const finalized: TranscriptTurn = existing
        ? {
            ...existing,
            text: sourceText,
            status: "final",
            translating: willTranslate,
          }
        : {
            id: existingTurnId ?? makeTurnId(),
            speaker: "unknown",
            text: sourceText,
            status: "final",
            createdAt: Date.now(),
            translating: willTranslate,
          };

      setTranscript((prev) => {
        const idx = prev.findIndex((t) => t.id === finalized.id);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = finalized;
          return next;
        }
        return [...prev, finalized];
      });

      if (!finalized.text.trim()) return;

      if (!apiKey) {
        scheduleFill();
        return;
      }

      // Speaker classification (fire-and-forget).
      const previousSpeaker: SpeakerRole =
        getPreviousSpeaker(transcriptRef.current) ?? "doctor";
      classifySpeaker({
        apiKey,
        recent: transcriptRef.current,
        utterance: finalized.text,
        previousSpeaker,
      })
        .then((speaker) => {
          setTranscript((prev) =>
            prev.map((t) => (t.id === finalized.id ? { ...t, speaker } : t)),
          );
        })
        .catch(() => {
          // Non-fatal; leave as "unknown".
        });

      // Translation pipeline. We always send the call (gpt-4o-mini echoes
      // English unchanged, so the cost of guessing wrong is one cheap
      // round-trip). Once it resolves we replace the display text and
      // stash the source-language string in `originalText` for tooltips.
      translateToEnglish({ apiKey, text: finalized.text })
        .then((english) => {
          setTranscript((prev) =>
            prev.map((t) => {
              if (t.id !== finalized.id) return t;
              const translated = english || t.text;
              const sameAsSource = translated === t.text;
              return {
                ...t,
                text: translated,
                originalText: sameAsSource ? t.originalText : t.text,
                translating: false,
              };
            }),
          );
        })
        .catch(() => {
          // Translation failed — keep source text and continue. gpt-4o
          // form-fill handles non-English input gracefully as a fallback.
          setTranscript((prev) =>
            prev.map((t) =>
              t.id === finalized.id ? { ...t, translating: false } : t,
            ),
          );
        })
        .finally(() => {
          scheduleFill();
        });
    },
    [apiKey, scheduleFill],
  );

  const onDelta = useCallback((itemId: string, delta: string) => {
    setTranscript((prev) => {
      let turnId = pendingItemIdsRef.current.get(itemId);
      if (!turnId) {
        turnId = makeTurnId();
        pendingItemIdsRef.current.set(itemId, turnId);
        const newTurn: TranscriptTurn = {
          id: turnId,
          speaker: "unknown",
          text: delta,
          status: "partial",
          createdAt: Date.now(),
        };
        return [...prev, newTurn];
      }
      return prev.map((t) =>
        t.id === turnId ? { ...t, text: t.text + delta } : t,
      );
    });
  }, []);

  // keep transcript accessible inside async callbacks
  const transcriptRef = useRef<TranscriptTurn[]>([]);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const handleFatal = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : "Unknown error";
    appendLog({ level: "error", source: "session", message, data: err });
    setErrorMessage(message);
    setStatus("error");
    playErrorCue();
  }, []);

  // Bumped on every realtime data-channel event. The heartbeat below uses
  // this to detect "session is open but nothing's coming through" stalls.
  const handleActivity = useCallback(() => {
    lastEventAtRef.current = Date.now();
  }, []);

  // The realtime session was closed without us asking — typically the
  // OpenAI session timed out (~30 min cap) or the underlying ICE
  // connection failed. Try to recover transparently before showing an
  // error. We forward to a ref so we don't depend on `reconnect`'s
  // identity here (avoids a circular hook-deps issue).
  const handleUnexpectedClose = useCallback((reason?: string) => {
    if (isStoppedRef.current) return;
    appendLog({
      level: "warn",
      source: "realtime",
      message: `Unexpected close (${reason ?? "no reason"}) — reconnecting`,
    });
    void reconnectRef.current();
  }, []);

  const transcription = useRealtimeTranscription({
    apiKey,
    onDelta,
    onCompleted,
    onError: handleFatal,
    onActivity: handleActivity,
    onUnexpectedClose: handleUnexpectedClose,
  });

  // Apply AI updates: convert to ResponseValue[], guard against ai_edited,
  // write through setForms, update provenance.
  const applyUpdates = useCallback(
    (updates: FillUpdate[]) => {
      if (updates.length === 0) return;

      const currentForms = formsRef.current;
      const currentProv = provenanceRef.current;
      const nextProv: ProvenanceMap = { ...currentProv };
      let provChanged = false;

      const updatesByForm = new Map<
        string,
        { questionId: string; values: ResponseValue[] }[]
      >();

      for (const update of updates) {
        const existing = currentProv[update.question_id];
        if (existing?.status === "ai_edited") continue;

        // Find which form owns this question_id.
        let owningFormId: string | undefined;
        let owningQuestion: Question | undefined;
        for (const form of currentForms) {
          const q = findQuestion(
            form.questionnaire.questions,
            update.question_id,
          );
          if (q) {
            owningFormId = form.questionnaire.id;
            owningQuestion = q;
            break;
          }
        }
        if (!owningFormId || !owningQuestion) continue;

        const values = fillToResponseValues(update, owningQuestion);
        if (!values) continue;

        // No-op if the AI is echoing the already-stored value.
        const currentResponse = currentForms
          .find((f) => f.questionnaire.id === owningFormId)
          ?.responses.find((r) => r.question_id === update.question_id);
        if (currentResponse && valuesEqual(currentResponse.values, values)) {
          continue;
        }

        const bucket = updatesByForm.get(owningFormId) ?? [];
        bucket.push({ questionId: update.question_id, values });
        updatesByForm.set(owningFormId, bucket);

        nextProv[update.question_id] = {
          status: "ai",
          aiValue: cloneValues(values),
          lastAiAt: Date.now(),
        };
        provChanged = true;
      }

      if (updatesByForm.size === 0) return;

      const totalApplied = Array.from(updatesByForm.values()).reduce(
        (sum, list) => sum + list.length,
        0,
      );
      appendLog({
        level: "info",
        source: "form_fill",
        message: `Applied ${totalApplied} field${totalApplied === 1 ? "" : "s"} from AI`,
      });

      setForms((prev) =>
        prev.map((form) => {
          const formUpdates = updatesByForm.get(form.questionnaire.id);
          if (!formUpdates) return form;
          return {
            ...form,
            errors: [],
            responses: form.responses.map((r) => {
              const match = formUpdates.find(
                (u) => u.questionId === r.question_id,
              );
              if (!match) return r;
              return { ...r, values: match.values };
            }),
          };
        }),
      );

      if (provChanged) {
        setProvenance(nextProv);
      }
    },
    [setForms],
  );

  const runFillInternal = useCallback(async () => {
    if (!apiKey) return;
    if (isStoppedRef.current) return;
    if (transcriptRef.current.length === 0) return;

    inFlightAbortRef.current?.abort();
    const abort = new AbortController();
    inFlightAbortRef.current = abort;
    lastFillAtRef.current = Date.now();

    const currentForms = formsRef.current;
    const fillable = [] as ReturnType<typeof collectFillable>;
    for (const form of currentForms) {
      const perForm = collectFillable(form.questionnaire.questions, (qid) => {
        const response = form.responses.find((r) => r.question_id === qid);
        return serializeCurrentValue(response);
      });
      fillable.push(...perForm);
    }

    const snapshots = fillable
      // exclude those currently marked as ai_edited (respect the doctor)
      .filter(
        (f) => provenanceRef.current[f.question.id]?.status !== "ai_edited",
      )
      .map((f) => f.snapshot);

    if (snapshots.length === 0) return;

    try {
      const updates = await runFormFill({
        apiKey,
        transcript: transcriptRef.current,
        fillable: snapshots,
        signal: abort.signal,
      });
      if (abort.signal.aborted) return;
      applyUpdates(updates);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      // Non-fatal — surface but don't kill the session.
      setErrorMessage(err instanceof Error ? err.message : "autofill_failed");
    }
  }, [apiKey, applyUpdates]);

  useEffect(() => {
    runFillRef.current = runFillInternal;
  }, [runFillInternal]);

  const runFillNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runFillRef.current();
  }, []);

  // Flush any pending audio-seconds delta into the usage tracker. Called
  // from the periodic tick while listening AND once on stop/unmount so the
  // final tail of the session isn't lost.
  const flushRealtimeAudioUsage = useCallback(() => {
    if (lastAudioTickRef.current == null) return;
    const now = Date.now();
    const deltaSec = (now - lastAudioTickRef.current) / 1000;
    lastAudioTickRef.current = now;
    if (deltaSec <= 0) return;
    recordUsage({
      source: "realtime",
      model: REALTIME_MODEL,
      audioInputSeconds: deltaSec,
    });
  }, []);

  // Watchdog: while listening, periodically schedule a fill if there is any
  // transcript content that hasn't yet been processed by a fill cycle.
  // This is the safety net for cases where the Realtime API doesn't emit a
  // proper `completed` event for every utterance (it sometimes only streams
  // deltas), so we don't miss autofill opportunities.
  useEffect(() => {
    if (status !== "listening") return;
    const interval = setInterval(() => {
      if (transcriptRef.current.length === 0) return;
      const newestTurnTs =
        transcriptRef.current[transcriptRef.current.length - 1].createdAt;
      // Only act if the most recent turn arrived after the last fill (i.e.
      // there is fresh content to consider).
      if (newestTurnTs <= lastFillAtRef.current) return;
      scheduleFill();
    }, WATCHDOG_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [scheduleFill, status]);

  // Realtime audio usage tick: while listening, emit a small usage record
  // every REALTIME_USAGE_TICK_MS so the debug toolbar's cost number grows
  // visibly as the session runs.
  useEffect(() => {
    if (status !== "listening") return;
    const id = setInterval(flushRealtimeAudioUsage, REALTIME_USAGE_TICK_MS);
    return () => clearInterval(id);
  }, [flushRealtimeAudioUsage, status]);

  const start = useCallback(async () => {
    if (!enabled || !apiKey) return;
    if (status === "listening" || status === "connecting") return;

    setErrorMessage(undefined);
    setStatus("connecting");
    isStoppedRef.current = false;
    reconnectAttemptsRef.current = 0;
    // Each new session is its own usage scope.
    resetSession();
    appendLog({ level: "info", source: "session", message: "Session start" });
    try {
      const stream = await audio.start();
      await transcription.connect(stream);
      const startedAt = Date.now();
      setSessionStartedAt(startedAt);
      lastAudioTickRef.current = startedAt;
      lastEventAtRef.current = startedAt;
      setStatus("listening");
      appendLog({
        level: "info",
        source: "realtime",
        message: "Connected to realtime transcription",
      });
      playStartCue();
    } catch (err) {
      audio.stop();
      handleFatal(err);
    }
  }, [apiKey, audio, enabled, handleFatal, status, transcription]);

  /**
   * Recover from an unexpected realtime session loss without disturbing
   * the doctor:
   *   1. Tear down the dead transcription session (audio capture stays up
   *      so the mic permission, AnalyserNode, and waveform animation are
   *      uninterrupted).
   *   2. Re-mint an ephemeral key and open a new realtime session against
   *      the SAME `MediaStream`.
   *   3. On success, flip back to "listening" and arm a stability timer
   *      that resets the consecutive-attempt counter.
   *   4. On hard failure (or after `MAX_CONSECUTIVE_RECONNECTS`), surface
   *      a translated error and stop the audio capture so the doctor sees
   *      a clear "needs restart" state instead of a stuck UI.
   */
  const reconnect = useCallback(async () => {
    if (isStoppedRef.current) return;
    if (reconnectingRef.current) return;

    if (reconnectAttemptsRef.current >= MAX_CONSECUTIVE_RECONNECTS) {
      reconnectingRef.current = false;
      appendLog({
        level: "error",
        source: "reconnect",
        message: `Giving up after ${MAX_CONSECUTIVE_RECONNECTS} consecutive failures`,
      });
      setErrorMessage("scribe_connection_lost");
      setStatus("error");
      transcription.disconnect();
      audio.stop();
      setSessionStartedAt(undefined);
      playErrorCue();
      return;
    }

    reconnectingRef.current = true;
    reconnectAttemptsRef.current += 1;
    appendLog({
      level: "info",
      source: "reconnect",
      message: `Reconnecting (attempt ${reconnectAttemptsRef.current}/${MAX_CONSECUTIVE_RECONNECTS})`,
    });
    setStatus("connecting");

    transcription.disconnect();
    const stream = audio.getStream();
    if (!stream) {
      reconnectingRef.current = false;
      appendLog({
        level: "error",
        source: "reconnect",
        message: "No active microphone stream — aborting reconnect",
      });
      setErrorMessage("scribe_connection_lost");
      setStatus("error");
      return;
    }

    try {
      await transcription.connect(stream);
      lastEventAtRef.current = Date.now();
      reconnectingRef.current = false;
      setStatus("listening");
      appendLog({
        level: "info",
        source: "reconnect",
        message: "Reconnected successfully",
      });
      // If the session stays healthy for a while, treat the previous
      // outage as transient and forgive the consecutive-attempt count.
      const settledAt = reconnectAttemptsRef.current;
      window.setTimeout(() => {
        if (
          !isStoppedRef.current &&
          reconnectAttemptsRef.current === settledAt
        ) {
          reconnectAttemptsRef.current = 0;
        }
      }, RECONNECT_STABILITY_RESET_MS);
    } catch (err) {
      reconnectingRef.current = false;
      appendLog({
        level: "error",
        source: "reconnect",
        message: err instanceof Error ? err.message : "Reconnect failed",
      });
      setErrorMessage(err instanceof Error ? err.message : "reconnect_failed");
      setStatus("error");
      audio.stop();
      setSessionStartedAt(undefined);
      playErrorCue();
    }
  }, [audio, transcription]);

  useEffect(() => {
    reconnectRef.current = reconnect;
  }, [reconnect]);

  // Liveness heartbeat: while listening, watch for the data channel
  // going silent. The OpenAI Realtime transcription session is capped at
  // ~30 minutes and ICE can drop on network changes — both leave the
  // peer half-alive (audio still flowing locally, but no further events
  // arrive). Trigger a transparent reconnect if we hit the stall window.
  useEffect(() => {
    if (status !== "listening") return;
    const id = setInterval(() => {
      if (isStoppedRef.current) return;
      if (reconnectingRef.current) return;
      if (lastEventAtRef.current === 0) return;
      const since = Date.now() - lastEventAtRef.current;
      if (since > HEARTBEAT_STALL_MS) {
        appendLog({
          level: "warn",
          source: "heartbeat",
          message: `No realtime events for ${(since / 1000).toFixed(0)}s — reconnecting`,
        });
        void reconnectRef.current();
      }
    }, HEARTBEAT_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status]);

  const stop = useCallback(() => {
    if (!isStoppedRef.current) {
      appendLog({ level: "info", source: "session", message: "Session stop" });
      playStopCue();
    }
    isStoppedRef.current = true;
    reconnectingRef.current = false;
    reconnectAttemptsRef.current = 0;
    lastEventAtRef.current = 0;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    inFlightAbortRef.current?.abort();
    inFlightAbortRef.current = null;
    flushRealtimeAudioUsage();
    lastAudioTickRef.current = null;
    transcription.disconnect();
    audio.stop();
    pendingItemIdsRef.current.clear();
    setSessionStartedAt(undefined);
    setStatus("idle");
  }, [audio, flushRealtimeAudioUsage, transcription]);

  // Refs keep the cleanup closure pointing at the latest disconnect/stop
  // functions without retriggering the effect (we only want it to run on
  // unmount).
  const transcriptionRef = useRef(transcription);
  const audioRef = useRef(audio);
  useEffect(() => {
    transcriptionRef.current = transcription;
    audioRef.current = audio;
  }, [transcription, audio]);

  // The unmount cleanup needs to flush realtime audio usage too, so it
  // gets its own ref to avoid making the effect depend on a re-rendered
  // callback identity.
  const flushRealtimeAudioUsageRef = useRef(flushRealtimeAudioUsage);
  useEffect(() => {
    flushRealtimeAudioUsageRef.current = flushRealtimeAudioUsage;
  }, [flushRealtimeAudioUsage]);

  useEffect(() => {
    return () => {
      isStoppedRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      inFlightAbortRef.current?.abort();
      flushRealtimeAudioUsageRef.current();
      lastAudioTickRef.current = null;
      transcriptionRef.current.disconnect();
      audioRef.current.stop();
    };
  }, []);

  const markEdited = useCallback(
    (questionId: string, values: ResponseValue[]) => {
      const prov = provenanceRef.current[questionId];
      if (!prov) return;
      if (values.length === 0) {
        // Doctor cleared the field — drop provenance entirely.
        setProvenance((prev) => {
          if (!(questionId in prev)) return prev;
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
        return;
      }
      if (valuesEqual(values, prov.aiValue)) {
        // Value matches what AI wrote — keep "ai" status.
        if (prov.status !== "ai") {
          setProvenance((prev) => ({
            ...prev,
            [questionId]: { ...prov, status: "ai" },
          }));
        }
        return;
      }
      if (prov.status !== "ai_edited") {
        setProvenance((prev) => ({
          ...prev,
          [questionId]: { ...prov, status: "ai_edited" },
        }));
      }
    },
    [],
  );

  const clearProvenanceFor = useCallback((questionId: string) => {
    setProvenance((prev) => {
      if (!(questionId in prev)) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  const handle = useMemo<ScribeHandle>(
    () => ({
      enabled,
      status,
      errorMessage,
      transcript,
      waveform: audio.waveform,
      audioMetrics: audio.metrics,
      provenance,
      sessionStartedAt,
      start,
      stop,
      runFillNow,
      markEdited,
      clearProvenanceFor,
    }),
    [
      audio.metrics,
      audio.waveform,
      clearProvenanceFor,
      enabled,
      errorMessage,
      markEdited,
      provenance,
      runFillNow,
      sessionStartedAt,
      start,
      status,
      stop,
      transcript,
    ],
  );

  return handle;
}

function findQuestion(questions: Question[], id: string): Question | undefined {
  for (const q of questions) {
    if (q.id === id && FILLABLE_TYPES.has(q.type)) return q;
    if (q.type === "group" && q.questions) {
      const found = findQuestion(q.questions, id);
      if (found) return found;
    }
  }
  return undefined;
}

function getPreviousSpeaker(turns: TranscriptTurn[]): SpeakerRole | null {
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].speaker !== "unknown") return turns[i].speaker;
  }
  return null;
}

function serializeCurrentValue(
  response: QuestionnaireResponse | undefined,
): unknown {
  if (!response || response.values.length === 0) return null;
  const v = response.values[0];
  if (v.value instanceof Date) return v.value.toISOString().slice(0, 10);
  if (typeof v.value === "object" && v.value !== null) return null;
  return v.value ?? null;
}
