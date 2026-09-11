import type {
  BatchRequestError,
  QuestionValidationError,
  StructuredDataError,
} from "@/types/questionnaire/batch";

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

/**
 * Map failed batch sub-requests back to the page. Every failure feeds the
 * server-error panel; failures that identify a question additionally feed
 * `errorsAtom`:
 * - structured entries carry their question id inside the reference_id
 *   (`structured:{type}:{questionId}`), so repeated structured types map
 *   to the right question;
 * - the questionnaire submit entry's pydantic errors carry `question_id`
 *   directly, making reference_id authoritative across forms.
 */
export function mapBatchErrors(
  results: FailedBatchResult[],
  fallbackMessage: string,
): MappedBatchErrors {
  const serverErrors: ServerValidationError[] = [];
  const questionErrors: QuestionValidationError[] = [];

  for (const result of results.filter((r) => r.status_code !== 200)) {
    const referenceId = result.reference_id || "";
    let message = fallbackMessage;

    if (Array.isArray(result.data)) {
      const errors = result.data.flatMap((d) => d.errors || []);
      if (errors.length > 0) {
        message = errors
          .map((e) => (e.loc ? `${e.loc.join(" > ")}: ${e.msg}` : e.msg))
          .join(", ");
      }
    } else if (result.data?.errors?.length) {
      const first = result.data.errors[0];
      message = first.loc
        ? `${first.loc.join(" > ")}: ${first.msg}`
        : first.msg || first.error || fallbackMessage;
    }

    serverErrors.push({
      reference_id: referenceId,
      message,
      status_code: result.status_code,
    });

    if (referenceId.startsWith(STRUCTURED_REFERENCE_PREFIX)) {
      const questionId = referenceId.split(":").slice(2).join(":");
      if (questionId) {
        questionErrors.push({
          question_id: questionId,
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
            error: error.msg || error.error || fallbackMessage,
            type: error.type ?? "server_error",
          });
        }
      }
    }
  }

  return { serverErrors, questionErrors };
}
