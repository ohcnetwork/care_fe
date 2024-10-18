import { Redirect } from "raviger";
import InventoryList from "../../Components/Facility/InventoryList";
import InventoryLog from "../../Components/Facility/InventoryLog";
import MinQuantityList from "../../Components/Facility/MinQuantityList";
import { SetInventoryForm } from "../../Components/Facility/SetInventoryForm";
import { AppRoutes } from "../AppRouter";

const FacilityInventoryRoutes: AppRoutes = {
  "/facility/:facilityId/inventory": ({ facilityId }) => (
    <InventoryList facilityId={facilityId} />
  ),
  "/facility/:facilityId/inventory/min_quantity/set": ({ facilityId }) => (
    <SetInventoryForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/inventory/min_quantity/list": ({ facilityId }) => (
    <MinQuantityList facilityId={facilityId} />
  ),
  "/facility/:facilityId/inventory/min_quantity": ({ facilityId }) => (
    <Redirect to={`/facility/${facilityId}/inventory/min_quantity/list`} />
  ),
  "/facility/:facilityId/inventory/:inventoryId": ({
    facilityId,
    inventoryId,
  }) => <InventoryLog facilityId={facilityId} inventoryId={inventoryId} />,
};

export default FacilityInventoryRoutes;
