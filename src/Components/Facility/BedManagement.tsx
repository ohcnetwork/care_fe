import { lazy, useState } from "react";
import ButtonV2 from "../Common/components/ButtonV2";
import { BedModel } from "./models";
import { ReactElement } from "react";
import * as Notification from "../../Utils/Notifications.js";
import { LOCATION_BED_TYPES } from "../../Common/constants";
import BedDeleteDialog from "./BedDeleteDialog";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Page from "../Common/components/Page";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import useFilters from "../../Common/hooks/useFilters";
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
    const { res } = await request(routes.deleteFacilityBed, {
      pathParams: { external_id: id },
    });
    if (res?.ok) {
      Notification.Success({ msg: "Bed deleted successfully" });
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
      <div className="parent  m-2 flex  lg:flex-row">
        <div
          key={id}
          className="  child m-2 items-center justify-between rounded-xl  border border-gray-300  bg-white py-4 hover:border-green-700 "
        >
          <div className="m-2   mt-2 space-y-2    p-10 px-4">
            <div className="   flex   flex-col lg:flex-row">
              <div id="view-bedbadges ">
                <div>
                  <p
                    className="inline break-words text-xl capitalize"
                    id="view-bed-name"
                  >
                    {name}
                  </p>
                  &nbsp;
                </div>
                <div>
                  {LOCATION_BED_TYPES.find((item) => item.id === bedType) && (
                    <p className="font-xs mb-1  inline-flex items-center rounded-md bg-blue-100 p-1 capitalize leading-5 text-blue-800 lg:w-fit lg:px-2.5 lg:py-0.5 lg:font-medium">
                      {LOCATION_BED_TYPES.find(
                        (item) => item.id === bedType
                      )?.name?.slice(0, 25) +
                        (bedType.length > 25 ? "..." : "")}
                    </p>
                  )}
                  <p
                    className={`${
                      isOccupied
                        ? "bg-warning-100 text-warning-600"
                        : "bg-primary-100 text-primary-600"
                    } mb-1 ml-1 inline-flex w-fit items-center rounded-md p-1 text-sm font-medium  capitalize leading-5 lg:px-2.5 lg:py-0.5`}
                  >
                    {isOccupied ? "Occupied" : "Vacant"}
                  </p>
                </div>
              </div>
            </div>
            <p className="break-all">{description}</p>
            <div className="mt-2 flex w-full flex-col gap-2 md:flex-row">
              <div className="w-full md:w-1/2">
                <ButtonV2
                  id="edit-bed-button"
                  href={`/facility/${facilityId}/location/${locationId}/beds/${id}/update`}
                  authorizeFor={NonReadOnlyUsers}
                  className="w-full"
                  variant="secondary"
                  ghost
                  border
                >
                  <CareIcon className="care-l-pen text-lg" />
                  Edit
                </ButtonV2>
              </div>
              <div className="w-full md:w-1/2">
                <ButtonV2
                  id="delete-bed-button"
                  onClick={() => handleDelete(name, id)}
                  authorizeFor={NonReadOnlyUsers}
                  variant="danger"
                  ghost
                  className="w-full"
                  disabled={isOccupied}
                  tooltip={isOccupied ? "Bed is occupied" : undefined}
                  tooltipClassName="w-full lg:w-auto"
                  border
                >
                  <CareIcon className="care-l-trash-alt text-lg" />
                  Delete
                </ButtonV2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const BedManagement = (props: BedManagementProps) => {
  const { facilityId, locationId } = props;
  let bed: ReactElement | null = null;
  let BedList: ReactElement[] | ReactElement = [];
  const { qParams, Pagination, resultsPerPage } = useFilters({});

  const { data: location } = useQuery(routes.getFacilityAssetLocation, {
    pathParams: {
      facility_external_id: facilityId,
      external_id: locationId,
    },
  });

  const { loading, data, refetch } = useQuery(routes.listFacilityBeds, {
    query: {
      facility: facilityId,
      location: locationId,
      limit: resultsPerPage,
      offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
    },
  });

  if (data?.results.length) {
    BedList = data.results.map((bedItem: BedModel) => (
      <BedRow
        id={bedItem.id ?? ""}
        facilityId={facilityId ?? ""}
        name={bedItem.name ?? ""}
        description={bedItem.description ?? ""}
        bedType={bedItem.bed_type ?? ""}
        triggerRerender={refetch}
        key={locationId ?? ""}
        locationId={locationId ?? ""}
        isOccupied={bedItem.is_occupied ?? false}
      />
    ));
  } else if (data?.results.length === 0) {
    BedList = (
      <p className="flex w-full justify-center bg-white p-5 text-center text-2xl font-bold text-gray-500">
        No beds available in this location
      </p>
    );
  }

  bed = (
    <>
      <div className="mt-5 flex grow flex-wrap p-4">{BedList}</div>
      {Boolean(data?.count && data.count > 0) && (
        <div className="mt-4 flex w-full justify-center">
          <Pagination totalCount={data?.count ?? 0} />
        </div>
      )}
    </>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <Page
      title="Bed Management"
      crumbsReplacements={{
        [facilityId]: { name: location?.facility?.name },
        [locationId]: {
          name: location?.name,
          uri: `/facility/${facilityId}/location`,
        },
      }}
      backUrl={`/facility/${facilityId}/location/${locationId}`}
    >
      <div className="container mx-auto  px-4 py-2 sm:px-8">
        <div className="flex justify-end ">
          <ButtonV2
            id="add-new-bed"
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
