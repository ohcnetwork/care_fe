import { Redirect, useRoutes } from "raviger";
import { Suspense } from "react";

import Loading from "@/components/Common/Loading";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { lazyPage } from "@/Routers/lazyPage";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

const ScheduleHome = lazyPage(
  () => import("@/components/Schedule/ScheduleHome"),
  "ScheduleHome",
);
const AppointmentDetail = lazyPage(
  () => import("@/pages/Appointments/AppointmentDetail"),
);
const AppointmentsPage = lazyPage(
  () => import("@/pages/Appointments/AppointmentsPage"),
);
const PrintAppointments = lazyPage(
  () => import("@/pages/Appointments/components/PrintAppointments"),
);
const ManageQueuePage = lazyPage(
  () => import("@/pages/Facility/queues/ManageQueue"),
  "ManageQueuePage",
);
const QueuesIndex = lazyPage(
  () => import("@/pages/Facility/queues/QueuesIndex"),
);
const HealthcareServiceShow = lazyPage(() => import("./HealthcareServiceShow"));

interface ServiceLayoutProps {
  facilityId: string;
  serviceId: string;
}

const getRoutes = (facilityId: string, serviceId: string) => ({
  "/locations": () => (
    <HealthcareServiceShow facilityId={facilityId} serviceId={serviceId} />
  ),

  // Schedule
  "/schedule": () => (
    <ScheduleHome
      facilityId={facilityId}
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
    />
  ),

  // Appointments
  "/appointments": () => (
    <AppointmentsPage
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
    />
  ),
  "/appointments/:appointmentId": ({
    appointmentId,
  }: {
    appointmentId: string;
  }) => <AppointmentDetail appointmentId={appointmentId} />,
  "/appointments/print": () => (
    <PrintAppointments
      facilityId={facilityId}
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
    />
  ),

  // Queues
  "/queues": () => (
    <QueuesIndex
      facilityId={facilityId}
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
    />
  ),
  "/queues/:queueId": ({ queueId }: { queueId: string }) => (
    <Redirect
      to={`/facility/${facilityId}/services/${serviceId}/queues/${queueId}/ongoing`}
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

  return (
    <div>
      <Suspense fallback={<Loading />}>{routeResult}</Suspense>
    </div>
  );
}
