import { cn } from "@/lib/utils";

import { QuestionnaireFormCanvas } from "@/components/QuestionnaireV2/form/FormCanvas";
import type { QuestionShellProps } from "@/components/QuestionnaireV2/form/chrome";
import { findFirstQuestion } from "@/components/QuestionnaireV2/shared/questionTree";

/**
 * Regular questions use a centered 768px column; structured sections get a
 * bounded 1024px column for their controls. Medication requests and statements
 * can use the full canvas, including through nested groups. Other structured
 * questions remain constrained even alongside medication sections.
 */
function FillQuestionShell({ question, depth, children }: QuestionShellProps) {
  const containsStructured = !!findFirstQuestion(
    [question],
    (item) => item.type === "structured",
  );
  if (depth > 0 && !containsStructured) return <>{children}</>;
  const containsMedication = !!findFirstQuestion(
    [question],
    (item) =>
      item.type === "structured" &&
      (item.structured_type === "medication_request" ||
        item.structured_type === "medication_statement"),
  );
  return (
    <div
      className={cn(
        "min-w-0 w-full",
        containsStructured && "col-span-full",
        !containsMedication && "mx-auto",
        !containsMedication && (containsStructured ? "max-w-5xl" : "max-w-3xl"),
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
