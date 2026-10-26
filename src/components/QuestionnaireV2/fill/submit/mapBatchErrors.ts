import { parseStructuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import type {
  BatchRequestError,
  QuestionValidationError,
  StructuredDataError,
} from "@/types/questionnaire/batch";
import type { Question } from "@/types/questionnaire/question";

/** Page-level entry for the server-error panel (one per failed batch
 *  sub-request). */
export interface ServerValidationError {
  reference_id: string;
  message: string;
  status_code: number;
}

interface FailedBatchResult {
  reference_id: string;
  status_code: number;
  data: { errors?: BatchRequestError[] } | StructuredDataError[] | undefined;
}

export interface MappedBatchErrors {
  serverErrors: ServerValidationError[];
  questionErrors: QuestionValidationError[];
}

const STRUCTURED_REFERENCE_PREFIX = "structured:";

function repeatedAncestors(
  questions: Question[],
  questionId: string,
  ancestors: string[] = [],
): string[] | undefined {
  for (const question of questions) {
    if (question.id === questionId) return ancestors;
    const found = repeatedAncestors(
      question.questions ?? [],
      questionId,
      question.type === "group" && question.repeats
        ? [...ancestors, question.id]
        : ancestors,
    );
    if (found) return found;
  }
  return undefined;
}

/** Django validation errors may wrap another { type, msg } inside `msg`.
 * Only extracted text reaches React; unknown objects use the normal fallback. */
function readErrorMessage(value: unknown): string | undefined {
  if (typeof value === "string") return value || undefined;
  if (!value || typeof value !== "object") return undefined;
  if ("msg" in value) {
    const message = readErrorMessage(value.msg);
    if (message) return message;
  }
  return "error" in value ? readErrorMessage(value.error) : undefined;
}

function errorMessage(error: BatchRequestError, fallback: string): string {
  return (
    readErrorMessage(error.msg) ?? readErrorMessage(error.error) ?? fallback
  );
}

function locatedErrorMessage(
  error: BatchRequestError,
  fallback: string,
): string {
  const message = errorMessage(error, fallback);
  return error.loc ? `${error.loc.join(" > ")}: ${message}` : message;
}

/**
 * Map failed batch sub-requests back to the page. Every failure feeds the
 * server-error panel; failures that identify a question additionally feed
 * `errorsAtom`:
 * - structured entries carry their question id inside the reference_id
 *   (`structured:{type}:{questionId}[#r0.r1]`), so repeated structured types map
 *   to the right question and repeat row;
 * - the questionnaire submit entry's pydantic errors carry `question_id`
 *   directly, making reference_id authoritative across forms.
 */
export function mapBatchErrors(
  results: FailedBatchResult[],
  fallbackMessage: string,
  questions: Question[] = [],
): MappedBatchErrors {
  const serverErrors: ServerValidationError[] = [];
  const questionErrors: QuestionValidationError[] = [];

  const failed = results.filter(
    (result) => result.status_code < 200 || result.status_code >= 300,
  );
  for (const result of failed) {
    const referenceId = result.reference_id || "";
    let message = fallbackMessage;

    if (Array.isArray(result.data)) {
      const errors = result.data.flatMap((d) => d.errors || []);
      if (errors.length > 0) {
        message = errors
          .map((error) => locatedErrorMessage(error, fallbackMessage))
          .join(", ");
      }
    } else if (result.data?.errors?.length) {
      message = locatedErrorMessage(result.data.errors[0], fallbackMessage);
    }

    serverErrors.push({
      reference_id: referenceId,
      message,
      status_code: result.status_code,
    });

    if (referenceId.startsWith(STRUCTURED_REFERENCE_PREFIX)) {
      const parsed = parseStructuredReferenceId(referenceId);
      if (parsed) {
        const ancestors = parsed.rowIndexes.length
          ? repeatedAncestors(questions, parsed.questionId)
          : [];
        // Keep unknown/malformed row addresses in the panel instead of
        // attaching the error to every occurrence of the question.
        if (!ancestors || ancestors.length !== parsed.rowIndexes.length)
          continue;
        questionErrors.push({
          question_id: parsed.questionId,
          ...(ancestors.length
            ? {
                response_path: ancestors.map((questionId, index) => ({
                  questionId,
                  rowIndex: parsed.rowIndexes[index],
                })),
              }
            : {}),
          error: message,
          type: "server_error",
        });
      }
      continue;
    }

    if (!Array.isArray(result.data)) {
      for (const error of result.data?.errors ?? []) {
        if (error.question_id) {
          questionErrors.push({
            question_id: error.question_id,
            error: errorMessage(error, fallbackMessage),
            type: error.type ?? "server_error",
          });
        }
      }
    }
  }

  return { serverErrors, questionErrors };
}
