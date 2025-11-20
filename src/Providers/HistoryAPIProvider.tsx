import { useLocationChange } from "raviger";
import { ReactNode, createContext, useState } from "react";

export const HistoryContext = createContext<string[]>([]);

export const PopHistoryContext = createContext(() => {});

export default function HistoryAPIProvider(props: { children: ReactNode }) {
  const [history, setHistory] = useState<string[]>([]);

  useLocationChange(
    (newLocation) => {
      const newPath = newLocation.fullPath + newLocation.search;
      setHistory((history) => {
        if (history.length && newPath === history[0])
          // Ignore push if navigate to same path (for some weird unknown reasons?)
          return history;

        if (history.length > 1 && newPath === history[1])
          // Pop current path if navigate back to previous path
          return history.slice(1);

        // Otherwise just push the current path
        return [newPath, ...history];
      });
    },
    { onInitial: true },
  );

  console.log("history", history);

  return (
    <HistoryContext.Provider value={history}>
      <PopHistoryContext.Provider
        value={() => setHistory((history) => history.slice(1))}
      >
        {props.children}
      </PopHistoryContext.Provider>
    </HistoryContext.Provider>
  );
}
