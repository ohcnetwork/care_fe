import { useCallback, useState } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { listFacilityAssetLocation, getAnyFacility } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { LocationModel } from "./models";
import { ReactElement } from "react";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Page from "../Common/components/Page";
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
  const { id, facilityId, name, description } = props;

  return (
    <div
      key={id}
      className="w-full border-b lg:flex justify-between items-center py-4"
    >
      <div className="px-4 lg:w-3/4">
        <div className="lg:flex items-baseline w-full">
          <p className="text-xl break-words lg:w-1/4 lg:mr-4">{name}</p>
          <p className="text-sm break-all lg:w-3/4">{description}</p>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-2 mt-4 lg:mt-0">
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
      <LocationRow
        id={locationItem.id || ""}
        facilityId={facilityId || ""}
        name={locationItem.name || ""}
        description={locationItem.description || ""}
      />
    ));
  } else if (locations && locations.length === 0) {
    locationsList = (
      <p className="bg-white flex justify-center text-2xl w-full font-bold px-5 py-5 border-b border-gray-200 text-center text-gray-500">
        No locations available
      </p>
    );
  }

  if (locations) {
    location = (
      <>
        <div className="grow mt-5 bg-white p-4 flex flex-wrap">
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
