import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import type { ServerValidationError } from "./submit/mapBatchErrors";

/** Page-level surface for batch sub-request failures (per-question
 *  failures additionally land on their blocks via errorsAtom). */
export function ServerErrorsPanel({
  errors,
}: {
  errors: ServerValidationError[];
}) {
  const { t } = useTranslation();
  if (errors.length === 0) return null;
  return (
    <Alert variant="destructive" className="mx-auto mb-4 w-full max-w-3xl">
      <AlertTitle>{t("questionnaire_submission_failed")}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc space-y-1 pl-4">
          {errors.map((error, index) => (
            <li key={`${error.reference_id}-${index}`}>{error.message}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
