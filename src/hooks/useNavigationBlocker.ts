import { useBlocker } from "@tanstack/react-router";
import { useCallback } from "react";

/**
 * Asks the user to confirm `message` before leaving the page while `when` is
 * true. It covers in-app navigation, browser back and forward, reload, and
 * closing the tab. Use it for unsaved clinical data.
 */
export function useNavigationBlocker(when: boolean, message: string) {
  const shouldBlockFn = useCallback(() => !window.confirm(message), [message]);
  useBlocker({
    shouldBlockFn,
    enableBeforeUnload: true,
    disabled: !when,
  });
}
