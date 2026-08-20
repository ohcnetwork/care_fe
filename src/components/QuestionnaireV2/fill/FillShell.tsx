import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

/** The fullscreen frame (the fill routes opt out of the app sidebar):
 *  fixed viewport shell, z-40 under portals at z-50. Every state of the
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
  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-gray-100">
      {/* min-w-0 + overflow on the strip: a long questionnaire title (or
          the two tabs) scrolls within its own row on narrow screens
          instead of pushing the close button off-viewport. */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 md:px-6">
        <div className="min-w-0 flex-1 overflow-x-auto">{tabs ?? <div />}</div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
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
