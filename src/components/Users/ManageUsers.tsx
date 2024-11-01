import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CountBlock from "../../CAREUI/display/Count";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import { USER_TYPES } from "@/common/constants";
import useAuthUser from "@/common/hooks/useAuthUser";
import useFilters from "@/common/hooks/useFilters";
import useWindowDimensions from "@/common/hooks/useWindowDimensions";
import routes from "../../Redux/api";
import * as Notification from "../../Utils/Notifications";
import request from "../../Utils/request/request";
import useQuery from "../../Utils/request/useQuery";
import {
  classNames,
  formatName,
  isUserOnline,
  relativeTime,
} from "../../Utils/utils";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import Pagination from "@/components/Common/Pagination";
import UserDetails from "@/components/Common/UserDetails";
import UserDetailComponent from "@/components/Common/UserDetailsComponet";
import ButtonV2 from "@/components/Common/components/ButtonV2";
import CircularProgress from "@/components/Common/components/CircularProgress";
import Page from "@/components/Common/components/Page";
import { FacilityModel } from "../Facility/models";
import SearchInput from "../Form/SearchInput";
import ConfirmHomeFacilityUpdateDialog from "./ConfirmHomeFacilityUpdateDialog";
import UnlinkFacilityDialog from "./UnlinkFacilityDialog";
import UserFilter from "./UserFilter";

import Loading from "@/components/Common/Loading";
export default function ManageUsers() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
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

  const extremeSmallScreenBreakpoint = 320;
  const isExtremeSmallScreen = width <= extremeSmallScreenBreakpoint;

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

  let userList: any[] = [];
  userListData?.results &&
    userListData.results.length &&
    (userList = userListData.results.map((user: any, idx) => {
      const cur_online = isUserOnline(user);
      return (
        <div key={`usr_${user.id}`} id={`usr_${idx}`}>
          <div className="relative block h-full overflow-visible rounded-lg bg-white shadow hover:border-primary-500">
            <div className="flex h-full flex-col justify-between @container">
              <div className="px-6 py-4">
                <div className="flex flex-col flex-wrap justify-between gap-3 @sm:flex-row">
                  {user.username && (
                    <div
                      id="username"
                      className="inline-flex w-fit items-center rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-medium leading-5 text-blue-800"
                    >
                      {user.username}
                    </div>
                  )}
                  <div className="min-width-50 shrink-0 text-sm text-secondary-600">
                    {user.last_login && cur_online ? (
                      <span>
                        {" "}
                        <CareIcon icon="l-clock" className="text-lg" />{" "}
                        Currently Online
                      </span>
                    ) : (
                      <>
                        <span>
                          <CareIcon icon="l-clock" className="text-lg" /> Last
                          Online:{" "}
                        </span>
                        <span
                          aria-label="Online"
                          className={classNames(
                            "inline-block h-2 w-2 shrink-0 rounded-full",
                            cur_online ? "bg-primary-400" : "bg-secondary-300",
                          )}
                        ></span>
                        <span className="pl-2">
                          {user.last_login
                            ? relativeTime(user.last_login)
                            : "Never"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div
                  id="name"
                  className="mt-2 flex items-center gap-3 text-2xl font-bold capitalize"
                >
                  {formatName(user)}

                  {user.last_login && cur_online ? (
                    <div
                      className="h-4 w-4 rounded-full bg-primary-500"
                      aria-label="Online"
                    />
                  ) : null}
                </div>

                <div
                  className={`flex ${
                    isExtremeSmallScreen
                      ? "flex-wrap"
                      : "flex-col justify-between md:flex-row"
                  } gap-2 md:grid md:grid-cols-2`}
                >
                  {user.user_type && (
                    <UserDetailComponent
                      id="role"
                      title="Role"
                      value={user.user_type}
                    />
                  )}
                  {user.district_object && (
                    <UserDetailComponent
                      id="district"
                      title="District"
                      value={user.district_object.name}
                    />
                  )}
                </div>
                {user.local_body_object && (
                  <UserDetails id="local_body" title="Location">
                    <div className="font-semibold">
                      {user.local_body_object.name}
                    </div>
                  </UserDetails>
                )}

                <div
                  className={`${
                    isExtremeSmallScreen ? "flex flex-wrap" : "grid grid-cols-2"
                  }`}
                >
                  {user.created_by && (
                    <div className="col-span-1">
                      <UserDetails id="created_by" title="Created by">
                        <div className="overflow-hidden">
                          <div
                            className="truncate font-semibold"
                            title={user.created_by}
                          >
                            {user.created_by}
                          </div>
                        </div>
                      </UserDetails>
                    </div>
                  )}
                  {user.username && (
                    <div className="col-span-1">
                      <UserDetails id="home_facility" title="Home Facility">
                        <span className="block font-semibold">
                          {user.home_facility_object?.name ||
                            "No Home Facility"}
                        </span>
                      </UserDetails>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex h-12 flex-row justify-end bg-secondary-200">
                <ButtonV2
                  id="link-user"
                  className="mr-2 mt-1 h-[35px] w-[80px] self-center text-sm"
                  ghost
                  border
                  onClick={() => navigate(`/users/${user.username}`)}
                >
                  {t("view_user")}
                </ButtonV2>
              </div>
            </div>
          </div>
        </div>
      );
    }));

  if (userListLoading || districtDataLoading || !userListData?.results) {
    manageUsers = <Loading />;
  } else if (userListData?.results.length) {
    manageUsers = (
      <div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {userList}
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
          <div className="w-full">
            <SearchInput
              id="search-by-username"
              name="username"
              onChange={(e) => updateQuery({ [e.name]: e.value })}
              value={qParams.username}
              placeholder={t("search_by_username")}
            />
          </div>
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

  const [replaceHomeFacility, setReplaceHomeFacility] = useState<{
    show: boolean;
    userName: string;
    previousFacility?: FacilityModel;
    newFacility?: FacilityModel;
  }>({
    show: false,
    userName: "",
    previousFacility: undefined,
    newFacility: undefined,
  });
  const hideReplaceHomeFacilityModal = () => {
    setReplaceHomeFacility({
      show: false,
      previousFacility: undefined,
      userName: "",
      newFacility: undefined,
    });
  };
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
                                      setReplaceHomeFacility({
                                        show: true,
                                        userName: username,
                                        previousFacility:
                                          user?.home_facility_object,
                                        newFacility: facility,
                                      });
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
      {replaceHomeFacility.show && (
        <ConfirmHomeFacilityUpdateDialog
          previousFacilityName={
            replaceHomeFacility.previousFacility?.name || ""
          }
          userName={replaceHomeFacility.userName}
          newFacilityName={replaceHomeFacility.newFacility?.name || ""}
          handleCancel={hideReplaceHomeFacilityModal}
          handleOk={() => {
            updateHomeFacility(
              replaceHomeFacility.userName,
              replaceHomeFacility.newFacility,
            );
            setReplaceHomeFacility({
              show: false,
              previousFacility: undefined,
              userName: "",
              newFacility: undefined,
            });
          }}
        />
      )}
    </div>
  );
}
