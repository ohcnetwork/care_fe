import { useEffect, useState } from "react";

export function useView(
  name: string,
  defaultView: string,
): [string, (view: string) => void] {
  const [view, setView] = useState(() => {
    return localStorage.getItem(name) || defaultView;
  });
  const updateView = (newView: string) => {
    localStorage.setItem(name, newView);
    setView(newView);
  };
  useEffect(() => {
    const interval = setInterval(() => {
      const storedView = localStorage.getItem(name);
      if (storedView !== view) {
        setView(storedView || defaultView);
      }
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, [name, view]);
  return [view, updateView];
}
