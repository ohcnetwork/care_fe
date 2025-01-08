import { useEffect } from "react";

interface UsePreventNavigationOptions {
  isDirty: boolean;
  message?: string;
}

export function usePreventNavigation({
  isDirty,
  message = "You have unsaved changes. Are you sure you want to leave?",
}: UsePreventNavigationOptions) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    const preventNavigation = (e: Event) => {
      const confirmLeave = window.confirm(message);

      if (!confirmLeave) {
        e.preventDefault();
        e.stopPropagation();
        window.history.replaceState(null, "", window.location.pathname);
        return false;
      }
    };

    const handleLinkClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a");
      if (link) preventNavigation(e);
    };

    // Common options for event listeners
    const listenerOptions = { capture: true };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", preventNavigation, listenerOptions);
    document.addEventListener("click", handleLinkClick, listenerOptions);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener(
        "popstate",
        preventNavigation,
        listenerOptions,
      );
      document.removeEventListener("click", handleLinkClick, listenerOptions);
    };
  }, [isDirty, message]);
}
