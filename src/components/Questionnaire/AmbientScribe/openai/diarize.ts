import type {
  SpeakerRole,
  TranscriptTurn,
} from "@/components/Questionnaire/AmbientScribe/types";
import { recordUsage } from "@/components/Questionnaire/AmbientScribe/usage/usageTracker";

const CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";
const CONFIDENCE_FLOOR = 0.6;
const CONTEXT_WINDOW = 5;

interface DiarizeOptions {
  apiKey: string;
  recent: TranscriptTurn[];
  utterance: string;
  /**
   * The previously-assigned speaker for the same stream of turns. Used as
   * the sticky fallback when the model returns low confidence.
   */
  previousSpeaker: SpeakerRole;
  signal?: AbortSignal;
}

interface DiarizeResult {
  speaker: Exclude<SpeakerRole, "unknown">;
  confidence: number;
}

const SYSTEM_PROMPT = `You are labelling turns from a spoken conversation between a DOCTOR and a PATIENT.
- DOCTOR: asks clinical questions, gives instructions, uses medical terminology, summarizes findings.
- PATIENT: describes symptoms, answers questions, reports history, expresses concerns.
Return strict JSON with the keys "speaker" (either "doctor" or "patient") and "confidence" (0..1).`;

const JSON_SCHEMA = {
  name: "speaker_classification",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      speaker: { type: "string", enum: ["doctor", "patient"] },
      confidence: { type: "number", minimum: 0, maximum: 1 },
    },
    required: ["speaker", "confidence"],
  },
} as const;

function buildUserMessage(recent: TranscriptTurn[], utterance: string) {
  const tail = recent.slice(-CONTEXT_WINDOW).map((t) => ({
    speaker: t.speaker,
    text: t.text,
  }));
  return [
    "Recent conversation (most recent last):",
    tail.length
      ? tail.map((t) => `[${t.speaker}] ${t.text}`).join("\n")
      : "(no prior turns)",
    "",
    "Classify the NEXT utterance:",
    utterance,
  ].join("\n");
}

/**
 * Classify a single finalized transcript utterance as "doctor" | "patient".
 *
 * When the model's confidence is below CONFIDENCE_FLOOR we keep the previous
 * speaker (conversations rarely flip-flop mid-utterance). When the previous
 * speaker is "unknown" and confidence is low, we still use the model's answer
 * rather than leaving it unlabelled.
 */
export async function classifySpeaker({
  apiKey,
  recent,
  utterance,
  previousSpeaker,
  signal,
}: DiarizeOptions): Promise<Exclude<SpeakerRole, "unknown">> {
  const startedAt = performance.now();
  let res: Response;
  try {
    res = await fetch(CHAT_URL, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(recent, utterance) },
        ],
        temperature: 0,
        response_format: { type: "json_schema", json_schema: JSON_SCHEMA },
      }),
    });
  } catch (networkErr) {
    recordUsage({
      source: "diarize",
      model: MODEL,
      latencyMs: Math.round(performance.now() - startedAt),
      status: "error",
      errorMessage:
        networkErr instanceof Error ? networkErr.message : "network_error",
      preview: { input: utterance },
    });
    throw networkErr;
  }

  const latencyMs = Math.round(performance.now() - startedAt);

  if (!res.ok) {
    recordUsage({
      source: "diarize",
      model: MODEL,
      latencyMs,
      status: "error",
      errorMessage: `HTTP ${res.status}`,
      preview: { input: utterance },
    });
    // Non-fatal: caller can fall back to previousSpeaker.
    throw new Error(`Diarization failed (${res.status})`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const raw = data?.choices?.[0]?.message?.content;
  let parsed: DiarizeResult | null = null;
  let parseError: string | null = null;
  if (!raw) {
    parseError = "response was empty";
  } else {
    try {
      parsed = JSON.parse(raw) as DiarizeResult;
    } catch {
      parseError = "response was not valid JSON";
    }
  }

  recordUsage({
    source: "diarize",
    model: MODEL,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
    latencyMs,
    status: parsed ? "success" : "error",
    errorMessage: parsed ? undefined : (parseError ?? "unknown"),
    preview: {
      input: utterance,
      output: parsed
        ? `${parsed.speaker} (${parsed.confidence.toFixed(2)})`
        : raw,
    },
  });

  if (!parsed) {
    throw new Error(`Diarization ${parseError ?? "failed"}`);
  }

  if (
    parsed.confidence < CONFIDENCE_FLOOR &&
    (previousSpeaker === "doctor" || previousSpeaker === "patient")
  ) {
    return previousSpeaker;
  }
  return parsed.speaker;
}
