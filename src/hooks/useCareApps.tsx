import { PluginManifest, PluginManifestWithMeta } from "@/pluginTypes";
import { CableIcon, Loader2Icon } from "lucide-react";
import { Suspense, createContext, useContext } from "react";

import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";
import OrganizationLayout from "@/pages/Organization/components/OrganizationLayout";
import { PlugConfig } from "@/types/plugConfig";
import { t } from "i18next";

export type CareAppsContextType = Array<
  PlugConfig &
    (({ isLoading: false } & PluginManifestWithMeta) | { isLoading: true })
>;

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

// export const useCareAppNavItems = () => {
//   const careApps = useCareApps();
//   const navItems = careApps.reduce<INavItem[]>((acc, plugin) => {
//     return [...acc, ...(plugin.navItems || [])];
//   }, []);
//   return navItems;
// };

const withSuspense = <T extends object>(
  Component: React.ComponentType<T>,
  pluginName: string,
) => {
  // eslint-disable-next-line react/display-name
  return (props: T) => {
    return (
      <PluginErrorBoundary
        pluginName={pluginName}
        fallback={
          <div className="flex items-center justify-center gap-2 py-6">
            <CableIcon
              role="status"
              aria-label="Error"
              className="size-4 text-red-500"
            />
            <p className="text-sm text-gray-600">
              {t("error_loading_encounter_tab")}
            </p>
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center gap-2">
              <Loader2Icon
                role="status"
                aria-label="Loading"
                className="size-4 animate-spin"
              />
              <p className="text-sm text-gray-600">{t("loading")}</p>
            </div>
          }
        >
          <Component {...props} />
        </Suspense>
      </PluginErrorBoundary>
    );
  };
};

export const useCareAppTabs = <T extends object>(key: keyof PluginManifest) => {
  const careApps = useCareApps();

  return careApps.reduce<Record<string, React.FC<T>>>((acc, app) => {
    if (app.isLoading) {
      return acc;
    }

    const tabs = app[key] as Record<string, React.ComponentType<T>> | undefined;
    if (!tabs) {
      return acc;
    }

    const appTabs = Object.entries(tabs).reduce((acc, [key, Component]) => {
      return { ...acc, [key]: withSuspense(Component, app.plugin) };
    }, {});

    return { ...acc, ...appTabs };
  }, {});
};

// If required; Reduce plugin.routes to a single pluginRoutes object of type Record<string, () => React.ReactNode>
export function usePluginRoutes() {
  const careApps = useCareApps();
  const routes = careApps.reduce((acc, plugin) => {
    if (plugin.isLoading) {
      return acc;
    }

    return { ...acc, ...(plugin.routes ?? {}) };
  }, {});
  if (!routes) {
    throw new Error("'usePluginRoutes' must be used within 'AppRouter' only");
  }
  return routes;
}

export const useOrganizationRoutes = () => {
  const careApps = useCareApps();

  const pluginTabs = careApps.flatMap(
    (c) => (!c.isLoading && c.organizationTabs) || [],
  );

  return {
    ...Object.fromEntries(
      pluginTabs.flatMap((t) => [
        [
          `/organization/:id/${t.slug}`,
          ({ id }: { id: string }) => (
            <OrganizationLayout id={id}>
              {() => <t.component contextId={id} />}
            </OrganizationLayout>
          ),
        ],
        [
          `/organization/:navOrganizationId/children/:id/${t.slug}`,
          ({
            navOrganizationId,
            id,
          }: {
            navOrganizationId: string;
            id: string;
          }) => (
            <OrganizationLayout id={id} navOrganizationId={navOrganizationId}>
              {() => (
                <t.component
                  contextId={id}
                  navOrganizationId={navOrganizationId}
                />
              )}
            </OrganizationLayout>
          ),
        ],
      ]),
    ),
  };
};
