import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type { ProjectValues } from "@/components/QuestionnaireV2/structured/core/types";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import type {
  ApplyChargeItemDefinitionRequest,
  ChargeItemQuestionRow,
} from "@/types/billing/chargeItem/chargeItem";
import type { ChargeItemDefinitionRead } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import type { StructuredEdit } from "@/types/questionnaire/structured";

/**
 * What the v2 editor (Task 6) edits. The definition object is required
 * here — every row the editor creates comes from a picked
 * `ChargeItemDefinitionRead` (`newChargeItemRow`, below) — while the
 * `ResponseValue`/`ChargeItemQuestionRow` arm it widens keeps both display
 * objects optional, because that arm also has to describe what the LEGACY
 * widget writes, and `ChargeItemQuestion.tsx` never sets
 * `performer_actor_object` unless a performer was picked, and both objects
 * are absent from a v1 draft restored from before this port.
 */
export type ChargeItemRow = ChargeItemQuestionRow & {
  charge_item_definition_object: ChargeItemDefinitionRead;
};

/**
 * A charge-item section is a LIST, not a singleton, and unlike
 * `time_of_death`'s datetime or `appointment`'s note/slot/tags, a row here
 * has no "half filled" state to reconcile: a row is born whole, the moment
 * `newChargeItemRow` creates it from a picked definition, and it either
 * exists (added, still in the log) or it doesn't (removed, annihilated by
 * the reducer). There is therefore no separate `isEmptyRow` predicate to
 * keep in sync with a submission filter (Lesson 2, this phase's binding
 * "Lessons from the first ports") — whatever `rows` holds IS what the
 * clinician sees and, via `toRequests` below, exactly the set a submit
 * compiles requests for. The only question this function answers is
 * whether the section has any rows at all.
 */
export const projectValues: ProjectValues<ChargeItemRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "charge_item", value: [...rows] }];

/**
 * A freshly picked charge-item definition, seeded exactly the way
 * `ChargeItemQuestion.tsx`'s selection effect does today: quantity defaults
 * to `"1"`, `encounter` comes from context (a charge item is always billed
 * to the encounter being filled, never the row's own state), and the
 * definition's `slug` is the wire identity `apply_charge_item_defs/`
 * expects. The definition object rides along on the row — not fetched a
 * second time — so a restored draft (or `StructuredList`, Task 6) can
 * repaint title/price straight from the response, which is the whole
 * defect this port fixes: today `ChargeItemQuestion.tsx` keeps this object
 * in a component `useState` no reload can restore.
 */
export function newChargeItemRow(
  definition: ChargeItemDefinitionRead,
  encounterId: string,
): ChargeItemRow {
  return {
    quantity: "1",
    encounter: encounterId,
    charge_item_definition: definition.slug,
    charge_item_definition_object: definition,
  };
}

/**
 * The ONE strip. `ChargeItemQuestion.tsx` performs this exact destructure
 * three times — once per mutation path (add, remove, update) — which is
 * three chances for a copy to drift and a display object (the whole
 * `ChargeItemDefinitionRead`: price components, category, tags, or a
 * `UserReadMinimal`) to reach the wire undetected. Here it happens once, on
 * the way to the request, and nowhere else. The exact remaining key set is
 * pinned by a dedicated test, not inferred from this comment.
 */
export function stripDisplay(
  row: ChargeItemRow,
): ApplyChargeItemDefinitionRequest {
  const {
    charge_item_definition_object: _definition,
    performer_actor_object: _performer,
    ...request
  } = row;
  return request;
}

export async function toRequests(
  edits: readonly StructuredEdit<ChargeItemRow>[],
  { facilityId, questionId }: StructuredRequestContext,
): Promise<StructuredBatchEntry[]> {
  if (!facilityId) return [];
  // Charge items are created, never prefetched or amended in place: there
  // is no server row a v2 charge-item section could ever have fetched, so
  // the baseline this differ resolves against is not merely "not fetched
  // yet" but GENUINELY, PERMANENTLY EMPTY — a fact about the TYPE. Stated
  // as an explicit empty `Map`, not the bare `{}` that defaults `baseline`
  // to `undefined` ("still loading or errored", per
  // `ResolveChangesOptions.baseline`'s own doc comment) — the same choice
  // `appointment`'s `resolveSingletonRow` makes, and for the same reason
  // (Lesson 3, this phase's binding "Lessons from the first ports": don't
  // claim "empty" only in a comment while passing an option that reads as
  // "unknown"). Behaviourally invariant for THIS function either way, since
  // only `creates` is ever read below and no `add` here can collide with an
  // empty baseline — but stating the fact directly is what the lesson asks
  // for, and it is what keeps this differ's reasoning aligned with
  // `projectRows`/`findOrphanRowIds`, which see the identical fact via
  // `useStructuredRows`'s own `baseline: []` for this type (Task 6).
  //
  // `updates`/`removes` are deliberately NOT merged into the request body:
  // an `update` here would mean a rowId the server already has, and
  // `apply_charge_item_defs/` — a create-only endpoint — has no verb for
  // that; a `remove` for a rowId that never reached the server carries
  // nothing worth sending. The ordinary add-then-remove path annihilates
  // the pair inside the reducer (`editLog.ts`'s `coalesceOntoAdd`) before
  // it ever reaches a log this function sees — see the "a removed row does
  // not reach requests" test below, built through the real reducer, not a
  // hand-written log.
  const { creates } = resolveChanges(edits, { baseline: new Map() });
  if (creates.length === 0) return [];
  return [
    {
      url: `/api/v1/facility/${facilityId}/charge_item/apply_charge_item_defs/`,
      method: "POST",
      body: { requests: creates.map(stripDisplay) },
      reference_id: structuredReferenceId("charge_item", questionId),
    },
  ];
}

