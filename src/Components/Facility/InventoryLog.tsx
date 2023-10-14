import { useState, useEffect, lazy } from "react";

import * as Notification from "../../Utils/Notifications.js";
import Pagination from "../Common/Pagination";
import { formatDateTime } from "../../Utils/utils";
import Page from "../Common/components/Page.js";
import CareIcon from "../../CAREUI/icons/CareIcon.js";
import ButtonV2 from "../Common/components/ButtonV2.js";
import useQuery from "../../Utils/request/useQuery.js";
import routes from "../../Redux/api.js";
import request from "../../Utils/request/request.js";
const Loading = lazy(() => import("../Common/Loading"));

export default function InventoryLog(props: any) {
  const { facilityId, inventoryId }: any = props;

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

  const { res, data, refetch } = useQuery(routes.getInventoryLog, {
    body: {
      item: item,
      limit: limit,
      name: facilityName,
      offset: offset,
    },
    pathParams: {
      id: facilityId,
    },
  });

  useEffect(() => {
    setIsLoading(true);
    if (data) {
      setInventory(data.results);
      setCurrentStock(data.results[0].current_stock);
      setTotalCount(data.count);
      setItemName(data.results[0].item_object.name);
    }
    setIsLoading(false);
  }, [offset, facilityId, res, data]);

  useEffect(() => {
    async function fetchFacilityName() {
      if (facilityId) {
        const { res, data } = await request(routes.getAnyFacility, {
          pathParams: {
            id: facilityId,
          },
        });

        if (res && data) setFacilityName(data.name || "");
      } else {
        setFacilityName("");
      }
    }
    fetchFacilityName();
  }, [facilityId]);

  const flagFacility = async (id: string) => {
    setSaving(true);
    // request body is not given in the dispath call
    const { res } = await request(routes.flagInventoryItem, {
      body: {},
      pathParams: {
        facility_external_id: facilityId,
        external_id: id,
      },
    });
    if (res && res.status === 204) {
      Notification.Success({
        msg: "Updated Successfully",
      });
      refetch();
    }
    setSaving(false);
  };

  const removeLastInventoryLog = async (id: any) => {
    setSaving(true);
    // API call not matching with documentation. Extra pathparam given in this file for dispatch call
    const { res, data } = await request(routes.deleteLastInventoryLog, {
      pathParams: {
        facility_external_id: facilityId,
        id: id,
      },
    });

    if (res?.status === 201) {
      Notification.Success({
        msg: "Last entry deleted Successfully",
      });
      refetch();
    } else {
      Notification.Error({
        msg: "Error while deleting last entry: " + (data?.detail || ""),
      });
    }
    setSaving(false);
  };

  useEffect(() => {
    refetch();
  }, [refetch]);
  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  let inventoryList: any = [];
  if (inventory?.length) {
    inventoryList = inventory.map((inventoryItem: any) => (
      <tr key={inventoryItem.id} className="bg-white">
        <td className="border-b border-gray-200 p-5 text-sm hover:bg-gray-100">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="whitespace-nowrap text-gray-900">
                {formatDateTime(inventoryItem.created_date)}
              </p>
            </div>
          </div>
        </td>
        <td className="border-b border-gray-200 p-5 text-sm hover:bg-gray-100">
          <p className="whitespace-nowrap lowercase text-gray-900">
            {inventoryItem.quantity_in_default_unit}{" "}
            {inventoryItem.item_object?.default_unit?.name}
            {inventoryItem.probable_accident && (
              <i className="fas fa-exclamation-triangle pl-2 text-orange-500"></i>
            )}
          </p>
        </td>
        <td className="border-b border-gray-200 p-5 text-sm hover:bg-gray-100">
          <p className="whitespace-nowrap lowercase text-gray-900">
            {inventoryItem.is_incoming ? (
              <span className="ml-2 text-primary-600">Added Stock</span>
            ) : (
              <span className="ml-2 text-red-600">Used Stock</span>
            )}
          </p>
        </td>
        <td>
          <div className="tooltip">
            <div className="tooltip-left tooltip-text">
              {inventoryItem.probable_accident ? (
                <div className="text-justify text-sm leading-snug">
                  <b>Unmarks this transaction as accident</b>
                  <br />
                  This action will not affect the total stock.
                </div>
              ) : (
                <div className="text-justify text-sm leading-snug ">
                  <b>Marks this transaction as accident</b>
                  <br />
                  This action will not affect the total stock. To delete the
                  transaction, create another transaction that undos the effect
                  of this, or click <i>Delete Last Entry</i>.
                </div>
              )}
            </div>

            {inventoryItem.probable_accident ? (
              <ButtonV2
                onClick={(_) => flagFacility(inventoryItem.external_id)}
                disabled={saving}
                variant="primary"
              >
                <span>
                  <CareIcon className="care-l-exclamation-triangle pr-2 text-lg" />
                  UnMark
                </span>
              </ButtonV2>
            ) : (
              <ButtonV2
                onClick={(_) => flagFacility(inventoryItem.external_id)}
                disabled={saving}
                variant="danger"
              >
                <span>
                  <CareIcon className="care-l-exclamation-circle pr-2 text-lg" />
                  Mark as Accident
                </span>
              </ButtonV2>
            )}
          </div>
        </td>
      </tr>
    ));
  } else if (inventory && inventory.length === 0) {
    inventoryList = (
      <tr className="bg-white">
        <td colSpan={3} className="border-b border-gray-200 p-5 text-center">
          <p className="whitespace-nowrap text-gray-500">
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
        <div className="-mx-4 overflow-x-auto p-4 sm:-mx-8 sm:px-8">
          <div className="inline-block min-w-full">
            <table className="min-w-full overflow-hidden rounded-lg leading-normal shadow">
              <thead>
                <tr>
                  <th className="border-b-2 border-gray-200 bg-primary-400 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Created On
                  </th>
                  <th className="border-b-2 border-gray-200 bg-primary-400 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Quantity
                  </th>
                  <th className="border-b-2 border-gray-200 bg-primary-400 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Status
                  </th>
                  <th className="border-b-2 border-gray-200 bg-primary-400 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
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
      <Page
        title="Inventory Log"
        className="mx-3 md:mx-8"
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [inventoryId]: { name: itemName },
        }}
        backUrl={`/facility/${facilityId}/inventory`}
      >
        <div className="container mx-auto px-4 sm:px-8">
          <div className="py-8 ">
            <div className="flex justify-between">
              <h4>Item: {itemName}</h4>
              {current_stock > 0 && (
                <div className="tooltip ">
                  <div className="tooltip-text tooltip-left text-justify text-sm leading-snug">
                    <b>Deletes the last transaction</b> by creating an
                    equivalent undo transaction and marks both the transactions
                    as accident.
                  </div>
                  <ButtonV2
                    variant="danger"
                    onClick={(_) =>
                      removeLastInventoryLog(inventory[0].item_object.id)
                    }
                    disabled={saving}
                  >
                    <span>
                      <CareIcon className="care-l-exclamation-circle pr-2 text-lg" />
                      Delete Last Entry
                    </span>
                  </ButtonV2>
                </div>
              )}
            </div>
            {inventoryItem}
          </div>
        </div>
      </Page>
    </div>
  );
}
