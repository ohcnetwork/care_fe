import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CountBlock from "@/CAREUI/display/Count";
import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";

import ButtonV2 from "@/components/Common/ButtonV2";
import CircularProgress from "@/components/Common/CircularProgress";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";
import { FacilityModel } from "@/components/Facility/models";
import UnlinkFacilityDialog from "@/components/Users/UnlinkFacilityDialog";
import UserFilter from "@/components/Users/UserFilter";
import UserListView from "@/components/Users/UserListAndCard";

import useAuthUser from "@/hooks/useAuthUser";
import useFilters from "@/hooks/useFilters";

import { USER_TYPES } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { classNames } from "@/Utils/utils";

export default function ManageUsers() {
  const { t } = useTranslation();
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({
    limit: 18,
    cacheBlacklist: ["username"],
  });
  let manageUsers: JSX.Element = <></>;
  const authUser = useAuthUser();
  const userIndex = USER_TYPES.indexOf(authUser.user_type);
  const userTypes = authUser.is_superuser
    ? [...USER_TYPES]
    : USER_TYPES.slice(0, userIndex + 1);
  const [activeTab, setActiveTab] = useState(0);

  const { data: homeFacilityData } = useTanStackQueryInstead(
    routes.getAnyFacility,
    {
      pathParams: { id: qParams.home_facility },
      prefetch: !!qParams.home_facility && qParams.home_facility !== "NONE",
    },
  );

  const { data: userListData, loading: userListLoading } =
    useTanStackQueryInstead(routes.userList, {
      query: {
        limit: resultsPerPage.toString(),
        offset: (
          (qParams.page ? qParams.page - 1 : 0) * resultsPerPage
        ).toString(),
        username: qParams.username,
        first_name: qParams.first_name,
        last_name: qParams.last_name,
        phone_number: qParams.phone_number,
        alt_phone_number: qParams.alt_phone_number,
        user_type: qParams.user_type,
        district_id: qParams.district,
        home_facility: qParams.home_facility,
        last_active_days: qParams.last_active_days,
      },
    });

  useEffect(() => {
    if (!qParams.state && qParams.district) {
      advancedFilter.removeFilters(["district"]);
    }
    if (!qParams.district && qParams.state) {
      advancedFilter.removeFilters(["state"]);
    }
  }, [advancedFilter, qParams]);

  const { data: districtData, loading: districtDataLoading } =
    useTanStackQueryInstead(routes.getDistrict, {
      prefetch: !!qParams.district,
      pathParams: { id: qParams.district },
    });

  const addUser = (
    <ButtonV2
      id="addUserButton"
      className="w-full"
      onClick={() => navigate("/users/add")}
    >
      <CareIcon icon="l-plus" className="text-lg" />
      <p>{t("add_new_user")}</p>
    </ButtonV2>
  );

  if (userListLoading || districtDataLoading || !userListData?.results) {
    return <Loading />;
  }

  manageUsers = (
    <div>
      <UserListView
        users={userListData?.results ?? []}
        onSearch={(username) => updateQuery({ username })}
        searchValue={qParams.username}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <Pagination totalCount={userListData.count} />
    </div>
  );

  return (
    <Page title={t("user_management")} hideBack={true} breadcrumbs={false}>
      <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <CountBlock
          text="Total Users"
          count={userListData?.count || 0}
          loading={userListLoading || districtDataLoading}
          icon="d-people"
          className="flex-1"
        />
        <div className="col-span-2 my-2 flex flex-col justify-between space-y-3 lg:flex-row lg:space-x-4 lg:space-y-0 lg:px-3">
          <div className="flex flex-col gap-2">
            <AdvancedFilterButton
              onClick={() => advancedFilter.setShow(true)}
            />
            {userTypes.length && addUser}
          </div>

          <UserFilter {...advancedFilter} key={window.location.search} />
        </div>
      </div>

      <div>
        <FilterBadges
          badges={({ badge, value, phoneNumber }) => [
            badge("Username", "username"),
            badge("First Name", "first_name"),
            badge("Last Name", "last_name"),
            phoneNumber(),
            phoneNumber("WhatsApp no.", "alt_phone_number"),
            badge("Role", "user_type"),
            value(
              "District",
              "district",
              qParams.district ? districtData?.name || "" : "",
            ),
            value(
              "Home Facility",
              "home_facility",
              qParams.home_facility
                ? qParams.home_facility === "NONE"
                  ? t("no_home_facility")
                  : homeFacilityData?.name || ""
                : "",
            ),
            value(
              "Last Active",
              "last_active_days",
              (() => {
                if (!qParams.last_active_days) return "";
                if (qParams.last_active_days === "never") return "Never";
                return `in the last ${qParams.last_active_days} day${qParams.last_active_days > 1 ? "s" : ""}`;
              })(),
            ),
          ]}
        />
      </div>

      <div className="pt-4">
        <div>{manageUsers}</div>
      </div>
    </Page>
  );
}

