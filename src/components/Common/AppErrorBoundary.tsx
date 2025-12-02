import ErrorBoundary from "@/components/Common/ErrorBoundary";
import { useCareApps } from "@/hooks/useCareApps";

export const AppErrorBoundary = (
  props: React.ComponentProps<typeof ErrorBoundary>,
) => {
  // Voluntarily using useCareApps to trigger re-render when the apps changes
  const apps = useCareApps();

  return (
    <ErrorBoundary key={JSON.stringify(apps)} {...props}>
      {props.children}
    </ErrorBoundary>
  );
};
