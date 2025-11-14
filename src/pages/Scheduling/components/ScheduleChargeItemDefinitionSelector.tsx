import { useState } from "react";
import { useTranslation } from "react-i18next";

import { WalletMinimal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ChargeItemDefinitionPicker } from "@/components/Common/ChargeItemDefinitionPicker";

import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import { ScheduleTemplate } from "@/types/scheduling/schedule";

interface ScheduleChargeItemDefinitionSelectorProps {
  facilityId: string;
  scheduleTemplate: ScheduleTemplate;
  onChange: (value: {
    charge_item_definition_slug: string;
    re_visit_allowed_days: number;
    re_visit_charge_item_definition_slug: string | null;
  }) => void;
}

export default function ScheduleChargeItemDefinitionSelector({
  facilityId,
  scheduleTemplate,
  onChange,
}: ScheduleChargeItemDefinitionSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [reVisitDays, setReVisitDays] = useState(
    scheduleTemplate.revisit_allowed_days,
  );

  const [selectedDefinitionState, setSelectedDefinitionState] = useState<{
    charge_item_definition: ChargeItemDefinitionBase | undefined;
    re_visit_charge_item_definition: ChargeItemDefinitionBase | undefined;
  }>({
    charge_item_definition: scheduleTemplate.charge_item_definition,
    re_visit_charge_item_definition:
      scheduleTemplate.revisit_charge_item_definition,
  });

  const handleSubmit = () => {
    onChange({
      charge_item_definition_slug:
        selectedDefinitionState.charge_item_definition?.slug || "",
      re_visit_allowed_days: reVisitDays,
      re_visit_charge_item_definition_slug:
        selectedDefinitionState.re_visit_charge_item_definition?.slug || null,
    });
    setIsOpen(false);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset to original values when closing
      setReVisitDays(scheduleTemplate.revisit_allowed_days);
      setSelectedDefinitionState({
        charge_item_definition: scheduleTemplate.charge_item_definition,
        re_visit_charge_item_definition:
          scheduleTemplate.revisit_charge_item_definition,
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-full gap-2">
          <WalletMinimal className="size-4" />
          <span className="text-gray-950 font-medium">
            {t("manage_charges")}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[90%] sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("select_charge_item_definitions")}</SheetTitle>
          <SheetDescription>
            {t("select_or_create_charge_item_definitions")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <Label>{t("consulation charge")}</Label>
                <div className="mt-2 flex gap-2 flex-col sm:flex-row">
                  <ChargeItemDefinitionPicker
                    facilityId={facilityId}
                    value={selectedDefinitionState.charge_item_definition}
                    onValueChange={(selectedDef) => {
                      if (!selectedDef) {
                        setSelectedDefinitionState({
                          ...selectedDefinitionState,
                          charge_item_definition: undefined,
                        });
                        return;
                      }
                      setSelectedDefinitionState({
                        ...selectedDefinitionState,
                        charge_item_definition:
                          selectedDef as ChargeItemDefinitionBase,
                      });
                    }}
                    placeholder={t("select_charge_item_definition")}
                    className="grow-1"
                    showCreateButton={true}
                  />
                </div>
              </div>

              <div>
                <Label>{t("re_visit_allowed_days")}</Label>
                <div className="mt-2">
                  <Input
                    type="number"
                    min={0}
                    value={reVisitDays}
                    onChange={(e) =>
                      setReVisitDays(parseInt(e.target.value) || 0)
                    }
                    placeholder={t("enter_re_visit_allowed_days")}
                  />
                </div>
              </div>

              <div>
                <Label>{t("re_visit_consultation_charge")}</Label>
                <div className="mt-2 flex gap-2 flex-col sm:flex-row">
                  <ChargeItemDefinitionPicker
                    facilityId={facilityId}
                    value={
                      selectedDefinitionState.re_visit_charge_item_definition
                    }
                    onValueChange={(selectedDef) => {
                      if (!selectedDef) {
                        setSelectedDefinitionState({
                          ...selectedDefinitionState,
                          re_visit_charge_item_definition: undefined,
                        });
                        return;
                      }
                      setSelectedDefinitionState({
                        ...selectedDefinitionState,
                        re_visit_charge_item_definition:
                          selectedDef as ChargeItemDefinitionBase,
                      });
                    }}
                    placeholder={t("select_charge_item_definition")}
                    className="flex-1"
                    showCreateButton={true}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedDefinitionState.charge_item_definition ||
                !selectedDefinitionState.re_visit_charge_item_definition ||
                !reVisitDays
              }
              className="w-full sm:w-auto"
            >
              {t("save")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
