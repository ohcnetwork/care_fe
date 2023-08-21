import { lazy, useCallback, useState } from "react";

import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getAnyFacility,
  getFacilityAssetLocation,
  listFacilityBeds,
  deleteFacilityBed,
} from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import ButtonV2 from "../Common/components/ButtonV2";
import { BedModel } from "./models";
import { ReactElement } from "react";
import * as Notification from "../../Utils/Notifications.js";
import { LOCATION_BED_TYPES } from "../../Common/constants";
import BedDeleteDialog from "./BedDeleteDialog";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Page from "../Common/components/Page";
const Loading = lazy(() => import("../Common/Loading"));

interface BedManagementProps {
  facilityId: string;
  locationId: string;
}

interface BedRowProps {
  id: string;
  facilityId: string;
  name: string;
  description: string;
  bedType: string;
  triggerRerender: () => void;
  locationId: string;
  isOccupied: boolean;
}

const BedRow = (props: BedRowProps) => {
  const {
    id,
    facilityId,
    name,
    description,
    triggerRerender,
    locationId,
    bedType,
    isOccupied,
  } = props;

  const dispatchAction: any = useDispatch();
  const [bedData, setBedData] = useState<{
    show: boolean;
    name: string;
  }>({ show: false, name: "" });

  const handleDelete = (name: string, _id: string) => {
    setBedData({
      show: true,
      name,
    });
  };

  const handleDeleteConfirm = async () => {
    const res = await dispatchAction(deleteFacilityBed(id));
    if (res?.status === 204) {
      Notification.Success({
        msg: "Bed deleted successfully",
      });
    } else {
      Notification.Error({
        msg: "Error while deleting Bed: " + (res?.data?.detail || ""),
      });
    }
    setBedData({ show: false, name: "" });
    triggerRerender();
  };

  const handleDeleteCancel = () => {
    setBedData({ show: false, name: "" });
  };

  return (
    <>
      <BedDeleteDialog
        name={bedData.name}
        show={bedData.show}
        handleCancel={handleDeleteCancel}
        handleOk={handleDeleteConfirm}
      />
      <div
        key={id}
        className="w-full items-center justify-between border-b py-4 lg:flex"
      >
        <div className="mt-2 space-y-2 px-4 lg:w-3/4">
          <div className="flex flex-col sm:flex-row">
            <p className="inline break-words text-xl capitalize">{name}</p>{" "}
            &nbsp;
            <div>
              {LOCATION_BED_TYPES.find((item) => item.id === bedType) && (
                <p className="mb-1 inline-flex w-fit items-center rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-medium capitalize leading-5 text-blue-800">
                  {LOCATION_BED_TYPES.find(
                    (item) => item.id === bedType
                  )?.name?.slice(0, 25) + (bedType.length > 25 ? "..." : "")}
                </p>
              )}
              <p
                className={`${
                  isOccupied
                    ? "bg-warning-100 text-warning-600"
                    : "bg-primary-100 text-primary-600"
                } mb-1 ml-1 inline-flex w-fit items-center rounded-md px-2.5 py-0.5 text-sm font-medium capitalize leading-5`}
              >
                {isOccupied ? "Occupied" : "Vacant"}
              </p>
            </div>
          </div>
          <p className="break-all">{description}</p>
        </div>
        <div className="mt-4 flex flex-col gap-2 lg:mt-0 lg:flex-row">
          <ButtonV2
            href={`/facility/${facilityId}/location/${locationId}/beds/${id}/update`}
            authorizeFor={NonReadOnlyUsers}
            className="w-full lg:w-auto"
            variant="secondary"
            border
            ghost
          >
            <CareIcon className="care-l-pen text-lg" />
            Edit
          </ButtonV2>
          <ButtonV2
            onClick={() => handleDelete(name, id)}
            authorizeFor={NonReadOnlyUsers}
            variant="danger"
            border
            ghost
            className="w-full lg:w-auto"
            disabled={isOccupied}
            tooltip={isOccupied ? "Bed is occupied" : undefined}
            tooltipClassName="w-full lg:w-auto"
          >
            <CareIcon className="care-l-trash-alt text-lg" />
            Delete
          </ButtonV2>
        </div>
      </div>
    </>
  );
};

export const BedManagement = (props: BedManagementProps) => {
  const { facilityId, locationId } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  let bed: ReactElement | null = null;
  let BedList: ReactElement[] | ReactElement = [];
  const [beds, setBeds] = useState<BedModel[]>([]);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [rerender, setRerender] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [locationName, setLocationName] = useState("");
  const limit = 14;

  const triggerRerender = () => {
    setRerender(!rerender);
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const facility = await dispatchAction(getAnyFacility(facilityId));

      setFacilityName(facility?.data?.name || "");

      const location = await dispatchAction(
        getFacilityAssetLocation(facilityId, locationId)
      );

      setLocationName(location?.data?.name || "");

      const res = await dispatchAction(
        listFacilityBeds({
          limit,
          offset,
          facility: facilityId,
          location: locationId,
        })
      );
      if (!status.aborted) {
        if (res?.data) {
          setBeds(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset, rerender, facilityId, locationId]
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

  if (beds && beds.length) {
    BedList = beds.map((bedItem: BedModel) => (
      <BedRow
        id={bedItem.id ?? ""}
        facilityId={facilityId ?? ""}
        name={bedItem.name ?? ""}
        description={bedItem.description ?? ""}
        bedType={bedItem.bed_type ?? ""}
        triggerRerender={triggerRerender}
        key={locationId ?? ""}
        locationId={locationId ?? ""}
        isOccupied={bedItem.is_occupied ?? false}
      />
    ));
  } else if (beds && beds.length === 0) {
    BedList = (
      <p className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
        No beds available in this location
      </p>
    );
  }

  if (beds) {
    bed = (
      <>
        <div className="mt-5 flex grow flex-wrap bg-white p-4">{BedList}</div>
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

  if (isLoading || !beds) {
    return <Loading />;
  }

  return (
    <Page
      title="Bed Management"
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        [locationId]: {
          name: locationName,
          uri: `/facility/${facilityId}/location`,
        },
      }}
      backUrl={`/facility/${facilityId}/location/${locationId}`}
    >
      <div className="container mx-auto px-4 py-2 sm:px-8">
        <div className="flex justify-end">
          <ButtonV2
            href={`/facility/${facilityId}/location/${locationId}/beds/add`}
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon className="care-l-plus text-lg" />
            Add New Bed(s)
          </ButtonV2>
        </div>
        {bed}
      </div>
    </Page>
  );
};
