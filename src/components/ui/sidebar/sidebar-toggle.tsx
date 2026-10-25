import { PanelLeft } from "lucide-react";
import { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";
import { TooltipComponent } from "@/components/ui/tooltip";
import careConfig from "@careConfig";

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
  const showLogo = isMobile ? !openMobile : !pinned;

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-sidebar="trigger"
      aria-label={t("toggle_sidebar")}
      aria-expanded={isMobile ? openMobile : pinned || isOverlay}
      className={cn(
        "relative -ml-1 size-7 shrink-0 text-neutral-700 after:absolute after:-inset-3 after:content-[''] hover:bg-neutral-200 hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-indigo-400",
        showLogo && "h-9 w-auto px-1",
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
        <img
          src={careConfig.mainLogo?.dark ?? "/images/care_logo.svg"}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="h-9 w-auto max-w-28 shrink-0 object-contain"
        />
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
