import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { SegmentedRadioGroup } from "@/components/QuestionnaireV2/shared/SegmentedRadioGroup";

import {
  QuestionStatus,
  QuestionnaireRead,
  QuestionnaireScope,
  SUBJECT_TYPES_FOR_CONTEXT,
} from "@/types/questionnaire/questionnaire";

import { DetailFormValues } from "./QuestionnaireDetailPage";

const STATUS_OPTIONS: QuestionStatus[] = ["active", "draft", "retired"];

interface FormPropertiesSidebarProps {
  scope: QuestionnaireScope;
  questionnaire: QuestionnaireRead;
  form: UseFormReturn<DetailFormValues>;
  children?: React.ReactNode;
}

export function FormPropertiesSidebar({
  scope,
  questionnaire,
  form,
  children,
}: FormPropertiesSidebarProps) {
  const { t } = useTranslation();
  const status = form.watch("status");

  return (
    <div className="h-fit space-y-4 rounded-lg border border-gray-200 bg-white p-4">
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
          options={STATUS_OPTIONS.map((value) => ({
            value,
            label: t(value),
          }))}
          aria-label={t("status")}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500">{t("subject_type")}</p>
        <SegmentedRadioGroup
          value={questionnaire.subject_type}
          onChange={() => {
            // subject_type is create-only on the backend; chips are read-only.
          }}
          options={SUBJECT_TYPES_FOR_CONTEXT[scope.authContext].map(
            (value) => ({
              value,
              label: t(value),
            }),
          )}
          disabled
          aria-label={t("subject_type")}
        />
      </div>

      <hr className="border-dashed" />

      {children}

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500">{t("version")}</p>
        {/* eslint-disable-next-line i18next/no-literal-string -- version notation ("v1"), not translatable prose */}
        <Badge variant="secondary">
          v{questionnaire.internal_revision ?? 1}
        </Badge>
      </div>
    </div>
  );
}
