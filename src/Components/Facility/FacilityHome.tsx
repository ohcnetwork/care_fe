import * as Notification from "../../Utils/Notifications.js";

import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import { FacilityModel } from "./models";
import { FACILITY_FEATURE_TYPES, USER_TYPES } from "../../Common/constants";
import DropdownMenu, { DropdownItem } from "../Common/components/Menu";
import { useState } from "react";

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
import { useTranslation } from "react-i18next";
import useAuthUser from "../../Common/hooks/useAuthUser.js";
import request from "../../Utils/request/request.js";
import routes from "../../Redux/api.js";
import useQuery from "../../Utils/request/useQuery.js";
import { FacilityHomeTriage } from "./FacilityHomeTriage.js";
import { FacilityBedCapacity } from "./FacilityBedCapacity.js";
import useSlug from "../../Common/hooks/useSlug.js";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { FieldLabel } from "../Form/FormFields/FormField.js";
import { LocationSelect } from "../Common/LocationSelect.js";
import { CameraFeedPermittedUserTypes } from "../../Utils/permissions.js";
import { FacilityStaffList } from "./FacilityStaffList.js";
import FacilityBlock from "./FacilityBlock.js";

type Props = {
  facilityId: string;
};

import Loading from "@/Components/Common/Loading";
import { Avatar } from "@/Components/Common/Avatar.js";
export const getFacilityFeatureIcon = (featureId: number) => {
  const feature = FACILITY_FEATURE_TYPES.find((f) => f.id === featureId);
  if (!feature?.icon) return null;
  return typeof feature.icon === "string" ? (
    <CareIcon icon={feature.icon} className="text-lg" />
  ) : (
    feature.icon
  );
};

