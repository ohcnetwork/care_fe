import { lazy, useState } from "react";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Page from "../Common/components/Page";
import routes from "../../Redux/api";
import PaginatedList from "../../CAREUI/misc/PaginatedList";
import { LocationModel } from "./models";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import request from "../../Utils/request/request";
import * as Notification from "../../Utils/Notifications.js";
import ConfirmDialog from "../Common/ConfirmDialog";

const Loading = lazy(() => import("../Common/Loading"));

interface Props {
  facilityId: string;
}

interface LocationProps extends LocationModel {
  setShowDeletePopup: any;
}

export default function LocationManagement({ facilityId }: Props) {
  const [showDeletePopup, setShowDeletePopup] = useState({
    open: false,
    name: "",
    id: "",
  });

  const deleteAssetLocation = async () => {
    const res: any = await request(routes.deleteFacilityAssetLocation, {
      pathParams: {
        facility_external_id: facilityId,
        external_id: showDeletePopup.id,
      },
    });
    if (res?.res?.status === 204) {
      Notification.Success({
        msg: `Location ${showDeletePopup.name} deleted succcessully`,
      });
      PaginatedList.Refresh;
    } else {
      Notification.Error({ msg: "Something went wrong!" });
    }
    setShowDeletePopup({ ...showDeletePopup, open: false });
  };

  return (
    <PaginatedList
      route={routes.listFacilityAssetLocation}
      pathParams={{ facility_external_id: facilityId }}
    >
      {({ refetch }) => (
        <Page
          title="Location Management"
          backUrl={`/facility/${facilityId}`}
          options={
            <ButtonV2
              id="add-new-location"
              href={`/facility/${facilityId}/location/add`}
              authorizeFor={NonReadOnlyUsers}
              className="mr-8 hidden lg:block"
            >
              <CareIcon icon="l-plus" className="text-lg" />
              Add New Location
            </ButtonV2>
          }
        >
          <div className="mx-auto">
            <ButtonV2
              href={`/facility/${facilityId}/location/add`}
              authorizeFor={NonReadOnlyUsers}
              className="w-full lg:hidden"
            >
              <CareIcon icon="l-plus" className="text-lg" />
              Add New Location
            </ButtonV2>
          </div>
          <div className="w-full @container">
            <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
              <span>No locations available</span>
            </PaginatedList.WhenEmpty>

            <PaginatedList.WhenLoading>
              <Loading />
            </PaginatedList.WhenLoading>
            <PaginatedList.Items<LocationModel> className="my-8 grid gap-3 @4xl:grid-cols-2 @6xl:grid-cols-3 @[100rem]:grid-cols-4 lg:mx-8">
              {(item) => (
                <Location setShowDeletePopup={setShowDeletePopup} {...item} />
              )}
            </PaginatedList.Items>
          </div>

          <div className="flex w-full items-center justify-center">
            <PaginatedList.Paginator hideIfSinglePage />
          </div>

          <ConfirmDialog
            title="Delete Location"
            description="Are you sure you want to delete this location?"
            action="Confirm"
            variant="danger"
            show={showDeletePopup.open}
            onClose={() =>
              setShowDeletePopup({ ...showDeletePopup, open: false })
            }
            onConfirm={async () => {
              await deleteAssetLocation();
              refetch();
            }}
          />
        </Page>
      )}
    </PaginatedList>
  );
}

const Location = ({
  name,
  description,
  middleware_address,
  location_type,
  created_date,
  modified_date,
  id,
  setShowDeletePopup,
}: LocationProps) => (
  <div className="flex h-full w-full flex-col rounded border border-gray-300 bg-white p-6 shadow-sm transition-all duration-200 ease-in-out hover:border-primary-400">
    <div className="flex-1">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p
            className="break-words text-xl font-medium"
            id="view-location-name"
          >
            {name}
          </p>
          <div
            className="h-fit rounded-full border-2 border-primary-500 bg-primary-100 px-3 py-[3px]"
            id="location-type"
          >
            <p className="text-xs font-bold text-primary-500">
              {location_type}
            </p>
          </div>
        </div>
      </div>
      <p
        className="mt-3 break-all text-sm font-medium text-gray-700"
        id="view-location-description"
      >
        {description || "-"}
      </p>
      <p className="mt-3 text-sm font-semibold text-gray-700">
        Middleware Address:
      </p>
      <p
        className="mt-1 break-all font-mono text-sm font-bold text-gray-700"
        id="view-location-middleware"
      >
        {middleware_address || "-"}
      </p>
    </div>

    <ButtonV2
      id="manage-bed-button"
      variant="secondary"
      border
      className="mt-3 w-full"
      href={`location/${id}/beds`}
    >
      <CareIcon className="care-l-bed text-lg" />
      Manage Beds
    </ButtonV2>
    <div className="mt-2 flex w-full flex-col gap-2 md:flex-row">
      <div className="w-full md:w-1/2">
        <ButtonV2
          id="edit-location-button"
          variant="secondary"
          border
          className="w-full"
          href={`location/${id}/update`}
          authorizeFor={NonReadOnlyUsers}
        >
          <CareIcon className="care-l-pen text-lg" />
          Edit
        </ButtonV2>
      </div>
      <div className="w-full md:w-1/2">
        <ButtonV2
          id="delete-location-button"
          variant="secondary"
          border
          className="w-full"
          onClick={() => setShowDeletePopup({ open: true, name: name, id: id })}
          authorizeFor={NonReadOnlyUsers}
        >
          <CareIcon className="care-l-trash text-lg" />
          Delete
        </ButtonV2>
      </div>
    </div>

    <div className="mt-3 flex items-center justify-between gap-4 text-sm font-medium text-gray-700">
      <RecordMeta time={created_date} prefix="Created:" />
      <RecordMeta time={modified_date} prefix="Modified:" />
    </div>
  </div>
);
