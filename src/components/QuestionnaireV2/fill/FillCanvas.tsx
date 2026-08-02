import { cn } from "@/lib/utils";

import { QuestionnaireFormCanvas } from "@/components/QuestionnaireV2/form/FormCanvas";
import type { QuestionShellProps } from "@/components/QuestionnaireV2/form/chrome";

/**
 * Width policy per the reference: regular questions read best in a
 * centered 768px column, structured clinical tables (symptoms,
 * medications…) get the full content width. Implemented as fill chrome —
 * the renderer itself stays layout-agnostic.
 */
function FillQuestionShell({ question, depth, children }: QuestionShellProps) {
  if (depth > 0) return <>{children}</>;
  return (
    <div
      className={cn(
        "w-full",
        question.type !== "structured" && "mx-auto max-w-3xl",
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
