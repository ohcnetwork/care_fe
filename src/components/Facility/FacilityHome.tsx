import careConfig from "@careConfig";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Chip from "@/CAREUI/display/Chip";
import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Markdown } from "@/components/ui/markdown";

import AvatarEditModal from "@/components/Common/AvatarEditModal";
import AvatarEditable from "@/components/Common/AvatarEditable";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import ContactLink from "@/components/Common/ContactLink";
import Loading from "@/components/Common/Loading";
import DropdownMenu, { DropdownItem } from "@/components/Common/Menu";
import Page from "@/components/Common/Page";

import useAuthUser from "@/hooks/useAuthUser";

import { FACILITY_FEATURE_TYPES, USER_TYPES } from "@/common/constants";

import { PLUGIN_Component } from "@/PluginEngine";
import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import uploadFile from "@/Utils/request/uploadFile";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { getAuthorizationHeader } from "@/Utils/request/utils";
import { sleep } from "@/Utils/utils";

import { UserModel } from "../Users/models";

export function canUserRegisterPatient(
  authUser: UserModel,
  facilityId: string,
) {
  return authUser.home_facility_object?.id === facilityId;
}

type Props = {
  facilityId: string;
};

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
  } = useTanStackQueryInstead(routes.getPermittedFacility, {
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
            msg: t("deleted_successfully", { name: facilityData?.name }),
          });
        }
        navigate("/facility");
      },
    });
  };

  const handleCoverImageUpload = async (file: File, onError: () => void) => {
    const formData = new FormData();
    formData.append("cover_image", file);
    const url = `${careConfig.apiUrl}/api/v1/facility/${facilityId}/cover_image/`;

    uploadFile(
      url,
      formData,
      "POST",
      { Authorization: getAuthorizationHeader() },
      async (xhr: XMLHttpRequest) => {
        if (xhr.status === 200) {
          await sleep(1000);
          facilityFetch();
          Notification.Success({ msg: "Cover image updated." });
          setEditCoverImage(false);
        } else {
          onError();
        }
      },
      null,
      () => {
        onError();
      },
    );
  };

  const handleCoverImageDelete = async (onError: () => void) => {
    const { res } = await request(routes.deleteFacilityCoverImage, {
      pathParams: { id: facilityId },
    });
    if (res?.ok) {
      Notification.Success({ msg: "Cover image deleted" });
      facilityFetch();
      setEditCoverImage(false);
    } else {
      onError();
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const StaffUserTypeIndex = USER_TYPES.findIndex((type) => type === "Staff");
  const hasPermissionToEditCoverImage =
    !(authUser.user_type as string).includes("ReadOnly") &&
    USER_TYPES.findIndex((type) => type == authUser.user_type) >=
      StaffUserTypeIndex;

  const hasPermissionToDeleteFacility =
    authUser.user_type === "DistrictAdmin" ||
    authUser.user_type === "StateAdmin";

  return (
    <Page
      title={facilityData?.name || "Facility"}
      crumbsReplacements={{ [facilityId]: { name: facilityData?.name } }}
      focusOnLoad={true}
      hideBack={false}
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
      <AvatarEditModal
        title={t("edit_cover_photo")}
        open={editCoverImage}
        imageUrl={facilityData?.read_cover_image_url}
        handleUpload={handleCoverImageUpload}
        handleDelete={handleCoverImageDelete}
        onClose={() => setEditCoverImage(false)}
      />

      <div className="p-3 transition-all duration-200 ease-in-out md:p-6">
        <div className="justify-between gap-2 lg:flex">
          <div className="flex-col justify-between md:flex">
            <div className="flex flex-1 flex-col">
              <div className="flex flex-col items-start gap-4 md:flex-row">
                <AvatarEditable
                  id="facility-coverimage"
                  imageUrl={facilityData?.read_cover_image_url}
                  name={facilityData?.name ?? ""}
                  editable={hasPermissionToEditCoverImage}
                  onClick={() => setEditCoverImage(true)}
                  className="md:mr-2 lg:mr-6 lg:h-80 lg:w-80"
                />
                <div
                  className="mb-6 grid gap-4 md:mb-0"
                  id="facility-details-card"
                >
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
                {facilityData?.description && (
                  <div className="mt-8">
                    <Markdown
                      content={facilityData.description}
                      className="mt-4"
                    />
                  </div>
                )}
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
                {/* <DropdownItem
                  id="configure-facility"
                  onClick={() => navigate(`/facility/${facilityId}/configure`)}
                  authorizeFor={NonReadOnlyUsers}
                  icon={<CareIcon icon="l-setting" className="text-lg" />}
                >
                  {t("configure_facility")}
                </DropdownItem> */}
                {/* <DropdownItem
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
                </DropdownItem> */}

                <PLUGIN_Component
                  __name="ManageFacilityOptions"
                  facility={facilityData}
                />
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
          </div>
        </div>
      </div>
    </Page>
  );
};
