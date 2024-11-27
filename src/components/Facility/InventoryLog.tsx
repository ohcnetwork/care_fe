import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import { formatDateTime } from "@/Utils/utils";

export default function InventoryLog(props: any) {
  const { facilityId, inventoryId }: any = props;
  const [saving, setSaving] = useState(false);
  let inventoryItem: any = null;
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 14;
  const item = inventoryId;

  const { data, refetch } = useQuery(routes.getInventoryLog, {
    pathParams: {
      facilityId: facilityId,
    },
    query: {
      item,
      limit,
      offset,
    },
    prefetch: facilityId !== undefined,
  });

  const { data: facilityObject } = useQuery(routes.getAnyFacility, {
    pathParams: { id: facilityId },
    prefetch: !!facilityId,
  });

  const flagFacility = async (id: string) => {
    setSaving(true);
    await request(routes.flagInventoryItem, {
      pathParams: { facility_external_id: facilityId, external_id: id },
      query: { item: id },
      onResponse: ({ res }) => {
        if (res?.ok) {
          Notification.Success({
            msg: "Updated Successfully",
          });
        }
        refetch();
      },
    });
    setSaving(false);
  };

  const removeLastInventoryLog = async (id: any) => {
    setSaving(true);
    await request(routes.deleteLastInventoryLog, {
      pathParams: { facility_external_id: facilityId, id: id },
      onResponse: ({ res }) => {
        if (res?.ok) {
          Notification.Success({
            msg: "Last entry deleted Successfully",
          });
          refetch();
        }
      },
    });
    setSaving(false);
  };

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  let inventoryList: any = [];
  if (data?.results.length) {
    inventoryList = data.results.map((inventoryItem: any, index) => (
      <tr id={`row-${index}`} key={inventoryItem.id} className="bg-white">
        <td className="border-b border-secondary-200 p-5 text-sm hover:bg-secondary-100">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="whitespace-nowrap text-secondary-900">
                {formatDateTime(inventoryItem.created_date)}
              </p>
            </div>
          </div>
        </td>
        <td className="border-b border-secondary-200 p-5 text-sm hover:bg-secondary-100">
          <p className="whitespace-nowrap lowercase text-secondary-900">
            {inventoryItem.quantity_in_default_unit}{" "}
            {inventoryItem.item_object?.default_unit?.name}
            {inventoryItem.probable_accident && (
              <CareIcon
                icon="l-exclamation-triangle"
                className="pl-2 text-lg text-orange-500"
              />
            )}
          </p>
        </td>
        <td className="border-b border-secondary-200 p-5 text-sm hover:bg-secondary-100">
          <p className="whitespace-nowrap lowercase text-secondary-900">
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
                <div className="text-justify text-sm leading-snug">
                  <b>Marks this transaction as accident</b>
                  <br />
                  This action will not affect the total stock.
                  <br />
                  To delete the transaction, create another transaction that
                  <br />
                  undos the effect of this, or click <i>Delete Last Entry</i>.
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
                  <CareIcon
                    icon="l-exclamation-triangle"
                    className="pr-2 text-lg"
                  />
                  UnMark
                </span>
              </ButtonV2>
            ) : (
              <ButtonV2
                onClick={(_) => flagFacility(inventoryItem.external_id)}
                disabled={saving}
                variant="danger"
                className="mr-2"
              >
                <span>
                  <CareIcon
                    icon="l-exclamation-circle"
                    className="pr-2 text-lg"
                  />
                  Mark as Accident
                </span>
              </ButtonV2>
            )}
          </div>
        </td>
      </tr>
    ));
  } else if (data?.results && data.results.length === 0) {
    inventoryList = (
      <tr className="bg-white">
        <td
          colSpan={3}
          className="border-b border-secondary-200 p-5 text-center"
        >
          <p className="whitespace-nowrap text-secondary-500">
            No log for this inventory available
          </p>
        </td>
      </tr>
    );
  }

  if (!data?.results) {
    inventoryItem = <Loading />;
  } else if (data.results) {
    inventoryItem = (
      <>
        <div className="-mx-4 overflow-x-auto p-4 pb-9 sm:-mx-8 sm:px-8">
          <div className="inline-block min-w-full">
            <table className="min-w-full overflow-x-clip rounded-lg leading-normal shadow">
              <thead>
                <tr>
                  <th className="border-b-2 border-secondary-200 bg-primary-400 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Created On
                  </th>
                  <th className="border-b-2 border-secondary-200 bg-primary-400 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Quantity
                  </th>
                  <th className="border-b-2 border-secondary-200 bg-primary-400 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Status
                  </th>
                  <th className="border-b-2 border-secondary-200 bg-primary-400 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>{inventoryList}</tbody>
            </table>
          </div>
        </div>
        {data.count > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount: data ? data.count : 0 }}
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
          [facilityId]: { name: facilityObject?.name },
          [inventoryId]: { name: data?.results[0].item_object.name },
        }}
        backUrl={`/facility/${facilityId}/inventory`}
      >
        <div className="container mx-auto px-4 sm:px-8">
          <div className="py-8">
            <div className="flex justify-between">
              <h4>Item: {data?.results[0].item_object.name}</h4>
              {data?.results && data.results[0].current_stock > 0 && (
                <div className="tooltip">
                  <div className="tooltip-text tooltip-left text-justify text-sm leading-snug">
                    <b>Deletes the last transaction</b>
                    <br />
                    It does by creating an equivalent undo transaction
                    <br />
                    and marks both the transactions as accident.
                  </div>
                  <ButtonV2
                    id="delete-last-entry"
                    variant="danger"
                    onClick={(_) =>
                      removeLastInventoryLog(data?.results[0].item_object.id)
                    }
                    disabled={saving}
                  >
                    <span>
                      <CareIcon
                        icon="l-exclamation-circle"
                        className="pr-2 text-lg"
                      />
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
