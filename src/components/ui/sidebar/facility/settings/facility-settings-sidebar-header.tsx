import { ChevronLeft, Settings, X } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { TooltipComponent } from "@/components/ui/tooltip";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

export function FacilitySettingsSidebarHeader() {
  const { t } = useTranslation();
  const { facilityId, facility, isFacilityLoading } = useCurrentFacility();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  return (
    <div
      className={cn("flex min-w-0 flex-col gap-2 py-2", !isCollapsed && "px-2")}
    >
      <div className="flex min-h-8 items-center justify-between">
        <TooltipComponent content={t("back_to_facility")} side="right">
          <Button
            asChild
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            className={cn(
              "gap-1.5 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-indigo-400",
              isCollapsed ? "size-8" : "-ml-1 h-8 px-2",
            )}
          >
            <Link
              href={`/facility/${facilityId}/overview`}
              basePath="/"
              aria-label={t("back_to_facility")}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
            >
              <ChevronLeft className="size-4" />
              {!isCollapsed && <span>{t("back_to_facility")}</span>}
            </Link>
          </Button>
        </TooltipComponent>
        {isMobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-indigo-400"
            onClick={() => setOpenMobile(false)}
            aria-label={t("close_sidebar")}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div
        className={cn(
          "flex min-w-0 items-center rounded-[10px] border border-neutral-300 bg-white text-neutral-950",
          isCollapsed ? "size-8 justify-center" : "px-3 py-2.5",
        )}
        title={isCollapsed ? t("settings") : facility?.name}
      >
        {isCollapsed ? (
          <>
            <Settings className="size-4 text-neutral-600" aria-hidden="true" />
            <span className="sr-only">{t("settings")}</span>
          </>
        ) : (
          <div className="flex min-w-0 flex-col">
            <span className="text-[10px] font-semibold tracking-wider text-neutral-600 uppercase">
              {t("settings")}
            </span>
            <span className="truncate text-sm font-semibold">
              {facility?.name ??
                (isFacilityLoading ? t("loading") : t("facility"))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
