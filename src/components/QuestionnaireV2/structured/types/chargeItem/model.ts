import { z } from "zod";

import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type { ProjectValues } from "@/components/QuestionnaireV2/structured/core/types";
import {
  displayObjectSchema,
  nonEmptyString,
  userDisplaySchema,
} from "@/components/QuestionnaireV2/structured/shared/rowSchemaPrimitives";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import type {
  ApplyChargeItemDefinitionRequest,
  ChargeItemQuestionRow,
} from "@/types/billing/chargeItem/chargeItem";
import { ChargeItemServiceResource } from "@/types/billing/chargeItem/chargeItem";
import type { ChargeItemDefinitionRead } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import type { StructuredEdit } from "@/types/questionnaire/structured";

/**
 * The definition object is required here — every row the editor creates
 * comes from a picked `ChargeItemDefinitionRead` (`newChargeItemRow`) —
 * while the wider `ChargeItemQuestionRow` arm keeps both display objects
 * optional, since restored persisted data may not include them.
 */
export type ChargeItemRow = ChargeItemQuestionRow & {
  charge_item_definition_object: ChargeItemDefinitionRead;
};

/**
 * Assistant write guard. `charge_item_definition_object`/
 * `performer_actor_object` are passthrough, id-keyed-only schemas: an
 * assistant only ever copies one verbatim from a prior pick, never authors
 * the full `ChargeItemDefinitionRead`/`UserReadMinimal` shape by hand. Every
 * other field is `.strict()`.
 */
export const rowSchema = z
  .object({
    charge_item_definition: nonEmptyString,
    quantity: z.string(),
    encounter: z.string().optional(),
    patient: z.string().optional(),
    service_resource: z.enum(ChargeItemServiceResource).optional(),
    service_resource_id: z.string().optional(),
    performer_actor: z.string().optional(),
    account: z.string().optional(),
    charge_item_definition_object: displayObjectSchema(["slug", "title"]),
    performer_actor_object: userDisplaySchema.optional(),
  })
  .strict();

/**
 * A charge-item section is a LIST whose rows are born whole
 * (`newChargeItemRow`): there is no "half filled" state, so no `isEmptyRow`
 * predicate to keep in sync with a submission filter. Whatever `rows` holds
 * is what the clinician sees and exactly the set `toRequests` compiles
 * requests for.
 */
export const projectValues: ProjectValues<ChargeItemRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "charge_item", value: [...rows] }];

/**
 * A freshly picked definition becomes a row: quantity defaults to `"1"`,
 * `encounter` comes from context (a charge item is always billed to the
 * encounter being filled), and the definition's `slug` is the wire identity
 * `apply_charge_item_defs/` expects. The definition object rides along on
 * the row — not fetched a second time — so a restored draft or the list can
 * repaint title/price straight from the response.
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
 * The single place display objects are stripped before the wire. The exact
 * remaining key set is pinned by a dedicated test, not inferred from this
 * comment.
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
  // Create-only: no server row is ever fetched for this type, so the baseline
  // is permanently empty — stated as an explicit empty Map because omitting
  // `baseline` means "still loading or errored" per
  // `ResolveChangesOptions.baseline`, which is not the fact here.
  //
  // `updates`/`removes` are deliberately not merged into the request body:
  // `apply_charge_item_defs/` is create-only (no verb for an update), and a
  // remove for a rowId that never reached the server carries nothing worth
  // sending. Add-then-remove pairs annihilate inside the reducer before this
  // function ever sees them.
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
 * Row-scoped quantity predicate; the definition's `validate()` turns each
 * returned rowId into a blocking `QuestionValidationError`. The wire type is
 * a bare string (`ApplyChargeItemDefinitionRequest.quantity`) and the
 * editor's `<Input type="number" min={1}>` is only a browser hint, so
 * `""`/`"-1"`/`"abc"` are all representable — this predicate is the only
 * client-side gate.
 *
 * `toRequests` deliberately does NOT also filter on it: client validation
 * runs before request compilation and blocks the whole submit on any error,
 * so `toRequests` cannot run while an invalid quantity survives — and having
 * it silently drop the row instead would make the clinician's entry vanish
 * from the request with no message they can act on. Projection and submit
 * therefore both include a row regardless of its quantity's validity.
 *
 * A `remove` edit's quantity is never reported: the row is on its way out,
 * not something the clinician still needs to fix.
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
