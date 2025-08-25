import { Redirect, useRoutes } from "raviger";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { ScheduleHome } from "@/components/Schedule/ScheduleHome";
import BedsList from "@/pages/Facility/locations/BedsList";
import { InventoryList } from "@/pages/Facility/services/inventory/InventoryList";
import { ReceiveStock } from "@/pages/Facility/services/inventory/ReceiveStock";
import SupplyRequestForm from "@/pages/Facility/services/inventory/SupplyRequestForm";
import { IncomingDeliveries } from "@/pages/Facility/services/inventory/externalSupply/IncomingDeliveries";
import { PurchaseOrders } from "@/pages/Facility/services/inventory/externalSupply/PurchaseOrders";
import PurchaseOrdersBySupplier from "@/pages/Facility/services/inventory/externalSupply/PurchaseOrdersBySupplier";
import ReceiveItem from "@/pages/Facility/services/inventory/internalTransfer/ReceiveItem";
import SupplyRequestDetail from "@/pages/Facility/services/inventory/internalTransfer/SupplyRequestDetail";
import SupplyRequestDispatch from "@/pages/Facility/services/inventory/internalTransfer/SupplyRequestDispatch";
import ToDispatch from "@/pages/Facility/services/inventory/internalTransfer/ToDispatch";
import ToReceive from "@/pages/Facility/services/inventory/internalTransfer/ToReceive";
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
    <ToReceive facilityId={facilityId} locationId={locationId} />
  ),
  "/internal_transfers/to_receive/raise_stock_request": () => (
    <SupplyRequestForm
      facilityId={facilityId}
      locationId={locationId}
      mode="internal"
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
  "/internal_transfers/to_dispatch": () => (
    <ToDispatch facilityId={facilityId} locationId={locationId} />
  ),

  "/internal_transfers/to_dispatch/:id": ({ id }: { id: string }) => (
    <SupplyRequestDispatch
      facilityId={facilityId}
      locationId={locationId}
      supplyRequestId={id}
    />
  ),

  "/internal_transfers/requests/:id": ({ id }: { id: string }) => (
    <SupplyRequestDetail
      facilityId={facilityId}
      locationId={locationId}
      id={id}
      mode="internal"
    />
  ),
  "/internal_transfers/requests/:id/edit": ({ id }: { id: string }) => (
    <SupplyRequestForm
      facilityId={facilityId}
      locationId={locationId}
      supplyRequestId={id}
      mode="internal"
    />
  ),

  // Inventory - External Supply
  "/external_supply/purchase_orders": () => (
    <PurchaseOrders facilityId={facilityId} locationId={locationId} />
  ),
  "/external_supply/purchase_orders/new": () => (
    <SupplyRequestForm
      facilityId={facilityId}
      locationId={locationId}
      mode="external"
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

  "/external_supply/purchase_orders/supplier/:supplierId": ({
    supplierId,
  }: {
    supplierId: string;
  }) => (
    <PurchaseOrdersBySupplier
      facilityId={facilityId}
      locationId={locationId}
      supplierId={supplierId}
    />
  ),
  "/external_supply/purchase_orders/:id": ({ id }: { id: string }) => (
    <SupplyRequestDetail
      facilityId={facilityId}
      locationId={locationId}
      id={id}
      mode="external"
    />
  ),
  "/external_supply/purchase_orders/:id/edit": ({ id }: { id: string }) => (
    <SupplyRequestForm
      facilityId={facilityId}
      locationId={locationId}
      supplyRequestId={id}
      mode="external"
    />
  ),
  "/external_supply/inward_entry": () => (
    <IncomingDeliveries facilityId={facilityId} locationId={locationId} />
  ),
  "/external_supply/inward_entry/receive": () => (
    <ReceiveStock facilityId={facilityId} locationId={locationId} />
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

  "/medication_requests/patient/:patientId/pending": ({
    patientId,
  }: {
    patientId: string;
  }) => (
    <PrescriptionsView
      facilityId={facilityId}
      patientId={patientId}
      tab={PharmacyMedicationTab.PENDING}
    />
  ),
  "/medication_requests/patient/:patientId/print": ({
    patientId,
  }: {
    patientId: string;
  }) => (
    <PrintPharmacyPrescription facilityId={facilityId} patientId={patientId} />
  ),
  "/medication_requests/patient/:patientId/partial": ({
    patientId,
  }: {
    patientId: string;
  }) => (
    <PrescriptionsView
      facilityId={facilityId}
      patientId={patientId}
      tab={PharmacyMedicationTab.PARTIAL}
    />
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
