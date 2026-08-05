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
import { StructuredDroppedRowsNotice } from "@/components/QuestionnaireV2/structured/core/StructuredDroppedRowsNotice";
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
 *  convert into a baseline, ever. Module scope so the baseline keeps one
 *  identity across renders (a fresh `[]` literal would defeat
 *  `useStructuredRows`'s memoization). Passed explicitly so the core
 *  receives the honest complete set — "the server confirmed zero rows", per
 *  the BASELINE COMPLETENESS CONTRACT — not `undefined`, its "still
 *  loading/errored" signal. */
const NO_BASELINE: readonly BaselineRow<ChargeItemRow>[] = [];

/** Price cell: the first price component's amount, with a popover breaking
 *  down all components. */
function ChargeItemPrice({
  definition,
}: {
  definition: ChargeItemDefinitionRead;
}) {
  const { t } = useTranslation();
  const priceComponents = definition.price_components ?? [];
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <span>
          <MonetaryDisplay amount={priceComponents[0]?.amount ?? 0} />
        </span>
        {priceComponents.length > 0 && (
          <Popover>
            {/* Without `asChild`, Radix renders its own button around the
                bare icon — which otherwise has no accessible name. */}
            <PopoverTrigger aria-label={t("price_breakdown")}>
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

  const list = useStructuredRows({
    questionId: question.id,
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
        // The collapsed mobile card already shows this title via `rowTitle`;
        // hidden here so the expanded card doesn't repeat it as an "Item"
        // field.
        mobileHidden: true,
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

  // Unreachable per the definition's `requires: ["encounterId", "facilityId"]`
  // — narrowed once here so the JSX below needs no non-null assertions.
  if (!facilityId || !encounterId) return null;

  return (
    <div className="space-y-2">
      <StructuredDroppedRowsNotice
        droppedEdits={list.droppedEdits}
        rowLabel={(row) => row.charge_item_definition_object.title}
      />
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
            facilityId={facilityId}
            // The picker is a TRIGGER, not a value holder — it never carries
            // a selection of its own: the row is appended directly from
            // onValueChange, so no selection state (and no effect to sync it)
            // exists.
            value={undefined}
            onValueChange={(selected) => {
              if (!selected || Array.isArray(selected)) return;
              list.addRow(newChargeItemRow(selected, encounterId));
            }}
            placeholder={t("select_charge_item_definition")}
            disabled={disabled}
            className="w-full"
            resourceType={ResourceCategoryResourceType.charge_item_definition}
            listDefinitions={{
              queryFn: chargeItemDefinitionApi.listChargeItemDefinition,
              pathParams: { facilityId },
              queryParams: { status: ChargeItemDefinitionStatus.active },
            }}
            translationBaseKey="charge_item_definition"
          />
        }
      />
    </div>
  );
}
