import { Plus, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { QuestionsEmptyState } from "@/components/QuestionnaireV2/shared/QuestionsEmptyState";

/** No-questions state for the builder's editor pane. */
export function BuilderEmptyState({
  onAddFirst,
  onImport,
}: {
  onAddFirst: () => void;
  /** Omitted when the user lacks questionnaire-write — hides the affordance. */
  onImport?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <QuestionsEmptyState className="gap-4 py-16">
      <Button type="button" variant="outline_primary" onClick={onAddFirst}>
        <Plus className="size-4" />
        {t("add_first_question")}
      </Button>
      {onImport && (
        <>
          <div className="flex w-full max-w-xs items-center gap-2 text-xs font-medium uppercase text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            {t("or")}
            <span className="h-px flex-1 bg-gray-200" />
          </div>
          <Button type="button" variant="outline" onClick={onImport}>
            <Upload className="size-4" />
            {t("import_questions")}
          </Button>
        </>
      )}
    </QuestionsEmptyState>
  );
}
