import React, { useCallback, useState, useEffect } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { listFacilityAssetLocation, getAnyFacility } from "../../Redux/actions";
import { navigate } from "raviger";
import Pagination from "../Common/Pagination";
import { RoleButton } from "../Common/RoleButton";
import { LocationModel } from "./models";
import { ReactElement } from "react";
const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

interface LocationManagementProps {
  facilityId: string;
}

interface LocationRowProps {
  id: string;
  facilityId: string;
  name: string;
  description: string;
}

const LocationRow = (props: LocationRowProps) => {
  let { id, facilityId, name, description } = props;

  return (
    <div
      key={id}
      className="w-full border-b lg:flex justify-between items-center py-4"
    >
      <div className="px-4 lg:w-3/4">
        <div className="lg:flex items-baseline w-full">
          <p className="text-xl capitalize break-words lg:w-1/4 lg:mr-4">
            {name}
          </p>
          <p className="text-sm break-all lg:w-3/4">{description}</p>
        </div>
      </div>
      <div className="flex">
        <div className="px-2 py-2 w-full">
          <RoleButton
            className="btn btn-default bg-white w-full"
            handleClickCB={() =>
              navigate(`/facility/${facilityId}/location/${id}/update`)
            }
            disableFor="readOnly"
            buttonType="html"
          >
            <i className="fas fa-pencil-alt w-4 mr-2"></i>
            Edit
          </RoleButton>
        </div>
        <div className="px-2 py-2 w-full">
          <RoleButton
            className="btn btn-default bg-white w-full"
            handleClickCB={() =>
              navigate(`/facility/${facilityId}/location/${id}/beds`)
            }
            disableFor="readOnly"
            buttonType="html"
          >
            <i className="fas fa-bed-pulse w-4 mr-2"></i>
            Manage Beds
          </RoleButton>
        </div>
      </div>
    </div>
  );
};

export const LocationManagement = (props: LocationManagementProps) => {
  const { facilityId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  let location: ReactElement | null = null;
  let locationsList: ReactElement[] | ReactElement = [];
  const [locations, setLocations] = useState<LocationModel[]>([]);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [facilityName, setFacilityName] = useState("");
  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const facility = await dispatchAction(getAnyFacility(facilityId));

      setFacilityName(facility?.data?.name || "");

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
    [dispatchAction, offset, facilityId]
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
    locationsList = locations.map((locationItem: LocationModel) => (
      <div className="grow mt-5 bg-white p-4 flex flex-wrap">
        <LocationRow
          id={locationItem.id || ""}
          facilityId={facilityId || ""}
          name={locationItem.name || ""}
          description={locationItem.description || ""}
        />
      </div>
    ));
  } else if (locations && locations.length === 0) {
    locationsList = (
      <div className="h-full content-center grid justify-items-center">
        <div className="flex justify-center w-full items-center">
          <img
            className="w-3/12 sm:w-3/12 md:w-3/12 lg:w-2/12 xl:w-2/12 2xl:w-2/12"
            src={"https://cdn.coronasafe.network/location.png"}
            alt={"No locations found"}
          />
        </div>
        <p className="font-sans mt-5 sm:text-sm md:text-lg lg:text-xl text-center text-green-800">
          No locations found.
        </p>
      </div>
    );
  }

  if (locations) {
    location = (
      <>
        {locationsList}
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

  if (isLoading || !locations) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col">
      <PageTitle
        title="Location Management"
        hideBack={false}
        className="mx-3 md:mx-8"
        crumbsReplacements={{ [facilityId]: { name: facilityName } }}
      />
      <div className="container mx-auto h-screen px-4 py-2 sm:px-8">
        <div className="flex justify-end">
          <RoleButton
            className="px-4 py-1 rounded-md bg-primary-500 text-white text-lg font-semibold shadow"
            handleClickCB={() =>
              navigate(`/facility/${facilityId}/location/add`)
            }
            disableFor="readOnly"
            buttonType="html"
          >
            <i className="fas fa-plus mr-2"></i>
            Add New Location
          </RoleButton>
        </div>
        {location}
      </div>
    </div>
  );
};
