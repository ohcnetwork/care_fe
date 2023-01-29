import React, { useState, useCallback, useEffect } from "react";
import loadable from "@loadable/component";
import * as Notification from "../../Utils/Notifications.js";
import { useDispatch } from "react-redux";
import {
  getInventoryLog,
  flagInventoryItem,
  deleteLastInventoryLog,
  getAnyFacility,
} from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";
import Pagination from "../Common/Pagination";
import { Tooltip } from "@material-ui/core";
import { formatDate } from "../../Utils/utils";
const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

export default function InventoryLog(props: any) {
  const { facilityId, inventoryId }: any = props;

  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialInventory: any[] = [];
  let inventoryItem: any = null;
  const [inventory, setInventory] = useState(initialInventory);
  const [current_stock, setCurrentStock] = useState(0);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 14;
  const item = inventoryId;
  const [itemName, setItemName] = useState(" ");
  const [facilityName, setFacilityName] = useState("");

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getInventoryLog(facilityId, { item, limit, offset })
      );
      if (!status.aborted) {
        if (res && res.data) {
          setInventory(res.data.results);
          setCurrentStock(res.data.results[0].current_stock);
          setTotalCount(res.data.count);
          setItemName(res.data.results[0].item_object.name);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset, facilityId]
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

  const flagFacility = async (id: string) => {
    setSaving(true);
    const res = await dispatchAction(
      flagInventoryItem({ facility_external_id: facilityId, external_id: id })
    );

    if (res && res.status === 204) {
      Notification.Success({
        msg: "Updated Successfully",
      });
      fetchData({ aborted: false });
    }
    setSaving(false);
  };

  const removeLastInventoryLog = async (id: any) => {
    setSaving(true);
    const res = await dispatchAction(
      deleteLastInventoryLog({
        facility_external_id: facilityId,
        id: id,
      })
    );

    if (res?.status === 201) {
      Notification.Success({
        msg: "Last entry deleted Successfully",
      });
      fetchData({ aborted: false });
    } else {
      Notification.Error({
        msg: "Error while deleting last entry: " + (res?.data?.detail || ""),
      });
    }
    setSaving(false);
  };

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );
  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  let inventoryList: any = [];
  if (inventory && inventory.length) {
    inventoryList = inventory.map((inventoryItem: any) => (
      <tr key={inventoryItem.id} className="bg-white">
        <td className="px-5 py-5 border-b border-gray-200 text-sm hover:bg-gray-100">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-gray-900 whitespace-nowrap">
                {formatDate(inventoryItem.created_date)}
              </p>
            </div>
          </div>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm hover:bg-gray-100">
          <p className="text-gray-900 whitespace-nowrap lowercase">
            {inventoryItem.quantity_in_default_unit}{" "}
            {inventoryItem.item_object?.default_unit?.name}
            {inventoryItem.probable_accident && (
              <i className="fas fa-exclamation-triangle pl-2 text-orange-500"></i>
            )}
          </p>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm hover:bg-gray-100">
          <p className="text-gray-900 whitespace-nowrap lowercase">
            {inventoryItem.is_incoming ? (
              <span className="ml-2 text-primary-600">Added Stock</span>
            ) : (
              <span className="ml-2 text-red-600">Used Stock</span>
            )}
          </p>
        </td>
        <td>
          <Tooltip
            title={
              inventoryItem.probable_accident ? (
                <div className="text-sm leading-snug text-justify">
                  <b>Unmarks this transaction as accident</b>
                  <br />
                  This action will not affect the total stock.
                </div>
              ) : (
                <div className="text-sm leading-snug text-justify">
                  <b>Marks this transaction as accident</b>
                  <br />
                  This action will not affect the total stock. To delete the
                  transaction, create another transaction that undos the effect
                  of this, or click <i>Delete Last Entry</i>.
                </div>
              )
            }
            arrow={true}
          >
            <button
              onClick={(_) => flagFacility(inventoryItem.external_id)}
              disabled={saving}
              className="btn btn-default"
            >
              {inventoryItem.probable_accident ? (
                <span className="text-primary-500">
                  <i className="fas fa-exclamation-triangle pr-2"></i>UnMark
                </span>
              ) : (
                <span className="text-red-500">
                  <i className="fas fa-exclamation-circle pr-2"></i>
                  Mark as Accident
                </span>
              )}
            </button>
          </Tooltip>
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
            No log for this inventory available
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
                    Created On
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Actions
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
        title="Inventory Log"
        className="mx-3 md:mx-8"
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [inventoryId]: { name: itemName },
        }}
      />
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8 ">
          <div className="flex justify-between">
            <h4>Item: {itemName}</h4>
            {current_stock > 0 && (
              <Tooltip
                title={
                  <div className="text-sm leading-snug text-justify">
                    <b>Deletes the last transaction</b> by creating an
                    equivalent undo transaction and marks both the transactions
                    as accident.
                  </div>
                }
                arrow={true}
              >
                <button
                  onClick={(_) =>
                    removeLastInventoryLog(inventory[0].item_object.id)
                  }
                  disabled={saving}
                  className="btn btn-default"
                >
                  <span className="text-red-500">
                    <i className="fas fa-exclamation-circle pr-2"></i>
                    Delete Last Entry
                  </span>
                </button>
              </Tooltip>
            )}
          </div>
          {inventoryItem}
        </div>
      </div>
    </div>
  );
}
