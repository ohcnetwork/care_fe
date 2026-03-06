import { Download } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ValueSetRead } from "@/types/valueSet/valueSet";
import {
  downloadFHIRValueSet,
  toFHIRValueSet,
} from "@/Utils/fhir/valueSetMapper";
import { validateFHIRValueSet } from "@/Utils/fhir/fhirValidator";

interface ExportValueSetButtonProps {
  valueSet: ValueSetRead;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ExportValueSetButton({
  valueSet,
  variant = "outline",
  size = "sm",
  className,
}: ExportValueSetButtonProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Convert to FHIR format
      const fhirValueSet = toFHIRValueSet(valueSet);

      // Validate the FHIR output
      const validation = validateFHIRValueSet(fhirValueSet);
      if (!validation.isValid) {
        console.error("FHIR validation errors:", validation.errors);
        toast.error(t("export_validation_failed"));
        return;
      }

      // Download the file
      downloadFHIRValueSet(fhirValueSet);
      toast.success(t("valueset_exported_successfully"));
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("export_failed"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
      className={className}
    >
      <Download className="size-4 mr-2" />
      {isExporting ? t("exporting") : t("export_fhir")}
    </Button>
  );
}
