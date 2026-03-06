import { useLocationChange } from "raviger";
import { ReactNode, createContext, useEffect, useRef, useState } from "react";

export const HistoryContext = createContext<string[]>([]);

export const ResetHistoryContext = createContext(() => {});

export default function HistoryAPIProvider(props: { children: ReactNode }) {
  const [history, setHistory] = useState<string[]>([]);
  const isReplaceRef = useRef(false);

  useEffect(() => {
    const original = window.history.replaceState.bind(window.history); //store the original browser replaceState function
    window.history.replaceState = (...args) => {
      isReplaceRef.current = true;
      return original(...args); //call the original browser replaceState function
    };
  }, []); //run this effect only once on mount

  useLocationChange(
    (newLocation) => {
      const newPath = newLocation.fullPath + newLocation.search;
      const isReplace = isReplaceRef.current;
      isReplaceRef.current = false;

      setHistory((history) => {
        if (history.length && newPath === history[0]) {
          return history;
        }

        if (isReplace) {
          return [newPath, ...history.slice(1)];
        }

        if (history.length > 1 && newPath === history[1]) {
          return history.slice(1);
        }

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
