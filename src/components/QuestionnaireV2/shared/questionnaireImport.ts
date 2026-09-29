import { z } from "zod";

import { QUESTION_TYPES, Question } from "@/types/questionnaire/question";
import { SUBJECT_TYPES } from "@/types/questionnaire/questionnaire";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Shape-only check of an imported question tree; nested `questions` recurse. */
function isQuestionLike(value: unknown): value is Question {
  if (!isRecord(value)) return false;
  const candidate = value as {
    text?: unknown;
    type?: unknown;
    description?: unknown;
    structured_type?: unknown;
    link_id?: unknown;
    questions?: unknown;
    enable_when?: unknown;
    answer_option?: unknown;
  };
  if (typeof candidate.text !== "string") return false;
  if (
    candidate.description !== undefined &&
    typeof candidate.description !== "string"
  )
    return false;
  if (
    candidate.structured_type != null &&
    typeof candidate.structured_type !== "string"
  )
    return false;
  if (
    typeof candidate.type !== "string" ||
    !(QUESTION_TYPES as readonly string[]).includes(candidate.type)
  ) {
    return false;
  }
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
          isRecord(condition) &&
          typeof condition.question === "string" &&
          typeof condition.operator === "string",
      ))
  ) {
    return false;
  }
  if (
    candidate.answer_option != null &&
    (!Array.isArray(candidate.answer_option) ||
      !candidate.answer_option.every(
        (option: unknown) =>
          isRecord(option) &&
          (typeof option.value === "string" ||
            typeof option.value === "number"),
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

function normalizeImportedQuestion(question: Question): Question {
  // Older exports stored value-set references as bare slugs.
  const answerValueSet: unknown = question.answer_value_set;
  return {
    ...question,
    ...(typeof answerValueSet === "string"
      ? { answer_value_set: { slug: answerValueSet } }
      : {}),
    ...(question.questions
      ? { questions: question.questions.map(normalizeImportedQuestion) }
      : {}),
  };
}

/** Accepts a bare `{ questions }` payload or a full questionnaire export. */
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
  return questions.every(isQuestionLike)
    ? questions.map(normalizeImportedQuestion)
    : null;
}

/** Writable metadata from a full export; audit fields and scope are ignored. */
const importMetadataSchema = z.object({
  title: z.string().min(1),
  // Slug constraints are enforced by the editable confirmation form.
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
