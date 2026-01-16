import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { MonetaryComponentSelector } from "@/components/Billing/MonetaryComponentSelector";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import {
  ConditionForm,
  getConditionDiscriminatorValue,
} from "@/types/base/condition/condition";
import {
  isSameComponentCode,
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import resourceCategoryApi from "@/types/base/resourceCategory/resourceCategoryApi";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import facilityApi from "@/types/facility/facilityApi";
import { round } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface CategoryMonetaryComponentsSheetProps {
  facilityId: string;
  categorySlug: string;
  categoryTitle: string;
  configuredMonetaryComponents?: MonetaryComponent[];
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryMonetaryComponentsSheet({
  facilityId,
  categorySlug,
  categoryTitle,
  configuredMonetaryComponents,
  isOpen,
  onClose,
}: CategoryMonetaryComponentsSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedDiscounts, setSelectedDiscounts] = useState<
    MonetaryComponent[]
  >([]);
  const [selectedTaxes, setSelectedTaxes] = useState<MonetaryComponent[]>([]);

  const { data: facilityData, isLoading } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId },
    }),
    enabled: isOpen,
  });

  const { data: availableMetrics = [] } = useQuery({
    queryKey: ["metrics"],
    queryFn: query(chargeItemDefinitionApi.listMetrics),
    enabled: isOpen,
  });

  const handleComponentConditionsChange = (
    component: MonetaryComponent,
    conditions: ConditionForm[],
  ) => {
    const componentIndex = selectedDiscounts.findIndex((c) =>
      isSameComponentCode(c, component),
    );

    if (componentIndex === -1) return;

    const newComponents = [...selectedDiscounts];
    newComponents[componentIndex] = {
      ...newComponents[componentIndex],
      conditions: conditions?.map((condition) => ({
        ...condition,
        _conditionType: getConditionDiscriminatorValue(
          condition.metric,
          condition.operation,
        ),
      })),
    };

    setSelectedDiscounts(newComponents);
  };

  useEffect(() => {
    if (isOpen && configuredMonetaryComponents) {
      const discounts = configuredMonetaryComponents
        .filter(
          (c) => c.monetary_component_type === MonetaryComponentType.discount,
        )
        .map((component) => ({
          ...component,
          amount: component.amount ? round(component.amount) : component.amount,
          factor: component.factor ? round(component.factor) : component.factor,
        }));
      const taxes = configuredMonetaryComponents
        .filter((c) => c.monetary_component_type === MonetaryComponentType.tax)
        .map((component) => ({
          ...component,
          factor: component.factor ? round(component.factor) : component.factor,
        }));
      setSelectedDiscounts(discounts);
      setSelectedTaxes(taxes);
    } else if (isOpen) {
      setSelectedDiscounts([]);
      setSelectedTaxes([]);
    }
  }, [isOpen, configuredMonetaryComponents]);

  const setMonetaryComponentsMutation = useMutation({
    mutationFn: mutate(resourceCategoryApi.setMonetaryComponents, {
      pathParams: { facilityId, slug: categorySlug },
    }),
    onSuccess: () => {
      toast.success(t("monetary_components_saved_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["resourceCategories"],
      });
      onClose();
    },
  });

  const handleSubmit = () => {
    const allComponents = [...selectedDiscounts, ...selectedTaxes];
    setMonetaryComponentsMutation.mutate(allComponents);
  };

  const availableDiscounts = facilityData
    ? [
        ...facilityData.discount_monetary_components,
        ...facilityData.instance_discount_monetary_components,
      ].map((component) => ({
        ...component,
        amount:
          component?.amount != null
            ? round(component.amount)
            : component.amount,
        factor:
          component?.factor != null
            ? round(component.factor)
            : component.factor,
      }))
    : [];

  const availableTaxes = facilityData
    ? [...facilityData.instance_tax_monetary_components].map((component) => ({
        ...component,
        factor:
          component?.factor != null
            ? round(component.factor)
            : component.factor,
      }))
    : [];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("set_monetary_components")}</SheetTitle>
          <SheetDescription>
            {t("set_monetary_components_description", {
              category: categoryTitle,
            })}
          </SheetDescription>
        </SheetHeader>

        {isLoading || !facilityData ? (
          <div className="mt-6">
            <CardListSkeleton count={3} />
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            <MonetaryComponentSelector
              title={t("taxes")}
              components={availableTaxes}
              selectedComponents={selectedTaxes}
              onSelectionChange={setSelectedTaxes}
              type={MonetaryComponentType.tax}
            />

            <MonetaryComponentSelector
              title={t("discounts")}
              components={availableDiscounts}
              selectedComponents={selectedDiscounts}
              onSelectionChange={setSelectedDiscounts}
              onConditionsChange={handleComponentConditionsChange}
              type={MonetaryComponentType.discount}
              showConditionsEditor
              availableMetrics={availableMetrics}
            />

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                aria-label={t("cancel")}
                onClick={onClose}
              >
                {t("cancel")}
                <ShortcutBadge actionId="cancel-action" />
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={setMonetaryComponentsMutation.isPending}
                aria-label={t("save")}
              >
                {setMonetaryComponentsMutation.isPending
                  ? t("saving")
                  : t("save")}
                <ShortcutBadge actionId="submit-action" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
