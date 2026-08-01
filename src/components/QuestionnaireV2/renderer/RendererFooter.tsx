import { useAtom } from "jotai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import {
  activeGroupIndexAtom,
  useVisibleTopLevelIndices,
} from "@/components/QuestionnaireV2/renderer/store";

export function RendererFooter() {
  const { t } = useTranslation();
  const [activeGroupIndex, setActiveGroupIndex] = useAtom(activeGroupIndexAtom);
  // Previous/Next step through the enable_when-visible top-level questions
  // only, mirroring RendererBody's pagination — hidden questions are
  // skipped, never served as blank pages.
  const visibleIndices = useVisibleTopLevelIndices();

  // The stored index may point at a hidden/stale question; RendererBody
  // snaps to the first visible one in that case, so mirror that here.
  const rawPosition = visibleIndices.indexOf(activeGroupIndex);
  const position = rawPosition === -1 ? 0 : rawPosition;
  const canGoPrevious = position > 0;
  const canGoNext = position < visibleIndices.length - 1;

  const goTo = (nextPosition: number) => {
    const nextIndex = visibleIndices[nextPosition];
    if (nextIndex !== undefined) setActiveGroupIndex(nextIndex);
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <Button
        type="button"
        variant="ghost"
        disabled={!canGoPrevious}
        onClick={() => goTo(position - 1)}
      >
        <ChevronLeft className="size-4" />
        {t("previous")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={!canGoNext}
        onClick={() => goTo(position + 1)}
      >
        {t("next")}
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
