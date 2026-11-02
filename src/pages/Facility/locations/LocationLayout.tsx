import { Redirect, useRoutes } from "raviger";
import { Suspense } from "react";

import Loading from "@/components/Common/Loading";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { lazyPage } from "@/Routers/lazyPage";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

const QuestionnaireFillPage = lazyPage(
  () => import("@/components/QuestionnaireV2/fill/QuestionnaireFillPage"),
  "QuestionnaireFillPage",
);
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
const BedsList = lazyPage(() => import("@/pages/Facility/locations/BedsList"));
const LocationOverview = lazyPage(
  () => import("@/pages/Facility/locations/LocationOverview"),
  "LocationOverview",
);
const LocationResponses = lazyPage(
  () => import("@/pages/Facility/locations/LocationResponses"),
);
const ManageQueuePage = lazyPage(
  () => import("@/pages/Facility/queues/ManageQueue"),
  "ManageQueuePage",
);
const QueuesIndex = lazyPage(
  () => import("@/pages/Facility/queues/QueuesIndex"),
);
const InventoryList = lazyPage(
  () => import("@/pages/Facility/services/inventory/InventoryList"),
  "InventoryList",
);
const ExternalPurchasesList = lazyPage(
  () =>
    import("@/pages/Facility/services/inventory/externalSupply/requestOrder/ExternalPurchasesList"),
  "ExternalPurchasesList",
);
const RequestOrderForm = lazyPage(
  () =>
    import("@/pages/Facility/services/inventory/externalSupply/requestOrder/RequestOrderForm"),
);
const RequestOrderShow = lazyPage(
  () =>
    import("@/pages/Facility/services/inventory/externalSupply/requestOrder/RequestOrderShow"),
  "RequestOrderShow",
);
const DeliveryOrderForm = lazyPage(
  () =>
    import("@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderForm"),
);
const DeliveryOrderList = lazyPage(
  () =>
    import("@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderList"),
  "DeliveryOrderList",
);
const DeliveryOrderShow = lazyPage(
  () =>
    import("@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderShow"),
  "DeliveryOrderShow",
);
const PrintDeliveryOrder = lazyPage(
  () =>
    import("@/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder"),
  "PrintDeliveryOrder",
);
const PrintRequestOrder = lazyPage(
  () =>
    import("@/pages/Facility/services/inventory/externalSupply/requestOrder/PrintRequestOrder"),
  "PrintRequestOrder",
);
const ToDispatch = lazyPage(
  () => import("@/pages/Facility/services/inventory/ToDispatch"),
  "ToDispatch",
);
const ToReceive = lazyPage(
  () => import("@/pages/Facility/services/inventory/ToReceive"),
  "ToReceive",
);
const BillMedicationsByNewDispense = lazyPage(
  () =>
    import("@/pages/Facility/services/pharmacy/billMedications/BillMedicationsByNewDispense"),
);
const BillMedicationsByPrescriptions = lazyPage(
  () =>
    import("@/pages/Facility/services/pharmacy/billMedications/BillMedicationsByPrescriptions"),
);
const DispenseOrderCompleted = lazyPage(
  () => import("@/pages/Facility/services/pharmacy/DispenseOrderCompleted"),
);
const DispenseOrderView = lazyPage(
  () => import("@/pages/Facility/services/pharmacy/DispenseOrderView"),
  "DispenseOrderView",
);
const MedicationDispenseHistory = lazyPage(
  () => import("@/pages/Facility/services/pharmacy/MedicationDispenseHistory"),
);
const MedicationReturnList = lazyPage(
  () => import("@/pages/Facility/services/pharmacy/MedicationReturnList"),
);
const MedicationReturnShow = lazyPage(
  () => import("@/pages/Facility/services/pharmacy/MedicationReturnShow"),
);
const PrescriptionQueue = lazyPage(
  () => import("@/pages/Facility/services/pharmacy/PrescriptionQueue"),
);
const PrescriptionsPreviewPage = lazyPage(
  () => import("@/pages/Facility/services/pharmacy/PrescriptionsPreviewPage"),
);
const PrintDispenseOrder = lazyPage(
  () => import("@/pages/Facility/services/pharmacy/PrintDispenseOrder"),
  "PrintDispenseOrder",
);
const PrintMedicationReturn = lazyPage(
  () => import("@/pages/Facility/services/pharmacy/PrintMedicationReturn"),
  "PrintMedicationReturn",
);
const ServiceRequestList = lazyPage(
  () => import("@/pages/Facility/services/serviceRequests/ServiceRequestList"),
);
const ServiceRequestShow = lazyPage(
  () => import("@/pages/Facility/services/serviceRequests/ServiceRequestShow"),
);

interface LocationLayoutProps {
  facilityId: string;
  locationId: string;
}

