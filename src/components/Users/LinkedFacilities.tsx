import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { FacilitySelect } from "@/components/Common/FacilitySelect";
import { FacilityModel } from "@/components/Facility/models";
import ConfirmFacilityModal from "@/components/Users/ConfirmFacilityModal";
import { UserModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";
import { useIsAuthorized } from "@/hooks/useIsAuthorized";

import AuthorizeFor from "@/Utils/AuthorizeFor";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

const initModalProps: {
  selectedFacility?: FacilityModel;
  type: string;
  toggle: boolean;
} = {
  toggle: false,
  selectedFacility: undefined,
  type: "",
};

export default function LinkedFacilities({
  userData,
  refetchUserData,
}: {
  userData: UserModel;
  refetchUserData?: () => void;
}) {
  const [facility, setFacility] = useState<any>(null);
  const [userFacilities, setUserFacilities] = useState<
    FacilityModel[] | null
  >();
  const [homeFacility, setHomeFacility] = useState<FacilityModel | undefined>();
  const [modalProps, setModalProps] = useState(initModalProps);
  const { t } = useTranslation();
  const authUser = useAuthUser();

  const authorizeForHomeFacility = useIsAuthorized(
    AuthorizeFor(["DistrictAdmin", "StateAdmin"]),
  );

  const isCurrentUser = userData.username === authUser.username;

  const { refetch: refetchUserFacilities } = useTanStackQueryInstead(
    routes.userListFacility,
    {
      pathParams: { username: userData.username },
      query: { limit: 36 },
      onResponse({ res, data }) {
        if (res?.status === 200 && data) {
          let userFacilities = data?.results;
          if (userData.home_facility_object) {
            const homeFacility = data?.results.find(
              (facility) => facility.id === userData.home_facility_object?.id,
            );
            userFacilities = userFacilities.filter(
              (facility) => facility.id !== homeFacility?.id,
            );
            setHomeFacility(homeFacility);
          }
          setUserFacilities(userFacilities);
        }
      },
    },
  );

  const handleOnClick = (type: string, selectedFacility: FacilityModel) => {
    switch (type) {
      case "clear_home_facility":
      case "unlink_facility":
      case "replace_home_facility":
        setModalProps({
          selectedFacility,
          type: type,
          toggle: true,
        });
        break;
      case "set_home_facility":
        replaceHomeFacility(selectedFacility);
        break;
    }
  };

  const handleModalCancel = () => {
    setModalProps(initModalProps);
  };

  const handleModalOk = () => {
    switch (modalProps.type) {
      case "unlink_facility":
        unlinkFacility();
        break;
      case "clear_home_facility":
        clearHomeFacility();
        break;
      case "replace_home_facility":
        replaceHomeFacility();
        break;
    }
    setModalProps(initModalProps);
  };

  const replaceHomeFacility = async (facility?: FacilityModel) => {
    const selectedFacility = facility ?? modalProps.selectedFacility;
    const { res } = await request(routes.partialUpdateUser, {
      pathParams: { username: userData.username },
      body: { home_facility: selectedFacility?.id?.toString() },
    });
    if (!res?.ok) {
      Notification.Error({
        msg: t("home_facility_updated_error"),
      });
    } else {
      setHomeFacility(selectedFacility);
      Notification.Success({
        msg: t("home_facility_updated_success"),
      });
    }
    await refetchUserFacilities();
    refetchUserData?.();
  };

  const clearHomeFacility = async () => {
    const { res } = await request(routes.clearHomeFacility, {
      pathParams: { username: userData.username },
    });

    if (!res?.ok) {
      Notification.Error({
        msg: t("clear_home_facility_error"),
      });
    } else {
      userData.home_facility_object = undefined;
      setHomeFacility(undefined);
      Notification.Success({
        msg: t("home_facility_cleared_success"),
      });
    }
    await refetchUserFacilities();
  };

  const unlinkFacility = async () => {
    const { res } = await request(routes.deleteUserFacility, {
      pathParams: { username: userData.username },
      body: { facility: modalProps.selectedFacility?.id?.toString() },
    });
    if (!res?.ok) {
      Notification.Error({
        msg: t("unlink_facility_error"),
      });
    } else {
      Notification.Success({
        msg: t("unlink_facility_success"),
      });
    }
    await refetchUserFacilities();
  };

  const linkFacility = async (
    username: string,
    facility: FacilityModel | null,
  ) => {
    if (!facility) return;
    const { res } = await request(routes.addUserFacility, {
      pathParams: { username },
      body: { facility: facility.id?.toString() },
    });

    if (!res?.ok) {
      Notification.Error({
        msg: t("link_facility_error"),
      });
    } else {
      Notification.Success({
        msg: t("facility_linked_success"),
      });
    }
    await refetchUserFacilities();
    setFacility(null);
  };

  const renderFacilityButtons = (facility: FacilityModel) => {
    if (!facility) return;
    return (
      <div id={`facility_${facility.id}`} key={`facility_${facility.id}`}>
        <DropdownMenu>
          <div className="flex flex-row items-center rounded-sm border bg-secondary-100 w-full md:w-full">
            <div className="text-sm text-black p-2 font-bold flex-1">
              {facility.name}
              {facility.district_object?.name && (
                <div className="text-sm text-gray-500 font-medium">
                  {facility.district_object?.name}
                  {facility.district_object?.name &&
                    facility.state_object?.name &&
                    ", "}
                  {facility.state_object?.name}
                </div>
              )}
            </div>
            <DropdownMenuTrigger id="linked-facility-settings">
              <div className="flex items-center justify-center rounded-r bg-secondary-300 px-2 min-h-16">
                <CareIcon icon="l-setting" className="text-xl" />
              </div>
            </DropdownMenuTrigger>
          </div>

          <DropdownMenuContent>
            {authorizeForHomeFacility && (
              <DropdownMenuItem
                id="set-home-facility"
                onClick={() =>
                  handleOnClick(
                    homeFacility
                      ? "replace_home_facility"
                      : "set_home_facility",
                    facility,
                  )
                }
              >
                {t("set_home_facility")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              id="unlink-facility"
              onClick={() => handleOnClick("unlink_facility", facility)}
            >
              {t("unlink_this_facility")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const renderHomeFacilityButton = (homeFacility: FacilityModel) => {
    return (
      <div
        id={`facility_${homeFacility.id}`}
        key={`facility_${homeFacility.id}`}
      >
        <div className="flex flex-row items-center rounded-sm border bg-secondary-100 w-full">
          <div className="text-sm text-black p-2 font-bold flex-1">
            {homeFacility.name}
            {homeFacility.district_object?.name && (
              <div className="text-sm text-gray-500 font-medium">
                {homeFacility.district_object?.name}
                {homeFacility.district_object?.name &&
                  homeFacility.state_object?.name &&
                  ", "}
                {homeFacility.state_object?.name}
              </div>
            )}
          </div>
          {(authorizeForHomeFacility || isCurrentUser) && (
            <div className="border-l-3 rounded-r bg-secondary-300 px-2 py-4 h-14">
              <button
                id="clear-home-facility"
                onClick={() =>
                  handleOnClick("clear_home_facility", homeFacility)
                }
                title={t("clear_home_facility")}
                aria-label={t("clear_home_facility")}
              >
                <CareIcon icon="l-multiply" className="text-xl" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {modalProps.toggle && (
        <ConfirmFacilityModal
          username={userData.username}
          currentFacility={modalProps.selectedFacility}
          homeFacility={homeFacility}
          handleCancel={handleModalCancel}
          handleOk={handleModalOk}
          type={modalProps.type}
        />
      )}
      <div className="flex flex-col gap-y-6 rounded bg-white p-4 shadow">
        <div className="flex flex-col sm:flex-row gap-3">
          <FacilitySelect
            id="select-facility"
            multiple={false}
            name="facility"
            exclude_user={userData.username}
            showAll={false}
            showNOptions={8}
            selected={facility}
            setSelected={setFacility}
            errors=""
            className="z-10 w-full"
            disabled={!authorizeForHomeFacility}
          />
          <Button
            variant="primary"
            size="lg"
            name="Add"
            id="link-facility"
            className="mt-1 rounded-lg px-6 py-[23px] text-base"
            onClick={() => linkFacility(userData.username, facility)}
            disabled={!authorizeForHomeFacility}
          >
            {t("add_facility")}
          </Button>
        </div>

        {homeFacility && (
          <div className="flex flex-col gap-2">
            <p className="text-xs">{t("home_facility")}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              {renderHomeFacilityButton(homeFacility)}
            </div>
          </div>
        )}

        {userFacilities && userFacilities.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs">{t("linked_facilities")}</p>

            <div
              id="linked-facility-list"
              className="flex flex-col sm:flex-row flex-wrap gap-3"
            >
              {userFacilities.map((facility: FacilityModel) => {
                if (homeFacility?.id === facility.id) {
                  return null;
                }
                return renderFacilityButtons(facility);
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
