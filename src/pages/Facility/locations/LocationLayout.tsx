import { Redirect, useRoutes } from "raviger";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import BedsList from "@/pages/Facility/locations/BedsList";
import { InventoryList } from "@/pages/Facility/services/inventory/InventoryList";
import { ReceiveStock } from "@/pages/Facility/services/inventory/ReceiveStock";
import { ApproveExternalSupplyDelivery } from "@/pages/Facility/services/inventory/externalSupply/ApproveDeliveries";
import { IncomingDeliveries } from "@/pages/Facility/services/inventory/externalSupply/IncomingDeliveries";
import { PurchaseOrderForm } from "@/pages/Facility/services/inventory/externalSupply/PurchaseOrderForm";
import { PurchaseOrders } from "@/pages/Facility/services/inventory/externalSupply/PurchaseOrders";
import DispensesView from "@/pages/Facility/services/pharmacy/DispensesView";
import MedicationBillForm from "@/pages/Facility/services/pharmacy/MedicationBillForm";
import MedicationDispenseHistory from "@/pages/Facility/services/pharmacy/MedicationDispenseHistory";
import MedicationRequestList from "@/pages/Facility/services/pharmacy/MedicationRequestList";
import PrescriptionsView, {
  PharmacyMedicationTab,
} from "@/pages/Facility/services/pharmacy/PrescriptionsView";
import ServiceRequestList from "@/pages/Facility/services/serviceRequests/ServiceRequestList";
import ServiceRequestShow from "@/pages/Facility/services/serviceRequests/ServiceRequestShow";
import SupplyDeliveryForm from "@/pages/Facility/services/supply/SupplyDeliveryForm";
import SupplyDeliveryList, {
  SupplyDeliveryTab,
} from "@/pages/Facility/services/supply/SupplyDeliveryList";
import SupplyDeliveryView from "@/pages/Facility/services/supply/SupplyDeliveryView";
import SupplyRequestForm from "@/pages/Facility/services/supply/SupplyRequestForm";
import SupplyRequestList, {
  SupplyRequestTab,
} from "@/pages/Facility/services/supply/SupplyRequestList";
import SupplyRequestView from "@/pages/Facility/services/supply/SupplyRequestView";
import { MedicationDispenseStatus } from "@/types/emr/medicationDispense/medicationDispense";

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
  "/supply_requests": () => (
    <Redirect
      to={`/facility/${facilityId}/locations/${locationId}/supply_requests/incoming`}
    />
  ),
  "/supply_requests/new": () => (
    <SupplyRequestForm facilityId={facilityId} locationId={locationId} />
  ),
  "/supply_requests/incoming": () => (
    <SupplyRequestList
      facilityId={facilityId}
      locationId={locationId}
      tab={SupplyRequestTab.INCOMING}
    />
  ),
  "/supply_requests/requested": () => (
    <SupplyRequestList
      facilityId={facilityId}
      locationId={locationId}
      tab={SupplyRequestTab.REQUESTED}
    />
  ),
  "/supply_requests/:id": ({ id }: { id: string }) => (
    <SupplyRequestView
      facilityId={facilityId}
      locationId={locationId}
      supplyRequestId={id}
    />
  ),
  "/supply_requests/:id/edit": ({ id }: { id: string }) => (
    <SupplyRequestForm
      facilityId={facilityId}
      locationId={locationId}
      supplyRequestId={id}
    />
  ),

  // Supply Delivery Routes
  "/supply_deliveries": () => (
    <Redirect
      to={`/facility/${facilityId}/locations/${locationId}/supply_deliveries/incoming`}
    />
  ),
  "/supply_deliveries/new": () => (
    <SupplyDeliveryForm facilityId={facilityId} locationId={locationId} />
  ),
  "/supply_deliveries/incoming": () => (
    <SupplyDeliveryList
      facilityId={facilityId}
      locationId={locationId}
      tab={SupplyDeliveryTab.INCOMING}
    />
  ),
  "/supply_deliveries/outgoing": () => (
    <SupplyDeliveryList
      facilityId={facilityId}
      locationId={locationId}
      tab={SupplyDeliveryTab.OUTGOING}
    />
  ),
  "/supply_deliveries/:id": ({ id }: { id: string }) => (
    <SupplyDeliveryView
      facilityId={facilityId}
      locationId={locationId}
      supplyDeliveryId={id}
    />
  ),

  // Inventory - External Supply
  "/external_supply/purchase_orders": () => (
    <PurchaseOrders facilityId={facilityId} locationId={locationId} />
  ),
  "/external_supply/purchase_orders/new": () => (
    <PurchaseOrderForm facilityId={facilityId} locationId={locationId} />
  ),
  "/external_supply/purchase_orders/:id": ({ id }: { id: string }) => (
    <SupplyRequestView
      facilityId={facilityId}
      locationId={locationId}
      supplyRequestId={id}
    />
  ),
  "/external_supply/incoming_deliveries": () => (
    <IncomingDeliveries facilityId={facilityId} locationId={locationId} />
  ),
  "/external_supply/receive": () => (
    <ReceiveStock facilityId={facilityId} locationId={locationId} />
  ),
  "/external_supply/incoming_deliveries/approve": () => (
    <ApproveExternalSupplyDelivery
      facilityId={facilityId}
      locationId={locationId}
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
