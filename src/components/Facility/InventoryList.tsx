import { navigate } from "raviger";
import { useState } from "react";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { classNames } from "@/Utils/utils";

export default function InventoryList(props: any) {
  const { facilityId }: any = props;
  let inventoryItem: any = null;
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 14;

  const { data: inventoryData } = useQuery(routes.getInventorySummary, {
    pathParams: {
      facility_external_id: facilityId,
    },
    query: {
      limit,
      offset,
    },
    prefetch: facilityId !== undefined,
  });

  const { data: facilityObject } = useQuery(routes.getAnyFacility, {
    pathParams: { id: facilityId },
    prefetch: !!facilityId,
  });

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  let inventoryList: any = [];
  if (inventoryData?.results.length) {
    inventoryList = inventoryData.results.map((inventoryItem: any) => (
      <tr
        id={`${inventoryItem.item_object?.name.replaceAll(" ", "-")}`}
        key={inventoryItem.id}
        className={classNames(
          "cursor-pointer hover:bg-secondary-200",
          inventoryItem.is_low ? "bg-red-100" : "bg-white",
        )}
        onClick={() =>
          navigate(
            `/facility/${facilityId}/inventory/${inventoryItem.item_object?.id}`,
          )
        }
      >
        <td className="border-b border-secondary-200 p-5 text-sm">
          <div className="flex items-center">
            <p className="whitespace-nowrap text-secondary-900">
              {inventoryItem.item_object?.name}
              {inventoryItem.is_low && (
                <span className="badge badge-danger ml-2">Low Stock</span>
              )}
            </p>
          </div>
        </td>
        <td className="border-b border-secondary-200 p-5 text-sm">
          <p className="whitespace-nowrap lowercase text-secondary-900">
            {inventoryItem.quantity}{" "}
            {inventoryItem.item_object?.default_unit?.name}
          </p>
        </td>
      </tr>
    ));
  } else if (inventoryData?.results && inventoryData.results.length === 0) {
    inventoryList = (
      <tr className="bg-white">
        <td
          colSpan={3}
          className="border-b border-secondary-200 p-5 text-center"
        >
          <p className="whitespace-nowrap text-secondary-500">
            No inventory available
          </p>
        </td>
      </tr>
    );
  }

  if (!inventoryData?.results) {
    inventoryItem = <Loading />;
  } else if (inventoryData.results) {
    inventoryItem = (
      <>
        <div className="-mx-4 overflow-x-auto p-4 sm:-mx-8 sm:px-8">
          <div className="inline-block min-w-full">
            <table className="min-w-full overflow-hidden rounded-lg leading-normal shadow">
              <thead>
                <tr>
                  <th className="border-b-2 border-secondary-200 bg-primary-400 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Name
                  </th>
                  <th className="border-b-2 border-secondary-200 bg-primary-400 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>{inventoryList}</tbody>
            </table>
          </div>
        </div>
        {inventoryData?.count > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount: inventoryData ? inventoryData.count : 0 }}
              onChange={handlePagination}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <Page
      title="Inventory Manager"
      className="mx-3 md:mx-8"
      crumbsReplacements={{ [facilityId]: { name: facilityObject?.name } }}
      backUrl={`/facility/${facilityId}`}
    >
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-4 md:py-8">
          <div className="flex flex-col gap-2 md:flex-row">
            <ButtonV2
              className="w-full"
              href={`/facility/${facilityId}/inventory/add`}
              authorizeFor={NonReadOnlyUsers}
            >
              Manage Inventory
            </ButtonV2>
            <ButtonV2
              id="add-minimum-quantity"
              className="w-full"
              href={`/facility/${facilityId}/inventory/min_quantity/list`}
            >
              Minimum Quantity Required
            </ButtonV2>
          </div>
          {inventoryItem}
        </div>
      </div>
    </Page>
  );
}
