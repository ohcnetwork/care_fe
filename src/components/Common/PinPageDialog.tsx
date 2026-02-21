import { Pin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import useUserPreferences from "@/hooks/useUserPreferences";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

interface PinPageDialogProps {
  url?: string;
}

export function PinPageDialog({ url }: PinPageDialogProps) {
  const { t } = useTranslation();
  const [open, onOpenChange] = useState(false);
  const {
    addCustomLink,
    isCustomLink,
    removeCustomLink,
    isPending,
    canAddMoreLinks,
    maxCustomLinks,
  } = useUserPreferences();
  const { facilityId } = useCurrentFacilitySilently();

  const [includeQueryParams, setIncludeQueryParams] = useState(false);
  const pathUrl = includeQueryParams
    ? window.location.pathname + window.location.search
    : window.location.pathname;
  const currentUrl = url ? url : pathUrl;
  const isAlreadyPinned = isCustomLink(currentUrl);
  const isLimitReached = !canAddMoreLinks && !isAlreadyPinned;
  useShortcutSubContext("facility");

  const [title, setTitle] = useState("");

  // Reset title when dialog opens
  useEffect(() => {
    if (open) {
      // Try to get a sensible default title from the page
      const pageTitle = document.title?.replace(" | CARE", "") || "";
      setTitle(pageTitle);
      setIncludeQueryParams(false);
    }
  }, [open]);

  const handlePin = useCallback(() => {
    if (!title.trim()) return;
    onOpenChange(false);
    addCustomLink({
      link: currentUrl,
      title: title.trim(),
      facilityId,
    });
  }, [title, currentUrl, facilityId, addCustomLink, onOpenChange]);

  const handleUnpin = useCallback(() => {
    onOpenChange(false);
    removeCustomLink(currentUrl);
  }, [currentUrl, removeCustomLink, onOpenChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isAlreadyPinned && title.trim()) {
        e.preventDefault();
        handlePin();
      }
    },
    [handlePin, isAlreadyPinned, title],
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => onOpenChange(true)}
        className="hidden"
      >
        <ShortcutBadge actionId="pin-page" />
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pin className="size-5" />
              {isAlreadyPinned ? t("unpin_page") : t("pin_page")}
            </DialogTitle>
            <DialogDescription>
              {isLimitReached
                ? t("pin_page_limit_reached", { max: maxCustomLinks })
                : isAlreadyPinned
                  ? t("pin_page_already_pinned_description")
                  : t("pin_page_description")}
            </DialogDescription>
          </DialogHeader>

          {isAlreadyPinned || isLimitReached ? (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                {t("pin_page_current_url")}:{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs break-all">
                  {currentUrl}
                </code>
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pin-title">{t("title")}</Label>
                <Input
                  id="pin-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("pin_page_title_placeholder")}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>{t("url")}</Label>
                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md border break-all">
                  {currentUrl}
                </p>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-query-params"
                    checked={includeQueryParams}
                    onCheckedChange={(checked) =>
                      setIncludeQueryParams(checked === true)
                    }
                  />
                  <Label
                    htmlFor="include-query-params"
                    className="text-sm font-normal cursor-pointer"
                  >
                    {t("include_filters")}
                  </Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            {isAlreadyPinned ? (
              <Button
                variant="destructive"
                onClick={handleUnpin}
                disabled={isPending}
              >
                {t("unbookmark_page")}
              </Button>
            ) : (
              <Button
                onClick={handlePin}
                disabled={isPending || !title.trim() || isLimitReached}
              >
                {t("bookmark_page")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PinPageDialog;
