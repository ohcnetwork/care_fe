import { useEffect, useState } from "react";

export function useView(name: string): [string, (view: string) => void] {
  const [view, setView] = useState(() => localStorage.getItem(name) || "board");

  const updateView = (view: string) => {
    setView(view);
    localStorage.setItem(name, view);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setView(localStorage.getItem(name) || "board");
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [name]);

  return [view, updateView];
}
