import type { Question } from "@/types/questionnaire/question";

/**
 * What `unsupportedDraftStructuredTypes` needs to know about a resolved
 * structured type — a structural subset of `ResolvedStructuredType`
 * (`structured/registry.ts`), duck-typed rather than imported so this
 * module stays import-free of `registry.ts`. `registry.ts` transitively
 * imports every core structured definition's real component tree (CSS, UI
 * libraries) and is provably unrunnable under the plain `node --test`
 * harness (confirmed by hand: importing it throws on `react-day-picker`'s
 * stylesheet before a single assertion runs) — the same constraint
 * `fill/submit/composeStructured.ts`'s identical doc comment documents.
 * `useSaveServerDraft.ts` passes the real `resolveStructuredType` as the
 * `resolve` parameter; a test passes a fake one.
 */
export interface DraftResolvableStructuredType {
  contract: 1 | 2;
  draftPolicy: "serialize" | "exclude";
}

/**
 * The structured questions in this tree that a SERVER draft cannot
 * faithfully carry, by `structured_type` (or the `"<untyped>"` placeholder
 * — see the REVIEW FIX paragraph below).
 *
 * Contract v1 conflates prefetched server rows with user input in
 * `values[0].value`, so a dump restores stale clinical rows and can
 * re-upsert data edited elsewhere — the same reason `draftPolicy:
 * "exclude"` exists for the local draft, and the reason the original gate
 * refused ANY structured question. Contract v2 dumps the EDIT LOG, which
 * is user intent alone and re-projects onto a freshly fetched baseline, so
 * it lifts that refusal — except where the values cannot round-trip at all
 * (`draftPolicy: "exclude"` — `files`), and except for a type this
 * deployment cannot resolve, whose contract is simply unknown.
 *
 * REVIEW FIX (post-Task-8 review): a `type: "structured"` question with NO
 * `structured_type` at all — the type picker always pairs the two, so this
 * is unreachable in practice, but Phase 1's checkpoint is "nothing
 * changed" and a differential review over 13 questionnaire shapes found
 * exactly this one disagreement. The pre-fix code did
 * `if (question.type !== "structured" || !question.structured_type) continue;`,
 * which SKIPPED an untyped structured question entirely — the original
 * pre-Task-8 gate (`hasStructuredQuestion`) matched on `question.type ===
 * "structured"` alone and blocked unconditionally, so this was a real
 * behavior drift (draft became savable where it used to be refused).
 * Fixed by pushing the `"<untyped>"` placeholder instead of skipping:
 * `resolve` is never even called when there is no type string to resolve,
 * and the placeholder always fails the check below, restoring the exact
 * pre-Task-8 answer for this shape.
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
      // Not `isV2Definition` here: that predicate's `Extract<D, {contract:
      // 2}>` narrowing is built for a real two-arm union
      // (`ResolvedStructuredType`'s two interfaces) and degrades to
      // `never` against this module's single duck-typed interface (a
      // `contract: 1 | 2` field, not two distinct members) — harmless at
      // runtime but it makes the compiler reject the very next property
      // read in the `||` chain below. A plain literal check is exactly as
      // correct and keeps this file simple.
      if (
        !resolved ||
        resolved.contract !== 2 ||
        resolved.draftPolicy === "exclude"
      ) {
        blocking.push(question.structured_type ?? "<untyped>");
      }
    }
  };
  walk(questions);
  return blocking;
}
