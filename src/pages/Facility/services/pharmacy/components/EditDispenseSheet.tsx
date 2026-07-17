import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { formatMedicationLine } from "@/components/Medicine/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { InventoryItemsSelector } from "@/pages/Facility/services/inventory/InventoryItemsSelector";
import { LotSelection } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";

import {
  getSubstitutionReasonDisplay,
  getSubstitutionTypeDisplay,
  MedicationDispenseCreate,
  MedicationDispenseRead,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { displayMedicationName } from "@/types/emr/medicationRequest/medicationRequest";

import {
  add,
  isEqual,
  isLessThanOrEqual,
  isPositive,
  roundWhole,
} from "@/Utils/decimal";
import { useBatchRequest } from "@/Utils/request/batch";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";

interface Props {
  facilityId: string;
  locationId: string;
  dispense: MedicationDispenseRead;
}

/**
 * Overlay to edit the lot / quantity of an existing medication dispense.
 *
 * Editing never mutates the original dispense in place — when there are
 * changes, the original dispense is marked as `declined` (restoring its
 * stock) and a replacement dispense is created under the same dispense
 * order in a single batch request. When there are no changes, nothing
 * is submitted.
 */
export function EditDispenseSheet({ facilityId, locationId, dispense }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [lot, setLot] = useState<LotSelection | null>(null);

  // The list endpoint's read shape doesn't carry the encounter for dispenses
  // without an authorizing request; recover it from the retrieve shape.
  const encounterFromRequest = dispense.authorizing_request?.encounter;
  const { data: retrievedDispense } = useQuery({
    queryKey: ["medication_dispense_retrieve", dispense.id],
    queryFn: query(medicationDispenseApi.get, {
      pathParams: { id: dispense.id },
    }),
    enabled: open && !encounterFromRequest,
  });
  const encounterId = encounterFromRequest ?? retrievedDispense?.encounter.id;

  const { mutate: saveEdit, isPending: isSaving } = useBatchRequest({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication_dispense"] });
      queryClient.invalidateQueries({ queryKey: ["dispenseOrder"] });
      toast.success(t("dispense_updated_successfully"));
      setOpen(false);
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLot({
        item: dispense.item,
        quantity: roundWhole(dispense.quantity),
        autoSelected: false,
      });
    }
  };

  const isSameLot = lot?.item.id === dispense.item.id;
  const hasChanges =
    !!lot && (!isSameLot || !isEqual(lot.quantity || "0", dispense.quantity));

  // Declining the original dispense restores its stock, so when the same lot
  // is kept, the original quantity is available on top of the lot's current
  // net content.
  const maxQuantity = lot
    ? isSameLot
      ? add(lot.item.net_content, dispense.quantity).toString()
      : lot.item.net_content
    : "0";

  const isQuantityValid =
    !!lot &&
    isPositive(lot.quantity || "0") &&
    isLessThanOrEqual(lot.quantity, maxQuantity);

  const handleSave = () => {
    if (!lot) return;

    if (!hasChanges) {
      setOpen(false);
      return;
    }

    if (!encounterId) return;

    const createBody: MedicationDispenseCreate = {
      status: MedicationDispenseStatus.preparation,
      category: dispense.category,
      when_prepared: new Date(),
      note: dispense.note,
      dosage_instruction: dispense.dosage_instruction ?? [],
      substitution:
        dispense.substitution?.was_substituted != null
          ? dispense.substitution
          : undefined,
      encounter: encounterId,
      location: locationId,
      authorizing_request: dispense.authorizing_request?.id ?? null,
      item: lot.item.id,
      quantity: lot.quantity,
      fully_dispensed: true,
      order: dispense.order.id,
    };

    saveEdit([
      {
        api: medicationDispenseApi.update,
        pathParams: { id: dispense.id },
        referenceId: `decline_${dispense.id}`,
        body: { status: MedicationDispenseStatus.declined },
      },
      {
        api: medicationDispenseApi.create,
        referenceId: `replace_${dispense.id}`,
        body: createBody,
      },
    ]);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("edit_dispense")}>
              <PencilIcon className="size-4" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("edit_dispense")}</TooltipContent>
      </Tooltip>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("edit_dispense")}</SheetTitle>
          <SheetDescription>{t("edit_dispense_description")}</SheetDescription>
        </SheetHeader>

        <ExistingDispenseDetails dispense={dispense} />

        <div className="flex gap-3 py-4">
          <div className="flex flex-col gap-2 w-full">
            <Label>{t("select_lot")}</Label>
            <InventoryItemsSelector
              facilityId={facilityId}
              locationId={locationId}
              productKnowledgeId={dispense.item.product.product_knowledge.id}
              showOnlyAvailable
              value={lot ?? undefined}
              selected={lot ? [lot] : []}
              onChange={(items) => {
                // Single-lot behaviour: keep the newly toggled lot (if any),
                // carrying over the entered quantity.
                const next =
                  items.find((i) => i.item.id !== lot?.item.id) ?? items[0];
                setLot(
                  next
                    ? { ...next, quantity: lot?.quantity ?? next.quantity }
                    : null,
                );
              }}
              disabled={isSaving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-dispense-quantity">{t("quantity")}</Label>
            <Input
              id="edit-dispense-quantity"
              type="number"
              min={0}
              max={maxQuantity}
              value={lot?.quantity ?? ""}
              onChange={(e) =>
                lot && setLot({ ...lot, quantity: e.target.value })
              }
              className="w-28"
              placeholder="0"
              disabled={isSaving || !lot}
            />
            {lot && !isQuantityValid && (
              <span className="text-sm text-red-600">
                {isPositive(lot.quantity || "0")
                  ? t("insufficient_stock")
                  : t("quantity_must_be_greater_than_zero")}
              </span>
            )}
          </div>
        </div>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isSaving ||
              !lot ||
              !isQuantityValid ||
              (hasChanges && !encounterId)
            }
          >
            {t("save_changes")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Read-only summary of the dispense being edited: the dispensed medicine
 * (with substitution context when it differs from what was prescribed),
 * current lot & quantity, prescriber details, and the dosage instructions.
 */
function ExistingDispenseDetails({
  dispense,
}: {
  dispense: MedicationDispenseRead;
}) {
  const { t } = useTranslation();

  const medication = dispense.authorizing_request;
  const batchNumber = dispense.item.product.batch?.lot_number;
  const expiryDate = dispense.item.product.expiration_date;
  const baseUnit =
    dispense.item.product.product_knowledge.base_unit?.display || t("units");
  const instructions = dispense.dosage_instruction?.length
    ? dispense.dosage_instruction
    : (medication?.dosage_instruction ?? []);
  const substitution = dispense.substitution?.was_substituted
    ? dispense.substitution
    : undefined;

  const dispensedName = dispense.item.product.product_knowledge.name;
  const prescribedName = medication ? displayMedicationName(medication) : "";
  // Only surface the prescribed medicine when it differs from what is being
  // dispensed — otherwise showing the same name twice adds nothing.
  const isDifferentFromPrescribed =
    !!prescribedName && prescribedName !== dispensedName;

  return (
    <div className="my-4 flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
      {/* Dispensed medicine (with substitution context) + lot & quantity */}
      <div className="flex flex-col gap-0.5">
        {isDifferentFromPrescribed && (
          <span className="text-xs italic text-gray-500 line-through">
            {prescribedName}
          </span>
        )}
        <span className="flex items-center gap-2 font-semibold text-gray-900">
          {dispensedName}
          {(isDifferentFromPrescribed || substitution) && (
            <Badge variant="orange">{t("substituted")}</Badge>
          )}
        </span>
        {substitution && (
          <span className="text-xs text-gray-600">
            {getSubstitutionTypeDisplay(t, substitution.substitution_type)}
            <span className="mx-1.5 text-gray-400">·</span>
            {getSubstitutionReasonDisplay(t, substitution.reason)}
          </span>
        )}
        <span className="text-xs text-gray-600">
          {batchNumber && (
            <>
              {t("batch")}:{" "}
              <span className="font-medium text-gray-900">{batchNumber}</span>
              <span className="mx-1.5 text-gray-400">·</span>
            </>
          )}
          {expiryDate && (
            <>
              {t("expiry_abbrevated")}:{" "}
              <span className="font-medium text-gray-900">
                {format(new Date(expiryDate), "dd/MM/yyyy")}
              </span>
              <span className="mx-1.5 text-gray-400">·</span>
            </>
          )}
          {t("quantity")}:{" "}
          <span className="font-medium text-gray-900">
            {roundWhole(dispense.quantity)} {baseUnit}
          </span>
        </span>
      </div>

      {/* Prescriber details — the medicine name is already shown above */}
      {medication && (
        <div className="flex flex-col gap-0.5 border-t border-gray-200 pt-2">
          <span className="text-xs text-gray-600">
            {t("prescribed_by")}:{" "}
            <span className="font-medium text-gray-900">
              {formatName(medication.requester ?? medication.created_by)}
            </span>
            <span className="mx-1.5 text-gray-400">·</span>
            {formatDateTime(medication.authored_on)}
          </span>
          {medication.note && (
            <span className="text-xs text-gray-600">
              {t("note")}: {medication.note}
            </span>
          )}
        </div>
      )}

      {/* Dosage instructions */}
      {instructions.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-gray-200 pt-2">
          <span className="text-xs font-medium text-gray-500">
            {t("instructions")}
          </span>
          {instructions.map((instruction, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-gray-900">
                {formatMedicationLine(instruction, { unitLabel: baseUnit }) ||
                  "-"}
              </span>
              {instruction.text && (
                <span className="text-xs text-gray-600">
                  {instruction.text}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dispense note */}
      {dispense.note && (
        <div className="flex flex-col gap-0.5 border-t border-gray-200 pt-2">
          <span className="text-xs font-medium text-gray-500">{t("note")}</span>
          <span className="text-gray-900">{dispense.note}</span>
        </div>
      )}
    </div>
  );
}
