/**
 * @file EntitySelectionSheet.tsx
 *
 * This component provides a consistent mobile-friendly Sheet UI for selecting and configuring
 * medical entities like medications, allergies, symptoms, and diagnoses. It handles the common
 * pattern of:
 *
 * 1. Displaying a search interface for finding entities using ValueSetSelect
 * 2. Allowing users to select an entity and configure its details
 * 3. Providing a Sheet UI with a back button and a confirmation button
 * 4. Supporting customization through props for different entity types and behaviors
 *
 * The component is reusable and can be adapted for various entity types by passing
 * the appropriate props.
 *
 */
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Code } from "@/types/base/code/code";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";

import MedicationValueSetSelect from "./MedicationValueSetSelect";
import ValueSetSelect from "./ValueSetSelect";

interface EntitySelectionSheetProps {
  /**
   * Whether the Sheet is open
   */
  open: boolean;
  /**
   * Callback when the open state changes
   * @param open The new open state
   */
  onOpenChange: (open: boolean) => void;
  /**
   * The system to use for the ValueSet lookup
   * Examples: "system-medication", "system-condition-code", "system-allergy-code"
   */
  system: string;
  /**
   * The entity type being selected (for display and translation)
   * This is used to build translation keys like "add_another_{entityType}" or "select_{entityType}"
   * Examples: "medication", "diagnosis", "symptom", "allergy"
   */
  entityType: string;
  /**
   * Optional postfix to append to search queries
   * For example, " clinical drug" for medications
   */
  searchPostFix?: string;
  /**
   * Whether the form is disabled
   * When true, prevents interaction with the form elements
   */
  disabled?: boolean;
  /**
   * Callback when an entity is selected from the ValueSet
   * This is typically used to handle the entity selection data
   * @param code The selected code
   */
  onEntitySelected: (code: Code) => void;
  /**
   * Callback when a product entity is selected from the ValueSet
   * @param product The selected product
   */
  onProductEntitySelected?: (product: ProductKnowledgeBase) => void;
  /**
   * Content to display when an entity is selected (the form for entity details)
   * This is provided as children for better React composition
   */
  children: ReactNode;
  /**
   * Optional placeholder text for the ValueSetSelect
   */
  placeholder?: string;
  /**
   * Function to handle confirming the current entity selection
   * This is called when the user clicks the "Add" button
   */
  onConfirm: () => void;
  /**
   * If `true`, renders the `MedicationValueSetSelect`.
   * Defaults to `false`.
   */
  enableProduct?: boolean;
}

export function EntitySelectionSheet({
  open,
  onOpenChange,
  system,
  entityType,
  searchPostFix = "",
  disabled = false,
  onEntitySelected,
  onProductEntitySelected,
  onConfirm,
  children,
  placeholder,
  enableProduct = false,
}: EntitySelectionSheetProps) {
  const { t } = useTranslation();
  const [selectedEntity, setSelectedEntity] = useState<Code | null>(null);

  const handleSelect = (code: Code) => {
    setSelectedEntity(code);
    onEntitySelected(code);
  };

  const handleProductSelect = (product: ProductKnowledgeBase) => {
    const code: Code = {
      display: product.name,
      code: String(product.id),
      system: "product",
    };
    setSelectedEntity(code);
    onProductEntitySelected?.(product);
  };

  const handleBack = () => {
    if (selectedEntity) {
      setSelectedEntity(null);
    }
  };

  const handleConfirm = () => {
    onConfirm();
    setSelectedEntity(null);
  };

  return (
    <>
      {enableProduct ? (
        <MedicationValueSetSelect
          onSelect={handleSelect}
          onProductSelect={handleProductSelect}
          disabled={disabled}
          placeholder={placeholder || t(`select_${entityType}`)}
          title={t(`select_${entityType}`)}
          mobileTrigger={
            <Button
              variant="outline"
              role="combobox"
              className="w-full border border-primary rounded-md px-2 text-primary-700"
              disabled={disabled}
            >
              <CareIcon icon="l-plus" className="mr-2" />
              <span className="font-semibold">{placeholder}</span>
            </Button>
          }
        />
      ) : (
        <ValueSetSelect
          system={system}
          placeholder={placeholder}
          onSelect={handleSelect}
          disabled={disabled}
          searchPostFix={searchPostFix}
          title={t(`select_${entityType}`)}
          mobileTrigger={
            <Button
              variant="outline"
              role="combobox"
              className="w-full border border-primary rounded-md px-2 text-primary-700"
              disabled={disabled}
            >
              <CareIcon icon="l-plus" className="mr-2" />
              <span className="font-semibold">{placeholder}</span>
            </Button>
          }
        />
      )}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="px-0 pt-2 pb-0 rounded-t-3xl sm:max-w-md sm:mx-auto [&>button:first-child]:hidden"
          side="bottom"
        >
          {selectedEntity ? (
            <div className="flex flex-col h-auto min-h-[50vh] max-h-[80vh] sm:max-h-[70vh] md:max-h-[60vh]">
              <div className="flex justify-between w-full p-2">
                <Button
                  variant="link"
                  onClick={handleBack}
                  className="underline text-sm"
                >
                  {t("back")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  className="text-sm"
                >
                  {t("done")}
                </Button>
              </div>
              <SheetHeader className="py-2 px-2 border-b border-gray-200">
                <SheetTitle className="text-center text-base font-semibold">
                  {selectedEntity.display}
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto pb-safe">{children}</div>
            </div>
          ) : enableProduct ? (
            <MedicationValueSetSelect
              onSelect={handleSelect}
              onProductSelect={handleProductSelect}
              disabled={disabled}
              hideTrigger={true}
              title={t(`select_${entityType}`)}
            />
          ) : (
            <ValueSetSelect
              system={system}
              placeholder={placeholder}
              onSelect={handleSelect}
              disabled={disabled}
              hideTrigger={true}
              searchPostFix={searchPostFix}
              title={t(`select_${entityType}`)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
