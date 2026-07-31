import { useAtom } from "jotai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { useRenderer } from "@/components/QuestionnaireV2/renderer/RendererContext";
import { activeGroupIndexAtom } from "@/components/QuestionnaireV2/renderer/store";

export function RendererFooter() {
  const { t } = useTranslation();
  const { questionnaire } = useRenderer();
  const [activeGroupIndex, setActiveGroupIndex] = useAtom(activeGroupIndexAtom);
  const lastIndex = Math.max(questionnaire.questions.length - 1, 0);
  // Mirrors RendererBody's `?? questionnaire.questions[0]` fallback — keeps
  // the Previous/Next disabled state in sync when the atom holds a stale
  // index (e.g. a shorter question set swapped in after the index was set).
  const clampedIndex = Math.min(Math.max(activeGroupIndex, 0), lastIndex);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <Button
        type="button"
        variant="ghost"
        disabled={clampedIndex <= 0}
        onClick={() => setActiveGroupIndex((index) => Math.max(index - 1, 0))}
      >
        <ChevronLeft className="size-4" />
        {t("previous")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={clampedIndex >= lastIndex}
        onClick={() =>
          setActiveGroupIndex((index) => Math.min(index + 1, lastIndex))
        }
      >
        {t("next")}
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
