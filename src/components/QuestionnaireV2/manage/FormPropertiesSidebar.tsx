import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { SegmentedRadioGroup } from "@/components/QuestionnaireV2/shared/SegmentedRadioGroup";

import {
  QUESTIONNAIRE_STATUSES,
  QuestionnaireRead,
  formatRevision,
} from "@/types/questionnaire/questionnaire";

import { DetailFormValues } from "./QuestionnaireDetailPage";

interface FormPropertiesSidebarProps {
  questionnaire: QuestionnaireRead;
  form: UseFormReturn<DetailFormValues>;
  /** When false, the status control renders disabled (read-only page). */
  canWrite: boolean;
  children?: React.ReactNode;
}

export function FormPropertiesSidebar({
  questionnaire,
  form,
  canWrite,
  children,
}: FormPropertiesSidebarProps) {
  const { t } = useTranslation();
  const status = form.watch("status");

  return (
    <div className="h-fit space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {t("form_properties")}
      </h3>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500">{t("status")}</p>
        <SegmentedRadioGroup
          value={status}
          onChange={(value) =>
            form.setValue("status", value, { shouldDirty: true })
          }
          options={QUESTIONNAIRE_STATUSES.map((value) => ({
            value,
            label: t(value),
          }))}
          disabled={!canWrite}
          aria-label={t("status")}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500">{t("subject_type")}</p>
        {/* subject_type is create-only on the backend — render the value
            statically instead of a fully greyed-out control that reads as
            broken or permission-denied. */}
        <Badge variant="secondary">{t(questionnaire.subject_type)}</Badge>
      </div>

      <hr className="border-dashed" />

      {children}

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500">{t("version")}</p>
        <Badge variant="secondary">
          {formatRevision(questionnaire.internal_revision)}
        </Badge>
      </div>
    </div>
  );
}
