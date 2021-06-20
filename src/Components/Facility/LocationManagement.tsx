import React, { useCallback, useState } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { Button } from "@material-ui/core";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { listFacilityAssetLocation } from "../../Redux/actions";
import { navigate } from "raviger";
import Pagination from "../Common/Pagination";
const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

export const LocationManagement = (props: any) => {
  const { facilityId }: any = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  let location: any = null;
  let locationsList: any = [];
  const [locations, setLocations] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        listFacilityAssetLocation(
          { limit, offset },
          { facility_external_id: facilityId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          setLocations(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset]
  );

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

  if (locations && locations.length) {
    locationsList = locations.map((locationItem: any) => (
      <tr key={locationItem.id} className="">
        <td className="px-5 py-5 border-b border-gray-200 text-sm ">
          <p className="text-gray-900">{locationItem.name}</p>
        </td>
        <td className="px-5 py-5 border-b border-gray-200 text-sm ">
          <p className="text-gray-900 lowercase">{locationItem.description}</p>
        </td>
      </tr>
    ));
  } else if (locations && locations.length === 0) {
    locationsList = (
      <tr className="bg-white">
        <td
          colSpan={3}
          className="px-5 py-5 border-b border-gray-200 text-center"
        >
          <p className="text-gray-500 whitespace-no-wrap">
            No locations available
          </p>
        </td>
      </tr>
    );
  }

  if (isLoading || !locations) {
    location = <Loading />;
  } else if (locations) {
    location = (
      <>
        <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
          <table className="min-w-full leading-normal shadow rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Name
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-primary-400 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>{locationsList}</tbody>
          </table>
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
        title="Location Management"
        hideBack={false}
        className="mx-3 md:mx-8"
      />
      <div className="container mx-auto px-4 py-4 md:my-8 sm:px-8">
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => navigate(`/facility/${facilityId}/location/add`)}
        >
          Add Location
        </Button>
        {location}
      </div>
    </div>
  );
};
