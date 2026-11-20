import { QuestionnaireFormCanvas } from "@/components/QuestionnaireV2/form/FormCanvas";
import type { QuestionShellProps } from "@/components/QuestionnaireV2/form/chrome";
import { findFirstQuestion } from "@/components/QuestionnaireV2/shared/questionTree";

/**
 * Every question shares the canvas width. Nested structured sections span
 * their group's grid columns so wide controls are not squeezed into a cell;
 * ordinary questions retain their authored grid layout.
 */
function FillQuestionShell({ question, depth, children }: QuestionShellProps) {
  if (
    depth === 0 ||
    !findFirstQuestion([question], (item) => item.type === "structured")
  ) {
    return <>{children}</>;
  }
  return <div className="col-span-full min-w-0 w-full">{children}</div>;
}

const FILL_CHROME = { QuestionShell: FillQuestionShell };

export function FillCanvas() {
  return <QuestionnaireFormCanvas chrome={FILL_CHROME} className="max-w-5xl" />;
}
