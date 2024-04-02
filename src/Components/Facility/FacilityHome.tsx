import * as Notification from "../../Utils/Notifications.js";

import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import { FacilityModel } from "./models";
import { FACILITY_FEATURE_TYPES, USER_TYPES } from "../../Common/constants";
import DropdownMenu, { DropdownItem } from "../Common/components/Menu";
import { Fragment, lazy, useState } from "react";

import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Chip from "../../CAREUI/display/Chip";
import ConfirmDialog from "../Common/ConfirmDialog";
import ContactLink from "../Common/components/ContactLink";
import CoverImageEditModal from "./CoverImageEditModal";

import Page from "../Common/components/Page";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import Table from "../Common/components/Table";

import { navigate } from "raviger";
import { useMessageListener } from "../../Common/hooks/useMessageListener";
import { useTranslation } from "react-i18next";
import useAuthUser from "../../Common/hooks/useAuthUser.js";
import request from "../../Utils/request/request.js";
import routes from "../../Redux/api.js";
import useQuery from "../../Utils/request/useQuery.js";
import { FacilityHomeTriage } from "./FacilityHomeTriage.js";
import { FacilityDoctorList } from "./FacilityDoctorList.js";
import { FacilityBedCapacity } from "./FacilityBedCapacity.js";
import useSlug from "../../Common/hooks/useSlug.js";
import { Popover, Transition } from "@headlessui/react";
import { FieldLabel } from "../Form/FormFields/FormField.js";
import { LocationSelect } from "../Common/LocationSelect.js";

const Loading = lazy(() => import("../Common/Loading"));

export const getFacilityFeatureIcon = (featureId: number) => {
  const feature = FACILITY_FEATURE_TYPES.find((f) => f.id === featureId);
  if (!feature?.icon) return null;
  return typeof feature.icon === "string" ? (
    <CareIcon icon={feature.icon} className="text-lg" />
  ) : (
    feature.icon
  );
};

