import { Suspense, createContext, useContext } from "react";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import { PluginManifest } from "@/pluginTypes";

export const CareAppsContext = createContext<PluginManifest[]>([]);

export const useCareApps = () => {
  const ctx = useContext(CareAppsContext);
  if (!ctx) {
    throw new Error(
      "'useCareApps' must be used within 'CareAppsProvider' only",
    );
  }
  return ctx;
};

// export const useCareAppNavItems = () => {
//   const careApps = useCareApps();
//   const navItems = careApps.reduce<INavItem[]>((acc, plugin) => {
//     return [...acc, ...(plugin.navItems || [])];
//   }, []);
//   return navItems;
// };

const withSuspense = (Component: React.ComponentType<EncounterTabProps>) => {
  // eslint-disable-next-line react/display-name
  return (props: EncounterTabProps) => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Component {...props} />
      </Suspense>
    );
  };
};

export const useCareAppEncounterTabs = () => {
  const careApps = useCareApps();

  return careApps.reduce((acc, app) => {
    const appTabs = Object.entries(app.encounterTabs ?? {}).reduce(
      (acc, [key, Component]) => {
        return { ...acc, [key]: withSuspense(Component) };
      },
      {},
    );

    return { ...acc, ...appTabs };
  }, {});
};

// If required; Reduce plugin.routes to a single pluginRoutes object of type Record<string, () => React.ReactNode>
export function usePluginRoutes() {
  const careApps = useCareApps();
  const routes = careApps.reduce((acc, plugin) => {
    return { ...acc, ...(plugin.routes ?? {}) };
  }, {});
  if (!routes) {
    throw new Error("'usePluginRoutes' must be used within 'AppRouter' only");
  }
  return routes;
}
