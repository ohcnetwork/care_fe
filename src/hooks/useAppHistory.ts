import { navigate } from "raviger";
import { useCallback, useContext } from "react";

import {
  HistoryContext,
  PopHistoryContext,
} from "@/Providers/HistoryAPIProvider";

export default function useAppHistory() {
  const history = useContext(HistoryContext);
  const popHistory = useContext(PopHistoryContext);

  // Volunarily extracting the last url from the history stack on mount.
  // So that `goBack` always yields the previous url at the time of component mount and not when it was last rendered / updated.
  const goBack = useCallback(() => {
    const targetUrl = history[1];

    // If target url is present, navigate to it.
    if (targetUrl) {
      return navigate(targetUrl, { replace: true });
    }
    // As a last resort, fallback to browser's go back behaviour.
    window.history.back();
  }, []);

  return { history, popHistory, goBack };
}