export const FacilityHome = (props: any) => {
  const { t } = useTranslation();
  const { facilityId } = props;
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editCoverImage, setEditCoverImage] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const authUser = useAuthUser();

  useMessageListener((data) => console.log(data));

  const {
    data: facilityData,
    loading: isLoading,
    refetch: facilityFetch,
  } = useQuery(routes.getPermittedFacility, {
    pathParams: {
      id: facilityId,
    },
    onResponse: ({ res }) => {
      if (!res?.ok) {
        navigate("/not-found");
      }
    },
  });

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };

  const handleDeleteSubmit = async () => {
    await request(routes.deleteFacility, {
      pathParams: { id: facilityId },
      onResponse: ({ res }) => {
        if (res?.ok) {
          Notification.Success({
            msg: "Facility deleted successfully",
          });
        }
        navigate("/facility");
      },
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  const hasCoverImage = !!facilityData?.read_cover_image_url;

  const StaffUserTypeIndex = USER_TYPES.findIndex((type) => type === "Staff");
  const hasPermissionToEditCoverImage =
    !(authUser.user_type as string).includes("ReadOnly") &&
    USER_TYPES.findIndex((type) => type == authUser.user_type) >=
      StaffUserTypeIndex;

  const hasPermissionToDeleteFacility =
    authUser.user_type === "DistrictAdmin" ||
    authUser.user_type === "StateAdmin";

  const editCoverImageTooltip = hasPermissionToEditCoverImage && (
    <div
      id="facility-coverimage"
      className="absolute right-0 top-0 z-10 flex h-full w-full flex-col items-center justify-center rounded-t-lg bg-black text-sm text-gray-300 opacity-0 transition-[opacity] hover:opacity-60 md:h-[88px]"
    >
      <CareIcon icon="l-pen" className="text-lg" />
      <span className="mt-2">{`${hasCoverImage ? "Edit" : "Upload"}`}</span>
    </div>
  );

  const CoverImage = () => (
    <img
      src={`${facilityData?.read_cover_image_url}?imgKey=${imageKey}`}
      alt={facilityData?.name}
      className="h-full w-full rounded-lg object-cover"
    />
  );

  return (
    <Page
      title={facilityData?.name || "Facility"}
      crumbsReplacements={{ [facilityId]: { name: facilityData?.name } }}
      focusOnLoad={true}
      backUrl="/facility"
    >
      <ConfirmDialog
        title={`Delete ${facilityData?.name}`}
        description={
          <span>
            Are you sure you want to delete{" "}
            <strong>{facilityData?.name}</strong>
          </span>
        }
        action="Delete"
        variant="danger"
        show={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteSubmit}
      />
      <CoverImageEditModal
        open={editCoverImage}
        onSave={() =>
          facilityData?.read_cover_image_url
            ? setImageKey(Date.now())
            : facilityFetch()
        }
        onClose={() => setEditCoverImage(false)}
        onDelete={() => facilityFetch()}
        facility={facilityData ?? ({} as FacilityModel)}
      />
      {hasCoverImage ? (
        <div
          className={
            "group relative h-48 w-full text-clip rounded-t bg-gray-200 opacity-100 transition-all duration-200 ease-in-out md:h-0 md:opacity-0"
          }
        >
          <CoverImage />
          {editCoverImageTooltip}
        </div>
      ) : (
        <div
          className={`group relative z-0 flex w-full shrink-0 items-center justify-center self-stretch bg-gray-300 md:hidden ${
            hasPermissionToEditCoverImage && "cursor-pointer"
          }`}
          onClick={() =>
            hasPermissionToEditCoverImage && setEditCoverImage(true)
          }
        >
          <CareIcon
            icon="l-hospital"
            className="block p-10 text-4xl text-gray-500"
            aria-hidden="true"
          />
          {editCoverImageTooltip}
        </div>
      )}
      <div
        className={`bg-white ${
          hasCoverImage ? "rounded-b lg:rounded-t" : "rounded"
        } p-3 shadow-sm transition-all duration-200 ease-in-out md:p-6`}
      >
        <div className="justify-between gap-2 lg:flex">
          <div className="flex-col justify-between md:flex">
            <div className="flex flex-1 flex-col">
              <div className="flex items-start gap-4">
                <div
                  className={`group relative hidden h-[20rem] w-[88px] text-clip rounded transition-all duration-200 ease-in-out md:mr-2 md:flex lg:mr-6 lg:h-[20rem] lg:w-[20rem] ${
                    hasPermissionToEditCoverImage && "cursor-pointer"
                  }`}
                  onClick={() =>
                    hasPermissionToEditCoverImage && setEditCoverImage(true)
                  }
                >
                  {hasCoverImage ? (
                    <CoverImage />
                  ) : (
                    <div className="flex h-[20rem] w-[88px] items-center justify-center rounded-lg bg-gray-200 font-medium text-gray-700 lg:h-[20rem] lg:w-[20rem]">
                      <svg
                        className="h-8 w-8 fill-current text-gray-500"
                        viewBox="0 0 40 32"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M18.5 6C18.5 5.4475 18.95 5 19.5 5H20.5C21.05 5 21.5 5.4475 21.5 6V7.5H23C23.55 7.5 24 7.95 24 8.5V9.5C24 10.05 23.55 10.5 23 10.5H21.5V12C21.5 12.55 21.05 13 20.5 13H19.5C18.95 13 18.5 12.55 18.5 12V10.5H17C16.45 10.5 16 10.05 16 9.5V8.5C16 7.95 16.45 7.5 17 7.5H18.5V6ZM25.5 0C27.9875 0 30 2.015 30 4.5V5H35.5C37.9875 5 40 7.0125 40 9.5V27.5C40 29.9875 37.9875 32 35.5 32H4.49875C2.01188 32 0 29.9875 0 27.5V9.5C0 7.0125 2.015 5 4.5 5H10V4.5C10 2.015 12.0125 0 14.5 0H25.5ZM30 8V29H35.5C36.3312 29 37 28.3313 37 27.5V21H33.5C32.6688 21 32 20.3313 32 19.5C32 18.6688 32.6688 18 33.5 18H37V15H33.5C32.6688 15 32 14.3313 32 13.5C32 12.6688 32.6688 12 33.5 12H37V9.5C37 8.66875 36.3312 8 35.5 8H30ZM3 9.5V12H6.5C7.33125 12 8 12.6688 8 13.5C8 14.3313 7.33125 15 6.5 15H3V18H6.5C7.33125 18 8 18.6688 8 19.5C8 20.3313 7.33125 21 6.5 21H3V27.5C3 28.3313 3.67125 29 4.49875 29H10V8H4.5C3.67188 8 3 8.66875 3 9.5ZM13 29H17V25C17 23.3438 18.3438 22 20 22C21.6562 22 23 23.3438 23 25V29H27V4.5C27 3.67188 26.3312 3 25.5 3H14.5C13.6688 3 13 3.67188 13 4.5V29Z" />
                      </svg>
                    </div>
                  )}
                  {editCoverImageTooltip}
                </div>
                <div className="mb-6 grid gap-4 md:mb-0">
                  <div className="flex-col justify-between md:flex lg:flex-1 ">
                    <div className="mb-4" id="facility-name">
                      <h1 className="text-3xl font-bold">
                        {facilityData?.name}
                      </h1>
                      {facilityData?.modified_date && (
                        <RecordMeta
                          className="mt-1 text-sm text-gray-700"
                          prefix={t("updated")}
                          time={facilityData?.modified_date}
                        />
                      )}
                    </div>
                    <div className="mb-4" id="address-details-view">
                      <h1 className="text-base font-semibold text-[#B9B9B9]">
                        Address
                      </h1>
                      <p className="text-base font-medium">
                        {facilityData?.address}
                      </p>
                    </div>

                    <div className="flex-col md:flex lg:flex-1">
                      <div className="mb-4">
                        <h1 className="text-base font-semibold text-[#B9B9B9]">
                          Local Body
                        </h1>
                        <p className="w-2/3 text-base font-medium md:w-full">
                          {facilityData?.local_body_object?.name}
                        </p>
                      </div>
                      <div className="mb-4 flex flex-col flex-wrap gap-4 md:flex-row">
                        <div>
                          <h1 className="text-base font-semibold text-[#B9B9B9]">
                            Ward
                          </h1>
                          <p className="text-base font-medium">
                            {facilityData?.ward_object?.number +
                              ", " +
                              facilityData?.ward_object?.name}
                          </p>
                        </div>
                        <div>
                          <h1 className="text-base font-semibold text-[#B9B9B9]">
                            District
                          </h1>
                          <p className="text-base font-medium">
                            {facilityData?.district_object?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div id="phone-number-view">
                          <h1 className="text-base font-semibold text-[#B9B9B9]">
                            Phone Number
                          </h1>
                          <ContactLink
                            tel={String(facilityData?.phone_number)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-center"></div>
            </div>
            <div className="mt-10 flex items-center gap-3">
              <div>
                {facilityData?.features?.some((feature) =>
                  FACILITY_FEATURE_TYPES.some((f) => f.id === feature)
                ) && (
                  <h1 className="text-lg font-semibold">Available features</h1>
                )}
                <div
                  className="mt-5 flex flex-wrap gap-2"
                  id="facility-available-features"
                >
                  {facilityData?.features?.map(
                    (feature: number, i: number) =>
                      FACILITY_FEATURE_TYPES.some((f) => f.id === feature) && (
                        <Chip
                          key={i}
                          size="large"
                          text={
                            FACILITY_FEATURE_TYPES.filter(
                              (f) => f.id === feature
                            )[0]?.name
                          }
                          startIcon={
                            FACILITY_FEATURE_TYPES.filter(
                              (f) => f.id === feature
                            )[0]?.icon
                          }
                        />
                      )
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex h-[20rem] flex-col justify-between">
            <div className="w-full md:w-auto">
              <DropdownMenu
                id="manage-facility-dropdown"
                title="Manage Facility"
                icon={<CareIcon icon="l-setting" className="text-lg" />}
              >
                <DropdownItem
                  id="update-facility"
                  onClick={() => navigate(`/facility/${facilityId}/update`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon icon="l-edit-alt" className="text-lg" />}
                >
                  Update Facility
                </DropdownItem>
                <DropdownItem
                  id="configure-facility"
                  onClick={() => navigate(`/facility/${facilityId}/configure`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon icon="l-setting" className="text-lg" />}
                >
                  Configure Facility
                </DropdownItem>
                <DropdownItem
                  id="inventory-management"
                  onClick={() => navigate(`/facility/${facilityId}/inventory`)}
                  icon={<CareIcon icon="l-clipboard-alt" className="w-5" />}
                >
                  Inventory Management
                </DropdownItem>
                <DropdownItem
                  id="location-management"
                  onClick={() => navigate(`/facility/${facilityId}/location`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={
                    <CareIcon icon="l-location-point" className="text-lg" />
                  }
                >
                  Location Management
                </DropdownItem>
                <DropdownItem
                  id="resource-request"
                  onClick={() =>
                    navigate(`/facility/${facilityId}/resource/new`)
                  }
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon icon="l-gold" className="text-lg" />}
                >
                  Resource Request
                </DropdownItem>
                <DropdownItem
                  id="create-assets"
                  onClick={() => navigate(`/facility/${facilityId}/assets/new`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon icon="l-plus-circle" className="text-lg" />}
                >
                  Create Asset
                </DropdownItem>
                <DropdownItem
                  id="view-assets"
                  onClick={() => navigate(`/assets?facility=${facilityId}`)}
                  icon={<CareIcon icon="l-medkit" className="text-lg" />}
                >
                  View Assets
                </DropdownItem>
                <DropdownItem
                  id="view-users"
                  onClick={() => navigate(`/facility/${facilityId}/users`)}
                  icon={<CareIcon icon="l-users-alt" className="text-lg" />}
                >
                  View Users
                </DropdownItem>
                {hasPermissionToDeleteFacility && (
                  <DropdownItem
                    id="delete-facility"
                    variant="danger"
                    onClick={() => setOpenDeleteDialog(true)}
                    className="flex items-center gap-3"
                    icon={<CareIcon icon="l-trash-alt" className="text-lg" />}
                  >
                    Delete Facility
                  </DropdownItem>
                )}
              </DropdownMenu>
            </div>
            <div className="sm:grid sm:grid-cols-2 sm:gap-2 md:grid md:grid-cols-2 md:gap-2 lg:flex lg:flex-col lg:justify-end lg:gap-0 ">
              <ButtonV2
                id="facility-detailspage-cns"
                variant="primary"
                ghost
                border
                className="mt-2 flex w-full flex-row justify-center md:w-auto"
                onClick={() => navigate(`/facility/${facilityId}/cns`)}
              >
                <CareIcon icon="l-monitor-heart-rate" className="text-lg" />
                <span>Central Nursing Station</span>
              </ButtonV2>
              <LiveMonitoringButton />
              <ButtonV2
                variant="primary"
                ghost
                border
                className="mt-2 flex w-full flex-row justify-center md:w-auto"
                onClick={() => navigate(`/facility/${facilityId}/patient`)}
                authorizeFor={NonReadOnlyUsers}
              >
                <CareIcon icon="l-plus" className="text-lg" />
                <span className="text-sm">Add Details of a Patient</span>
              </ButtonV2>
              <ButtonV2
                id="view-patient-facility-list"
                variant="primary"
                ghost
                border
                className="mt-2 flex w-full flex-row justify-center md:w-auto"
                onClick={() => navigate(`/patients?facility=${facilityId}`)}
              >
                <CareIcon icon="l-user-injured" className="text-lg" />
                <span>View Patients</span>
              </ButtonV2>
              <ButtonV2
                id="view-patient-facility-list"
                variant="primary"
                ghost
                border
                className="mt-2 flex w-full flex-row justify-center md:w-auto"
                onClick={() =>
                  navigate(`/facility/${facilityId}/discharged-patients`)
                }
              >
                <CareIcon icon="l-user-injured" className="text-lg" />
                <span>View Discharged Patients</span>
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>
      <FacilityBedCapacity facilityId={facilityId} />
      <FacilityDoctorList facilityId={facilityId} />

      <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
        <h1 className="mb-6 text-xl font-bold">Oxygen Information</h1>
        <div
          className="overflow-x-auto overflow-y-hidden"
          id="facility-oxygen-info"
        >
          <Table
            headings={[
              "",
              "Oxygen capacity",
              "Type B cylinder",
              "Type C cylinder",
              "Type D cylinder",
            ]}
            rows={[
              [
                "Capacity",
                String(facilityData?.oxygen_capacity),
                String(facilityData?.type_b_cylinders),
                String(facilityData?.type_c_cylinders),
                String(facilityData?.type_d_cylinders),
              ],
              [
                "Daily Expected Consumption",
                String(facilityData?.expected_oxygen_requirement),
                String(facilityData?.expected_type_b_cylinders),
                String(facilityData?.expected_type_c_cylinders),
                String(facilityData?.expected_type_d_cylinders),
              ],
            ]}
          />
        </div>
      </div>

      <FacilityHomeTriage
        facilityId={facilityId}
        NonReadOnlyUsers={NonReadOnlyUsers}
      />
    </Page>
  );
};

const LiveMonitoringButton = () => {
  const facilityId = useSlug("facility");
  const [location, setLocation] = useState<string>();
  const authUser = useAuthUser();

  const permittedUserTypes = ["StateAdmin", "DistrictAdmin", "Doctor"];

  return (
    <Popover className="relative">
      {permittedUserTypes.includes(authUser.user_type) && (
        <Popover.Button className="mt-2 w-full">
          <ButtonV2
            variant="primary"
            ghost
            border
            className="w-full"
            id="facility-detailspage-livemonitoring"
          >
            <CareIcon icon="l-video" className="text-lg" />
            <span>Live Monitoring</span>
          </ButtonV2>
        </Popover.Button>
      )}

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute z-30 mt-1 w-full px-4 sm:px-0 md:w-96 lg:max-w-3xl lg:translate-x-[-168px]">
          <div className="rounded-lg shadow-lg ring-1 ring-gray-400">
            <div className="relative flex flex-col gap-4 rounded-b-lg bg-white p-6">
              <div>
                <FieldLabel htmlFor="location" className="text-sm">
                  Choose a location
                </FieldLabel>
                <div className="flex w-full items-center gap-2">
                  <LocationSelect
                    className="w-full"
                    name="location"
                    setSelected={(v) => setLocation(v as string | undefined)}
                    selected={location ?? null}
                    showAll={false}
                    multiple={false}
                    facilityId={facilityId}
                    errors=""
                    errorClassName="hidden"
                  />
                </div>
              </div>
              <ButtonV2
                id="live-monitoring-button"
                disabled={!location}
                className="w-full"
                href={`/facility/${facilityId}/live-monitoring?location=${location}`}
              >
                Open Live Monitoring
              </ButtonV2>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
