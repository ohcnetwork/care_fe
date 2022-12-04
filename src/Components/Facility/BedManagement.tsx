import { useCallback, useState } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  getAnyFacility,
  getFacilityAssetLocation,
  listFacilityBeds,
  deleteFacilityBed,
} from "../../Redux/actions";
import { navigate } from "raviger";
import Pagination from "../Common/Pagination";
import { BedModel } from "./models";
import { ReactElement } from "react";
import * as Notification from "../../Utils/Notifications.js";
import { LOCATION_BED_TYPES } from "../../Common/constants";
import BedDeleteDialog from "./BedDeleteDialog";

const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

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
    <div
      key={id}
      className="w-full border-b lg:flex justify-between items-center py-6"
    >
      <div className="px-4 lg:w-3/4 space-y-2 mt-2">
        <div>
          <p className="inline text-xl capitalize break-words">{name}</p> &nbsp;
          {LOCATION_BED_TYPES.find((item) => item.id === bedType) && (
            <p className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-blue-100 text-blue-800 w-fit capitalize mb-1">
              {LOCATION_BED_TYPES.find(
                (item) => item.id === bedType
              )?.name?.slice(0, 25) + (bedType.length > 25 ? "..." : "")}
            </p>
          )}
        </div>
        <p className="break-all">{description}</p>
      </div>
      <div className="sm:flex">
        <div className="px-2 py-2 w-full">
          <button
            onClick={() =>
              navigate(
                `/facility/${facilityId}/location/${locationId}/beds/${id}/update`
              )
            }
            className="btn btn-default bg-white w-full border-gray-700 transition ease-in-out duration-150 hover:shadow"
          >
            <i className="fas fa-pencil-alt mr-2"></i>
            Edit
          </button>
        </div>
        <div className="px-2 py-2 w-full">
          <button
            onClick={() => handleDelete(name, id)}
            className="btn btn-default bg-white w-full border-red-500 text-red-700 active:text-red-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
          >
            <i className="fas fa-trash mr-2"></i>
            Delete
          </button>
        </div>
      </div>
      <BedDeleteDialog
        name={bedData.name}
        show={bedData.show}
        handleCancel={handleDeleteCancel}
        handleOk={handleDeleteConfirm}
      />
    </div>
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
        if (res && res.data) {
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
        id={bedItem.id || ""}
        facilityId={facilityId || ""}
        name={bedItem.name || ""}
        description={bedItem.description || ""}
        bedType={bedItem.bed_type || ""}
        triggerRerender={triggerRerender}
        key={locationId || ""}
        locationId={locationId || ""}
      />
    ));
  } else if (beds && beds.length === 0) {
    BedList = (
      <p className="bg-white text-2xl w-full flex justify-center font-bold px-5 py-5 border-b border-gray-200 text-center text-gray-500">
        No beds available in this location
      </p>
    );
  }

  if (beds) {
    bed = (
      <>
        <div className="grow mt-5 bg-white px-2 flex flex-wrap">{BedList}</div>
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
    <div>
      <PageTitle
        title="Bed Management"
        className="mx-3 md:mx-8"
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [locationId]: {
            name: locationName,
            uri: `/facility/${facilityId}/location`,
          },
        }}
      />
      <div className="container px-4 py-2 sm:px-8">
        <div className="flex justify-end">
          <button
            className="px-4 py-1 rounded-md bg-primary-500 text-white text-lg font-semibold shadow"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/location/${locationId}/beds/add`,
                { replace: true }
              )
            }
          >
            <i className="fas fa-plus mr-2"></i>
            Add New Bed
          </button>
        </div>
        {bed}
      </div>
    </div>
  );
};
