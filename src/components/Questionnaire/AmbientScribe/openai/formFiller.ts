import type {
  FillUpdate,
  FillableQuestionSnapshot,
  TranscriptTurn,
} from "@/components/Questionnaire/AmbientScribe/types";
import { recordUsage } from "@/components/Questionnaire/AmbientScribe/usage/usageTracker";
import { buildAnswerSchema } from "./buildAnswerSchema";

const CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";

const SYSTEM_PROMPT = `You are an expert clinical scribe assisting a doctor during a patient consultation.
You will be given:
- A running transcript of the conversation, with speaker labels.
- A JSON list of the form fields that can be filled ("fillable"), each with id, text, description, current value, and for choice questions the allowed option values.

Your job: extract answers that the conversation CLEARLY supports and return them in the requested JSON shape.
Rules:
- Only emit an update when the transcript provides justification. Do NOT guess.
- Prefer the doctor's summarization or the patient's own words for symptom descriptions; normalize numbers (e.g. "a hundred and ten over seventy" -> 110 for systolic if asked).
- For choice fields, the value MUST be one of the provided option values (case-exact).
- For date fields, use ISO format YYYY-MM-DD. For time, use 24h HH:MM.
- Confidence is 0..1; only emit updates with confidence >= 0.7.
- If a field was already filled and the transcript does NOT contradict it, skip it.
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

function serializeFillable(fillable: FillableQuestionSnapshot[]): string {
  return JSON.stringify(
    fillable.map((f) => ({
      id: f.id,
      text: f.text,
      description: f.description,
      type: f.fillType,
      required: f.required,
      options: f.options?.map((o) => o.value),
      current_value: f.currentValue ?? null,
    })),
    null,
    2,
  );
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

  const userMessage = [
    "TRANSCRIPT SO FAR:",
    serializeTranscript(transcript),
    "",
    "FILLABLE FIELDS:",
    serializeFillable(fillable),
    "",
    "Return only the JSON object described by the response schema.",
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
          { role: "user", content: userMessage },
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
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const raw = data?.choices?.[0]?.message?.content;

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
      input: `${fillable.length} fields, ${transcript.length} turns`,
      output: `${updates.length} update${updates.length === 1 ? "" : "s"}${updates.length ? `: ${updates.map((u) => u.question_id).join(", ")}` : ""}`,
    },
  });

  return updates;
}
