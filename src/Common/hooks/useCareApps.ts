import { createContext, useContext } from "react";
import { PluginConfigType } from "./useConfig";
import { INavItem } from "@core/Components/Common/Sidebar/Sidebar";

type CareAppsContextType = PluginConfigType[];

export const CareAppsContext = createContext<CareAppsContextType | null>(null);

export const useCareApps = () => {
  const ctx = useContext(CareAppsContext);
  if (!ctx) {
    throw new Error(
      "'useCareApps' must be used within 'CareAppsProvider' only",
    );
  }
  return ctx;
};

export const useCareAppNavItems = () => {
  const careApps = useCareApps();
  const navItems = careApps.reduce<INavItem[]>((acc, plugin) => {
    if (typeof plugin === "string") {
      return acc;
    }
    return [...acc, ...(plugin.navItems || [])];
  }, []);
  return navItems;
};

// If required; Reduce plugin.routes to a single pluginRoutes object of type Record<string, () => JSX.Element>
export function usePluginRoutes() {
  const careApps = useCareApps();
  const routes = careApps.reduce((acc, plugin) => {
    if (typeof plugin === "string") {
      return acc;
    }
    return { ...acc, ...plugin.routes };
  }, {});
  if (!routes) {
    throw new Error("'usePluginRoutes' must be used within 'AppRouter' only");
  }
  return routes;
}
