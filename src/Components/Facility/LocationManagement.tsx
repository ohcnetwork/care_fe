import { useCallback, useState, ReactElement, lazy } from "react";

import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { listFacilityAssetLocation, getAnyFacility } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { LocationModel } from "./models";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Page from "../Common/components/Page";
const Loading = lazy(() => import("../Common/Loading"));

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
  const { id, facilityId, name, description } = props;

  return (
    <div
      key={id}
      className="w-full items-center justify-between border-b py-4 lg:flex"
    >
      <div className="px-4 lg:w-3/4">
        <div className="w-full items-baseline lg:flex">
          <p className="break-words text-xl lg:mr-4 lg:w-1/4">{name}</p>
          <p className="break-all text-sm lg:w-3/4">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 lg:mt-0 lg:flex-row">
        <ButtonV2
          variant="secondary"
          border
          className="w-full lg:w-auto"
          href={`/facility/${facilityId}/location/${id}/update`}
          authorizeFor={NonReadOnlyUsers}
        >
          <CareIcon className="care-l-pen text-lg" />
          Edit
        </ButtonV2>
        <ButtonV2
          variant="secondary"
          border
          className="w-full lg:w-auto"
          href={`/facility/${facilityId}/location/${id}/beds`}
        >
          <CareIcon className="care-l-bed text-lg" />
          Manage Beds
        </ButtonV2>
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
        if (res?.data) {
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

  if (locations?.length) {
    locationsList = locations.map((locationItem: LocationModel) => (
      <LocationRow
        key={locationItem.id}
        id={locationItem.id || ""}
        facilityId={facilityId || ""}
        name={locationItem.name || ""}
        description={locationItem.description || ""}
      />
    ));
  } else if (locations && locations.length === 0) {
    locationsList = (
      <p className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
        No locations available
      </p>
    );
  }

  if (locations) {
    location = (
      <>
        <div className="mt-5 flex grow flex-wrap bg-white p-4">
          {locationsList}
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

  if (isLoading || !locations) {
    return <Loading />;
  }

  return (
    <Page
      title="Location Management"
      crumbsReplacements={{ [facilityId]: { name: facilityName } }}
      backUrl={`/facility/${facilityId}`}
    >
      <div className="container mx-auto px-4 py-2 sm:px-8">
        <div className="flex justify-end">
          <ButtonV2
            href={`/facility/${facilityId}/location/add`}
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon className="care-l-plus text-lg" />
            Add New Location
          </ButtonV2>
        </div>
        {location}
      </div>
    </Page>
  );
};
