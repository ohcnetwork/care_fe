import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { useDisableSmoothScroll } from "@/components/QuestionnaireV2/shared/useDisableSmoothScroll";

/** The fullscreen frame (the fill routes opt out of the app sidebar):
 *  fixed viewport shell from md up, z-40 under portals at z-50. Every state of the
 *  fill page — picker, skeleton, loaded session — renders inside it, so
 *  the layout never jumps shells and the close affordance always exists. */
export function FillShell({
  children,
  onClose,
  tabs,
}: {
  children: React.ReactNode;
  onClose: () => void;
  /** Content of the header strip's left side (tab list or plain title). */
  tabs?: React.ReactNode;
}) {
  const { t } = useTranslation();
  useDisableSmoothScroll();
  return (
    // -m-4 cancels AppRouter's page-wrapper p-4 below md, where this shell
    <div className="-m-4 flex min-h-dvh flex-col bg-gray-100 md:m-0 md:fixed md:inset-0 md:z-40 md:overflow-hidden">
      {/* min-w-0 + overflow on the strip: a long questionnaire title (or
          the two tabs) scrolls within its own row on narrow screens
          instead of pushing the close button off-viewport. */}
      <div className="sticky top-0 z-10 flex shrink-0 items-end justify-between gap-2 bg-gray-200 px-4 pt-3 md:px-6">
        <div className="min-w-0 flex-1 overflow-x-auto">{tabs ?? <div />}</div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="mb-2 shrink-0 border-gray-300 shadow-xs"
          aria-label={t("close")}
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}
