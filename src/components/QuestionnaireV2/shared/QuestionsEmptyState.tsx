import { ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

interface QuestionsEmptyStateProps {
  /** Secondary line under the "no questions" heading. */
  hint?: string;
  /** Action row (buttons, "or" separators) rendered under the text. */
  children?: React.ReactNode;
  /** Padding/spacing overrides for the dashed container. */
  className?: string;
}

/**
 * The dashed "no questions yet" treatment shared by the create page, the
 * detail overview list and the builder. Deliberately not ui/EmptyState —
 * this Figma treatment (dashed border, primary icon medallion) intentionally
 * differs from that card-styled primitive.
 */
export function QuestionsEmptyState({
  hint,
  children,
  className,
}: QuestionsEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <ListChecks className="size-6 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-900">
          {t("no_questions_added_yet")}
        </p>
        {hint && <p className="text-sm text-gray-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
