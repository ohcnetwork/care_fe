import type {
  FillUpdate,
  FillableQuestionSnapshot,
  TranscriptTurn,
} from "@/components/Questionnaire/AmbientScribe/types";
import { recordUsage } from "@/components/Questionnaire/AmbientScribe/usage/usageTracker";
import { buildAnswerSchema } from "./buildAnswerSchema";

const CHAT_URL = "https://api.openai.com/v1/chat/completions";
// `gpt-4o-mini` is plenty smart for schema-constrained extraction, has a
// much higher TPM ceiling than `gpt-4o` (~200k vs ~30k on tier-1), and
// costs ~16× less per token. The TPM headroom is the key driver — large
// forms were tripping `gpt-4o`'s rate limit during real conversations.
const MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `You are an expert clinical scribe assisting a doctor during a patient consultation.

You will be given three blocks of context, in this order:
1. FORM DEFINITION — a JSON list of fillable fields with their id, text, optional description, and (for choice fields) a {value: display} option map.
2. CURRENT VALUES — a JSON object mapping field id → its existing value (only fields that already have a value).
3. TRANSCRIPT — the running conversation so far, with speaker labels.

Your job: extract answers that the transcript CLEARLY supports and return them in the requested JSON shape.

Rules:
- Only emit an update when the transcript provides justification. Do NOT guess.
- Prefer the doctor's summarization or the patient's own words for symptom descriptions; normalize numbers (e.g. "a hundred and ten over seventy" -> 110 for systolic if asked).
- For choice fields, the value MUST be one of the provided option values (case-exact).
- For date fields, use ISO format YYYY-MM-DD. For time, use 24h HH:MM.
- Confidence is 0..1; only emit updates with confidence >= 0.7.
- If a field already has a value in CURRENT VALUES and the transcript does not contradict it, skip it.
- Return an empty updates array if nothing new can be extracted with confidence.`;

interface RunFillArgs {
  apiKey: string;
  transcript: TranscriptTurn[];
  fillable: FillableQuestionSnapshot[];
  signal?: AbortSignal;
}

function serializeTranscript(turns: TranscriptTurn[]): string {
  if (turns.length === 0) return "(no transcript yet)";
  return turns
    .map((t) => {
      const speaker =
        t.speaker === "doctor"
          ? "Doctor"
          : t.speaker === "patient"
            ? "Patient"
            : "Speaker";
      return `[${speaker}] ${t.text}`;
    })
    .join("\n");
}

/**
 * Serializes the *immutable* part of the form: id, text, description, and
 * (for choice fields) the value→display option map. Compact JSON (no
 * pretty-print) to minimize tokens. We deliberately omit `type` and
 * `required` because:
 *   - `type` is already encoded as a `const` per question in the response
 *     schema (see buildAnswerSchema.ts), so the model already knows it.
 *   - `required` doesn't affect extraction; the orchestrator decides what
 *     to do with required-but-unanswered fields, not the model.
 * Empty `description`s are omitted — they cost real tokens at scale.
 *
 * The output of this function MUST be deterministic across calls within a
 * session so OpenAI's automatic prompt-caching (≥1024 token prefix match)
 * can kick in. No `currentValue`, no timestamps, no random ordering.
 */
function serializeFormDefinition(fillable: FillableQuestionSnapshot[]): string {
  return JSON.stringify(
    fillable.map((f) => {
      const item: Record<string, unknown> = { id: f.id, text: f.text };
      if (f.description) item.description = f.description;
      if (f.fillType === "choice" && f.options && f.options.length > 0) {
        // {value: display} map — about half the tokens of the previous
        // [{value, display}, …] array form for typical option sets.
        const optMap: Record<string, string> = {};
        for (const o of f.options) optMap[o.value] = o.display ?? o.value;
        item.options = optMap;
      }
      return item;
    }),
  );
}

