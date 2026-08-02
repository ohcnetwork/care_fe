import { CheckCheck, Dot } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  useAnsweredQuestionIds,
  useFormRenderer,
  useHiddenQuestionIds,
} from "@/components/QuestionnaireV2/form/FormContext";
import { QuestionTreeNav } from "@/components/QuestionnaireV2/shared/QuestionTreeNav";

/**
 * The fill page's left outline (≥lg only): the shared tree nav with live
 * completion adornments — answered questions get the double-check, open
 * ones a dot — and enable_when-hidden rows dropped, exactly like the
 * canvas. Selecting a row scrolls its block into view via the renderer's
 * `data-question-id` anchors.
 *
 * `ariaLabel` names the nav landmark: a multi-questionnaire session
 * renders one outline per form into the same aside, and repeating the
 * generic name would leave a screen reader with several
 * indistinguishable "Questions" landmarks — the host passes each form's
 * title there instead.
 */
export function FillOutline({ ariaLabel }: { ariaLabel?: string }) {
  const { t } = useTranslation();
  const { questionnaire } = useFormRenderer();
  const hiddenIds = useHiddenQuestionIds();
  const answeredIds = useAnsweredQuestionIds();

  return (
    <QuestionTreeNav
      ariaLabel={ariaLabel ?? t("questions")}
      questions={questionnaire.questions}
      activeId={null}
      hiddenIds={hiddenIds}
      onSelect={(questionId) => {
        document
          .querySelector(`[data-question-id="${questionId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      rowAdornment={(question) => {
        if (question.type === "group" || question.type === "display") {
          return null;
        }
        return answeredIds.has(question.id) ? (
          <CheckCheck className="size-4 text-primary-600" />
        ) : (
          <Dot className="size-4 text-gray-300" />
        );
      }}
    />
  );
}
