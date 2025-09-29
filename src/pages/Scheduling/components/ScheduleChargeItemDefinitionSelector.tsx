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

import { ChargeItemDefinitionForm } from "@/pages/Facility/settings/chargeItemDefinitions/ChargeItemDefinitionForm";
import { ResourceCategorySubType } from "@/types/base/resourceCategory/resourceCategory";
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
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [selectedCSlug, setSelectedCSlug] = useState<string | undefined>(
    scheduleTemplate.charge_item_definition?.slug,
  );
  const [reVisitDays, setReVisitDays] = useState(
    scheduleTemplate.revisit_allowed_days,
  );
  const [reVisitCSlug, setReVisitCSlug] = useState<string | undefined>(
    scheduleTemplate.revisit_charge_item_definition?.slug,
  );

  const handleSubmit = () => {
    onChange({
      charge_item_definition_slug: selectedCSlug!,
      re_visit_allowed_days: reVisitDays,
      re_visit_charge_item_definition_slug: reVisitCSlug || null,
    });
    setIsOpen(false);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset to original values when closing
      setSelectedCSlug(scheduleTemplate.charge_item_definition?.slug);
      setReVisitCSlug(scheduleTemplate.revisit_charge_item_definition?.slug);
      setReVisitDays(scheduleTemplate.revisit_allowed_days);
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
                <div className="mt-2 flex gap-2 flex-row">
                  <ChargeItemDefinitionPicker
                    facilityId={facilityId}
                    resourceSubType={ResourceCategorySubType.practitioner}
                    value={selectedCSlug}
                    onValueChange={setSelectedCSlug}
                    placeholder={t("select_charge_item_definition")}
                    className="flex-1"
                  />
                  <Sheet
                    open={isCreateSheetOpen}
                    onOpenChange={setIsCreateSheetOpen}
                  >
                    <SheetTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        {t("create_new")}
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[90%] sm:max-w-2xl flex min-w-full flex-col bg-gray-100 sm:min-w-fit overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>
                          {t("create_charge_item_definition")}
                        </SheetTitle>
                        <SheetDescription>
                          {t("create_charge_item_definition_description")}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <ChargeItemDefinitionForm
                          facilityId={facilityId}
                          onSuccess={() => setIsCreateSheetOpen(false)}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
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
                <div className="mt-2 flex gap-2 flex-row">
                  <ChargeItemDefinitionPicker
                    facilityId={facilityId}
                    resourceSubType={ResourceCategorySubType.practitioner}
                    value={reVisitCSlug}
                    onValueChange={setReVisitCSlug}
                    placeholder={t("select_charge_item_definition")}
                    className="flex-1"
                  />
                  <Sheet
                    open={isCreateSheetOpen}
                    onOpenChange={setIsCreateSheetOpen}
                  >
                    <SheetTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        {t("create_new")}
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[90%] sm:max-w-2xl flex min-w-full flex-col bg-gray-100 sm:min-w-fit overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>
                          {t("create_charge_item_definition")}
                        </SheetTitle>
                        <SheetDescription>
                          {t("create_charge_item_definition_description")}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <ChargeItemDefinitionForm
                          facilityId={facilityId}
                          onSuccess={() => setIsCreateSheetOpen(false)}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
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
              disabled={!selectedCSlug || !reVisitDays}
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
