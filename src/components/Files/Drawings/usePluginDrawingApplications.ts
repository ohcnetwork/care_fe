import { useCareApps } from "@/hooks/useCareApps";

export class DrawingApplicationNotFoundError extends Error {
  application: string;

  constructor(application: string) {
    super(`Drawing application ${application} not found`);
    this.name = "DrawingApplicationNotFoundError";
    this.application = application;
  }
}

function getDrawingApplicationsFromCareApps(
  careApps: ReturnType<typeof useCareApps>,
) {
  return careApps.flatMap(
    (app) => (!app.isLoading && app.drawingApplications) || [],
  );
}

export const usePluginDrawingApplications = () => {
  const careApps = useCareApps();
  return getDrawingApplicationsFromCareApps(careApps);
};

export const usePluginDrawingApplication = (application: string) => {
  const careApps = useCareApps();
  const isLoading = careApps.some((app) => app.isLoading);
  const drawingApplications = getDrawingApplicationsFromCareApps(careApps);

  const drawingApplication = drawingApplications.find(
    (drawingApplication) => drawingApplication.application === application,
  );

  if (drawingApplication) {
    return { isLoading: false, drawingApplication } as const;
  }

  if (isLoading) {
    return { isLoading: true, drawingApplication: null } as const;
  }

  throw new DrawingApplicationNotFoundError(application);
};
