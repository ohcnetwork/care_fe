import ChargeItemPriceDisplay from "@/components/Billing/ChargeItem/ChargeItemPriceDisplay";
import { DosageInstructionList } from "@/components/Medicine/DosageInstructionList";
import { FormattedDosage } from "@/components/Medicine/FormattedDosage";
import {
  formatDuration,
  formatFrequency,
  formatTotalUnits,
} from "@/components/Medicine/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  CHARGE_ITEM_STATUS_COLORS,
  ChargeItemRead,
} from "@/types/billing/chargeItem/chargeItem";
import { INVOICE_STATUS_COLORS } from "@/types/billing/invoice/invoice";
import { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import {
  displayMedicationName,
  MEDICATION_REQUEST_STATUS_COLORS,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import { roundWhole } from "@/Utils/decimal";
import { formatName } from "@/Utils/utils";
import { format } from "date-fns";
import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface DispenseInfoPopoverProps {
  trigger: React.ReactNode;
  dispense: MedicationDispenseRead;
}

export const DispenseInfoPopover = ({
  trigger,
  dispense,
}: DispenseInfoPopoverProps) => {
  const { t } = useTranslation();
  const [openPopover, setOpenPopover] = useState(false);

  const authorizingRequest = dispense.authorizing_request;
  const chargeItem = dispense.charge_item;

  const title = authorizingRequest
    ? displayMedicationName(authorizingRequest)
    : dispense.item.product.product_knowledge.name;

  return (
    <Popover open={openPopover} onOpenChange={setOpenPopover}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="flex flex-col border border-gray-200 shadow-lg p-4 rounded-md gap-4 w-100 bg-white z-50"
        side="bottom"
        align="start"
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-between border-b border-gray-200 pb-3">
            <div className="flex flex-col">
              <h4 className="font-semibold text-gray-950 wrap-anywhere">
                {title || t("unknown_medication")}
              </h4>
              <span className="text-xs text-gray-600">
                {t("dispense_details")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="size-8 border border-gray-300 p-4"
              onClick={() => setOpenPopover(false)}
            >
              <X className="size-4 text-gray-600" />
            </Button>
          </div>

          {authorizingRequest ? (
            <PrescriptionInfoSection authorizingRequest={authorizingRequest} />
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-950">
                {t("prescription_details")}
              </span>
              <span className="text-sm text-gray-600">
                {t("dispense_no_prescription")}
              </span>
            </div>
          )}

          {chargeItem && <ChargeItemInfoSection chargeItem={chargeItem} />}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const PrescriptionInfoSection = ({
  authorizingRequest,
}: {
  authorizingRequest: MedicationRequestRead;
}) => {
  const { t } = useTranslation();

  const prescriber =
    authorizingRequest.prescription?.prescribed_by ??
    authorizingRequest.requester;
  const prescribedOn =
    authorizingRequest.authored_on ?? authorizingRequest.created_date;
  const instructions = authorizingRequest.dosage_instruction ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-950">
          {t("prescription_details")}
        </span>
        <Badge
          variant={MEDICATION_REQUEST_STATUS_COLORS[authorizingRequest.status]}
        >
          {t(authorizingRequest.status)}
        </Badge>
      </div>

      <div className="flex justify-between gap-2">
        <span className="text-sm font-medium text-gray-600">
          {t("prescribed_by")}
        </span>
        <span className="text-sm font-semibold text-gray-950 text-right">
          {prescriber ? formatName(prescriber) : "-"}
        </span>
      </div>
      <div className="flex justify-between gap-2">
        <span className="text-sm font-medium text-gray-600">
          {t("prescribed_on")}
        </span>
        <span className="text-sm font-semibold text-gray-950 text-right">
          {prescribedOn
            ? format(new Date(prescribedOn), "dd/MM/yyyy · hh:mm a")
            : "-"}
        </span>
      </div>

      {instructions.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-gray-950">
            {t("instructions")}
          </span>
          <DosageInstructionList
            instructions={instructions}
            gap="sm"
            itemClassName="text-sm text-gray-700 font-medium flex items-center gap-1 capitalize"
            renderItem={(di) => {
              const rest = [formatFrequency(di), formatDuration(di)]
                .filter(Boolean)
                .join(" × ");
              const total = formatTotalUnits([di], "units");
              return (
                <>
                  <FormattedDosage instruction={di} fallback="-" />
                  {rest && <span> × {rest}</span>}
                  {total && (
                    <span>
                      {" "}
                      ={" "}
                      <span className="underline underline-offset-2 decoration-dotted decoration-gray-500 font-semibold">
                        {total}
                      </span>
                    </span>
                  )}
                </>
              );
            }}
          />
        </div>
      )}

      {authorizingRequest.note && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-gray-950">
            {t("note")}
          </span>
          <span className="text-sm text-gray-700">
            {authorizingRequest.note}
          </span>
        </div>
      )}
    </div>
  );
};

const ChargeItemInfoSection = ({
  chargeItem,
}: {
  chargeItem: ChargeItemRead;
}) => {
  const { t } = useTranslation();

  const paidInvoice = chargeItem.paid_invoice;

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-950">
          {t("billing_details")}
        </span>
        <Badge variant={CHARGE_ITEM_STATUS_COLORS[chargeItem.status]}>
          {t(chargeItem.status)}
        </Badge>
      </div>

      <div className="flex justify-between gap-2">
        <span className="text-sm font-medium text-gray-600">
          {t("quantity")}
        </span>
        <span className="text-sm font-semibold text-gray-950 text-right">
          {roundWhole(chargeItem.quantity)}
        </span>
      </div>

      {chargeItem.total_price_components.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-gray-50">
          <ChargeItemPriceDisplay
            priceComponents={chargeItem.total_price_components}
          />
          <Separator />
          <div className="flex justify-between gap-2 p-3">
            <span className="text-sm font-semibold text-gray-950">
              {t("total_price")}
            </span>
            <MonetaryDisplay
              className="text-sm font-semibold text-gray-950"
              amount={chargeItem.total_price}
            />
          </div>
        </div>
      )}

      {chargeItem.total_price_components.length === 0 && (
        <div className="flex justify-between gap-2">
          <span className="text-sm font-medium text-gray-600">
            {t("total_price")}
          </span>
          <MonetaryDisplay
            className="text-sm font-semibold text-gray-950"
            amount={chargeItem.total_price}
          />
        </div>
      )}

      {paidInvoice && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-600">
            {t("invoice")}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-950">
              #{paidInvoice.number}
            </span>
            <Badge variant={INVOICE_STATUS_COLORS[paidInvoice.status]}>
              {t(paidInvoice.status)}
            </Badge>
          </span>
        </div>
      )}
    </div>
  );
};
