import { Redirect } from "raviger";
import InventoryList from "../../Components/Facility/InventoryList";
import InventoryLog from "../../Components/Facility/InventoryLog";
import MinQuantityList from "../../Components/Facility/MinQuantityList";
import { SetInventoryForm } from "../../Components/Facility/SetInventoryForm";

export default {
  "/facility/:facilityId/inventory": ({ facilityId }: any) => (
    <InventoryList facilityId={facilityId} />
  ),
  "/facility/:facilityId/inventory/min_quantity/set": ({ facilityId }: any) => (
    <SetInventoryForm facilityId={facilityId} />
  ),
  "/facility/:facilityId/inventory/min_quantity/list": ({
    facilityId,
  }: any) => <MinQuantityList facilityId={facilityId} />,
  "/facility/:facilityId/inventory/min_quantity": ({ facilityId }: any) => (
    <Redirect to={`/facility/${facilityId}/inventory/min_quantity/list`} />
  ),
  "/facility/:facilityId/inventory/:inventoryId": ({
    facilityId,
    inventoryId,
  }: any) => <InventoryLog facilityId={facilityId} inventoryId={inventoryId} />,
};
