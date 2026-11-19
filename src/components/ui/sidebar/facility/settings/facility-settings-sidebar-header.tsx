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
    <div className={cn("flex min-w-0 flex-col gap-2", !isCollapsed && "px-2")}>
      <div className="flex min-h-8 items-center justify-between">
        <TooltipComponent content={t("back_to_facility")} side="right">
          <Button
            asChild
            variant="ghost"
            size={isCollapsed ? "icon-sm" : "sm"}
            className={cn(
              "gap-1.5 text-muted-foreground",
              !isCollapsed && "-ml-2 px-2",
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
            size="icon-sm"
            onClick={() => setOpenMobile(false)}
            aria-label={t("close_sidebar")}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div
        className={cn(
          "flex min-w-0 items-center",
          isCollapsed ? "size-9 justify-center" : "py-2",
        )}
        title={isCollapsed ? t("settings") : facility?.name}
      >
        {isCollapsed ? (
          <>
            <Settings
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="sr-only">{t("settings")}</span>
          </>
        ) : (
          <div className="flex min-w-0 flex-col">
            <span className="text-xs text-muted-foreground">
              {t("settings")}
            </span>
            <span className="truncate text-sm font-medium">
              {facility?.name ??
                (isFacilityLoading ? t("loading") : t("facility"))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
