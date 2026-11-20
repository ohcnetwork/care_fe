import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ClinicalListErrorProps {
  isFetching: boolean;
  onRetry: () => unknown;
}

export function ClinicalListError({
  isFetching,
  onRetry,
}: ClinicalListErrorProps) {
  const { t } = useTranslation();

  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertDescription className="space-y-2">
        <p>{t("clinical_load_error")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => onRetry()}
        >
          {t("try_again")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
