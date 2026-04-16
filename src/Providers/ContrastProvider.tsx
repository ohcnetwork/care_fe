import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "care-ui-high-contrast";

interface ContrastContextType {
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
}

const ContrastContext = createContext<ContrastContextType>({
  highContrast: false,
  setHighContrast: () => null,
});

export function ContrastProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  const value = useMemo(
    () => ({
      highContrast,
      setHighContrast: (value: boolean) => {
        localStorage.setItem(STORAGE_KEY, String(value));
        setHighContrastState(value);
      },
    }),
    [highContrast],
  );

  return (
    <ContrastContext.Provider value={value}>
      {children}
    </ContrastContext.Provider>
  );
}

export const useContrast = () => useContext(ContrastContext);
