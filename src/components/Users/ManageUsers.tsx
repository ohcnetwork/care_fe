import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "@/CAREUI/display/Card";
import CountBlock from "@/CAREUI/display/Count";
import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";

import { Avatar } from "@/components/Common/Avatar";
import ButtonV2 from "@/components/Common/ButtonV2";
import CircularProgress from "@/components/Common/CircularProgress";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import Pagination from "@/components/Common/Pagination";
import Tabs from "@/components/Common/Tabs";
import { FacilityModel } from "@/components/Facility/models";
import SearchInput from "@/components/Form/SearchInput";
import UnlinkFacilityDialog from "@/components/Users/UnlinkFacilityDialog";
import UserFilter from "@/components/Users/UserFilter";

import useAuthUser from "@/hooks/useAuthUser";
import useFilters from "@/hooks/useFilters";
import useWindowDimensions from "@/hooks/useWindowDimensions";

import { USER_TYPES } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import {
  classNames,
  formatName,
  isUserOnline,
  relativeTime,
} from "@/Utils/utils";

import { UserModel } from "./models";

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
  let manageUsers: any = null;
  const authUser = useAuthUser();
  const userIndex = USER_TYPES.indexOf(authUser.user_type);
  const userTypes = authUser.is_superuser
    ? [...USER_TYPES]
    : USER_TYPES.slice(0, userIndex + 1);
  const { width } = useWindowDimensions();
  const mediumScreenBreakpoint = 640;
  const isMediumScreen = width <= mediumScreenBreakpoint;
  const [activeTab, setActiveTab] = useState(0);

  const { data: homeFacilityData } = useQuery(routes.getAnyFacility, {
    pathParams: { id: qParams.home_facility },
    prefetch: !!qParams.home_facility && qParams.home_facility !== "NONE",
  });

  const { data: userListData, loading: userListLoading } = useQuery(
    routes.userList,
    {
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
    },
  );

  useEffect(() => {
    if (!qParams.state && qParams.district) {
      advancedFilter.removeFilters(["district"]);
    }
    if (!qParams.district && qParams.state) {
      advancedFilter.removeFilters(["state"]);
    }
  }, [advancedFilter, qParams]);

  const { data: districtData, loading: districtDataLoading } = useQuery(
    routes.getDistrict,
    {
      prefetch: !!qParams.district,
      pathParams: { id: qParams.district },
    },
  );

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

  const getNameAndStatusCard = (user: UserModel, cur_online: boolean) => {
    return (
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold" id="user-name">
            {formatName(user)}
          </h1>
          <div
            className={classNames(
              "flex items-center gap-2 rounded-full px-3 py-1",
              cur_online ? "bg-green-100" : "bg-gray-100",
            )}
          >
            {user && (
              <>
                <span
                  aria-label="Online"
                  className={classNames(
                    "inline-block h-2 w-2 shrink-0 rounded-full",
                    cur_online ? "bg-green-500" : "bg-gray-400",
                  )}
                ></span>
                <span
                  className={classNames(
                    "text-xs",
                    cur_online ? "text-green-700" : "text-gray-500",
                  )}
                >
                  {cur_online
                    ? "Online"
                    : user.last_login
                      ? relativeTime(user.last_login)
                      : "Never"}
                </span>
              </>
            )}
          </div>
        </div>
        <span className="text-sm text-gray-500">{user.username}</span>
      </div>
    );
  };
  const getCard = (user: UserModel, idx: number) => {
    const cur_online = isUserOnline(user);

    return (
      <Card key={`usr_${user.id}`} id={`usr_${idx}`} className="relative">
        <div className="flex flex-col items-start justify-between sm:flex-row">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col items-center gap-4 min-[320px]:flex-row sm:items-start">
              <Avatar
                imageUrl={user.read_profile_picture_url}
                name={user.username ?? ""}
                className="h-16 w-16 self-center text-2xl sm:self-auto"
              />
              {isMediumScreen && getNameAndStatusCard(user, cur_online)}
            </div>
            <div className="flex flex-col">
              {!isMediumScreen && getNameAndStatusCard(user, cur_online)}
              <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2">
                <div className="text-sm">
                  <div className="text-gray-500">Role</div>
                  <div className="font-medium">{user.user_type}</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500">Home facility</div>
                  <div className="font-medium">
                    {user.home_facility_object?.name || "No Home Facility"}
                  </div>
                </div>
                {user.district_object && (
                  <div className="text-sm">
                    <div className="text-gray-500">District</div>
                    <div className="font-medium">
                      {user.district_object.name}
                    </div>
                  </div>
                )}
                {user.weekly_working_hours && (
                  <div className="text-sm">
                    <div className="text-gray-500">Average Weekly Hours</div>
                    <div className="font-medium">
                      {user.weekly_working_hours}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/users/${user.username}`)}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-xs"
          >
            <CareIcon icon="l-arrow-up-right" className="text-lg" />
            <span>More details</span>
          </button>
        </div>
      </Card>
    );
  };
  const getListHeader = () => (
    <thead>
      <tr className="bg-gray-50 text-sm font-medium text-gray-500">
        <th className="px-4 py-3 text-left">Name</th>
        <th className="px-4 py-3 text-left">Status</th>
        <th className="px-4 py-3 text-left">Role</th>
        <th className="px-4 py-3 text-left">Home facility</th>
        <th className="px-4 py-3 text-left">District</th>
        <th className="px-4 py-3"></th>
      </tr>
    </thead>
  );
  const getList = (user: UserModel, idx: number) => {
    const cur_online = isUserOnline(user);
    return (
      <tr key={`usr_${user.id}`} id={`usr_${idx}`} className="hover:bg-gray-50">
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar
              imageUrl={user.read_profile_picture_url}
              name={user.username ?? ""}
              className="h-10 w-10 text-lg"
            />
            <div className="flex flex-col">
              <h1 className="text-sm font-medium" id="user-name">
                {formatName(user)}
              </h1>
              <span className="text-xs text-gray-500">@{user.username}</span>
            </div>
          </div>
        </td>
        <td className="flex-0 py-4">
          <div
            className={classNames(
              "flex items-center gap-2 rounded-full px-3 py-1",
              cur_online ? "bg-green-100" : "bg-gray-100",
            )}
          >
            <span
              className={classNames(
                "inline-block h-2 w-2 shrink-0 rounded-full",
                cur_online ? "bg-green-500" : "bg-gray-400",
              )}
            ></span>
            <span
              className={classNames(
                "text-xs",
                cur_online ? "text-green-700" : "text-gray-500",
              )}
            >
              {cur_online
                ? "Online"
                : user.last_login
                  ? relativeTime(user.last_login)
                  : "Never"}
            </span>
          </div>
        </td>
        <td className="px-4 py-4 text-sm">{user.user_type}</td>
        <td className="px-4 py-4 text-sm">
          {user.home_facility_object?.name || "No Home Facility"}
        </td>
        <td className="px-4 py-4 text-sm">
          {user.district_object?.name || ""}
        </td>
        <td className="px-4 py-4">
          <button
            onClick={() => navigate(`/users/${user.username}`)}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-xs"
          >
            <CareIcon icon="l-arrow-up-right" className="text-lg" />
            <span>More details</span>
          </button>
        </td>
      </tr>
    );
  };
  const renderCard = () => (
    <>
      {userListData?.results.map((user: UserModel, idx: number) =>
        getCard(user, idx),
      )}
    </>
  );
  const renderList = () => (
    <table className="min-w-full divide-y divide-gray-200">
      {getListHeader()}
      <tbody className="divide-y divide-gray-200 bg-white">
        {userListData?.results.map((user: UserModel, idx: number) =>
          getList(user, idx),
        )}
      </tbody>
    </table>
  );

  const tabs = [
    {
      id: 0,
      content: (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {renderCard()}
        </div>
      ),
    },
    {
      id: 1,
      content: <div className="rounded-lg bg-white shadow">{renderList()}</div>,
    },
  ];

  if (userListLoading || districtDataLoading || !userListData?.results) {
    return <Loading />;
  }

  if (userListData?.results.length) {
    manageUsers = (
      <div>
        <div className="mb-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="sm:w-1/2">
            <SearchInput
              id="search-by-username"
              name="username"
              onChange={(e) => updateQuery({ [e.name]: e.value })}
              value={qParams.username}
              placeholder={t("search_by_username")}
            />
          </div>
          <Tabs
            tabs={[
              {
                text: (
                  <div className="flex items-center gap-2">
                    <CareIcon icon="l-credit-card" className="text-lg" />
                    <span>Card</span>
                  </div>
                ),
                value: 0,
              },
              {
                text: (
                  <div className="flex items-center gap-2">
                    <CareIcon icon="l-list-ul" className="text-lg" />
                    <span>List</span>
                  </div>
                ),
                value: 1,
              },
            ]}
            currentTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as number)}
            className="float-right"
          />
        </div>
        <div className="clear-both">
          {tabs.find((tab) => tab.id === activeTab)?.content}
        </div>
        <Pagination totalCount={userListData.count} />
      </div>
    );
  } else if (userListData?.results && userListData?.results.length === 0) {
    manageUsers = (
      <div>
        <div className="h-full space-y-2 rounded-lg bg-white p-7 shadow">
          <div className="flex w-full items-center justify-center text-xl font-bold text-secondary-500">
            No Users Found
          </div>
        </div>
      </div>
    );
  }

  return (
    <Page title={t("user_management")} hideBack={true} breadcrumbs={false}>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 md:gap-5">
        <CountBlock
          text="Total Users"
          count={userListData?.count || 0}
          loading={userListLoading || districtDataLoading}
          icon="l-user-injured"
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
  } = useQuery(routes.userListFacility, {
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
