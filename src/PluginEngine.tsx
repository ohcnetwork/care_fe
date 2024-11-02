import { CareAppsContext, useCareApps } from "@/common/hooks/useCareApps";
/* eslint-disable i18next/no-literal-string */
import React, { Suspense } from "react";
import { SupportedPluginComponents, pluginMap } from "./pluginTypes";

import ErrorBoundary from "@/components/Common/ErrorBoundary";

export default function PluginEngine({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading plugins...</div>}>
      <ErrorBoundary
        fallback={
          <div className="flex h-screen w-screen items-center justify-center">
            Error loading plugins
          </div>
        }
      >
        <CareAppsContext.Provider value={pluginMap}>
          {children}
        </CareAppsContext.Provider>
      </ErrorBoundary>
    </Suspense>
  );
}

type PluginProps<K extends keyof SupportedPluginComponents> =
  React.ComponentProps<SupportedPluginComponents[K]>;

export function PLUGIN_Component<K extends keyof SupportedPluginComponents>({
  __name,
  ...props
}: { __name: K } & PluginProps<K>) {
  const plugins = useCareApps();

  return (
    <>
      {plugins.map((plugin) => {
        const Component = plugin.components[
          __name
        ] as React.ComponentType<unknown>;

        if (!Component) {
          return null;
        }

        return <Component {...props} key={plugin.plugin} />;
      })}
    </>
  );
}
