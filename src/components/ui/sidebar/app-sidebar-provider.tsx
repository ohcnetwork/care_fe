import { useLocationChange, usePath } from "raviger";
import {
  ComponentProps,
  createContext,
  CSSProperties,
  FocusEvent,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import { SidebarProvider } from "@/components/ui/sidebar";

import { useIsMobile } from "@/hooks/use-mobile";

interface AppSidebarContextValue {
  pinned: boolean;
  isOverlay: boolean;
  overlayReady: boolean;
  pinningTransition: boolean;
  innerWorkspace: boolean;
  cancelClose: () => void;
  scheduleClose: () => void;
  handleToggleMouseEnter: () => void;
  handleMenuOpenChange: (open: boolean) => void;
  handleSidebarProviderOpenChange: (open: boolean) => void;
  handleSidebarFocus: () => void;
  handleSidebarBlur: (event: FocusEvent<HTMLElement>) => void;
  toggleSidebar: () => void;
  setPinned: (open: boolean) => void;
}

const AppSidebarContext = createContext<AppSidebarContextValue | null>(null);

export function useAppSidebar() {
  const context = useContext(AppSidebarContext);
  if (!context) {
    throw new Error("useAppSidebar must be used within AppSidebarProvider.");
  }
  return context;
}

interface AppSidebarProviderProps extends ComponentProps<"div"> {
  defaultOpen?: boolean;
  innerWorkspace?: boolean;
}

export function AppSidebarProvider({
  children,
  defaultOpen = true,
  innerWorkspace = false,
  className,
  style,
  ...props
}: AppSidebarProviderProps) {
  const isMobile = useIsMobile();
  const path = usePath();
  const [pinned, setPinned] = useState(defaultOpen);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayReady, setOverlayReady] = useState(!defaultOpen);
  const [pinningTransition, setPinningTransition] = useState(false);
  const scopeRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuOpen = useRef(false);
  const isOverlay = !isMobile && overlayOpen && !pinned;

  const cancelClose = useCallback(() => {
    clearTimeout(closeTimer.current ?? undefined);
    clearTimeout(settleTimer.current ?? undefined);
    closeTimer.current = null;
    settleTimer.current = null;
  }, []);

  const startSettle = useCallback(() => {
    clearTimeout(settleTimer.current ?? undefined);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    settleTimer.current = setTimeout(
      () => setOverlayReady(true),
      reducedMotion ? 0 : 210,
    );
  }, []);

  const focusMainIfNeeded = useCallback(() => {
    const sidebar = scopeRef.current?.querySelector<HTMLElement>(
      "[data-side=left][data-collapsible]",
    );
    if (!sidebar?.contains(document.activeElement)) return;
    const main = scopeRef.current?.querySelector<HTMLElement>("main#pages");
    if (!main) return;
    const hadTabIndex = main.hasAttribute("tabindex");
    if (!hadTabIndex) main.tabIndex = -1;
    main.focus({ preventScroll: true });
    if (!hadTabIndex) main.removeAttribute("tabindex");
  }, []);

  const closeOverlay = useCallback(() => {
    cancelClose();
    focusMainIfNeeded();
    setOverlayOpen(false);
    startSettle();
  }, [cancelClose, focusMainIfNeeded, startSettle]);

  const scheduleClose = useCallback(() => {
    if (pinned || isMobile || menuOpen.current) return;
    cancelClose();
    closeTimer.current = setTimeout(() => {
      const sidebar = scopeRef.current?.querySelector<HTMLElement>(
        "[data-side=left][data-collapsible]",
      );
      const focused = document.activeElement;
      const hasKeyboardFocus =
        focused instanceof HTMLElement &&
        sidebar?.contains(focused) &&
        focused.matches(":focus-visible");
      if (menuOpen.current || hasKeyboardFocus) return;
      closeOverlay();
    }, 300);
  }, [pinned, isMobile, cancelClose, closeOverlay]);

  const handleToggleMouseEnter = useCallback(() => {
    if (isMobile) return;
    cancelClose();
    if (!pinned) {
      setOverlayReady(true);
      setOverlayOpen(true);
    }
  }, [isMobile, pinned, cancelClose]);

  const pinSidebar = useCallback(() => {
    cancelClose();
    clearTimeout(pinningTimer.current ?? undefined);
    if (isOverlay) {
      setPinningTransition(true);
      pinningTimer.current = setTimeout(() => setPinningTransition(false), 200);
    }
    setOverlayReady(false);
    setPinned(true);
    setOverlayOpen(false);
  }, [cancelClose, isOverlay]);

  const unpinSidebar = useCallback(() => {
    cancelClose();
    focusMainIfNeeded();
    setOverlayReady(false);
    setPinned(false);
    setOverlayOpen(false);
    startSettle();
  }, [cancelClose, focusMainIfNeeded, startSettle]);

  const toggleSidebar = useCallback(() => {
    if (pinned) unpinSidebar();
    else pinSidebar();
  }, [pinned, pinSidebar, unpinSidebar]);

  const handlePinnedChange = useCallback(
    (open: boolean) => {
      if (open) pinSidebar();
      else unpinSidebar();
    },
    [pinSidebar, unpinSidebar],
  );

  const handleSidebarProviderOpenChange = useCallback(
    (open: boolean) => {
      // The primitive's keyboard shortcut toggles its visible open state.
      // Toggling a preview pins it instead of dismissing the hovered sidebar.
      if (open || isOverlay) pinSidebar();
      else unpinSidebar();
    },
    [isOverlay, pinSidebar, unpinSidebar],
  );

  const handleMenuOpenChange = useCallback(
    (open: boolean) => {
      menuOpen.current = open;
      if (open) cancelClose();
      else scheduleClose();
    },
    [cancelClose, scheduleClose],
  );

  const handleSidebarBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) scheduleClose();
    },
    [scheduleClose],
  );

  // Hovering never changes the saved preference. This also corrects the
  // primitive's cookie write when its keyboard shortcut pins an open preview.
  useEffect(() => {
    document.cookie = `sidebar:state=${pinned}; path=/; max-age=604800`;
  }, [pinned]);

  useLayoutEffect(() => {
    const sidebar = scopeRef.current?.querySelector<HTMLElement>(
      "[data-side=left][data-collapsible]",
    );
    if (!sidebar) return;
    const hidden = !isMobile && !pinned && !overlayOpen;
    sidebar.inert = hidden;
    if (hidden) sidebar.setAttribute("aria-hidden", "true");
    else sidebar.removeAttribute("aria-hidden");
    return () => {
      sidebar.inert = false;
      sidebar.removeAttribute("aria-hidden");
    };
  }, [isMobile, pinned, overlayOpen, path]);

  useEffect(() => {
    if (!isOverlay) return;
    let active = true;
    const captureEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const escapeStartedInMenu =
        menuOpen.current ||
        (event.target instanceof Element &&
          !!event.target.closest(
            '[role="menu"], [role="dialog"], [role="alertdialog"], [role="listbox"]',
          ));
      if (escapeStartedInMenu) return;
      // A tooltip may prevent Escape even when its content is visually hidden.
      // Finish after Radix handles the event, even if it stops propagation.
      queueMicrotask(() => {
        if (active) closeOverlay();
      });
    };
    window.addEventListener("keydown", captureEscape, true);
    return () => {
      active = false;
      window.removeEventListener("keydown", captureEscape, true);
    };
  }, [isOverlay, closeOverlay]);

  useLocationChange(() => {
    // A route can unmount an open portalled menu without an open-change event.
    menuOpen.current = false;
    if (isOverlay) closeOverlay();
  });

  useEffect(
    () => () => {
      clearTimeout(closeTimer.current ?? undefined);
      clearTimeout(settleTimer.current ?? undefined);
      clearTimeout(pinningTimer.current ?? undefined);
    },
    [],
  );

  const value = useMemo(
    () => ({
      pinned,
      isOverlay,
      overlayReady,
      pinningTransition,
      innerWorkspace,
      cancelClose,
      scheduleClose,
      handleToggleMouseEnter,
      handleMenuOpenChange,
      handleSidebarProviderOpenChange,
      handleSidebarFocus: cancelClose,
      handleSidebarBlur,
      toggleSidebar,
      setPinned: handlePinnedChange,
    }),
    [
      pinned,
      isOverlay,
      overlayReady,
      pinningTransition,
      innerWorkspace,
      cancelClose,
      scheduleClose,
      handleToggleMouseEnter,
      handleMenuOpenChange,
      handleSidebarProviderOpenChange,
      handleSidebarBlur,
      toggleSidebar,
      handlePinnedChange,
    ],
  );

  return (
    <AppSidebarContext.Provider value={value}>
      <SidebarProvider
        {...props}
        ref={scopeRef}
        open={pinned || isOverlay}
        onOpenChange={handleSidebarProviderOpenChange}
        data-app-sidebar-pinned={pinned}
        data-app-sidebar-preview={isOverlay}
        data-app-sidebar-ready={overlayReady}
        className={cn(
          "bg-neutral-100 text-neutral-950 [&_[data-collapsible]>div]:duration-100 [&_[data-collapsible]>div]:motion-reduce:transition-none",
          pinningTransition &&
            "[&_[data-collapsible]>div:last-child]:transition-[left,right,width,top,height,box-shadow,background-color,border-radius] [&>main]:transition-[margin] [&>main]:duration-100 [&>main]:motion-reduce:transition-none",
          !isMobile &&
            overlayReady &&
            !pinned &&
            "[&_[data-collapsible]>div:last-child]:top-(--app-sidebar-offset)! [&_[data-collapsible]>div:last-child]:h-[calc(100svh-var(--app-sidebar-offset))]!",
          !isMobile &&
            !pinned &&
            !overlayOpen &&
            overlayReady &&
            "[&_[data-collapsible]>div:last-child]:invisible",
          isOverlay &&
            "[&_[data-collapsible]>div:first-child]:w-0! [&_[data-collapsible]>div:last-child]:border-t [&_[data-collapsible]>div:last-child]:border-r [&_[data-collapsible]>div:last-child]:border-neutral-200 [&_[data-collapsible]>div:last-child]:rounded-r-md [&_[data-collapsible]>div:last-child]:bg-neutral-100 [&_[data-collapsible]>div:last-child]:shadow-xl",
          isOverlay && (innerWorkspace ? "[&>main]:ml-0!" : "[&>main]:ml-2!"),
          className,
        )}
        style={
          {
            "--sidebar-width": "15rem",
            "--app-sidebar-offset": innerWorkspace ? "3rem" : "3.5rem",
            ...style,
          } as CSSProperties
        }
      >
        {children}
      </SidebarProvider>
    </AppSidebarContext.Provider>
  );
}
