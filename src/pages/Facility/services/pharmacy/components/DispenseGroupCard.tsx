import { DosageInstructionList } from "@/components/Medicine/DosageInstructionList";
import { FormattedDosage } from "@/components/Medicine/FormattedDosage";
import { formatDosage, formatFrequency } from "@/components/Medicine/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EditDispenseSheet } from "@/pages/Facility/services/pharmacy/components/EditDispenseSheet";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import {
  MEDICATION_DISPENSE_CANCELLED_STATUSES,
  MEDICATION_DISPENSE_STATUS_COLORS,
  MedicationDispenseRead,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { roundWhole } from "@/Utils/decimal";
import mutate from "@/Utils/request/mutate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Fragment } from "react/jsx-runtime";
import { toast } from "sonner";

const EDITABLE_STATUSES: MedicationDispenseStatus[] = [
  MedicationDispenseStatus.preparation,
  MedicationDispenseStatus.in_progress,
  MedicationDispenseStatus.on_hold,
  MedicationDispenseStatus.completed,
];

function getStatusOptions(
  chargeItem?: ChargeItemRead,
): MedicationDispenseStatus[] {
  const options: MedicationDispenseStatus[] = [
    MedicationDispenseStatus.preparation,
    MedicationDispenseStatus.in_progress,
    MedicationDispenseStatus.on_hold,
    MedicationDispenseStatus.completed,
  ];
  if (
    !chargeItem ||
    !chargeItem.paid_invoice ||
    chargeItem.paid_invoice.status === InvoiceStatus.draft
  ) {
    options.push(...MEDICATION_DISPENSE_CANCELLED_STATUSES);
  }
  return options;
}

/**
 * Whether a dispense can be edited (replaced). Mirrors the restrictions for
 * cancelling a dispense: the status must be editable and cancellation must
 * not be blocked by a non-draft invoice.
 */
function canEditDispense(dispense: MedicationDispenseRead): boolean {
  return (
    EDITABLE_STATUSES.includes(dispense.status) &&
    getStatusOptions(dispense.charge_item).includes(
      MedicationDispenseStatus.cancelled,
    )
  );
}

/** Context needed to render the per-row edit action. */
interface DispenseEditContext {
  facilityId: string;
  locationId: string;
}

function DispenseItemsTable({
  dispenses,
  edit,
}: {
  dispenses: MedicationDispenseRead[];
  edit?: DispenseEditContext;
}) {
  const { t } = useTranslation();

  return (
    <div className="contents">
      <div className="col-start-1 bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("medicine")}
        </span>
      </div>
      <div className="col-start-2 bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("instructions")}
        </span>
      </div>
      <div className="col-start-3 bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">
          {t("quantity")}
        </span>
      </div>
      <div className="col-start-4 bg-gray-100 py-1 px-3 flex items-center">
        <span className="text-sm font-medium text-gray-700">{t("status")}</span>
      </div>
      {edit && (
        <div className="col-start-5 bg-gray-100 py-1 px-3 flex items-center">
          <span className="text-sm font-medium text-gray-700">
            {t("actions")}
          </span>
        </div>
      )}

      {dispenses.map((dispense) => {
        const instructions = dispense.dosage_instruction ?? [];
        const batchNumber = dispense.item.product.batch?.lot_number;
        const expiryDate = dispense.item.product.expiration_date;

        const isCancelled = MEDICATION_DISPENSE_CANCELLED_STATUSES.includes(
          dispense.status,
        );

        return (
          <Fragment key={dispense.id}>
            {/* Medicine */}
            <div
              className={cn(
                "bg-white flex flex-col justify-center py-2 px-3 col-start-1",
                isCancelled && "text-red-500 line-through decoration-1",
              )}
            >
              <span className="text-gray-900 font-semibold">
                {dispense.item.product.product_knowledge.name}
              </span>
              <div className="flex gap-2">
                <span
                  className={cn(
                    "text-sm text-gray-700",
                    !batchNumber && "hidden",
                  )}
                >
                  <span>{t("batch")}: </span>
                  <span className="font-medium text-gray-900">
                    {batchNumber}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-sm text-gray-700",
                    !expiryDate && "hidden",
                  )}
                >
                  <span>{t("expiry_abbrevated")}: </span>
                  {expiryDate && (
                    <span className="font-medium text-gray-900">
                      {format(new Date(expiryDate), "dd/MM/yyyy")}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white flex flex-col justify-center py-2 px-3 col-start-2">
              <DosageInstructionList
                instructions={instructions}
                gap="sm"
                renderItem={(di) => {
                  const dose = formatDosage(di);
                  const freq = formatFrequency(di);
                  return (
                    <div className="flex flex-col text-sm font-medium">
                      {(dose || freq) && (
                        <span className="text-gray-900 flex items-center gap-1">
                          {dose && <FormattedDosage instruction={di} />}
                          {dose && freq && <span>·</span>}
                          {freq && <span>{freq}</span>}
                        </span>
                      )}
                    </div>
                  );
                }}
              />
            </div>

            {/* Quantity */}
            <div className="bg-white flex flex-col justify-center py-2 px-3 col-start-3">
              <span className="text-gray-900 font-medium">
                {dispense.quantity ? roundWhole(dispense.quantity) : "-"}
              </span>
            </div>

            {/* Status */}
            <div className="bg-white flex flex-col justify-center py-2 px-3 col-start-4 xl:min-w-48">
              <DispenseStatusSelect dispense={dispense} />
            </div>

            {/* Actions */}
            {edit && (
              <div className="bg-white flex items-center justify-center py-2 px-3 col-start-5">
                {canEditDispense(dispense) && (
                  <EditDispenseSheet
                    facilityId={edit.facilityId}
                    locationId={edit.locationId}
                    dispense={dispense}
                  />
                )}
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

const DispenseStatusSelect = ({
  dispense,
}: {
  dispense: MedicationDispenseRead;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: updateDispense } = useMutation({
    mutationFn: mutate(medicationDispenseApi.update, {
      pathParams: { id: dispense.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication_dispense"] });
      toast.success(t("dispense_status_updated"));
    },
  });

  return (
    <Select
      disabled={!EDITABLE_STATUSES.includes(dispense.status)}
      value={dispense.status.toString()}
      onValueChange={(value) =>
        updateDispense({
          id: dispense.id,
          status: value as MedicationDispenseStatus,
        })
      }
    >
      <SelectTrigger>
        <SelectValue placeholder={t("select_status")} />
      </SelectTrigger>
      <SelectContent>
        {getStatusOptions(dispense.charge_item).map((status) => (
          <SelectItem key={status} value={status.toString()}>
            <Badge variant={MEDICATION_DISPENSE_STATUS_COLORS[status]}>
              {t(status)}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
/**
 * Renders a dispense items table inside the shared grid container.
 * Use when displaying a flat list of dispenses (e.g. grouped by invoice)
 * without prescription/other-item header context.
 */
export function DispenseItemsTableCard({
  dispenses,
  edit,
}: {
  dispenses: MedicationDispenseRead[];
  edit?: DispenseEditContext;
}) {
  return (
    <div
      className={cn(
        "bg-gray-200 border border-gray-200 rounded-md overflow-hidden grid gap-px",
        edit
          ? "grid-cols-[1fr_1fr_auto_minmax(10rem,auto)_auto]"
          : "grid-cols-[1fr_1fr_auto_minmax(10rem,auto)]",
      )}
    >
      <DispenseItemsTable dispenses={dispenses} edit={edit} />
    </div>
  );
}
