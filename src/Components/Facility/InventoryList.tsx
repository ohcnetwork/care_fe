import React, { useState, useCallback, useEffect } from "react";
import loadable from "@loadable/component";
import { Button } from "@material-ui/core";
import { navigate } from "raviger";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getInventorySummary, getAnyFacility } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { RoleButton } from "../Common/RoleButton";
import { classNames } from "../../Utils/utils";
const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

export default function InventoryList(props: any) {
  const { facilityId }: any = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const initialInventory: any[] = [];
  let inventoryItem: any = null;
  const [inventory, setInventory] = useState(initialInventory);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [facilityName, setFacilityName] = useState("");
  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getInventorySummary(facilityId, { limit, offset })
      );
      if (!status.aborted) {
        if (res && res.data) {
          setInventory(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset, facilityId]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  useEffect(() => {
    async function fetchFacilityName() {
      if (facilityId) {
        const res = await dispatchAction(getAnyFacility(facilityId));

        setFacilityName(res?.data?.name || "");
      } else {
        setFacilityName("");
      }
    }
    fetchFacilityName();
  }, [dispatchAction, facilityId]);

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  let inventoryList: any = [];
  if (inventory && inventory.length) {
    inventoryList = inventory.map((inventoryItem: any) => (
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
                <span className="ml-2 badge badge badge-danger">Low Stock</span>
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
      </tr>
    ));
  } else if (inventory && inventory.length === 0) {
    inventoryList = (
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
    );
  }

  if (isLoading || !inventory) {
    inventoryItem = <Loading />;
  } else if (inventory) {
    inventoryItem = (
      <>
        <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
          <div className="inline-block min-w-full">
            <table className="min-w-full leading-normal shadow rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>{inventoryList}</tbody>
            </table>
          </div>
        </div>
        {totalCount > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
      </>
    );
  }

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
          {inventoryItem}
        </div>
      </div>
    </div>
  );
}
