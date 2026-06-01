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

import { ExternalPurchasesList } from "@/pages/Facility/services/inventory/externalSupply/requestOrder/ExternalPurchasesList";
import RequestOrderForm from "@/pages/Facility/services/inventory/externalSupply/requestOrder/RequestOrderForm";
import { RequestOrderShow } from "@/pages/Facility/services/inventory/externalSupply/requestOrder/RequestOrderShow";

import DeliveryOrderForm from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderForm";
import { DeliveryOrderList } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderList";
import { DeliveryOrderShow } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderShow";
import { PrintDeliveryOrder } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder";
import { PrintRequestOrder } from "@/pages/Facility/services/inventory/externalSupply/requestOrder/PrintRequestOrder";
import { ToDispatch } from "@/pages/Facility/services/inventory/ToDispatch";
import { ToReceive } from "@/pages/Facility/services/inventory/ToReceive";
import BillMedicationsByDispenseOrder from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsByDispenseOrder";
import BillMedicationsByNewDispense from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsByNewDispense";
import BillMedicationsByPrescriptions from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsByPrescriptions";
import DispenseOrderCompleted from "@/pages/Facility/services/pharmacy/DispenseOrderCompleted";
import { DispenseOrderView } from "@/pages/Facility/services/pharmacy/DispenseOrderView";
import MedicationDispenseHistory from "@/pages/Facility/services/pharmacy/MedicationDispenseHistory";
import MedicationReturnList from "@/pages/Facility/services/pharmacy/MedicationReturnList";
import MedicationReturnShow from "@/pages/Facility/services/pharmacy/MedicationReturnShow";
import PrescriptionQueue from "@/pages/Facility/services/pharmacy/PrescriptionQueue";
import PrescriptionsPreviewPage from "@/pages/Facility/services/pharmacy/PrescriptionsPreviewPage";
import PrescriptionsView, {
  PharmacyMedicationTab,
} from "@/pages/Facility/services/pharmacy/PrescriptionsView";
import { PrintDispenseOrder } from "@/pages/Facility/services/pharmacy/PrintDispenseOrder";
import { PrintMedicationReturn } from "@/pages/Facility/services/pharmacy/PrintMedicationReturn";
import ServiceRequestList from "@/pages/Facility/services/serviceRequests/ServiceRequestList";
import ServiceRequestShow from "@/pages/Facility/services/serviceRequests/ServiceRequestShow";
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
  "/medication_requests/patient/:patientId/bill/dispense_order/:dispenseOrderId":
    ({
      patientId,
      dispenseOrderId,
    }: {
      patientId: string;
      dispenseOrderId: string;
    }) => (
      <BillMedicationsByDispenseOrder
        facilityId={facilityId}
        locationId={locationId}
        patientId={patientId}
        dispenseOrderId={dispenseOrderId}
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