export const FacilityHome = ({ facilityId }: Props) => {
  const { t } = useTranslation();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editCoverImage, setEditCoverImage] = useState(false);
  const authUser = useAuthUser();

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

  const spokesQuery = useQuery(routes.getFacilitySpokes, {
    pathParams: {
      id: facilityId,
    },
    silent: true,
  });

  const hubsQuery = useQuery(routes.getFacilityHubs, {
    pathParams: {
      id: facilityId,
    },
    silent: true,
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
            msg: t("deleted_successfully", { name: facilityData?.name }),
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
      className={
        "absolute right-0 top-0 z-10 flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg bg-black text-sm text-secondary-300 opacity-0 transition-opacity hover:opacity-60"
      }
      onClick={() => setEditCoverImage(true)}
    >
      <CareIcon icon="l-pen" className="text-lg" />
      <span className="mt-2">{t(hasCoverImage ? "edit" : "upload")}</span>
    </div>
  );

  return (
    <Page
      title={facilityData?.name || "Facility"}
      crumbsReplacements={{ [facilityId]: { name: facilityData?.name } }}
      focusOnLoad={true}
      backUrl="/facility"
    >
      <ConfirmDialog
        title={t("delete_item", { name: facilityData?.name })}
        description={
          <span>
            {t("are_you_sure_want_to_delete", { name: facilityData?.name })}
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
        onSave={() => facilityFetch()}
        onClose={() => setEditCoverImage(false)}
        onDelete={() => facilityFetch()}
        facility={facilityData ?? ({} as FacilityModel)}
      />

      <div
        className={`group relative z-0 flex w-full shrink-0 items-center justify-center self-stretch md:hidden ${
          hasPermissionToEditCoverImage && "cursor-pointer"
        }`}
        onClick={() => hasPermissionToEditCoverImage && setEditCoverImage(true)}
      >
        <Avatar
          imageUrl={facilityData?.read_cover_image_url}
          name={facilityData?.name ?? ""}
        />
        {editCoverImageTooltip}
      </div>
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
                  className={`group relative hidden h-80 w-[88px] text-clip rounded transition-all duration-200 ease-in-out md:mr-2 md:flex lg:mr-6 lg:h-80 lg:w-80 ${
                    hasPermissionToEditCoverImage && "cursor-pointer"
                  }`}
                  onClick={() =>
                    hasPermissionToEditCoverImage && setEditCoverImage(true)
                  }
                >
                  <div className="flex h-80 w-[88px] items-center justify-center rounded-lg font-medium text-secondary-700 lg:h-80 lg:w-80">
                    <Avatar
                      imageUrl={facilityData?.read_cover_image_url}
                      name={facilityData?.name ?? ""}
                    />
                  </div>

                  {editCoverImageTooltip}
                </div>
                <div className="mb-6 grid gap-4 md:mb-0">
                  <div className="flex-col justify-between md:flex lg:flex-1">
                    <div className="mb-4" id="facility-name">
                      <h1 className="text-3xl font-bold">
                        {facilityData?.name}
                      </h1>
                      {facilityData?.modified_date && (
                        <RecordMeta
                          className="mt-1 text-sm text-secondary-700"
                          prefix={t("updated")}
                          time={facilityData?.modified_date}
                        />
                      )}
                    </div>
                    <div className="mb-4" id="address-details-view">
                      <h1 className="text-base font-semibold text-[#B9B9B9]">
                        {t("address")}
                      </h1>
                      <p className="text-base font-medium">
                        {facilityData?.address}
                      </p>
                    </div>

                    <div className="flex-col md:flex lg:flex-1">
                      <div className="mb-4">
                        <h1 className="text-base font-semibold text-[#B9B9B9]">
                          {t("local_body")}
                        </h1>
                        <p className="w-2/3 text-base font-medium md:w-full">
                          {facilityData?.local_body_object?.name}
                        </p>
                      </div>
                      <div className="mb-4 flex flex-col flex-wrap gap-4 md:flex-row">
                        <div>
                          <h1 className="text-base font-semibold text-[#B9B9B9]">
                            {t("ward")}
                          </h1>
                          <p className="text-base font-medium">
                            {facilityData?.ward_object?.number +
                              ", " +
                              facilityData?.ward_object?.name}
                          </p>
                        </div>
                        <div>
                          <h1 className="text-base font-semibold text-[#B9B9B9]">
                            {t("district")}
                          </h1>
                          <p className="text-base font-medium">
                            {facilityData?.district_object?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div id="phone-number-view">
                          <h1 className="text-base font-semibold text-[#B9B9B9]">
                            {t("phone_number")}
                          </h1>
                          <ContactLink
                            tel={String(facilityData?.phone_number)}
                          />
                        </div>
                      </div>
                      {!!spokesQuery.data?.results?.length && (
                        <div className="mt-4 flex items-center gap-3">
                          <div id="spokes-view">
                            <h1 className="text-base font-semibold text-[#B9B9B9]">
                              {t("spokes")}
                            </h1>
                            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                              {spokesQuery.data?.results.map((spoke) => (
                                <FacilityBlock
                                  key={spoke.id}
                                  facility={spoke.spoke_object}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {!!hubsQuery.data?.results?.length && (
                        <div className="mt-4 flex items-center gap-3">
                          <div id="hubs-view">
                            <h1 className="text-base font-semibold text-[#B9B9B9]">
                              {t("hubs")}
                            </h1>
                            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                              {hubsQuery.data.results.map((hub) => (
                                <FacilityBlock
                                  facility={hub.hub_object}
                                  redirect={false}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 items-center"></div>
            </div>
            <div className="mt-10 flex items-center gap-3">
              <div>
                {facilityData?.features?.some((feature) =>
                  FACILITY_FEATURE_TYPES.some((f) => f.id === feature),
                ) && (
                  <h1 className="text-lg font-semibold">
                    {t("available_features")}
                  </h1>
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
                              (f) => f.id === feature,
                            )[0]?.name
                          }
                          startIcon={
                            FACILITY_FEATURE_TYPES.filter(
                              (f) => f.id === feature,
                            )[0]?.icon
                          }
                        />
                      ),
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex h-80 flex-col justify-between">
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
                  {t("update_facility")}
                </DropdownItem>
                <DropdownItem
                  id="configure-facility"
                  onClick={() => navigate(`/facility/${facilityId}/configure`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon icon="l-setting" className="text-lg" />}
                >
                  {t("configure_facility")}
                </DropdownItem>
                <DropdownItem
                  id="inventory-management"
                  onClick={() => navigate(`/facility/${facilityId}/inventory`)}
                  icon={<CareIcon icon="l-clipboard-alt" className="w-5" />}
                >
                  {t("inventory_management")}
                </DropdownItem>
                <DropdownItem
                  id="location-management"
                  onClick={() => navigate(`/facility/${facilityId}/location`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={
                    <CareIcon icon="l-location-point" className="text-lg" />
                  }
                >
                  {t("location_management")}
                </DropdownItem>
                <DropdownItem
                  id="resource-request"
                  onClick={() =>
                    navigate(`/facility/${facilityId}/resource/new`)
                  }
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon icon="l-gold" className="text-lg" />}
                >
                  {t("resource_request")}
                </DropdownItem>
                <DropdownItem
                  id="create-assets"
                  onClick={() => navigate(`/facility/${facilityId}/assets/new`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon icon="l-plus-circle" className="text-lg" />}
                >
                  {t("create_asset")}
                </DropdownItem>
                <DropdownItem
                  id="view-assets"
                  onClick={() => navigate(`/assets?facility=${facilityId}`)}
                  icon={<CareIcon icon="l-medkit" className="text-lg" />}
                >
                  {t("view_asset")}
                </DropdownItem>
                <DropdownItem
                  id="view-users"
                  onClick={() => navigate(`/facility/${facilityId}/users`)}
                  icon={<CareIcon icon="l-users-alt" className="text-lg" />}
                >
                  {t("view_users")}
                </DropdownItem>
                <DropdownItem
                  id="view-abdm-records"
                  onClick={() => navigate(`/facility/${facilityId}/abdm`)}
                  icon={<CareIcon icon="l-file-network" className="text-lg" />}
                >
                  {t("view_abdm_records")}
                </DropdownItem>
                {hasPermissionToDeleteFacility ? (
                  <DropdownItem
                    id="delete-facility"
                    variant="danger"
                    onClick={() => setOpenDeleteDialog(true)}
                    className="flex items-center gap-3"
                    icon={<CareIcon icon="l-trash-alt" className="text-lg" />}
                  >
                    {t("delete_facility")}
                  </DropdownItem>
                ) : (
                  <></>
                )}
              </DropdownMenu>
            </div>
            <div className="sm:grid sm:grid-cols-2 sm:gap-2 md:grid md:grid-cols-2 md:gap-2 lg:flex lg:flex-col lg:justify-end lg:gap-0">
              <ButtonV2
                id="facility-detailspage-cns"
                variant="primary"
                ghost
                border
                className="mt-2 flex w-full flex-row justify-center md:w-auto"
                onClick={() => navigate(`/facility/${facilityId}/cns`)}
              >
                <CareIcon icon="l-monitor-heart-rate" className="text-lg" />
                <span>{t("central_nursing_station")}</span>
              </ButtonV2>
              {CameraFeedPermittedUserTypes.includes(authUser.user_type) && (
                <LiveMonitoringButton />
              )}
              <ButtonV2
                variant="primary"
                ghost
                border
                className="mt-2 flex w-full flex-row justify-center md:w-auto"
                onClick={() => navigate(`/facility/${facilityId}/patient`)}
                authorizeFor={NonReadOnlyUsers}
              >
                <CareIcon icon="l-plus" className="text-lg" />
                <span className="text-sm">{t("add_details_of_patient")}</span>
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
                <span>{t("view_patients")}</span>
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>
      <FacilityBedCapacity facilityId={facilityId} />
      <FacilityStaffList facilityId={facilityId} />

      <div className="mt-5 rounded bg-white p-3 shadow-sm md:p-6">
        <h1 className="mb-6 text-xl font-bold">{t("oxygen_information")}</h1>
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

  const { t } = useTranslation();

  return (
    <Popover className="relative">
      <PopoverButton className="mt-2 w-full">
        <ButtonV2
          variant="primary"
          ghost
          border
          className="w-full"
          id="facility-detailspage-livemonitoring"
        >
          <CareIcon icon="l-video" className="text-lg" />
          <span>{t("live_monitoring")}</span>
        </ButtonV2>
      </PopoverButton>

      <Transition
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel className="absolute z-30 mt-1 w-full px-4 sm:px-0 md:w-96 lg:max-w-3xl lg:translate-x-[-168px]">
          <div className="rounded-lg shadow-lg ring-1 ring-secondary-400">
            <div className="relative flex flex-col gap-4 rounded-b-lg bg-white p-6">
              <div>
                <FieldLabel htmlFor="location" className="text-sm">
                  {t("choose_location")}
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
                {t("open_live_monitoring")}
              </ButtonV2>
            </div>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
};
