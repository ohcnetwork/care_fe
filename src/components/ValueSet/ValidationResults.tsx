import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { FHIRValidationResult } from "@/types/valueSet/fhir";

interface ValidationResultsProps {
  validation: FHIRValidationResult;
}

export function ValidationResults({ validation }: ValidationResultsProps) {
  const { t } = useTranslation();

  if (validation.isValid && validation.warnings.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="size-4 text-green-600" />
        <AlertTitle className="text-green-900">
          {t("validation_passed")}
        </AlertTitle>
        <AlertDescription className="text-green-700">
          {t("fhir_valueset_valid")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{t("validation_errors")}</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-sm">
                  <Badge variant="destructive" className="mr-2">
                    {error.path}
                  </Badge>
                  {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="size-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">
            {t("validation_warnings")}
          </AlertTitle>
          <AlertDescription className="text-yellow-700">
            <ul className="mt-2 space-y-1 list-disc list-inside">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="text-sm">
                  <Badge
                    variant="outline"
                    className="mr-2 border-yellow-400 text-yellow-700"
                  >
                    {warning.path}
                  </Badge>
                  {warning.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
