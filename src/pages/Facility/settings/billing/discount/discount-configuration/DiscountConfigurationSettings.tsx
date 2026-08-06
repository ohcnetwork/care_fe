import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import mutate from "@/Utils/request/mutate";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  DiscountApplicabilityOrder,
  DiscountConfiguration,
} from "@/types/base/monetaryComponent/monetaryComponent";
import facilityApi from "@/types/facility/facilityApi";

export function DiscountConfigurationSettings() {
  const { t } = useTranslation();
  const { facility, facilityId } = useCurrentFacility();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [maxApplicable, setMaxApplicable] = useState<number>(0);
  const [applicabilityOrder, setApplicabilityOrder] =
    useState<DiscountApplicabilityOrder>(DiscountApplicabilityOrder.total_desc);

  const {
    mutate: saveConfiguration,
    isPending,
    reset,
  } = useMutation({
    mutationFn: mutate(facilityApi.setMonetaryComponents, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", facilityId] });
      toast.success(t("discount_configuration_saved"));
      setEditing(false);
    },
  });

  if (!facility) {
    return <Loading />;
  }

  const config = facility.discount_configuration;

  const startEditing = () => {
    setMaxApplicable(config?.max_applicable ?? 0);
    setApplicabilityOrder(
      config?.applicability_order ?? DiscountApplicabilityOrder.total_desc,
    );
    setEditing(true);
    reset();
  };

  const handleSave = () => {
    const newConfig: DiscountConfiguration = {
      max_applicable: maxApplicable,
      applicability_order: applicabilityOrder,
    };

    saveConfiguration({
      discount_codes: facility.discount_codes,
      discount_monetary_components: facility.discount_monetary_components,
      discount_configuration: newConfig,
    });
  };

  const handleCancel = () => {
    setEditing(false);
    reset();
  };

  return (
    <Page title={t("discount_configuration")}>
      <section className="w-full max-w-5xl mx-auto mt-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("discount_configuration")}
            </h2>
            <p className="text-gray-500 text-sm">
              {t("discount_configuration_description")}
            </p>
          </div>

          {editing ? (
            <div className="flex flex-col gap-6 w-full max-w-md">
              <div className="flex flex-col gap-2">
                <Label htmlFor="max-applicable">
                  {t("max_applicable_discounts")}
                </Label>
                <Input
                  id="max-applicable"
                  type="number"
                  min={0}
                  value={maxApplicable}
                  onChange={(e) =>
                    setMaxApplicable(parseInt(e.target.value) || 0)
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  {t("max_applicable_discounts_description")}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="applicability-order">
                  {t("applicability_order")}
                </Label>
                <Select
                  value={applicabilityOrder}
                  onValueChange={(value) =>
                    setApplicabilityOrder(value as DiscountApplicabilityOrder)
                  }
                >
                  <SelectTrigger id="applicability-order" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DiscountApplicabilityOrder.total_desc}>
                      {t("applicability_order_total_desc")}
                    </SelectItem>
                    <SelectItem value={DiscountApplicabilityOrder.total_asc}>
                      {t("applicability_order_total_asc")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {t("applicability_order_description")}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full">
                <Button
                  onClick={handleSave}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? t("saving") : t("save")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full sm:w-auto"
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full max-w-md">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">
                  {t("max_applicable_discounts")}
                </span>
                <span className="font-mono bg-gray-100 px-3 py-2 rounded text-base border border-gray-200 text-gray-800 block">
                  {config?.max_applicable ?? (
                    <span className="text-gray-400">-</span>
                  )}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">
                  {t("applicability_order")}
                </span>
                <span className="font-mono bg-gray-100 px-3 py-2 rounded text-base border border-gray-200 text-gray-800 block">
                  {config?.applicability_order ? (
                    t(`applicability_order_${config.applicability_order}`)
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </span>
              </div>

              <Button
                variant="outline"
                onClick={startEditing}
                className="w-full sm:w-auto mt-2"
              >
                {t("edit")}
              </Button>
            </div>
          )}
        </div>
      </section>
    </Page>
  );
}
