import { useState, useCallback, useEffect } from "react";
import loadable from "@loadable/component";
import { Button } from "@material-ui/core";
import { navigate } from "raviger";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getInventorySummary, getAnyFacility } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { RoleButton } from "../Common/RoleButton";
import { classNames } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import SetInventoryModal from "./SetInventoryModal";
const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

interface IInventoryTableProps {
  facilityId: string;
}

const InventoryTable = ({ facilityId }: IInventoryTableProps) => {
  const LIMIT = 14;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showSetInventoryModal, setShowSetInventoryModal] = useState(false);
  const [currentInventoryItem, setCurrentInventoryItem] = useState();
  const [inventoryAction, setInventoryAction] = useState<"use" | "add">("use");

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        getInventorySummary(facilityId, { page: currentPage })
      );
      if (!status.aborted) {
        if (res && res.data) {
          setInventory(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatch, facilityId, currentPage]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  console.log(inventory);

  if (isLoading || !inventory) return <Loading />;
  return (
    <>
      <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="min-w-full leading-normal shadow rounded-lg overflow-hidden">
            <thead>
              <tr>
                {["Name", "Available Stock", "Min Required", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {inventory && inventory.length ? (
                inventory.map((inventoryItem: any) => (
                  <tr
                    key={inventoryItem.id}
                    className={classNames(
                      "cursor-pointer hover:bg-gray-200",
                      inventoryItem.is_low ? "bg-red-100" : "bg-white"
                    )}
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/inventory/${inventoryItem.item_object?.id}`
                      )
                    }
                  >
                    <td className="px-5 py-5 border-b border-gray-200 text-sm ">
                      <div className="flex items-center">
                        <p className="text-gray-900 whitespace-nowrap">
                          {inventoryItem.item_object?.name}
                          {inventoryItem.is_low && (
                            <span className="ml-2 badge badge badge-danger">
                              Low Stock
                            </span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm ">
                      <p className="text-gray-900 whitespace-nowrap lowercase">
                        {inventoryItem.quantity}{" "}
                        {inventoryItem.item_object?.default_unit?.name}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm ">
                      <p className="text-gray-900 whitespace-nowrap">
                        {/* TODO: add minimum quantity required */}
                        <span className="text-gray-700">Not Set</span>
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 text-sm ">
                      <div className="flex items-center gap-2">
                        <ButtonV2
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentInventoryItem(inventoryItem);
                            setInventoryAction("add");
                            setShowSetInventoryModal(true);
                          }}
                        >
                          Add
                        </ButtonV2>
                        <ButtonV2
                          variant="warning"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentInventoryItem(inventoryItem);
                            setInventoryAction("use");
                            setShowSetInventoryModal(true);
                          }}
                        >
                          Use
                        </ButtonV2>
                        <ButtonV2
                          variant="alert"
                          onClick={() => console.log("")}
                        >
                          Set Min
                        </ButtonV2>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="bg-white">
                  <td
                    colSpan={3}
                    className="px-5 py-5 border-b border-gray-200 text-center"
                  >
                    <p className="text-gray-500 whitespace-nowrap">
                      No inventory available
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <SetInventoryModal
        facilityId={facilityId}
        action={inventoryAction}
        show={showSetInventoryModal}
        item={currentInventoryItem}
        onClose={() => setShowSetInventoryModal(false)}
      />
      {totalCount > LIMIT && (
        <div className="mt-4 flex w-full justify-center">
          <Pagination
            cPage={currentPage}
            defaultPerPage={LIMIT}
            data={{ totalCount }}
            onChange={(page: number) => setCurrentPage(page)}
          />
        </div>
      )}
    </>
  );
};

export default function InventoryList(props: any) {
  const { facilityId }: any = props;
  const dispatch: any = useDispatch();
  const [facilityName, setFacilityName] = useState("");

  useEffect(() => {
    async function fetchFacilityName() {
      if (facilityId) {
        const res = await dispatch(getAnyFacility(facilityId));

        setFacilityName(res?.data?.name || "");
      } else {
        setFacilityName("");
      }
    }
    fetchFacilityName();
  }, [dispatch, facilityId]);

  return (
    <div>
      <PageTitle
        title="Inventory Manager"
        className="mx-3 md:mx-8"
        crumbsReplacements={{ [facilityId]: { name: facilityName } }}
      />
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-4 md:py-8">
          <div className="flex flex-col md:flex-row">
            <div className="mt-2">
              <RoleButton
                className="w-full"
                materialButtonProps={{
                  variant: "contained",
                  color: "primary",
                  size: "small",
                }}
                handleClickCB={() =>
                  navigate(`/facility/${facilityId}/inventory/add`)
                }
                disableFor="readOnly"
                buttonType="materialUI"
              >
                Manage Inventory
              </RoleButton>
            </div>
            <div className="mt-2">
              <Button
                className="md:ml-2 w-full"
                variant="contained"
                color="primary"
                size="small"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/inventory/min_quantity/list`
                  )
                }
              >
                Minimum Quantity Required
              </Button>
            </div>
          </div>
          <InventoryTable facilityId={facilityId} />
        </div>
      </div>
    </div>
  );
}
