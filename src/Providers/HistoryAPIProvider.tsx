import { useLocationChange } from "raviger";
import { ReactNode, createContext, useState } from "react";

export const HistoryContext = createContext<string[]>([]);

export const ResetHistoryContext = createContext(() => {});

export default function HistoryAPIProvider(props: { children: ReactNode }) {
  const [history, setHistory] = useState<string[]>([]);
  useLocationChange(
    (location) => {
      const newPath = location.fullPath + location.search;
      const action = location.initiatedBy;

      setHistory((history) => {
        // instead of pushing, we are popping the history when the same page is navigated to
        if (
          (history.length > 1 && newPath === history[1]) ||
          action === "pop"
        ) {
          return history.slice(1);
        }

        // replace navigation
        if (action === "replace") {
          return [newPath, ...history.slice(1)];
        }

        // normal navigation or push navigation
        return [newPath, ...history];
      });
    },
    { onInitial: true },
  );
  const resetHistory = () => setHistory((history) => history.slice(0, 1));

  return (
    <HistoryContext.Provider value={history}>
      <ResetHistoryContext.Provider value={resetHistory}>
        {props.children}
      </ResetHistoryContext.Provider>
    </HistoryContext.Provider>
  );
}