const getRoutes = (facilityId: string, locationId: string) => ({
  "/": () => (
    <Redirect to={`/facility/${facilityId}/locations/${locationId}/overview`} />
  ),
  "/overview": () => (
    <LocationOverview facilityId={facilityId} locationId={locationId} />
  ),
  "/forms": () => (
    <Redirect
      to={`/facility/${facilityId}/locations/${locationId}/responses`}
    />
  ),
  "/responses": () => (
    <LocationResponses
      key={locationId}
      facilityId={facilityId}
      locationId={locationId}
    />
  ),
  // Beds
  "/beds": () => <BedsList facilityId={facilityId} locationId={locationId} />,
  // Pharmacy
  "/medication_requests": () => (
    <PrescriptionQueue facilityId={facilityId} locationId={locationId} />
  ),
  "/medication_requests/patient/:patientId/prescriptions/:prescriptionIds": ({
    patientId,
    prescriptionIds,
  }: {
    patientId: string;
    prescriptionIds: string;
  }) => (
    <PrescriptionsPreviewPage
      facilityId={facilityId}
      patientId={patientId}
      locationId={locationId}
      prescriptionIds={prescriptionIds.split(",")}
    />
  ),
  "/medication_requests/patient/:patientId/bill/prescriptions/:prescriptionIds":
    ({
      patientId,
      prescriptionIds,
    }: {
      patientId: string;
      prescriptionIds: string;
    }) => (
      <BillMedicationsByPrescriptions
        facilityId={facilityId}
        locationId={locationId}
        patientId={patientId}
        prescriptionIds={prescriptionIds.split(",")}
      />
    ),
  "/medication_requests/patient/:patientId/bill/dispense/:encounterId": ({
    patientId,
    encounterId,
  }: {
    patientId: string;
    encounterId: string;
  }) => (
    <BillMedicationsByNewDispense
      facilityId={facilityId}
      locationId={locationId}
      patientId={patientId}
      encounterId={encounterId}
    />
  ),
  "/medication_dispense": () => (
    <MedicationDispenseHistory
      facilityId={facilityId}
      locationId={locationId}
    />
  ),
  "/medication_dispense/order/:dispenseOrderId/print": ({
    dispenseOrderId,
  }: {
    dispenseOrderId: string;
  }) => (
    <PrintDispenseOrder
      facilityId={facilityId}
      dispenseOrderId={dispenseOrderId}
      locationId={locationId}
    />
  ),
  "/medication_dispense/order/:dispenseOrderId/completed": ({
    dispenseOrderId,
  }: {
    dispenseOrderId: string;
  }) => (
    <DispenseOrderCompleted
      facilityId={facilityId}
      locationId={locationId}
      dispenseOrderId={dispenseOrderId}
    />
  ),
  "/medication_dispense/order/:dispenseOrderId": ({
    dispenseOrderId,
  }: {
    dispenseOrderId: string;
  }) => (
    <DispenseOrderView
      facilityId={facilityId}
      locationId={locationId}
      dispenseOrderId={dispenseOrderId}
    />
  ),
  "/medication_return": () => (
    <MedicationReturnList facilityId={facilityId} locationId={locationId} />
  ),
  "/medication_return/order/:deliveryOrderId": ({
    deliveryOrderId,
  }: {
    deliveryOrderId: string;
  }) => (
    <MedicationReturnShow
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={deliveryOrderId}
    />
  ),
  "/medication_return/order/:deliveryOrderId/print": ({
    deliveryOrderId,
  }: {
    deliveryOrderId: string;
  }) => (
    <PrintMedicationReturn
      facilityId={facilityId}
      deliveryOrderId={deliveryOrderId}
    />
  ),

  // Laboratory
  "/service_requests": () => (
    <ServiceRequestList facilityId={facilityId} locationId={locationId} />
  ),
  "/service_requests/:serviceRequestId": ({
    serviceRequestId,
  }: {
    serviceRequestId: string;
  }) => (
    <ServiceRequestShow
      facilityId={facilityId}
      locationId={locationId}
      serviceRequestId={serviceRequestId}
    />
  ),

  // Inventory
  "/inventory/summary": () => (
    <InventoryList facilityId={facilityId} locationId={locationId} />
  ),

  "/inventory/internal/:type/orders/new": () => (
    <RequestOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
    />
  ),
  // View Internal Order
  "/inventory/internal/:type/orders/:id": ({ id }: { id: string }) => (
    <RequestOrderShow
      facilityId={facilityId}
      locationId={locationId}
      requestOrderId={id}
      internal={true}
    />
  ),
  // Edit Internal Order
  "/inventory/internal/:type/orders/:id/edit": ({ id }: { id: string }) => (
    <RequestOrderForm
      facilityId={facilityId}
      locationId={locationId}
      requestOrderId={id}
      internal={true}
    />
  ),
  //Print Internal Order
  "/inventory/internal/:type/orders/:id/print": ({ id }: { id: string }) => (
    <PrintRequestOrder
      facilityId={facilityId}
      locationId={locationId}
      requestOrderId={id}
      internal={true}
    />
  ),
  // Create Delivery
  "/inventory/internal/:type/deliveries/new": () => (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
    />
  ),
  // View Delivery
  "/inventory/internal/:type/deliveries/:id": ({ id }: { id: string }) => (
    <DeliveryOrderShow
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={id}
      internal={true}
    />
  ),
  // Print Delivery
  "/inventory/internal/:type/deliveries/:id/print": ({
    id,
  }: {
    id: string;
  }) => (
    <PrintDeliveryOrder
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={id}
      internal={true}
    />
  ),
  // Edit Delivery
  "/inventory/internal/:type/deliveries/:id/edit": ({ id }: { id: string }) => (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={id}
      internal={true}
    />
  ),
  "/inventory/internal/receive": () => (
    <ToReceive
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      tab={"orders"}
    />
  ),
  "/inventory/internal/receive/:tab": ({ tab }: { tab: string }) => (
    <ToReceive
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      tab={tab}
    />
  ),
  "/inventory/internal/dispatch": () => (
    <ToDispatch
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      tab={"orders"}
    />
  ),
  "/inventory/internal/dispatch/:tab": ({ tab }: { tab: string }) => (
    <ToDispatch
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      tab={tab}
    />
  ),
  // List External Orders
  "/inventory/external/orders/:tab": ({ tab }: { tab: string }) => (
    <ExternalPurchasesList
      facilityId={facilityId}
      locationId={locationId}
      isRequester={tab == "outgoing"}
    />
  ),
  // Create External Order
  "/inventory/external/orders/:tab/new": () => (
    <RequestOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={false}
    />
  ),
  // View External Order
  "/inventory/external/orders/:tab/:id": ({ id }: { id: string }) => (
    <RequestOrderShow
      facilityId={facilityId}
      locationId={locationId}
      requestOrderId={id}
      internal={false}
    />
  ),
  // Edit External Order
  "/inventory/external/orders/:tab/:id/edit": ({ id }: { id: string }) => (
    <RequestOrderForm
      facilityId={facilityId}
      locationId={locationId}
      requestOrderId={id}
      internal={false}
    />
  ),
  // Print External Order
  "/inventory/external/orders/:tab/:id/print": ({ id }: { id: string }) => (
    <PrintRequestOrder
      facilityId={facilityId}
      locationId={locationId}
      requestOrderId={id}
      internal={false}
    />
  ),

  // List External Deliveries
  "/inventory/external/deliveries/:tab": ({ tab }: { tab: string }) => (
    <DeliveryOrderList
      facilityId={facilityId}
      locationId={locationId}
      internal={false}
      isRequester={tab == "incoming"}
    />
  ),
  // Create External Delivery
  "/inventory/external/deliveries/:tab/new": () => (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={false}
    />
  ),
  // View External Delivery
  "/inventory/external/deliveries/:tab/:id": ({ id }: { id: string }) => (
    <DeliveryOrderShow
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={id}
      internal={false}
    />
  ),
  // Print External Delivery
  "/inventory/external/deliveries/:tab/:id/print": ({ id }: { id: string }) => (
    <PrintDeliveryOrder
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={id}
      internal={false}
    />
  ),
  // Edit External Delivery
  "/inventory/external/deliveries/:tab/:id/edit": ({ id }: { id: string }) => (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={id}
      internal={false}
    />
  ),

  // Schedule
  "/schedule": () => (
    <ScheduleHome
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Location}
      resourceId={locationId}
    />
  ),

  // Appointments
  "/appointments": () => (
    <AppointmentsPage
      resourceType={SchedulableResourceType.Location}
      resourceId={locationId}
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
      resourceType={SchedulableResourceType.Location}
      resourceId={locationId}
    />
  ),

  // Queues
  "/queues": () => (
    <QueuesIndex
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Location}
      resourceId={locationId}
    />
  ),
  "/queues/:queueId": ({ queueId }: { queueId: string }) => (
    <Redirect
      to={`/facility/${facilityId}/locations/${locationId}/queues/${queueId}/ongoing`}
    />
  ),
  "/queues/:queueId/ongoing": ({ queueId }: { queueId: string }) => (
    <ManageQueuePage
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Location}
      resourceId={locationId}
      queueId={queueId}
      tab="ongoing"
    />
  ),

  "/queues/:queueId/completed": ({ queueId }: { queueId: string }) => (
    <ManageQueuePage
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Location}
      resourceId={locationId}
      queueId={queueId}
      tab="completed"
    />
  ),

  // Questionnaire fill for the location subject (fullscreen shell — see
  // PATHS_WITHOUT_SIDEBAR in AppRouter).
  "/questionnaire": () => (
    <QuestionnaireFillPage
      subject={{ type: "location", facilityId, locationId }}
    />
  ),
  "/questionnaire/:questionnaireId": ({
    questionnaireId,
  }: {
    questionnaireId: string;
  }) => (
    <QuestionnaireFillPage
      subject={{ type: "location", facilityId, locationId }}
      questionnaireId={questionnaireId}
    />
  ),

  "*": () => <ErrorPage />,
});

export function LocationLayout({
  facilityId,
  locationId,
}: LocationLayoutProps) {
  const basePath = `/facility/${facilityId}/locations/${locationId}`;
  const routeResult = useRoutes(getRoutes(facilityId, locationId), {
    basePath,
    routeProps: {
      facilityId,
      locationId,
    },
  });

  return (
    <div>
      <Suspense fallback={<Loading />}>{routeResult}</Suspense>
    </div>
  );
}