/** Is `quantity` a positive integer, written as the wire's plain string
 *  (`ApplyChargeItemDefinitionRequest.quantity: string`)? Trimmed first so
 *  incidental whitespace doesn't fail a value that is otherwise a clean
 *  integer — the same defensive trim `appointment`'s `hasValidSlot` applies
 *  to `slot_id`. `"0"`/negative values fail the `>= 1` check, not the regex,
 *  so both are reported for the same reason a clinician can act on: not a
 *  quantity, not "at least one". */
function isPositiveIntegerQuantity(quantity: string): boolean {
  const trimmed = quantity.trim();
  return /^\d+$/.test(trimmed) && Number(trimmed) >= 1;
}

/**
 * THE QUANTITY DECISION. Row-scoped, pure — the predicate a later task's
 * `validate()` (wired once `charge_item`'s definition flips to contract v2)
 * turns into a `QuestionValidationError` per invalid row, per N5 (Global
 * Constraints: a row-scoped error can only be raised for a row that carries
 * an edit, because the bare projection has no `rowId` to key it to).
 *
 * WHY THIS VALIDATES AT ALL, given the legacy widget never did. Today
 * `CHARGE_ITEM_FIELDS.QUANTITY` declares `required: true`
 * (`ChargeItemQuestion.tsx`) but nothing client-side ever checks it — the
 * `<Input type="number" min={1}>` is a browser hint a clinician can still
 * defeat (paste, an IME, a non-conforming browser: the wire type is a bare
 * `string`, not a number), and `FieldError` only ever renders an error the
 * SERVER already sent back after a 400. A quantity of `""`, `"-1"` or
 * `"abc"` reaches `apply_charge_item_defs/` today and is caught only there,
 * if at all. Deciding to validate it here — deliberately, not by omission —
 * closes that gap the same way `appointment`'s `needsSlot` closes P1-16.
 *
 * WHY `toRequests` (above) DOES NOT ALSO FILTER ON IT — the deliberate,
 * documented other half of the decision. Unlike `appointment`'s
 * `slot_id` (which `toRequests` MUST gate: with no slot there is no URL to
 * construct, so the request is not just wrong, it cannot be built),  an
 * invalid `quantity` string does not stop `toRequests` from building a
 * syntactically complete POST body — the gate belongs entirely to
 * `validate()`, not the differ, because:
 *   1. `useSubmitQuestionnaire.ts`'s client-validation pass runs BEFORE
 *      `composeBatch`/`toRequests` and returns immediately the moment ANY
 *      `QuestionValidationError` exists, for ANY question, in the WHOLE
 *      session (`collectStructuredErrors`'s errors are concatenated with
 *      `collectRequiredErrors`'s and gate the entire submit, not just this
 *      section) — so once this predicate backs a blocking error,
 *      `toRequests` structurally cannot run with an invalid quantity still
 *      present.
 *   2. Having `toRequests` ALSO silently drop the bad row instead would be
 *      exactly the silent-drop class this phase exists to retire: the
 *      clinician's entry would vanish from the request with no message,
 *      rather than blocking Save with one they can act on.
 * This is what keeps PROJECTION AND SUBMIT in agreement here too: both
 * `projectValues` and `toRequests` include a row regardless of its
 * quantity's validity, because control flow never reaches `toRequests` on
 * a real submit while an invalid one survives — see `model.test.ts`'s
 * "quantity decision" cases, which exercise `toRequests` directly (as a unit
 * would, bypassing the submit gate) to show it is NOT the safety net, on
 * purpose.
 *
 * A `remove` edit's quantity is never reported: the row is on its way out,
 * not something the clinician still needs to fix (mirrors `needsSlot`'s own
 * "an edit that resolved to nothing visible must not trip validation").
 */
export function invalidQuantityRowIds(
  edits: readonly StructuredEdit<ChargeItemRow>[],
): string[] {
  return edits
    .filter(
      (edit) =>
        edit.op !== "remove" && !isPositiveIntegerQuantity(edit.patch.quantity),
    )
    .map((edit) => edit.rowId);
}
