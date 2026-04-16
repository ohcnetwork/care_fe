import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme =
  | "dark"
  | "light"
  | "system"
  | "light-protanopia"
  | "dark-protanopia"
  | "light-tritanopia"
  | "dark-tritanopia";

function resolveTheme(
  theme: Theme,
  systemIsDark: boolean,
): { colorScheme: "dark" | "light"; a11yVariant: string | null } {
  if (theme === "system") {
    return { colorScheme: systemIsDark ? "dark" : "light", a11yVariant: null };
  }
  const [scheme, ...rest] = theme.split("-") as ["dark" | "light", ...string[]];
  const variant = rest.length > 0 ? rest.join("-") : null;
  return { colorScheme: scheme, a11yVariant: variant };
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "care-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );

  useEffect(() => {
    const root = window.document.documentElement;
    const systemIsDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const { colorScheme, a11yVariant } = resolveTheme(theme, systemIsDark);

    root.classList.remove("light", "dark");
    root.classList.add(colorScheme);

    if (a11yVariant) {
      root.setAttribute("data-theme", a11yVariant);
    } else {
      root.removeAttribute("data-theme");
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (newTheme: Theme) => {
        localStorage.setItem(storageKey, newTheme);
        setTheme(newTheme);
      },
    }),
    [theme, storageKey],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
