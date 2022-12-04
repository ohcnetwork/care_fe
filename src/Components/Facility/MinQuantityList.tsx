import { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import loadable from "@loadable/component";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getMinQuantity, getAnyFacility } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { Link, navigate } from "raviger";
import { RoleButton } from "../Common/RoleButton";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

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
  if (inventory && inventory.length) {
    inventoryList = inventory.map((inventoryItem: any) => (
      <tr key={inventoryItem.id} className="bg-white">
        <td className="px-5 py-5 border-b border-gray-200 sm:text-sm sm:hover:bg-white hover:bg-gray-200 sm:cursor-default cursor-pointer">
          <div className="sm:flex flex-col hidden">
            <p className="text-gray-900 whitespace-nowrap font-normal">
              {inventoryItem.item_object?.name}
            </p>
          </div>
          <Link
            href={`/facility/${facilityId}/inventory/${inventoryItem.id}/update/${inventoryItem.item_object?.id}`}
          >
            <div className="sm:hidden flex justify-between items-center w-full">
              <div className="flex flex-col">
                <p className="text-gray-900 whitespace-nowrap font-semibold">
                  {inventoryItem.item_object?.name}
                </p>
                <p className="text-gray-900 whitespace-nowrap text-sm mt-1">
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
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
            </div>
          </Link>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm sm:flex hidden w-full justify-between">
          <p className="text-gray-900 whitespace-nowrap lowercase mt-2">
            {inventoryItem.min_quantity}{" "}
            {inventoryItem.item_object?.default_unit?.name}
          </p>
          <RoleButton
            className=" bg-primary-500 hover:bg-primary-600 text-white"
            materialButtonProps={{
              variant: "contained",
              color: "primary",
              size: "medium",
            }}
            handleClickCB={() =>
              navigate(
                `/facility/${facilityId}/inventory/${inventoryItem.id}/update/${inventoryItem.item_object?.id}`
              )
            }
            disableFor="readOnly"
            buttonType="materialUI"
          >
            UPDATE
          </RoleButton>
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
        <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4">
          <div className="min-w-full sm:inline-block hidden bg-white">
            <table className="min-w-full leading-normal shadow rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-500 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-500 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Minimum Quantity
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-500 text-left text-xs font-semibold text-white uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>{inventoryList}</tbody>
            </table>
          </div>
          <div className="sm:hidden bg-gray-100 shadow-sm rounded-lg">
            <table className="min-w-full leading-normal shadow rounded-lg overflow-hidden">
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
    <div>
      <PageTitle
        title="Minimum Quantity Required"
        className="mx-3 md:mx-8"
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
      />
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8">
          <RoleButton
            className="ml-2"
            materialButtonProps={{
              variant: "contained",
              color: "primary",
              size: "small",
            }}
            handleClickCB={() =>
              navigate(`/facility/${facilityId}/inventory/min_quantity/set`)
            }
            disableFor="readOnly"
            buttonType="materialUI"
          >
            Set Min Quantity
          </RoleButton>
          {inventoryItem}
        </div>
      </div>
    </div>
  );
}
