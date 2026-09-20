import { z } from "zod";

import { QUESTION_TYPES, Question } from "@/types/questionnaire/question";
import { SUBJECT_TYPES } from "@/types/questionnaire/questionnaire";

/**
 * Recursively narrows an unknown question-ish object down to the fields the
 * importer needs. Validation must recurse: nested `questions` reach the
 * builder tree and the PUT body unmodified, so a malformed child (missing
 * `text`, or `questions` that isn't an array) would otherwise surface as a
 * crash in the confirm step or a save that silently does nothing.
 */
function isQuestionLike(value: unknown): value is Question {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as {
    text?: unknown;
    type?: unknown;
    link_id?: unknown;
    questions?: unknown;
    enable_when?: unknown;
  };
  if (typeof candidate.text !== "string") return false;
  // Membership, not just typeof: an unknown `type` (e.g. "radio") would flow
  // into builder state and crash the type picker's TYPE_ICONS lookup, then
  // be PUT to the API on save.
  if (
    typeof candidate.type !== "string" ||
    !(QUESTION_TYPES as readonly string[]).includes(candidate.type)
  ) {
    return false;
  }
  // link_id is optional (regenerateQuestionIds synthesizes fresh ones), but
  // when present it must be a string.
  if (
    candidate.link_id !== undefined &&
    typeof candidate.link_id !== "string"
  ) {
    return false;
  }
  if (
    candidate.enable_when != null &&
    (!Array.isArray(candidate.enable_when) ||
      !candidate.enable_when.every(
        (condition: unknown) =>
          typeof condition === "object" &&
          condition !== null &&
          "question" in condition &&
          typeof condition.question === "string",
      ))
  ) {
    return false;
  }
  if (candidate.questions !== undefined) {
    if (!Array.isArray(candidate.questions)) return false;
    return candidate.questions.every(isQuestionLike);
  }
  return true;
}

/**
 * Accepts either a bare `{ questions: [...] }` payload or a full
 * questionnaire export (which has a `questions` array alongside its other
 * fields) — both shapes are read the same way, through `.questions`.
 */
export function extractQuestions(
  data: unknown,
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): Question[] | null {
  if (typeof data !== "object" || data === null || !("questions" in data)) {
    return null;
  }
  const questions = (data as { questions: unknown }).questions;
  if (!Array.isArray(questions) || (!allowEmpty && questions.length === 0))
    return null;
  return questions.every(isQuestionLike) ? (questions as Question[]) : null;
}

/** Writable metadata from a full export; audit fields and scope are ignored. */
const importMetadataSchema = z.object({
  title: z.string().min(1),
  // Slug constraints belong to the editable confirmation form, so even an
  // older invalid slug can be corrected before any create request is sent.
  slug: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  description: z.string().nullish(),
  subject_type: z.enum(SUBJECT_TYPES),
  version: z.union([z.string(), z.number()]).optional(),
  code: z
    .object({ system: z.string(), code: z.string(), display: z.string() })
    .nullish(),
  actions: z
    .array(
      z.object({
        condition: z.string(),
        instructions: z
          .array(
            z.object({
              slug: z.string().min(1),
              params: z.record(z.string(), z.unknown()),
              context: z.string().default("self"),
            }),
          )
          .default([]),
      }),
    )
    .nullish(),
});

export function parseQuestionnaireImport(data: unknown) {
  const metadata = importMetadataSchema.safeParse(data);
  const questions = extractQuestions(data, { allowEmpty: true });
  if (!metadata.success || !questions) return null;
  return { ...metadata.data, questions };
}

export type ImportedQuestionnaire = NonNullable<
  ReturnType<typeof parseQuestionnaireImport>
>;
