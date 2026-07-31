import { ListChecks, Plus, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <ListChecks className="size-6 text-primary" />
      </div>
      <p className="text-sm font-medium text-gray-900">
        {t("no_questions_added_yet")}
      </p>
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
    </div>
  );
}
