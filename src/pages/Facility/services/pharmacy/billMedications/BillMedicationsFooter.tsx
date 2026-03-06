import BackButton from "@/components/Common/BackButton";
import { Button } from "@/components/ui/button";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { BillMedicationLineItemSchemaType } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { calculateTotalPriceWithQuantity } from "@/types/base/monetaryComponent/monetaryComponent";
import { add } from "@/Utils/decimal";
import { ArrowRightIcon, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  isBillingMedications: boolean;
  items: BillMedicationLineItemSchemaType[];
}

export const BillMedicationsFooter = ({
  isBillingMedications,
  items,
}: Props) => {
  const { t } = useTranslation();

  const { facilityId } = useCurrentFacility();
  const { locationId } = useCurrentLocation();

  const grandTotal = add(
    ...items
      .filter((item) => item.isSelected)
      .flatMap((item) => item.lots)
      .map((lot) =>
        calculateTotalPriceWithQuantity(
          lot.item.product.charge_item_definition?.price_components || [],
          lot.quantity,
        ),
      ),
  );

  return (
    <div className="flex justify-between items-center bg-white px-6 py-4 fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-0.5">
          <div className="text-gray-700">
            <span>{t("estimated_total")}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xl font-semibold text-black tabular-nums">
              <MonetaryDisplay amount={grandTotal} />
            </span>
            <span className="text-base font-medium text-red-600 italic">
              ({t("final_amount_is_calculated_after_invoice_generation")})
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-6">
        <BackButton
          variant="outline"
          size="lg"
          disabled={isBillingMedications}
          to={`/facility/${facilityId}/locations/${locationId}/medication_requests`}
        >
          {t("cancel")}
        </BackButton>
        <Button variant="primary" size="lg" disabled={isBillingMedications}>
          {isBillingMedications && <Loader2 className="size-4 animate-spin" />}
          {isBillingMedications ? t("billing") : t("bill_selected")}
          {!isBillingMedications && <ArrowRightIcon className="size-4" />}
        </Button>
      </div>
    </div>
  );
};
