/* eslint-disable i18next/no-literal-string */
import React, { Suspense } from "react";
import { CareAppsContext, useCareApps } from "@/common/hooks/useCareApps";
import { pluginMap } from "./pluginTypes";
import { UserAssignedModel } from "@/components/Users/models";
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

export function PLUGIN_DoctorConnectButtons({
  user,
}: {
  user: UserAssignedModel;
}) {
  const plugins = useCareApps();
  return (
    <div>
      {plugins.map((plugin, index) => {
        const DoctorConnectButtons = plugin.components.DoctorConnectButtons;
        if (!DoctorConnectButtons) {
          return null;
        }
        return (
          <div key={index}>
            <DoctorConnectButtons user={user} />
          </div>
        );
      })}
    </div>
  );
}
