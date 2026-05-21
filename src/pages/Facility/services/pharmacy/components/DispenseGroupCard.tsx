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
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import {
  MEDICATION_DISPENSE_STATUS_COLORS,
  MedicationDispenseRead,
  MedicationDispenseStatus,
  MedicationDispenseUpdate,
} from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import { LocationRead } from "@/types/location/location";
import { getLocationPath } from "@/types/location/utils";
import { roundWhole } from "@/Utils/decimal";
import mutate from "@/Utils/request/mutate";
import { formatName } from "@/Utils/utils";
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
    options.push(
      MedicationDispenseStatus.declined,
      MedicationDispenseStatus.entered_in_error,
      MedicationDispenseStatus.cancelled,
    );
  }
  return options;
}

function DispenseItemsTable({
  dispenses,
}: {
  dispenses: MedicationDispenseRead[];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: updateDispense } = useMutation({
    mutationFn: (body: MedicationDispenseUpdate) =>
      mutate(medicationDispenseApi.update, {
        pathParams: { id: body.id ?? "" },
      })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medication_dispense"] });
      toast.success(t("dispense_status_updated"));
    },
  });

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

      {dispenses.map((dispense) => {
        const instructions = dispense.dosage_instruction ?? [];
        const batchNumber = dispense.item.product.batch?.lot_number;
        const expiryDate = dispense.item.product.expiration_date;

        const isCancelled =
          dispense.status === MedicationDispenseStatus.cancelled ||
          dispense.status === MedicationDispenseStatus.declined ||
          dispense.status === MedicationDispenseStatus.entered_in_error;

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
              {instructions.map((di, idx) => {
                const dosageText = [formatDosage(di), formatFrequency(di)]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <div key={idx} className="flex flex-col text-sm font-medium">
                    {dosageText && (
                      <span className="text-gray-900">{dosageText}</span>
                    )}
                    {di.text && (
                      <span className="text-gray-500">{di.text}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quantity */}
            <div className="bg-white flex flex-col justify-center py-2 px-3 col-start-3">
              <span className="text-gray-900 font-medium">
                {dispense.quantity ? roundWhole(dispense.quantity) : "-"}
              </span>
            </div>

            {/* Status */}
            <div className="bg-white flex flex-col justify-center py-2 px-3 col-start-4 xl:min-w-48">
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
                      <Badge
                        variant={MEDICATION_DISPENSE_STATUS_COLORS[status]}
                      >
                        {t(status)}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

interface PrescriptionGroupCardProps {
  prescription: PrescriptionRead;
  dispenses: MedicationDispenseRead[];
}

export function PrescriptionGroupCard({
  prescription,
  dispenses,
}: PrescriptionGroupCardProps) {
  const { t } = useTranslation();
  const encounterLocation = prescription.encounter?.current_location as
    | LocationRead
    | undefined
    | null;

  return (
    <div className="bg-gray-200 border border-gray-200 rounded-md overflow-hidden grid grid-cols-[1fr_1fr_auto_minmax(10rem,auto)] gap-px">
      <div className="relative bg-white flex justify-between col-start-1 col-span-4 pt-4 pr-2 pb-3 pl-4">
        <div className="absolute top-5 left-0 h-4 w-1 bg-indigo-500 rounded-r-md" />
        <div className="flex flex-col gap-2">
          <div className="text-base text-gray-950">
            <span className="font-medium">{t("prescribed_by")} </span>
            <span className="font-semibold">
              {formatName(prescription.prescribed_by)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {prescription.tags && prescription.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {prescription.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="capitalize"
                    title={tag.description}
                  >
                    {getTagHierarchyDisplay(tag)}
                  </Badge>
                ))}
              </div>
            )}
            <span className="font-medium text-gray-700">
              {format(prescription.created_date, "dd/MM/yyyy · hh:mm a")} (
              {t("items_count", { count: dispenses.length })})
            </span>
            {encounterLocation && (
              <span className="text-gray-700">
                <span className="font-medium text-gray-500">
                  {t("location")}:{" "}
                </span>
                <span className="font-medium">
                  {getLocationPath(encounterLocation)}
                </span>
              </span>
            )}
          </div>
          {prescription.note && (
            <span className="text-sm font-medium text-gray-700">
              {t("note")}: {prescription.note}
            </span>
          )}
        </div>
      </div>
      <DispenseItemsTable dispenses={dispenses} />
    </div>
  );
}

interface OtherItemsGroupCardProps {
  dispenses: MedicationDispenseRead[];
}

export function OtherItemsGroupCard({ dispenses }: OtherItemsGroupCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-200 border border-gray-200 rounded-md overflow-hidden grid grid-cols-[1fr_1fr_auto_minmax(10rem,auto)] gap-px">
      <div className="relative bg-white flex justify-between col-start-1 col-span-4 pt-4 pr-2 pb-2 pl-4">
        <div className="absolute top-5 left-0 h-4 w-1 bg-amber-500 rounded-r-md" />
        <div className="flex flex-col gap-0.5">
          <div className="text-base text-gray-950">
            <span className="font-semibold">{t("other_items")}</span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            ({t("items_count", { count: dispenses.length })})
          </span>
        </div>
      </div>
      <DispenseItemsTable dispenses={dispenses} />
    </div>
  );
}
