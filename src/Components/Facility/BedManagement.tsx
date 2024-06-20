import { lazy, useState } from "react";
import ButtonV2 from "../Common/components/ButtonV2";
import { BedModel } from "./models";
import { ReactElement } from "react";
import * as Notification from "../../Utils/Notifications.js";
import { LOCATION_BED_TYPES } from "../../Common/constants";
import BedDeleteDialog from "./BedDeleteDialog";
import AuthorizeFor, { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Page from "../Common/components/Page";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import useFilters from "../../Common/hooks/useFilters";
import useAuthUser from "../../Common/hooks/useAuthUser";
import RecordMeta from "../../CAREUI/display/RecordMeta";
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
  created_date: string;
  modified_date: string;
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
    created_date,
    modified_date,
  } = props;
  const [bedData, setBedData] = useState<{
    show: boolean;
    name: string;
  }>({ show: false, name: "" });
  const authUser = useAuthUser();
  const handleDelete = (name: string, _id: string) => {
    setBedData({
      show: true,
      name,
    });
  };

  const allowedUser = ["DistrictAdmin", "StateAdmin"].includes(
    authUser.user_type,
  );

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
    <div>
      <BedDeleteDialog
        name={bedData.name}
        show={bedData.show}
        handleCancel={handleDeleteCancel}
        handleOk={handleDeleteConfirm}
      />
      <div className="flex h-full w-full flex-col rounded border border-gray-300 bg-white p-6 shadow-sm transition-all duration-200 ease-in-out hover:border-primary-400">
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <p
              className="inline break-words text-xl capitalize"
              id="view-bed-name"
            >
              {name}
            </p>
          </div>
        </div>
        <div id="view-bedbadges">
          {LOCATION_BED_TYPES.find((item) => item.id === bedType) && (
            <p className="mb-1 inline-flex w-fit items-center rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-medium capitalize leading-5 text-blue-800">
              {LOCATION_BED_TYPES.find(
                (item) => item.id === bedType,
              )?.name?.slice(0, 25) + (bedType.length > 25 ? "..." : "")}
            </p>
          )}
          <p
            className={`${
              isOccupied
                ? "bg-warning-100 text-warning-600"
                : "bg-primary-100 text-primary-600"
            } mb-1 inline-flex w-fit items-center rounded-md px-2.5 py-0.5 text-sm font-medium capitalize leading-5 min-[400px]:ml-1`}
          >
            {isOccupied ? "Occupied" : "Vacant"}
          </p>
        </div>
        <p className="break-all">{description}</p>
        <div className="mt-4 flex flex-col justify-between gap-2 lg:flex-row">
          <ButtonV2
            id="edit-bed-button"
            href={`/facility/${facilityId}/location/${locationId}/beds/${id}/update`}
            authorizeFor={NonReadOnlyUsers}
            className="w-full lg:w-auto"
            variant="secondary"
            border
            ghost
          >
            <CareIcon icon="l-pen" className="text-lg" />
            Edit
          </ButtonV2>
          <ButtonV2
            id="delete-bed-button"
            onClick={() => handleDelete(name, id)}
            authorizeFor={AuthorizeFor(["DistrictAdmin", "StateAdmin"])}
            variant="danger"
            border
            ghost
            className="w-full lg:w-auto"
            tooltip={
              !allowedUser
                ? "Contact your admin to delete the bed"
                : isOccupied
                  ? "Bed is occupied"
                  : undefined
            }
            tooltipClassName=" text-xs w-full lg:w-auto"
          >
            <CareIcon icon="l-trash-alt" className="text-lg" />
            Delete
          </ButtonV2>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4 text-sm font-medium text-gray-700">
          <RecordMeta time={created_date} prefix="Created:" />
          <RecordMeta time={modified_date} prefix="Modified:" />
        </div>
      </div>
    </div>
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
    BedList = (
      <div className="my-8 grid  gap-3 lg:mx-8 min-[1100px]:grid-cols-2 min-[1560px]:grid-cols-3">
        {data.results.map((bedItem: BedModel) => (
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
            created_date={bedItem.created_date ?? ""}
            modified_date={bedItem.modified_date ?? ""}
          />
        ))}
      </div>
    );
  } else if (data?.results.length === 0) {
    BedList = (
      <p className="my-8 flex w-full justify-center bg-white p-5 text-center text-2xl font-bold text-gray-500">
        No beds available in this location
      </p>
    );
  }

  bed = (
    <>
      {BedList}
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
      <div className="container mx-auto px-4 py-2 sm:px-8">
        <div className="flex justify-end">
          <ButtonV2
            id="add-new-bed"
            href={`/facility/${facilityId}/location/${locationId}/beds/add`}
            authorizeFor={NonReadOnlyUsers}
          >
            <CareIcon icon="l-plus" className="text-lg" />
            Add New Bed(s)
          </ButtonV2>
        </div>
        {bed}
      </div>
    </Page>
  );
};
