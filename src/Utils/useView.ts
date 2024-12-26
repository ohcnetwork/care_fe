import { useEffect, useState } from "react";

export function useView(name: string): [string, (view: string) => void] {
  const [view, setView] = useState(() => {
    return localStorage.getItem(name) || "board";
  });
  const updateView = (newView: string) => {
    localStorage.setItem(name, newView);
    setView(newView);
  };
  useEffect(() => {
    const interval = setInterval(() => {
      const storedView = localStorage.getItem(name);
      if (storedView !== view) {
        setView(storedView || "board");
      }
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, [name, view]);
  return [view, updateView];
}
