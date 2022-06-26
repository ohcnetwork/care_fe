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
      className="w-full pb-2 border-b md:flex justify-between items-center mb-1"
    >
      <div className="px-4 md:w-1/2 mb-2">
        <div className="md:flex justify-between w-full mb-2">
          <p className="text-xl font-normal capitalize">{name}</p>
        </div>
        <p className="font-normal text-sm text-ellipsis overflow-hidden">
          {description}
        </p>
      </div>
      <div className="md:flex">
        <div className="px-2 py-2 md:py-0">
          <RoleButton
            className="btn btn-default bg-white"
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
        <div className="px-2 pb-2 md:py-0">
          <RoleButton
            className="btn btn-default bg-white"
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
      <tr className="bg-white">
        <td
          colSpan={3}
          className="px-5 py-5 border-b border-gray-200 text-center"
        >
          <p className="text-gray-500 whitespace-nowrap">
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

  return (
    <div>
      <PageTitle
        title="Location Management"
        hideBack={false}
        className="mx-3 md:mx-8"
        crumbsReplacements={{ [facilityId]: { name: facilityName } }}
      />
      <div className="container mx-auto px-4 py-2 sm:px-8">
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
