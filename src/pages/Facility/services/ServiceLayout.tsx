import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import { ManageQueuePage } from "@/pages/Facility/queues/ManageQueue";
import QueuesIndex from "@/pages/Facility/queues/QueuesIndex";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { useRoutes } from "raviger";
import HealthcareServiceShow from "./HealthcareServiceShow";

interface ServiceLayoutProps {
  facilityId: string;
  serviceId: string;
}

const getRoutes = (facilityId: string, serviceId: string) => ({
  "/locations": () => (
    <HealthcareServiceShow facilityId={facilityId} serviceId={serviceId} />
  ),
  // Queues
  "/queues": () => (
    <QueuesIndex
      facilityId={facilityId}
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
    />
  ),
  "/queues/:queueId/ongoing": ({ queueId }: { queueId: string }) => (
    <ManageQueuePage
      facilityId={facilityId}
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
      queueId={queueId}
      tab="ongoing"
    />
  ),

  "/queues/:queueId/completed": ({ queueId }: { queueId: string }) => (
    <ManageQueuePage
      facilityId={facilityId}
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
      queueId={queueId}
      tab="completed"
    />
  ),

  "*": () => <ErrorPage />,
});

export function ServiceLayout({ facilityId, serviceId }: ServiceLayoutProps) {
  const basePath = `/facility/${facilityId}/services/${serviceId}`;
  const routeResult = useRoutes(getRoutes(facilityId, serviceId), {
    basePath,
    routeProps: {
      facilityId,
      serviceId,
    },
  });

  return <div>{routeResult}</div>;
}
