import { useTranslation } from "react-i18next";

import {
  Drawer,
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
  onSuccess?: (chargeItemDefinition: ChargeItemDefinitionRead) => void;
}

export function ChargeItemDefinitionDrawer({
  open,
  onOpenChange,
  facilityId,
  categorySlug,
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
      <DrawerContent height="fixed">
        <DrawerHeader showCloseButton className="p-3">
          <DrawerTitle>{t("create_charge_item_definition")}</DrawerTitle>
          <DrawerDescription>
            {t("create_charge_item_definition_description")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full px-4 py-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <ChargeItemDefinitionForm
                facilityId={facilityId}
                categorySlug={categorySlug}
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
