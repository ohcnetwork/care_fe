import { navigate } from "raviger";
import { useContext } from "react";
import {
  HistoryContext,
  ResetHistoryContext,
} from "../../CAREUI/misc/HistoryAPIProvider";

export default function useAppHistory() {
  const history = useContext(HistoryContext);
  const resetHistory = useContext(ResetHistoryContext);

  const goBack = (fallbackUrl?: string) => {
    if (history.length > 1)
      // Navigate to history present in the app navigation history stack.
      return navigate(history[1]);

    if (fallbackUrl)
      // Otherwise, use provided fallback url if provided.
      return navigate(fallbackUrl);

    // Otherwise, fallback to browser's go back behaviour.
    window.history.back();
  };

  return { history, resetHistory, goBack };
}
