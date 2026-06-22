import ErrorBoundary from "@/components/Common/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { usePluginDrawingApplication } from "./usePluginDrawingApplications";

const ApplicationIcon = ({ application }: { application: string }) => {
  const { drawingApplication: app, isLoading } =
    usePluginDrawingApplication(application);

  if (isLoading || !app.icon) {
    return fallback;
  }

  return <app.icon className="size-full" />;
};

const fallback = <Skeleton className="size-full" />;

export const DrawingIcon = ({ application }: { application: string }) => {
  return (
    <ErrorBoundary fallback={fallback}>
      <ApplicationIcon application={application} />
    </ErrorBoundary>
  );
};
