import type { Question } from "@/types/questionnaire/question";

/**
 * Structural subset needed to decide whether a structured type can be carried
 * in a server draft, kept registry-free so this module can run in plain tests.
 */
export interface DraftResolvableStructuredType {
  draftPolicy: "serialize" | "exclude";
}

/**
 * Structured types in this tree that a server draft cannot faithfully carry:
 * unresolved types, untyped structured questions, and types with
 * `draftPolicy: "exclude"`.
 */
export function unsupportedDraftStructuredTypes(
  questions: Question[],
  resolve: (type: string) => DraftResolvableStructuredType | undefined,
): string[] {
  const blocking: string[] = [];
  const walk = (list: Question[]) => {
    for (const question of list) {
      if (question.type === "group") {
        walk(question.questions ?? []);
        continue;
      }
      if (question.type !== "structured") continue;
      const resolved = question.structured_type
        ? resolve(question.structured_type)
        : undefined;
      if (!resolved || resolved.draftPolicy === "exclude") {
        blocking.push(question.structured_type ?? "<untyped>");
      }
    }
  };
  walk(questions);
  return blocking;
}
