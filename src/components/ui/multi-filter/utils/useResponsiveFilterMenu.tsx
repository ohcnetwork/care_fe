import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import useBreakpoints from "@/hooks/useBreakpoints";

/**
 * Returns the right Root/Trigger primitives for a MultiFilter menu:
 * `DropdownMenu`/`DropdownMenuTrigger` on desktop, `Drawer`/`DrawerTrigger`
 * (bottom sheet) on mobile — matching the responsive pattern used by
 * `Autocomplete`/`MultiSelect`. Pair with `FilterMenuContent` for the
 * content panel, which needs a different layout per container.
 *
 * Root/Trigger prop shapes are compatible between the two implementations
 * (`open`/`onOpenChange` on Root, `asChild` on Trigger), so callers can
 * freely place arbitrary sibling markup (e.g. extra buttons) between the
 * Trigger and Content, same as they would with a plain `DropdownMenu`.
 */
export default function useResponsiveFilterMenu() {
  const isMobile = useBreakpoints({ default: true, sm: false });

  return {
    isMobile,
    Root: isMobile ? Drawer : DropdownMenu,
    Trigger: isMobile ? DrawerTrigger : DropdownMenuTrigger,
  };
}

interface FilterMenuContentProps {
  children: React.ReactNode;
  /** i18next translation key for the mobile drawer's accessible (visually hidden) title. */
  titleKey: string;
  align?: "start" | "end";
  className?: string;
  drawerClassName?: string;
}

/**
 * Content panel counterpart to `useResponsiveFilterMenu` — renders a
 * `DropdownMenuContent` on desktop and a scrollable bottom `DrawerContent`
 * (with a visually-hidden `DrawerTitle` for a11y) on mobile.
 */
export function FilterMenuContent({
  children,
  titleKey,
  align = "start",
  className,
  drawerClassName,
}: FilterMenuContentProps) {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, sm: false });

  if (isMobile) {
    return (
      <DrawerContent
        aria-describedby={undefined}
        className={cn(
          "min-h-[40vh] max-h-[85vh] px-0 pt-2 pb-0 rounded-t-lg flex flex-col",
          drawerClassName,
        )}
      >
        <DrawerTitle className="sr-only">{t(titleKey)}</DrawerTitle>
        <div className="mt-4 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
          {children}
        </div>
      </DrawerContent>
    );
  }

  return (
    <DropdownMenuContent className={cn("p-0", className)} align={align}>
      {children}
    </DropdownMenuContent>
  );
}