/**
 * Serializes the *volatile* per-call state: only the field ids that have
 * a value, mapped to that value. Excluded from the cached prefix so it
 * can change every call without invalidating the cache.
 */
function serializeCurrentValues(fillable: FillableQuestionSnapshot[]): string {
  const filled: Record<string, unknown> = {};
  for (const f of fillable) {
    if (f.currentValue !== null && f.currentValue !== undefined) {
      filled[f.id] = f.currentValue;
    }
  }
  if (Object.keys(filled).length === 0) return "{}";
  return JSON.stringify(filled);
}

export async function runFormFill({
  apiKey,
  transcript,
  fillable,
  signal,
}: RunFillArgs): Promise<FillUpdate[]> {
  if (fillable.length === 0 || transcript.length === 0) {
    return [];
  }

  const schema = buildAnswerSchema(fillable);

  // Two-message layout designed for OpenAI's automatic prompt caching.
  // The static block (system + FORM DEFINITION) is identical across every
  // call in a session, so once warm OpenAI charges those tokens at half
  // price and they don't pressure the TPM ceiling the same way.
  // CURRENT VALUES + TRANSCRIPT are volatile and intentionally placed
  // *after* the static block so they don't break the cacheable prefix.
  const formDefinitionMessage = `FORM DEFINITION:\n${serializeFormDefinition(fillable)}`;
  const volatileMessage = [
    `CURRENT VALUES:`,
    serializeCurrentValues(fillable),
    ``,
    `TRANSCRIPT:`,
    serializeTranscript(transcript),
    ``,
    `Return only the JSON object described by the response schema.`,
  ].join("\n");

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
          { role: "user", content: formDefinitionMessage },
          { role: "user", content: volatileMessage },
        ],
        temperature: 0,
        response_format: {
          type: "json_schema",
          json_schema: schema,
        },
      }),
    });
  } catch (networkErr) {
    recordUsage({
      source: "form_fill",
      model: MODEL,
      latencyMs: Math.round(performance.now() - startedAt),
      status: "error",
      errorMessage:
        networkErr instanceof Error ? networkErr.message : "network_error",
      preview: {
        input: `${fillable.length} fields, ${transcript.length} turns`,
      },
    });
    throw networkErr;
  }

  const latencyMs = Math.round(performance.now() - startedAt);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    recordUsage({
      source: "form_fill",
      model: MODEL,
      latencyMs,
      status: "error",
      errorMessage: `HTTP ${res.status}: ${body.slice(0, 200)}`,
    });
    throw new Error(`Form-fill call failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      // OpenAI returns `prompt_tokens_details.cached_tokens` when prompt
      // caching kicks in. Useful as a dev signal that the static prefix
      // is being recognized; surfaced below in the call preview.
      prompt_tokens_details?: { cached_tokens?: number };
    };
  };
  const raw = data?.choices?.[0]?.message?.content;
  const cachedTokens = data.usage?.prompt_tokens_details?.cached_tokens ?? 0;

  let updates: FillUpdate[] = [];
  let parseError: string | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { updates?: FillUpdate[] };
      if (parsed.updates && Array.isArray(parsed.updates)) {
        updates = parsed.updates.filter(
          (u) =>
            typeof u.question_id === "string" &&
            typeof u.confidence === "number" &&
            u.confidence >= 0.7,
        );
      } else {
        parseError = "missing `updates` array";
      }
    } catch {
      parseError = "response was not valid JSON";
    }
  }

  recordUsage({
    source: "form_fill",
    model: MODEL,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
    latencyMs,
    status: parseError ? "error" : "success",
    errorMessage: parseError ?? undefined,
    preview: {
      input: `${fillable.length} fields, ${transcript.length} turns${cachedTokens ? ` · ${cachedTokens} cached` : ""}`,
      output: `${updates.length} update${updates.length === 1 ? "" : "s"}${updates.length ? `: ${updates.map((u) => u.question_id).join(", ")}` : ""}`,
    },
  });

  return updates;
}
