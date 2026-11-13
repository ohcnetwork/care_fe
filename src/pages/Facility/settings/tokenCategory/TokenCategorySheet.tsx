import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenCategoryRead } from "@/types/tokens/tokenCategory/tokenCategory";

import { TokenCategoryForm } from "./TokenCategoryForm";

export type TokenCategorySheetState =
  | { mode: "create"; resourceType: SchedulableResourceType }
  | { mode: "edit"; tokenCategory: TokenCategoryRead };

interface Props {
  facilityId: string;
  state: TokenCategorySheetState | null;
  onClose: () => void;
  onSaved?: (tokenCategory: TokenCategoryRead) => void;
}

export function TokenCategorySheet({
  facilityId,
  state,
  onClose,
  onSaved,
}: Props) {
  const { t } = useTranslation();

  // Keep rendering the last opened state while the sheet animates closed.
  const [shown, setShown] = useState(state);
  if (state && state !== shown) setShown(state);

  const resourceType =
    shown?.mode === "edit"
      ? shown.tokenCategory.resource_type
      : shown?.resourceType;

  return (
    <Sheet
      open={!!state}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="overflow-hidden">
        {shown && resourceType && (
          <>
            <SheetHeader>
              <SheetTitle className="text-foreground">
                {t(
                  shown.mode === "edit"
                    ? "edit_token_category"
                    : "create_token_category",
                )}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground">
                {shown.mode === "edit"
                  ? shown.tokenCategory.name
                  : t("token_category_create_for_resource_type", {
                      resource_type: t(resourceType),
                    })}
              </SheetDescription>
            </SheetHeader>
            <TokenCategoryForm
              key={
                shown.mode === "edit"
                  ? shown.tokenCategory.id
                  : `new-${resourceType}`
              }
              facilityId={facilityId}
              resourceType={resourceType}
              tokenCategory={
                shown.mode === "edit" ? shown.tokenCategory : undefined
              }
              onSaved={(saved) => {
                onClose();
                onSaved?.(saved);
              }}
              onCancel={onClose}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
