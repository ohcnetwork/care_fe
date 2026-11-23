import { DosageInstructionList } from "@/components/Medicine/DosageInstructionList";
import { FormattedDosage } from "@/components/Medicine/FormattedDosage";
import { formatDuration, formatFrequency } from "@/components/Medicine/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { billMedicationLineItemSchema } from "@/pages/Facility/services/pharmacy/billMedications/formSchema";
import { DispensedItemsSheet } from "@/pages/Facility/services/pharmacy/components/DispensedItemsSheet";
import {
  MedicationRequestDispenseStatus,
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import z from "zod";

interface MedicineInfoCardProps {
  trigger: React.ReactNode;
  medication: MedicationRequestRead | null;
  effectiveProductKnowledge: ProductKnowledgeBase | null;
  substitution: z.infer<
    typeof billMedicationLineItemSchema.shape.substitution
  > | null;
  productKnowledge: ProductKnowledgeBase | null;
  dosageInstructions: MedicationRequestDosageInstruction[];
}

export const MedicineInfoPopover = ({
  trigger,
  medication,
  effectiveProductKnowledge,
  substitution,
  productKnowledge,
  dosageInstructions,
}: MedicineInfoCardProps) => {
  const { t } = useTranslation();
  const [openPopover, setOpenPopover] = useState(false);
  const [viewingDispensedMedicationId, setViewingDispensedMedicationId] =
    useState<string | null>(null);

  const isDispensedOrSubstituted =
    medication?.dispense_status === MedicationRequestDispenseStatus.partial ||
    substitution;

  return (
    <Popover open={openPopover} onOpenChange={setOpenPopover}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="flex flex-col border border-gray-200 shadow-lg p-4 rounded-md gap-4 w-100 bg-white z-50"
        side="bottom"
        align="start"
      >
        <div className="flex flex-col gap-6 ">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between border-b border-gray-200 pb-3">
              <div className="flex flex-col">
                <h4 className="font-semibold text-gray-950 wrap-anywhere">
                  {effectiveProductKnowledge?.name ||
                    medication?.medication?.display ||
                    t("unknown_medication")}
                </h4>
                <DosageInstructionList
                  instructions={dosageInstructions}
                  gap="sm"
                  itemClassName="text-xs text-gray-600 flex items-center gap-1 capitalize"
                  renderItem={(di) => {
                    const rest = [formatFrequency(di), formatDuration(di)]
                      .filter(Boolean)
                      .join(" × ");
                    return (
                      <>
                        <FormattedDosage instruction={di} fallback="-" />
                        {rest && <span> × {rest}</span>}
                      </>
                    );
                  }}
                />
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
            <div className="flex gap-1">
              {medication?.dispense_status ===
                MedicationRequestDispenseStatus.partial && (
                <Badge variant="yellow">{t("partially_dispensed")}</Badge>
              )}

              {medication?.dispense_status ===
                MedicationRequestDispenseStatus.complete && (
                <Badge variant="blue">
                  <Check />
                  {t("dispensed")}
                </Badge>
              )}

              {substitution && (
                <Badge variant="orange">{t("substituted")}</Badge>
              )}
            </div>
          </div>
          {isDispensedOrSubstituted ? (
            <div className="flex flex-col gap-4">
              {substitution && (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-semibold text-gray-950">
                    {t("substitution")}
                  </span>
                  <span className="text-gray-600 text-sm italic line-through">
                    {!productKnowledge
                      ? medication?.medication?.display
                      : productKnowledge?.name}
                  </span>
                  <span>
                    <Trans
                      i18nKey="substituted_with_product"
                      values={{
                        substituted_with:
                          effectiveProductKnowledge?.name ||
                          medication?.medication?.display ||
                          t("unknown_medication"),
                      }}
                      components={{
                        strong: (
                          <strong className="font-semibold text-gray-950" />
                        ),
                      }}
                    />
                  </span>
                </div>
              )}
              {medication?.dispense_status ===
                MedicationRequestDispenseStatus.partial && (
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  className="mr-auto font-semibold"
                  onClick={() => {
                    setViewingDispensedMedicationId(medication?.id);
                  }}
                >
                  {t("dispense_history")}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <span className="text-gray-500 text-sm italic -mt-5">
                {t("not_dispensed_yet")}
              </span>
            </div>
          )}

          {viewingDispensedMedicationId && (
            <DispensedItemsSheet
              open={!!viewingDispensedMedicationId}
              onOpenChange={(open) => {
                if (!open) setViewingDispensedMedicationId(null);
              }}
              medicationRequestId={viewingDispensedMedicationId}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
