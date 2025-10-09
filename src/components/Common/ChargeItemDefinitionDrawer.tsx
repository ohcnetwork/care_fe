import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { ChargeItemDefinitionForm } from "@/pages/Facility/settings/chargeItemDefinitions/ChargeItemDefinitionForm";
import { ChargeItemDefinitionRead } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";

interface ChargeItemDefinitionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  categorySlug?: string;
  initialData?: ChargeItemDefinitionRead;
  onSuccess?: (chargeItemDefinition: ChargeItemDefinitionRead) => void;
}

export function ChargeItemDefinitionDrawer({
  open,
  onOpenChange,
  facilityId,
  categorySlug,
  initialData,
  onSuccess,
}: ChargeItemDefinitionDrawerProps) {
  const { t } = useTranslation();

  function handleCancel() {
    onOpenChange(false);
  }

  function handleCreateSuccess(chargeItemDefinition: ChargeItemDefinitionRead) {
    onSuccess?.(chargeItemDefinition);
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col px-8">
        <DrawerHeader className="relative flex-shrink-0">
          <div className="max-w-4xl mx-auto w-full relative">
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
            <DrawerTitle className="text-left">
              {initialData
                ? t("copy_charge_item_definition")
                : t("create_charge_item_definition")}
            </DrawerTitle>
            <DrawerDescription className="text-left">
              {initialData
                ? t("copy_charge_item_definition_description")
                : t("create_charge_item_definition_description")}
            </DrawerDescription>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full px-4 py-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <ChargeItemDefinitionForm
                facilityId={facilityId}
                categorySlug={initialData ? undefined : categorySlug}
                initialData={initialData}
                minimal={true}
                onSuccess={handleCreateSuccess}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
