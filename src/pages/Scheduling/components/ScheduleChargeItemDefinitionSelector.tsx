import { useQuery, useQueryClient } from "@tanstack/react-query";
import { WalletMinimal } from "lucide-react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
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

import { ChargeItemDefinitionForm } from "@/pages/Facility/settings/chargeItemDefinitions/ChargeItemDefinitionForm";
import { ChargeItemDefinitionStatus } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import { ScheduleTemplate } from "@/types/scheduling/schedule";
import query from "@/Utils/request/query";
import { mergeAutocompleteOptions } from "@/Utils/utils";
import { useState } from "react";

interface ScheduleChargeItemDefinitionSelectorProps {
  facilityId: string;
  scheduleTemplate: ScheduleTemplate;
  onChange: (value: {
    charge_item_definition_slug: string;
    re_visit_allowed_days: number;
    re_visit_charge_item_definition_slug?: string;
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
  const [consulationSearch, setSearch] = useState("");
  const queryClient = useQueryClient();
  const [selectedCSlug, setSelectedCSlug] = useState(
    scheduleTemplate.charge_item_definition?.slug,
  );
  const [reVisitDays, setReVisitDays] = useState(
    scheduleTemplate.revisit_allowed_days,
  );
  const [reVisitCSlug, setReVisitCSlug] = useState<string>(
    scheduleTemplate.revisit_charge_item_definition?.slug,
  );
  const [reVisitSearch, setReVisitSearch] = useState("");

  const {
    data: consultationChargeItemDefinitions,
    isLoading: isConsultationLoading,
  } = useQuery({
    queryKey: ["chargeItemDefinitions", facilityId, consulationSearch],
    queryFn: query.debounced(chargeItemDefinitionApi.listChargeItemDefinition, {
      pathParams: { facilityId },
      queryParams: {
        limit: 100,
        title: consulationSearch,
        status: ChargeItemDefinitionStatus.active,
      },
    }),
  });

  const { data: revisitChargeItemDefinitions, isLoading: isRevisitLoading } =
    useQuery({
      queryKey: ["chargeItemDefinitions", facilityId, reVisitSearch],
      queryFn: query.debounced(
        chargeItemDefinitionApi.listChargeItemDefinition,
        {
          pathParams: { facilityId },
          queryParams: {
            limit: 100,
            title: reVisitSearch,
            status: ChargeItemDefinitionStatus.active,
          },
        },
      ),
    });

  const handleSubmit = () => {
    onChange({
      charge_item_definition_slug: selectedCSlug,
      re_visit_allowed_days: reVisitDays,
      re_visit_charge_item_definition_slug: reVisitCSlug,
    });
    setIsOpen(false);
  };
  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearch("");
      setReVisitSearch("");
      setSelectedCSlug(scheduleTemplate.charge_item_definition?.slug);
      setReVisitCSlug(scheduleTemplate.revisit_charge_item_definition?.slug);
      setReVisitDays(scheduleTemplate.revisit_allowed_days);
      queryClient.invalidateQueries({
        queryKey: ["chargeItemDefinitions", facilityId, consulationSearch],
      });
      queryClient.invalidateQueries({
        queryKey: ["chargeItemDefinitions", facilityId, reVisitSearch],
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
                <div className="mt-2 flex gap-2 flex-row">
                  <Autocomplete
                    options={mergeAutocompleteOptions(
                      consultationChargeItemDefinitions?.results.map((cid) => ({
                        label: cid.title,
                        value: cid.slug,
                      })) || [],
                      selectedCSlug
                        ? {
                            label:
                              consultationChargeItemDefinitions?.results.find(
                                (cid) => cid.slug === selectedCSlug,
                              )?.title || "",
                            value: selectedCSlug,
                          }
                        : undefined,
                    )}
                    value={selectedCSlug || ""}
                    onChange={setSelectedCSlug}
                    onSearch={setSearch}
                    placeholder={t("select_charge_item_definition")}
                    isLoading={isConsultationLoading}
                    noOptionsMessage={t("no_charge_item_definitions_found")}
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
                  <Autocomplete
                    options={mergeAutocompleteOptions(
                      revisitChargeItemDefinitions?.results.map((cid) => ({
                        label: cid.title,
                        value: cid.slug,
                      })) || [],
                      reVisitCSlug
                        ? {
                            label:
                              revisitChargeItemDefinitions?.results.find(
                                (cid) => cid.slug === reVisitCSlug,
                              )?.title || "",
                            value: reVisitCSlug,
                          }
                        : undefined,
                    )}
                    value={reVisitCSlug || ""}
                    onChange={setReVisitCSlug}
                    onSearch={setReVisitSearch}
                    placeholder={t("select_charge_item_definition")}
                    isLoading={isRevisitLoading}
                    noOptionsMessage={t("no_charge_item_definitions_found")}
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
