import { Question } from "@/types/questionnaire/question";

type Loc = (string | number)[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Error paths of a rejected save: `cause.errors` for a plain update,
 *  `cause.results[].data.errors` when it went through a batch. */
function errorLocs(cause: unknown): Loc[] {
  if (!isRecord(cause)) return [];
  const bodies = Array.isArray(cause.results)
    ? cause.results.map((result) => (isRecord(result) ? result.data : null))
    : [cause];
  return bodies.flatMap((body) =>
    isRecord(body) && Array.isArray(body.errors)
      ? body.errors.flatMap((error) =>
          isRecord(error) && Array.isArray(error.loc) ? [error.loc as Loc] : [],
        )
      : [],
  );
}

/**
 * The question a rejected save points at, with its outline number ("6",
 * or "4.2" for a sub-question). The server's path counts from zero:
 * `["questions", 3, "questions", 1]` is question 4.2.
 */
export function findServerErrorQuestion(
  error: unknown,
  questions: Question[],
): { question: Question; position: string } | undefined {
  for (const loc of errorLocs(isRecord(error) ? error.cause : undefined)) {
    let siblings = questions;
    let question: Question | undefined;
    const position: number[] = [];
    for (let i = loc.indexOf("questions"); loc[i] === "questions"; i += 2) {
      const index = loc[i + 1];
      if (typeof index !== "number" || !siblings[index]) break;
      question = siblings[index];
      position.push(index + 1);
      siblings = question.questions ?? [];
    }
    if (question) return { question, position: position.join(".") };
  }
  return undefined;
}
