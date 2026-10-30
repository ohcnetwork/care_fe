import careConfig from "@careConfig";
import { PanelLeft } from "lucide-react";
import { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";
import { TooltipComponent } from "@/components/ui/tooltip";

const hasCustomLogo = [
  careConfig.mainLogo?.dark,
  careConfig.mainLogo?.light,
].some((source) => source && source !== "/images/care_logo.svg");
const iconOnLight = hasCustomLogo
  ? (careConfig.mainLogo?.dark ?? careConfig.mainLogo?.light)
  : "/images/care_icon_on_light.svg";
const iconOnDark = hasCustomLogo
  ? (careConfig.mainLogo?.light ?? careConfig.mainLogo?.dark)
  : "/images/care_icon_on_dark.svg";

export function AppSidebarToggle({
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onBlur,
  ...props
}: ComponentProps<typeof Button>) {
  const { t } = useTranslation();
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const {
    pinned,
    isOverlay,
    toggleSidebar,
    handleToggleMouseEnter,
    scheduleClose,
  } = useAppSidebar();
  const showLogo = isMobile || !(pinned || isOverlay);

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-sidebar="trigger"
      aria-label={t("toggle_sidebar")}
      aria-expanded={isMobile ? openMobile : pinned || isOverlay}
      className={cn(
        "group/sidebar-toggle relative -ml-1 size-7 shrink-0 p-0 after:absolute after:-inset-3 after:content-['']",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (isMobile) setOpenMobile(!openMobile);
        else toggleSidebar();
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (!event.defaultPrevented) handleToggleMouseEnter();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        if (!event.defaultPrevented) scheduleClose();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.defaultPrevented) scheduleClose();
      }}
      {...props}
    >
      {showLogo ? (
        <>
          <img
            src={iconOnLight}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="size-6 object-contain transition-opacity group-hover/sidebar-toggle:opacity-0 group-focus-visible/sidebar-toggle:opacity-0 dark:hidden"
          />
          <img
            src={iconOnDark}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="hidden size-6 object-contain transition-opacity group-hover/sidebar-toggle:opacity-0 group-focus-visible/sidebar-toggle:opacity-0 dark:block"
          />
          <PanelLeft
            className="absolute size-4 opacity-0 transition-opacity group-hover/sidebar-toggle:opacity-100 group-focus-visible/sidebar-toggle:opacity-100"
            aria-hidden="true"
          />
        </>
      ) : (
        <PanelLeft className="size-4" aria-hidden="true" />
      )}
    </Button>
  );

  if (isMobile) return button;

  return (
    <TooltipComponent content={t("toggle_sidebar")} side="left">
      {button}
    </TooltipComponent>
  );
}
