import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonetaryDisplay } from "@/components/ui/monetary-display";

import Loading from "@/components/Common/Loading";

import mutate from "@/Utils/request/mutate";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { MonetaryComponentRead } from "@/types/base/monetaryComponent/monetaryComponent";
import { FacilityData } from "@/types/facility/facility";
import facilityApi from "@/types/facility/facilityApi";

import { CreateDiscountMonetaryComponentPopover } from "./discount/CreateDiscountMonetaryComponentPopover";
import { EditDiscountMonetaryPopover } from "./discount/EditDiscountMonetaryPopover";

export function DiscountComponentSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [componentToDelete, setComponentToDelete] = useState<number>();

  const facility = useCurrentFacility();

  const { mutate: updateMonetaryComponents, isPending: _isPending } =
    useMutation({
      mutationFn: mutate(facilityApi.updateMonetaryComponents, {
        pathParams: { facilityId: facility?.id ?? "" },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["facility", facility?.id] });
        toast.success(t("billing.components_updated"));
      },
    });

  if (!facility) {
    return <Loading />;
  }

  const handleSaveComponent = (
    data: MonetaryComponentRead,
    replaceIndex?: number,
  ) => {
    const discountComponents = [...facility.discount_monetary_components];
    const discountCodes = [...facility.discount_codes];
    const allCodes = [
      ...facility.instance_discount_codes,
      ...facility.discount_codes,
    ];

    // Replace existing component if index is provided (edit workflow)
    if (replaceIndex != null) {
      discountComponents[replaceIndex] = data;
    } else {
      discountComponents.push(data);
    }

    const discountCode = data.code;
    if (
      discountCode &&
      !allCodes.find((code) => code.code === discountCode.code)
    ) {
      discountCodes.push(discountCode);
    }

    updateMonetaryComponents({
      discount_monetary_components: discountComponents,
      discount_codes: discountCodes,
    });
  };

  const confirmDeleteComponent = () => {
    if (componentToDelete == null) return;

    const updatedComponents = facility.discount_monetary_components.filter(
      (_, index) => index !== componentToDelete,
    );

    updateMonetaryComponents({
      discount_monetary_components: updatedComponents,
      discount_codes: facility.discount_codes,
    });

    setComponentToDelete(undefined);
  };

  return (
    <>
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("billing.discount_components")}</CardTitle>
            <CreateDiscountMonetaryComponentPopover
              onSubmit={handleSaveComponent}
              systemCodes={facility.instance_discount_codes}
              facilityCodes={facility.discount_codes}
            />
          </CardHeader>
          <CardContent>
            <DiscountComponentGrid
              components={facility.discount_monetary_components || []}
              canEdit={true}
              onEdit={handleSaveComponent}
              onDelete={setComponentToDelete}
              facility={facility}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("billing.instance_discount_components")}</CardTitle>
            <p className="text-sm text-gray-500">
              {t("billing.instance_components_description")}
            </p>
          </CardHeader>
          <CardContent>
            <DiscountComponentGrid
              components={facility.instance_discount_monetary_components || []}
              canEdit={false}
              onEdit={() => {}}
              onDelete={() => {}}
              facility={facility}
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={componentToDelete !== undefined}
        onOpenChange={(open) => !open && setComponentToDelete(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("billing.delete_component")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("billing.delete_component_confirmation", {
                title:
                  componentToDelete !== undefined
                    ? facility.discount_monetary_components[componentToDelete]
                        ?.title
                    : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComponent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const DiscountComponentGrid = ({
  components,
  canEdit = false,
  onEdit,
  onDelete,
  facility,
}: {
  components: MonetaryComponentRead[];
  canEdit?: boolean;
  onEdit?: (data: MonetaryComponentRead, index: number) => void;
  onDelete?: (index: number) => void;
  // TODO: Skip passing facility so that discount codes can be obtained from current facility context
  facility: FacilityData;
}) => {
  const { t } = useTranslation();

  if (components.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("billing.no_components")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {components.map((component, index) => (
        <DiscountCouponCard
          key={`${component.title}-${index}`}
          component={component}
          index={index}
          canEdit={canEdit}
          onEdit={onEdit}
          onDelete={onDelete}
          facility={facility}
        />
      ))}
    </div>
  );
};

const DiscountCouponCard = ({
  component,
  index,
  canEdit,
  onEdit,
  onDelete,
  facility,
}: {
  component: MonetaryComponentRead;
  index: number;
  canEdit: boolean;
  onEdit?: (data: MonetaryComponentRead, index: number) => void;
  onDelete?: (index: number) => void;
  facility: FacilityData;
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative rounded-lg p-4 shadow bg-gradient-to-r from-gray-50/40 to-gray-100/40 overflow-hidden border-2 border-dashed border-gray-300/70">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-16 h-16 rounded-full -translate-x-1/2 -translate-y-1/2 bg-white/10"></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full translate-x-1/3 translate-y-1/3 bg-white/10"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium truncate" title={component.title}>
            {component.title}
          </h3>
          {canEdit && (
            <div className="flex space-x-1">
              {onEdit && (
                <EditDiscountMonetaryPopover
                  component={component}
                  onSubmit={(data) => onEdit(data, index)}
                  systemCodes={facility.instance_discount_codes}
                  facilityCodes={facility.discount_codes}
                />
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(index)}
                >
                  <TrashIcon className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              {t("billing.value")}
            </span>
            <span className="text-2xl font-bold">
              <MonetaryDisplay {...component} fallback="-" />
            </span>
          </div>

          {component.code && (
            <div className="flex flex-col mt-2">
              <span className="text-sm text-muted-foreground">
                {t("billing.component_code")}
              </span>
              <span className="text-sm font-mono bg-white/50 rounded px-2 py-1 inline-block">
                {component.code.code}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {component.code.display}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
