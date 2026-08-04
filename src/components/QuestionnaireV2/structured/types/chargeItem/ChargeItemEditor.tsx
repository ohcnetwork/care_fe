import { InfoIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import ChargeItemPriceDisplay from "@/components/Billing/ChargeItem/ChargeItemPriceDisplay";
import { ResourceDefinitionCategoryPicker } from "@/components/Common/ResourceDefinitionCategoryPicker";
import UserSelector from "@/components/Common/UserSelector";
import {
  StructuredList,
  type StructuredColumn,
} from "@/components/QuestionnaireV2/structured/core/StructuredList";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import { useStructuredRows } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import {
  ChargeItemDefinitionBase,
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";

import { newChargeItemRow, projectValues, type ChargeItemRow } from "./model";

/** Charge items are applied, never prefetched — there is no server row to
 *  convert into a baseline, ever (the legacy widget only ever wrote a
 *  response, `ChargeItemQuestion.tsx`'s selection effect). Module scope,
 *  like `projectValues`: a fresh `[]` literal on every render would be a
 *  new baseline identity each time, defeating `useStructuredRows`'s own
 *  memoization of it. Passed explicitly rather than omitted so the honest
 *  complete set — "the server confirmed zero rows," per the BASELINE
 *  COMPLETENESS CONTRACT — is what the core actually receives, not
 *  `undefined` (its "still loading/errored" signal). Mirrors
 *  `AppointmentEditor.tsx`'s `NO_BASELINE`. */
const NO_BASELINE: readonly BaselineRow<ChargeItemRow>[] = [];

/** The `MonetaryDisplay` + price-breakdown `Popover`, lifted verbatim out
 *  of `ChargeItemQuestion.tsx:124-156` (the `ChargeItemForm`'s price cell)
 *  into a local component here — no behaviour change, just relocated
 *  beside its one caller. */
function ChargeItemPrice({
  definition,
}: {
  definition: ChargeItemDefinitionRead;
}) {
  const priceComponents = definition.price_components ?? [];
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <span>
          <MonetaryDisplay amount={priceComponents[0]?.amount ?? 0} />
        </span>
        {priceComponents.length > 0 && (
          <Popover>
            <PopoverTrigger>
              <InfoIcon className="h-4 w-4 cursor-pointer text-gray-700" />
            </PopoverTrigger>
            <PopoverContent
              side="right"
              className="w-auto max-w-[calc(100vw-2rem)] p-0"
              align="start"
            >
              <ChargeItemPriceDisplay priceComponents={priceComponents} />
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}

export function ChargeItemEditor({
  question,
  disabled,
  errors,
  encounterId,
  facilityId,
}: StructuredInputProps) {
  const { t } = useTranslation();

  // No explicit type arguments — `TRow` infers from `projectValues`, `Mode`
  // defaults to "list" (charge_item is a genuine list, not a singleton).
  const list = useStructuredRows({
    questionId: question.id,
    // Create-only: charge items are applied, never prefetched. An explicit
    // empty baseline is the honest complete set for this type, not a
    // loading stand-in — see NO_BASELINE's own doc comment.
    baseline: NO_BASELINE,
    projectValues,
    disabled,
  });

  const columns: StructuredColumn<ChargeItemRow>[] = useMemo(
    () => [
      {
        key: "item",
        header: t("item"),
        width: "minmax(12rem, 1fr)",
        render: ({ row }) => row.row.charge_item_definition_object.title,
      },
      {
        key: "quantity",
        header: t("quantity"),
        width: "8rem",
        required: true,
        render: ({
          row,
          update,
          disabled: cellDisabled,
          ariaLabel,
          fieldId,
          describedBy,
          invalid,
        }) => (
          <Input
            id={fieldId}
            type="number"
            min={1}
            aria-label={ariaLabel}
            aria-required
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            value={row.row.quantity}
            onChange={(event) => update({ quantity: event.target.value })}
            disabled={cellDisabled}
            className={cn("w-24", invalid && "border-red-500")}
          />
        ),
      },
      {
        key: "price",
        header: t("price"),
        width: "10rem",
        render: ({ row }) => (
          <ChargeItemPrice definition={row.row.charge_item_definition_object} />
        ),
      },
      {
        key: "performer",
        header: t("performer"),
        width: "minmax(12rem, 1fr)",
        render: ({ row, update, disabled: cellDisabled, ariaLabel }) => (
          <UserSelector
            selected={row.row.performer_actor_object}
            onChange={(user) =>
              update({ performer_actor: user.id, performer_actor_object: user })
            }
            placeholder={t("select_performer")}
            facilityId={facilityId}
            disabled={cellDisabled}
            aria-label={ariaLabel}
          />
        ),
      },
    ],
    [t, facilityId],
  );

  return (
    <StructuredList
      questionId={question.id}
      label={t("structured_type__charge_item")}
      rows={list.rows}
      columns={columns}
      errors={errors}
      disabled={disabled}
      onUpdateRow={list.updateRow}
      onRemoveRow={list.removeRow}
      rowTitle={(row) => row.row.charge_item_definition_object.title}
      addControl={
        <ResourceDefinitionCategoryPicker<ChargeItemDefinitionBase>
          facilityId={facilityId!}
          // The picker is a TRIGGER, not a value holder — it never carries
          // a selection of its own. The legacy component held the pick in
          // `selectedChargeItemDefinition` and appended the row from a
          // `useEffect` keyed on it (`ChargeItemQuestion.tsx:211-244`),
          // then reset the selection inside that SAME effect: a
          // write-during-effect loop whose dependency array had to list
          // the response callback to stay correct. Adding the row directly
          // from `onValueChange` removes both the effect and the second
          // piece of state.
          value={undefined}
          onValueChange={(selected) => {
            if (!selected || Array.isArray(selected) || !encounterId) return;
            list.addRow(
              newChargeItemRow(
                selected as ChargeItemDefinitionRead,
                encounterId,
              ),
            );
          }}
          placeholder={t("select_charge_item_definition")}
          disabled={disabled}
          className="w-full"
          resourceType={ResourceCategoryResourceType.charge_item_definition}
          listDefinitions={{
            queryFn: chargeItemDefinitionApi.listChargeItemDefinition,
            pathParams: { facilityId: facilityId! },
            queryParams: { status: ChargeItemDefinitionStatus.active },
          }}
          translationBaseKey="charge_item_definition"
        />
      }
    />
  );
}
