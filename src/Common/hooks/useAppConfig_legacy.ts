import { createContext, useContext } from "react";

type AppConfigContextType = {
  routes: any;
};

export const AppConfigContext = createContext<AppConfigContextType | null>(
  null,
);

export const useAppConfigContext = () => {
  const ctx = useContext(AppConfigContext);
  if (!ctx) {
    throw new Error(
      "'useAppConfigContext' must be used within 'AppConfigProvider' only",
    );
  }
  return ctx;
};

export default function usePluginRoutes() {
  const routes = useAppConfigContext().routes;
  if (!routes) {
    throw new Error("'usePluginRoutes' must be used within 'AppRouter' only");
  }
  return routes;
}