export function UserFacilities(props: { user: any }) {
  const { t } = useTranslation();
  const { user } = props;
  const username = user.username;
  const limit = 20;
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [facility, setFacility] = useState<any>(null);
  const [unlinkFacilityData, setUnlinkFacilityData] = useState<{
    show: boolean;
    userName: string;
    facility?: FacilityModel;
    isHomeFacility: boolean;
  }>({ show: false, userName: "", facility: undefined, isHomeFacility: false });
  const authUser = useAuthUser();
  const hideUnlinkFacilityModal = () => {
    setUnlinkFacilityData({
      show: false,
      facility: undefined,
      userName: "",
      isHomeFacility: false,
    });
  };

  const {
    data: userFacilities,
    loading: userFacilitiesLoading,
    refetch: refetchUserFacilities,
  } = useTanStackQueryInstead(routes.userListFacility, {
    pathParams: { username },
    query: {
      limit,
      offset,
    },
    onResponse: ({ res, data }) => {
      if (res?.status === 200 && data) {
        setTotalCount(data.count);
      }
    },
  });

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const updateHomeFacility = async (username: string, facility: any) => {
    setIsLoading(true);
    const { res } = await request(routes.partialUpdateUser, {
      pathParams: { username },
      body: { home_facility: facility.id.toString() },
    });
    if (!res?.ok) {
      Notification.Error({
        msg: "Error while updating Home facility",
      });
    } else {
      user.home_facility_object = facility;
      Notification.Success({
        msg: "Home Facility updated successfully",
      });
    }
    await refetchUserFacilities();
    setIsLoading(false);
  };

  const handleUnlinkFacilitySubmit = async () => {
    setIsLoading(true);
    if (unlinkFacilityData.isHomeFacility) {
      const { res } = await request(routes.clearHomeFacility, {
        pathParams: { username },
      });

      if (!res?.ok) {
        Notification.Error({
          msg: "Error while clearing home facility",
        });
      } else {
        user.home_facility_object = null;
        Notification.Success({
          msg: "Home Facility cleared successfully",
        });
      }
    } else {
      const { res } = await request(routes.deleteUserFacility, {
        pathParams: { username },
        body: { facility: unlinkFacilityData?.facility?.id?.toString() },
      });
      if (!res?.ok) {
        Notification.Error({
          msg: "Error while unlinking home facility",
        });
      } else {
        Notification.Success({
          msg: "Facility unlinked successfully",
        });
      }
    }
    await refetchUserFacilities();
    hideUnlinkFacilityModal();
    setIsLoading(false);
  };

  const addFacility = async (username: string, facility: any) => {
    setIsLoading(true);
    const { res } = await request(routes.addUserFacility, {
      pathParams: { username },
      body: { facility: facility.id.toString() },
    });

    if (!res?.ok) {
      Notification.Error({
        msg: "Error while linking facility",
      });
    } else {
      Notification.Success({
        msg: "Facility linked successfully",
      });
    }
    await refetchUserFacilities();
    setIsLoading(false);
    setFacility(null);
  };

  return (
    <div className="h-full">
      {unlinkFacilityData.show && (
        <UnlinkFacilityDialog
          facilityName={unlinkFacilityData.facility?.name || ""}
          userName={unlinkFacilityData.userName}
          isHomeFacility={unlinkFacilityData.isHomeFacility}
          handleCancel={hideUnlinkFacilityModal}
          handleOk={handleUnlinkFacilitySubmit}
        />
      )}

      <div className="mb-4 flex items-stretch gap-2">
        <FacilitySelect
          multiple={false}
          name="facility"
          exclude_user={username}
          showAll={false} // Show only facilities that user has access to link (not all facilities)
          showNOptions={8}
          selected={facility}
          setSelected={setFacility}
          errors=""
          className="z-40 w-full"
        />
        <ButtonV2
          id="link-facility"
          disabled={!facility}
          className="mt-1 h-[45px] w-[74px] text-base"
          onClick={() => addFacility(username, facility)}
        >
          {t("add")}
        </ButtonV2>
      </div>
      <hr className="my-2 border-secondary-300" />

      {isLoading || userFacilitiesLoading ? (
        <div className="flex items-center justify-center">
          <CircularProgress />
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Home Facility section */}
          {user?.home_facility_object && (
            <div className="py-2" id="home-facility">
              <div className="relative rounded p-2 transition hover:bg-secondary-200 focus:bg-secondary-200 md:rounded-lg">
                <div className="flex items-center justify-between">
                  <span>{user?.home_facility_object?.name}</span>
                  <span
                    className={
                      "flex items-center justify-center rounded-xl bg-green-600 px-2 py-0.5 text-sm font-medium text-white"
                    }
                  >
                    <CareIcon icon="l-estate" className="mr-1 pt-px text-lg" />
                    Home Facility
                  </span>
                  {(["DistrictAdmin", "StateAdmin"].includes(
                    authUser.user_type,
                  ) ||
                    username === authUser.username) && (
                    <div className="flex items-center gap-2">
                      <button
                        className="tooltip text-lg text-red-600"
                        onClick={() =>
                          setUnlinkFacilityData({
                            show: true,
                            facility: user?.home_facility_object,
                            userName: username,
                            isHomeFacility: true,
                          })
                        }
                      >
                        <CareIcon icon="l-link-broken" />
                        <span className="tooltip-text tooltip-left">
                          {t("clear_home_facility")}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Linked Facilities section */}
          {!!userFacilities?.results.length && (
            <div id="linked-facility-list">
              <div className="flex flex-col">
                {userFacilities.results.map(
                  (facility: FacilityModel, i: number) => {
                    if (user?.home_facility_object?.id === facility.id) {
                      // skip if it's a home facility
                      return null;
                    }
                    return (
                      <div
                        id={`facility_${i}`}
                        key={`facility_${i}`}
                        className={classNames(
                          "relative rounded p-2 transition hover:bg-secondary-200 focus:bg-secondary-200 md:rounded-lg",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span>{facility.name}</span>
                          {(["DistrictAdmin", "StateAdmin"].includes(
                            authUser.user_type,
                          ) ||
                            username === authUser.username) && (
                            <div className="flex items-center gap-2">
                              {authUser.user_type !== "Nurse" && (
                                <button
                                  className="tooltip text-lg hover:text-primary-500"
                                  id="home-facility-icon"
                                  onClick={() => {
                                    if (user?.home_facility_object) {
                                      // has previous home facility
                                    } else {
                                      // no previous home facility
                                      updateHomeFacility(username, facility);
                                    }
                                  }}
                                >
                                  <CareIcon icon="l-estate" />
                                  <span className="tooltip-text tooltip-left">
                                    Set as home facility
                                  </span>
                                </button>
                              )}
                              <button
                                id="unlink-facility-button"
                                className="tooltip text-lg text-red-600"
                                onClick={() => {
                                  setUnlinkFacilityData({
                                    show: true,
                                    facility: facility,
                                    userName: username,
                                    isHomeFacility: false,
                                  });
                                }}
                              >
                                <CareIcon icon="l-link-broken" />
                                <span className="tooltip-text tooltip-left">
                                  Unlink Facility
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
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
            </div>
          )}
          {!user?.home_facility_object && !userFacilities?.results.length && (
            <div className="my-2 flex h-96 flex-col content-center justify-center align-middle">
              <div className="w-full">
                <img
                  src="/images/404.svg"
                  alt="No linked facilities"
                  className="mx-auto w-80"
                />
              </div>
              <p className="pt-4 text-center text-lg font-semibold text-primary">
                {t("no_linked_facilities")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
