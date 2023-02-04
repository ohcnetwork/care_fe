import { useLocationChange } from "raviger";
import { createContext, ReactNode, useState } from "react";

export const HistoryContext = createContext<string[]>([]);
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const ResetHistoryContext = createContext(() => {});

export const HistoryAPIProvider = (props: { children: ReactNode }) => {
  const [history, setHistory] = useState<string[]>([]);

  useLocationChange(
    (newLocation) => {
      setHistory((history) => {
        if (history.length && newLocation.fullPath === history[0])
          // Ignore push if navigate to same path (for some weird unknown reasons?)
          return history;

        if (history.length > 1 && newLocation.fullPath === history[1])
          // Pop current path if navigate back to previous path
          return history.slice(1);

        // Otherwise just push the current path
        return [newLocation.fullPath, ...history];
      });
    },
    { onInitial: true }
  );

  const resetHistory = () => setHistory((history) => history.slice(0, 1));

  return (
    <HistoryContext.Provider value={history}>
      <ResetHistoryContext.Provider value={resetHistory}>
        {props.children}
      </ResetHistoryContext.Provider>
    </HistoryContext.Provider>
  );
};
