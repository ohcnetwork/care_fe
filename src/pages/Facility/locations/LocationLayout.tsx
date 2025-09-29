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
import ReceiveItem from "@/pages/Facility/services/inventory/internalTransfer/ReceiveItem";

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
  "/inventory": () => (
    <InventoryList facilityId={facilityId} locationId={locationId} />
  ),

  // Inventory - Internal Transfers
  "/internal_transfers/to_receive": () => (
    <RequestOrderList
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      isRequester={true}
    />
  ),
  "/internal_transfers/received": () => (
    <DeliveryOrderList
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      isRequester={false}
    />
  ),
  "/internal_transfers/to_receive/:deliveryId": ({
    deliveryId,
  }: {
    deliveryId: string;
  }) => (
    <ReceiveItem
      facilityId={facilityId}
      locationId={locationId}
      deliveryId={deliveryId}
      mode="internal"
    />
  ),
  "/internal_transfers/request_orders/new": () => (
    <RequestOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
    />
  ),
  "/internal_transfers/request_orders/:id/edit": ({ id }: { id: string }) => (
    <RequestOrderForm
      facilityId={facilityId}
      locationId={locationId}
      requestOrderId={id}
      internal={true}
    />
  ),
  "/internal_transfers/request_orders/:id": ({ id }: { id: string }) => (
    <RequestOrderShow
      facilityId={facilityId}
      requestOrderId={id}
      internal={true}
    />
  ),
  "/internal_transfers/to_dispatch": () => (
    <RequestOrderList
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      isRequester={false}
    />
  ),
  "/internal_transfers/dispatched": () => (
    <DeliveryOrderList
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      isRequester={true}
    />
  ),
  "/internal_transfers/delivery_orders": () => (
    <DeliveryOrderList
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      isRequester={true}
    />
  ),
  "/internal_transfers/delivery_orders/new": () => (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
    />
  ),
  "/internal_transfers/delivery_orders/:id/edit": ({ id }: { id: string }) => (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      deliveryOrderId={id}
    />
  ),
  "/internal_transfers/delivery_orders/:id": ({ id }: { id: string }) => (
    <DeliveryOrderShow facilityId={facilityId} deliveryOrderId={id} />
  ),
  // "/internal_transfers/create_delivery": () => (
  //   <SupplyDeliveryCreate facilityId={facilityId} locationId={locationId} />
  // ),
  // "/internal_transfers/to_dispatch/delivery/:id": ({ id }: { id: string }) => (
  //   <SupplyRequestDispatch
  //     facilityId={facilityId}
  //     locationId={locationId}
  //     supplyDeliveryId={id}
  //   />
  // ),
  // "/internal_transfers/to_dispatch/:id": ({ id }: { id: string }) => (
  //   <SupplyRequestDispatch
  //     facilityId={facilityId}
  //     locationId={locationId}
  //     supplyRequestId={id}
  //   />
  // ),

  // "/internal_transfers/requests/:id": ({ id }: { id: string }) => (
  //   <SupplyRequestDetail
  //     facilityId={facilityId}
  //     locationId={locationId}
  //     id={id}
  //     mode="internal"
  //   />
  // ),
  // "/internal_transfers/requests/:id/edit": ({ id }: { id: string }) => (
  //   <SupplyRequestForm
  //     facilityId={facilityId}
  //     locationId={locationId}
  //     supplyRequestId={id}
  //     mode="internal"
  //   />
  // ),

  // Inventory - External Supply
  // "/external_supply/purchase_orders": () => (
  //   <PurchaseOrders facilityId={facilityId} locationId={locationId} />
  // ),
  // "/external_supply/purchase_orders/new": () => (
  //   <SupplyRequestForm
  //     facilityId={facilityId}
  //     locationId={locationId}
  //     mode="external"
  //   />
  // ),
  "/external_supply/request_orders/new": () => (
    <RequestOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={false}
    />
  ),
  "/external_supply/request_orders/:id/edit": ({ id }: { id: string }) => (
    <RequestOrderForm
      facilityId={facilityId}
      locationId={locationId}
      requestOrderId={id}
      internal={false}
    />
  ),
  "/external_supply/request_orders": () => (
    <RequestOrderList
      facilityId={facilityId}
      locationId={locationId}
      internal={false}
      isRequester={true}
    />
  ),
  "/external_supply/request_orders/:id": ({ id }: { id: string }) => (
    <RequestOrderShow
      facilityId={facilityId}
      requestOrderId={id}
      internal={false}
    />
  ),
  "/external_supply/deliveries/:id": ({ id }: { id: string }) => (
    <ReceiveItem
      facilityId={facilityId}
      locationId={locationId}
      deliveryId={id}
      mode="external"
    />
  ),

  // "/external_supply/purchase_orders/supplier/:supplierId": ({
  //   supplierId,
  // }: {
  //   supplierId: string;
  // }) => (
  //   <PurchaseOrdersBySupplier
  //     facilityId={facilityId}
  //     locationId={locationId}
  //     supplierId={supplierId}
  //   />
  // ),
  // "/external_supply/purchase_orders/:id": ({ id }: { id: string }) => (
  //   <SupplyRequestDetail
  //     facilityId={facilityId}
  //     locationId={locationId}
  //     id={id}
  //     mode="external"
  //   />
  // ),
  // "/external_supply/purchase_orders/:id/edit": ({ id }: { id: string }) => (
  //   <SupplyRequestForm
  //     facilityId={facilityId}
  //     locationId={locationId}
  //     supplyRequestId={id}
  //     mode="external"
  //   />
  // ),
  "/external_supply/delivery_orders": () => (
    <DeliveryOrderList
      facilityId={facilityId}
      locationId={locationId}
      internal={false}
      isRequester={false}
    />
  ),
  "/external_supply/delivery_orders/new": () => (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={false}
    />
  ),
  "/external_supply/delivery_orders/:id/edit": ({ id }: { id: string }) => (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={false}
      deliveryOrderId={id}
    />
  ),
  "/external_supply/delivery_orders/:id": ({ id }: { id: string }) => (
    <DeliveryOrderShow facilityId={facilityId} deliveryOrderId={id} />
  ),

  // "/external_supply/inward_entry/receive": () => (
  //   <ReceiveStock facilityId={facilityId} locationId={locationId} />
  // ),

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
