import { useWatch, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { ValueSetPreview } from "./ValueSetPreview";
import type { ValueSetFormData } from "./valueSetFormTypes";

interface ValueSetFormPreviewProps {
  control: Control<ValueSetFormData>;
  hasParent: boolean;
}

/** Preview needs the complete live payload; keep that subscription local so
 * editing a concept does not rerender the entire authoring workspace. */
export function ValueSetFormPreview({
  control,
  hasParent,
}: ValueSetFormPreviewProps) {
  const { t } = useTranslation();
  // Defaults populate every field; useWatch's DeepPartial is broader than
  // the runtime form shape.
  const values = useWatch({ control }) as ValueSetFormData;
  return (
    <ValueSetPreview
      valueset={values}
      definitionNotice={
        hasParent && !values.disable_composition
          ? t("valueset_parent_preview_hint")
          : undefined
      }
      trigger={
        <Button
          type="button"
          variant="ghost"
          aria-label={t("valueset_preview")}
          className="px-3 text-gray-600"
        >
          {t("preview")}
        </Button>
      }
    />
  );
}
