import { lazy, useState } from "react";
import ButtonV2, { Cancel } from "../Common/components/ButtonV2";
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
import DialogModal from "../Common/Dialog";
import Uptime from "../Common/Uptime";

const Loading = lazy(() => import("../Common/Loading"));

interface Props {
  facilityId: string;
}

interface LocationProps extends LocationModel {
  facilityId: string;
  setShowDeletePopup: (e: { open: boolean; name: string; id: string }) => void;
}

export default function LocationManagement({ facilityId }: Props) {
  const [showDeleteFailModal, setShowDeleteFailModal] = useState({
    open: false,
    id: "",
    reason: "",
  });
  const [showDeletePopup, setShowDeletePopup] = useState({
    open: false,
    name: "",
    id: "",
  });

  const closeDeleteFailModal = () => {
    setShowDeleteFailModal({ ...showDeleteFailModal, open: false });
  };

  const deleteAssetLocation = async () => {
    const { res, error } = await request(routes.deleteFacilityAssetLocation, {
      pathParams: {
        facility_external_id: facilityId,
        external_id: showDeletePopup.id,
      },
    });
    if (res?.ok) {
      Notification.Success({
        msg: `Location ${showDeletePopup.name} deleted successfully`,
      });
    } else if (res?.status === 400 && error?.length) {
      const errorMessage: string = (error as unknown as string[])[0];
      if (errorMessage.includes("Asset")) {
        setShowDeleteFailModal({
          open: true,
          id: showDeletePopup.id,
          reason: "assets",
        });
      } else {
        setShowDeleteFailModal({
          open: true,
          id: showDeletePopup.id,
          reason: "beds",
        });
      }
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
                <Location
                  setShowDeletePopup={setShowDeletePopup}
                  facilityId={facilityId}
                  {...item}
                />
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

          <DialogModal
            title={
              <div className="flex items-center gap-2">
                <CareIcon icon="l-exclamation-triangle" />
                Delete Location
              </div>
            }
            show={showDeleteFailModal.open}
            onClose={() =>
              setShowDeleteFailModal({ ...showDeleteFailModal, open: false })
            }
          >
            <div>
              {showDeleteFailModal.reason === "beds" ? (
                <div>
                  <div>
                    There are Beds associated with this location that need to be
                    deleted first before the location can be removed
                  </div>
                  <div className="mt-2 flex flex-col justify-end gap-2 md:flex-row">
                    <Cancel
                      onClick={() => {
                        closeDeleteFailModal();
                      }}
                    />
                    <ButtonV2
                      id="manage-beds"
                      href={`/facility/${facilityId}/location/${showDeleteFailModal.id}/beds`}
                      authorizeFor={NonReadOnlyUsers}
                      className="w-full"
                    >
                      Manage Beds
                    </ButtonV2>
                  </div>
                </div>
              ) : (
                <div>
                  <div>
                    There are Assets associated with this location that need to
                    be deleted first before the location can be removed
                  </div>
                  <div className="mt-2 flex flex-col justify-end gap-2 md:flex-row">
                    <Cancel
                      onClick={() => {
                        closeDeleteFailModal();
                      }}
                    />
                    <ButtonV2
                      id="manage-assets"
                      href={`/assets?page=1&limit=18&facility=${facilityId}&asset_type=&asset_class=&status=&location=${showDeleteFailModal.id}&warranty_amc_end_of_validity_before=&warranty_amc_end_of_validity_after=`}
                      authorizeFor={NonReadOnlyUsers}
                      className="w-full"
                    >
                      Manage Assets
                    </ButtonV2>
                  </div>
                </div>
              )}
            </div>
          </DialogModal>
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
  facilityId,
}: LocationProps) => (
  <div className="flex h-full w-full flex-col rounded border border-gray-300 bg-white p-6 shadow-sm transition-all duration-200 ease-in-out hover:border-primary-400">
    <div className="flex-1">
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <p className="break-all text-xl font-medium" id="view-location-name">
            {name}
          </p>
          <div
            className="mt-2 h-fit rounded-full border-2 border-primary-500 bg-primary-100 px-3 py-[3px]"
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
      <Uptime
        route={routes.listFacilityAssetLocationAvailability}
        params={{ external_id: id, facility_external_id: facilityId }}
        header={
          <p className="mt-3 text-sm font-semibold text-gray-700">
            Middleware Uptime
          </p>
        }
        centerInfoPanel
      />
    </div>

    <ButtonV2
      id="manage-bed-button"
      variant="secondary"
      border
      className="mt-3 w-full"
      href={`location/${id}/beds`}
    >
      <CareIcon icon="l-bed" className="text-lg" />
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
          <CareIcon icon="l-pen" className="text-lg" />
          Edit
        </ButtonV2>
      </div>
      <div className="w-full md:w-1/2">
        <ButtonV2
          id="delete-location-button"
          variant="secondary"
          border
          className="w-full"
          onClick={() =>
            setShowDeletePopup({ open: true, name: name ?? "", id: id ?? "" })
          }
          authorizeFor={NonReadOnlyUsers}
        >
          <CareIcon icon="l-trash" className="text-lg" />
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
