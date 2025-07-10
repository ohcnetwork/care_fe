import { navigate } from "raviger";
import { useContext, useMemo } from "react";

import {
  HistoryContext,
  ResetHistoryContext,
} from "@/Providers/HistoryAPIProvider";

export default function useAppHistory() {
  const history = useContext(HistoryContext);
  const resetHistory = useContext(ResetHistoryContext);

  // Volunarily extracting the last url from the history stack on mount.
  // So that `goBack` always yields the previous url at the time of component mount and not when it was last rendered / updated.
  const lastUrl = useMemo(() => {
    if (history.length > 1) return history[1];
  }, []);

  const goBack = (fallbackUrl?: string) => {
    // If last url is present, navigate to it.
    if (lastUrl) {
      return navigate(lastUrl);
    }

    // else fallback to using the provided url
    if (fallbackUrl) {
      return navigate(fallbackUrl);
    }

    // As a last resort, fallback to browser's go back behaviour.
    window.history.back();
  };

  return { history, resetHistory, goBack };
}
