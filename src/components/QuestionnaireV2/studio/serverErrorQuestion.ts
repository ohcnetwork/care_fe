import { Question } from "@/types/questionnaire/question";

export interface ServerErrorQuestion {
  question: Question;
  /** Position as the outline numbers it, e.g. "6" or "4.2". */
  position: string;
}

type Loc = (string | number)[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Error paths from a rejected save, for both the plain update
 *  (`cause.errors`) and the batched one (`cause.results[].data.errors`). */
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
 * The question a rejected save points at. The backend's path counts from
 * zero (`["questions", 5]` is the sixth question) and nests through
 * `questions` for sub-questions.
 */
export function findServerErrorQuestion(
  error: unknown,
  questions: Question[],
): ServerErrorQuestion | undefined {
  const cause = isRecord(error) ? error.cause : undefined;
  for (const loc of errorLocs(cause)) {
    const start = loc.indexOf("questions");
    if (start === -1) continue;
    let siblings = questions;
    let question: Question | undefined;
    const position: number[] = [];
    for (let i = start; loc[i] === "questions"; i += 2) {
      const index = Number(loc[i + 1]);
      const next = Number.isInteger(index) ? siblings[index] : undefined;
      if (!next) break;
      question = next;
      position.push(index + 1);
      siblings = next.questions ?? [];
    }
    if (question) return { question, position: position.join(".") };
  }
  return undefined;
}
