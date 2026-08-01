import { Copy, Download } from "lucide-react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Form } from "@/components/ui/form";

import { BasicInformationCard } from "@/components/QuestionnaireV2/manage/BasicInformationCard";
import { CloneQuestionnaireDialog } from "@/components/QuestionnaireV2/manage/CloneQuestionnaireDialog";
import { FormPropertiesSidebar } from "@/components/QuestionnaireV2/manage/FormPropertiesSidebar";
import { OrganizationsField } from "@/components/QuestionnaireV2/manage/OrganizationsField";
import { DetailFormValues } from "@/components/QuestionnaireV2/manage/questionnaireFormSchema";
import { downloadQuestionnaireJson } from "@/components/QuestionnaireV2/shared/downloadQuestionnaireJson";
import { LabeledActionButton } from "@/components/QuestionnaireV2/shared/LabeledActionButton";

import {
  QuestionnaireRead,
  QuestionnaireScope,
} from "@/types/questionnaire/questionnaire";

export interface FormSettingsPanelProps {
  scope: QuestionnaireScope;
  questionnaire: QuestionnaireRead;
  /** The studio page's metadata form — saved together with the question
   *  tree by the page's Save Changes (one full-body PUT). */
  form: UseFormReturn<DetailFormValues>;
  canWrite: boolean;
}

/**
 * The inspector's questionnaire-level state (the reference design's "Form
 * settings"): identity fields, status, subject type, organizations, clone
 * and JSON export — composed from the manage components so the detail page
 * and the studio cannot drift. Note organizations keep their own
 * immediate-save semantics (same as the detail page), independent of the
 * Save Changes flow.
 */
export function FormSettingsPanel({
  scope,
  questionnaire,
  form,
  canWrite,
}: FormSettingsPanelProps) {
  const { t } = useTranslation();
  const [cloneOpen, setCloneOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">
          {t("form_settings")}
        </h2>
        <p className="text-xs text-gray-500">{t("form_settings_hint")}</p>
      </div>

      <Form {...form}>
        <BasicInformationCard form={form} canWrite={canWrite}>
          <OrganizationsField
            scope={scope}
            questionnaireId={questionnaire.id}
            canWrite={canWrite}
          />
        </BasicInformationCard>

        <FormPropertiesSidebar
          questionnaire={questionnaire}
          form={form}
          canWrite={canWrite}
        >
          {canWrite && (
            <LabeledActionButton
              label={t("create_copy_of_form")}
              onClick={() => setCloneOpen(true)}
            >
              <Copy className="size-4" />
              {t("clone_form")}
            </LabeledActionButton>
          )}
          <LabeledActionButton
            label={t("download_the_form")}
            onClick={() => downloadQuestionnaireJson(questionnaire)}
          >
            <Download className="size-4" />
            {t("download_json")}
          </LabeledActionButton>
        </FormPropertiesSidebar>
      </Form>

      <CloneQuestionnaireDialog
        scope={scope}
        questionnaire={questionnaire}
        open={cloneOpen}
        onOpenChange={setCloneOpen}
      />
    </div>
  );
}
