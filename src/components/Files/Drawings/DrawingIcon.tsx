import ErrorBoundary from "@/components/Common/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { DrawingApplicationManifest } from "@/pluginTypes";
import { usePluginDrawingApplication } from "./usePluginDrawingApplications";

const ApplicationIcon = ({ app }: { app: DrawingApplicationManifest }) => {
  if (!app.icon) {
    return fallback;
  }
  return <app.icon className="size-full" />;
};

const fallback = <Skeleton className="size-full" />;

export const DrawingIcon = ({ application }: { application: string }) => {
  const { drawingApplication, isLoading } =
    usePluginDrawingApplication(application);

  if (isLoading) {
    return fallback;
  }

  return (
    <ErrorBoundary fallback={fallback}>
      <ApplicationIcon app={drawingApplication!} />
    </ErrorBoundary>
  );
};
