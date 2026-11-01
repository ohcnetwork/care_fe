import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { ChargeItemDefinitionDrawer } from "@/components/Common/ChargeItemDefinitionDrawer";
import {
  ResourceCategoryResourceType,
  ResourceCategorySubType,
} from "@/types/base/resourceCategory/resourceCategory";
import {
  ChargeItemDefinitionBase,
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import { ResourceDefinitionCategoryPicker } from "./ResourceDefinitionCategoryPicker";

interface ChargeItemDefinitionPickerProps {
  facilityId: string;
  value: ChargeItemDefinitionBase | ChargeItemDefinitionBase[] | undefined;
  onValueChange: (
    definitions:
      ChargeItemDefinitionBase | ChargeItemDefinitionBase[] | undefined,
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showCreateButton?: boolean;
  categorySlug?: string;
  allowMultiple?: boolean;
  resourceSubType?: ResourceCategorySubType;
}

export function ChargeItemDefinitionPicker({
  facilityId,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  className,
  showCreateButton = false,
  categorySlug,
  resourceSubType,
  allowMultiple = false,
}: ChargeItemDefinitionPickerProps) {
  const { t } = useTranslation();
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedDefinitions, setSelectedDefinitions] = useState<
    ChargeItemDefinitionBase[]
  >([]);

  useEffect(() => {
    if (value) {
      const defs = Array.isArray(value) ? value : [value];
      setSelectedDefinitions(defs);
    } else {
      setSelectedDefinitions([]);
    }
  }, [value]);

  const handleCreateSuccess = (
    chargeItemDefinition: ChargeItemDefinitionRead,
  ) => {
    if (allowMultiple) {
      const newDefinitions = [...selectedDefinitions, chargeItemDefinition];
      setSelectedDefinitions(newDefinitions);
      onValueChange(newDefinitions);
    } else {
      setSelectedDefinitions([chargeItemDefinition]);
      onValueChange(chargeItemDefinition);
    }
    setCreateDrawerOpen(false);
  };

  return (
    <>
      <div className="grow">
        <ResourceDefinitionCategoryPicker<ChargeItemDefinitionBase>
          facilityId={facilityId}
          value={allowMultiple ? selectedDefinitions : selectedDefinitions[0]}
          onValueChange={(selectedDef) => {
            if (!selectedDef) {
              setSelectedDefinitions([]);
              onValueChange(undefined);
              return;
            }
            if (allowMultiple) {
              const defs = Array.isArray(selectedDef)
                ? selectedDef
                : [selectedDef];
              setSelectedDefinitions(defs);
              onValueChange(defs);
            } else {
              const def = Array.isArray(selectedDef)
                ? selectedDef[0]
                : selectedDef;
              setSelectedDefinitions([def]);
              onValueChange(def);
            }
          }}
          allowMultiple={allowMultiple}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          resourceType={ResourceCategoryResourceType.charge_item_definition}
          listDefinitions={{
            queryFn: chargeItemDefinitionApi.listChargeItemDefinition,
            pathParams: { facilityId },
            queryParams: {
              status: ChargeItemDefinitionStatus.active,
            },
          }}
          resourceSubType={resourceSubType}
          translationBaseKey="charge_item_definition"
        />
      </div>

      {showCreateButton && (
        <div className="flex items-center gap-2 self-end w-full sm:w-auto">
          {showCreateButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateDrawerOpen(true)}
              className="h-9 px-2 w-full"
              disabled={disabled}
            >
              <Plus className="h-3 w-3 mr-1" />
              {t("create_charge_item_definition")}
            </Button>
          )}
        </div>
      )}

      <ChargeItemDefinitionDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        facilityId={facilityId}
        categorySlug={categorySlug}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
