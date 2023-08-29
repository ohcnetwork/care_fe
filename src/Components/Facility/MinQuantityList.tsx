import { useCallback, useState, useEffect, lazy } from "react";
import { useDispatch } from "react-redux";

import { statusType, useAbortableEffect } from "../../Common/utils";
import { getMinQuantity, getAnyFacility } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { MinQuantityRequiredModal } from "./MinQuantityRequiredModal";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import Page from "../Common/components/Page";
const Loading = lazy(() => import("../Common/Loading"));

export default function MinQuantityList(props: any) {
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
  const [showMinQuantityRequiredModal, setShowMinQuantityRequiredModal] =
    useState(false);
  const [selectedItem, setSelectedItem] = useState({ id: 0, item_id: 0 });
  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getMinQuantity(facilityId, { limit, offset })
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
  if (inventory?.length) {
    inventoryList = inventory.map((inventoryItem: any) => (
      <tr key={inventoryItem.id} className="bg-white">
        <td className="cursor-pointer border-b border-gray-200 p-5 hover:bg-gray-200 sm:cursor-default sm:text-sm sm:hover:bg-white">
          <div className="hidden flex-col sm:flex">
            <p className="whitespace-nowrap font-normal text-gray-900">
              {inventoryItem.item_object?.name}
            </p>
          </div>
          <ButtonV2
            ghost={true}
            className="w-full hover:bg-gray-200 sm:hidden"
            onClick={() => {
              setSelectedItem({
                id: inventoryItem.id,
                item_id: inventoryItem.item_object?.id,
              });
              setShowMinQuantityRequiredModal(true);
            }}
          >
            <div className="flex w-full items-center justify-between sm:hidden">
              <div className="flex flex-col text-start">
                <p className="whitespace-nowrap font-semibold text-gray-900">
                  {inventoryItem.item_object?.name}
                </p>
                <p className="mt-1 whitespace-nowrap text-sm text-gray-900">
                  {"Min Quantity: "}
                  {inventoryItem.min_quantity}{" "}
                  {inventoryItem.item_object?.default_unit?.name}
                </p>
              </div>
              <div className="text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
            </div>
          </ButtonV2>
        </td>
        <td className="hidden w-full justify-between border-b border-gray-200 p-5 text-sm sm:flex">
          <p className="mt-2 whitespace-nowrap lowercase text-gray-900">
            {inventoryItem.min_quantity}{" "}
            {inventoryItem.item_object?.default_unit?.name}
          </p>
          <ButtonV2
            variant="secondary"
            ghost
            border
            onClick={() => {
              setSelectedItem({
                id: inventoryItem.id,
                item_id: inventoryItem.item_object?.id,
              });
              setShowMinQuantityRequiredModal(true);
            }}
            authorizeFor={NonReadOnlyUsers}
          >
            Update
          </ButtonV2>
        </td>
      </tr>
    ));
  } else if (inventory && inventory.length === 0) {
    inventoryList = (
      <tr className="bg-white">
        <td
          colSpan={3}
          className="pxf-5 border-b border-gray-200 py-5 text-center"
        >
          <p className="whitespace-nowrap text-gray-500">
            No item with minimum quantity set
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
        <div className="-mx-4 p-4 sm:-mx-8 sm:px-8">
          <div className="hidden min-w-full bg-white sm:inline-block">
            <table className="min-w-full overflow-hidden rounded-lg leading-normal shadow">
              <thead>
                <tr>
                  <th className="border-b-2 border-gray-200 bg-primary-500 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Item
                  </th>
                  <th className="border-b-2 border-gray-200 bg-primary-500 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Minimum Quantity
                  </th>
                  <th className="border-b-2 border-gray-200 bg-primary-500 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"></th>
                </tr>
              </thead>
              <tbody>{inventoryList}</tbody>
            </table>
          </div>
          <div className="rounded-lg bg-gray-100 shadow-sm sm:hidden">
            <table className="min-w-full overflow-hidden rounded-lg leading-normal shadow">
              {inventoryList}
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
    <Page
      title="Minimum Quantity Required"
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        min_quantity: {
          name: "Min Quantity",
          uri: `/facility/${facilityId}/inventory/min_quantity/list`,
        },
        list: {
          style: "pointer-events-none",
        },
      }}
      backUrl={`/facility/${facilityId}/inventory`}
    >
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8">
          <ButtonV2
            className="ml-2"
            href={`/facility/${facilityId}/inventory/min_quantity/set`}
            authorizeFor={NonReadOnlyUsers}
          >
            Set Min Quantity
          </ButtonV2>
          {inventoryItem}
        </div>
      </div>
      {showMinQuantityRequiredModal && (
        <MinQuantityRequiredModal
          facilityId={facilityId}
          inventoryId={selectedItem.id}
          itemId={selectedItem.item_id}
          show={showMinQuantityRequiredModal}
          handleClose={() => setShowMinQuantityRequiredModal(false)}
          handleUpdate={() => {
            fetchData({ aborted: false });
            setShowMinQuantityRequiredModal(false);
          }}
        />
      )}
    </Page>
  );
}
