import { cn } from "@/lib/utils";

import { QuestionnaireFormCanvas } from "@/components/QuestionnaireV2/form/FormCanvas";
import type { QuestionShellProps } from "@/components/QuestionnaireV2/form/chrome";
import { findFirstQuestion } from "@/components/QuestionnaireV2/shared/questionTree";

/**
 * Width policy per the reference: regular questions read best in a
 * centered 768px column, structured clinical tables (symptoms,
 * medications…) get the full content width. Implemented as fill chrome —
 * the renderer itself stays layout-agnostic.
 */
function FillQuestionShell({ question, depth, children }: QuestionShellProps) {
  const containsStructured = !!findFirstQuestion(
    [question],
    (item) => item.type === "structured",
  );
  if (depth > 0 && !containsStructured) return <>{children}</>;
  return (
    <div
      className={cn(
        "min-w-0 w-full",
        containsStructured ? "col-span-full" : "mx-auto max-w-3xl",
      )}
    >
      {children}
    </div>
  );
}

const FILL_CHROME = { QuestionShell: FillQuestionShell };

export function FillCanvas() {
  return (
    <QuestionnaireFormCanvas chrome={FILL_CHROME} className="max-w-none" />
  );
}
