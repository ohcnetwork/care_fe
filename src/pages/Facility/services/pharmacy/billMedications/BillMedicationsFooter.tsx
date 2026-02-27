import BackButton from "@/components/Common/BackButton";
import { Button } from "@/components/ui/button";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { BillMedicationLineItemSchemaType } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  items: BillMedicationLineItemSchemaType[];
  handleBillSelected: () => void;
}

export const BillMedicationsFooter = ({ items, handleBillSelected }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex justify-between items-center bg-white px-6 py-4 fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-0.5">
          <div className="text-gray-700">
            <span>{t("estimated_total")}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xl font-semibold text-black tabular-nums">
              <MonetaryDisplay amount={450} />
            </span>
            <span className="text-base font-medium text-red-600 italic">
              ({t("final_amount_is_calculated_after_invoice_generation")})
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-6">
        <BackButton variant="outline" size="lg">
          {t("cancel")}
        </BackButton>
        <Button variant="primary" size="lg" onClick={handleBillSelected}>
          {t("bill_selected")}
          <ArrowRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
};
