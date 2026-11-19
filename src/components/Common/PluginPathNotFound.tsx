import { Spinner } from "@/components/ui/spinner";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { useCareApps } from "@/hooks/useCareApps";

/**
 * Not-found for a path that a plugin route can own. While plugin manifests
 * load, it shows a spinner: the router matches the plugin route when its
 * manifest is attached.
 */
export function PluginPathNotFound() {
  const careApps = useCareApps();
  if (careApps.some((app) => app.isLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner role="status" aria-label="Loading" className="size-6" />
      </div>
    );
  }
  return <ErrorPage />;
}
