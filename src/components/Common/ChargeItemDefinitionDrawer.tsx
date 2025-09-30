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
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="relative px-8 flex-shrink-0">
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
          <div className="max-w-8xl mx-auto w-full">
            <DrawerTitle className="text-left">
              Create Charge Item Definition
            </DrawerTitle>
            <DrawerDescription className="text-left">
              Create a new charge item definition for billing purposes.
            </DrawerDescription>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-8">
          <div className="max-w-8xl mx-auto w-full py-4">
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
