import { Redirect, useRoutes } from "raviger";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { ScheduleHome } from "@/components/Schedule/ScheduleHome";
import AppointmentDetail from "@/pages/Appointments/AppointmentDetail";
import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import PrintAppointments from "@/pages/Appointments/components/PrintAppointments";
import BedsList from "@/pages/Facility/locations/BedsList";
import { ManageQueuePage } from "@/pages/Facility/queues/ManageQueue";
import QueuesIndex from "@/pages/Facility/queues/QueuesIndex";
import { InventoryList } from "@/pages/Facility/services/inventory/InventoryList";
// import { ReceiveStock } from "@/pages/Facility/services/inventory/ReceiveStock";

import RequestOrderForm from "@/pages/Facility/services/inventory/externalSupply/requestOrder/RequestOrderForm";
import { RequestOrderList } from "@/pages/Facility/services/inventory/externalSupply/requestOrder/RequestOrderList";
import { RequestOrderShow } from "@/pages/Facility/services/inventory/externalSupply/requestOrder/RequestOrderShow";

import DeliveryOrderForm from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderForm";
import { DeliveryOrderList } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderList";
import { DeliveryOrderShow } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderShow";
import DispensesView from "@/pages/Facility/services/pharmacy/DispensesView";
import MedicationBillForm from "@/pages/Facility/services/pharmacy/MedicationBillForm";
import MedicationDispenseHistory from "@/pages/Facility/services/pharmacy/MedicationDispenseHistory";
import MedicationRequestList from "@/pages/Facility/services/pharmacy/MedicationRequestList";
import PrescriptionsView, {
  PharmacyMedicationTab,
} from "@/pages/Facility/services/pharmacy/PrescriptionsView";
import { PrintPharmacyPrescription } from "@/pages/Facility/services/pharmacy/PrintPharmacyPrescription";
import ServiceRequestList from "@/pages/Facility/services/serviceRequests/ServiceRequestList";
import ServiceRequestShow from "@/pages/Facility/services/serviceRequests/ServiceRequestShow";
import { MedicationDispenseStatus } from "@/types/emr/medicationDispense/medicationDispense";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

interface LocationLayoutProps {
  facilityId: string;
  locationId: string;
}

const getRoutes = (facilityId: string, locationId: string) => ({
  // Beds
  "/beds": () => <BedsList facilityId={facilityId} locationId={locationId} />,
  // Pharmacy
  "/medication_requests": () => (
    <MedicationRequestList facilityId={facilityId} locationId={locationId} />
  ),
  "/medication_dispense": () => (
    <MedicationDispenseHistory
      facilityId={facilityId}
      locationId={locationId}
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

  // List Orders
  "/inventory/:group/orders/:tab": ({
    group,
    tab,
  }: {
    group: string;
    tab: string;
  }) => (
    <RequestOrderList
      facilityId={facilityId}
      locationId={locationId}
      internal={group === "internal"}
      isRequester={tab == "outgoing"}
    />
  ),
  // Create Order
  "/inventory/:group/orders/:tab/new": ({ group }: { group: string }) => (
    <RequestOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={group === "internal"}
    />
  ),
  // View Order
  "/inventory/:group/orders/:tab/:id": ({
    group,
    id,
  }: {
    group: string;
    id: string;
  }) => (
    <RequestOrderShow
      facilityId={facilityId}
      locationId={locationId}
      requestOrderId={id}
      internal={group === "internal"}
    />
  ),
  // Edit Order
  "/inventory/:group/orders/:tab/:id/edit": ({
    group,
    id,
  }: {
    group: string;
    id: string;
  }) => (
    <RequestOrderForm
      facilityId={facilityId}
      locationId={locationId}
      requestOrderId={id}
      internal={group === "internal"}
    />
  ),

  // List Deliveries
  "/inventory/:group/deliveries/:tab": ({
    group,
    tab,
  }: {
    group: string;
    tab: string;
  }) => (
    <DeliveryOrderList
      facilityId={facilityId}
      locationId={locationId}
      internal={group === "internal"}
      isRequester={tab == "incoming"}
    />
  ),
  // Create Delivery
  "/inventory/:group/deliveries/:tab/new": ({ group }: { group: string }) => (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={group === "internal"}
    />
  ),
  // View Delivery
  "/inventory/:group/deliveries/:tab/:id": ({
    group,
    id,
  }: {
    group: string;
    id: string;
  }) => (
    <DeliveryOrderShow
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={id}
      internal={group === "internal"}
    />
  ),
  // Edit Delivery
  "/inventory/:group/deliveries/:tab/:id/edit": ({
    group,
    id,
  }: {
    group: string;
    id: string;
  }) => (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={id}
      internal={group === "internal"}
    />
  ),

  "/medication_requests/patient/:patientId": ({
    patientId,
  }: {
    patientId: string;
  }) => (
    <Redirect
      to={`/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${patientId}/pending`}
    />
  ),

  "/medication_requests/patient/:patientId/prescription/:prescriptionId": ({
    patientId,
    prescriptionId,
  }: {
    patientId: string;
    prescriptionId: string;
  }) => (
    <PrescriptionsView
      facilityId={facilityId}
      patientId={patientId}
      tab={PharmacyMedicationTab.PENDING}
      prescriptionId={prescriptionId}
    />
  ),
  "/medication_requests/patient/:patientId/print": ({
    patientId,
  }: {
    patientId: string;
  }) => (
    <PrintPharmacyPrescription facilityId={facilityId} patientId={patientId} />
  ),

  "/medication_dispense/patient/:patientId/:status": ({
    patientId,
    status,
  }: {
    patientId: string;
    status: string;
  }) => (
    <DispensesView
      facilityId={facilityId}
      patientId={patientId}
      status={status as MedicationDispenseStatus}
    />
  ),

  "/medication_requests/patient/:patientId/bill": ({
    patientId,
  }: {
    patientId: string;
  }) => <MedicationBillForm patientId={patientId} />,

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

  return <div>{routeResult}</div>;
}
