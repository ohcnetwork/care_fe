import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { resolveStructuredType } from "./registry";
import { parseStoredStructuredValue } from "./storedAnswer";

/**
 * The stored answer of a response-persisted structured question, if this
 * question is one and the response carries entries for it, in the shape
 * the type's component reads — `values[0].value` is the decoded entries
 * array, and `structured_type` (which the submit body never carried) is
 * restored from the question. `undefined` means the viewers should treat
 * the question the way they treat every other structured one — skip it:
 * batch-persisted types never put anything on the questionnaire response,
 * and a type this deployment lacks cannot be rendered.
 */
export function storedStructuredAnswer(
  question: Question,
  responses: readonly QuestionnaireResponse[],
): QuestionnaireResponse | undefined {
  if (question.type !== "structured" || !question.structured_type) {
    return undefined;
  }
  const definition = resolveStructuredType(question.structured_type);
  if (definition?.persistence !== "response") return undefined;
  const response = responses.find((r) => r.question_id === question.id);
  if (!response) return undefined;
  const entries = parseStoredStructuredValue(response.values[0]?.value);
  if (entries.length === 0) return undefined;
  return {
    ...response,
    structured_type: question.structured_type,
    // The union's structured members type `value` per core type; a plugin
    // type's entries are opaque to the host, hence the one cast.
    values: [{ type: "string", value: entries } as unknown as ResponseValue],
  };
}
