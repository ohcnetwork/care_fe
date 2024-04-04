import dayjs from "dayjs";
import { navigate } from "raviger";
import { lazy, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CountBlock from "../../CAREUI/display/Count";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import SlideOverCustom from "../../CAREUI/interactive/SlideOver";
import { USER_TYPES } from "../../Common/constants";
import useAuthUser from "../../Common/hooks/useAuthUser.js";
import useFilters from "../../Common/hooks/useFilters";
import useWindowDimensions from "../../Common/hooks/useWindowDimensions";
import routes from "../../Redux/api.js";
import * as Notification from "../../Utils/Notifications.js";
import request from "../../Utils/request/request.js";
import useQuery from "../../Utils/request/useQuery.js";
import {
  classNames,
  isUserOnline,
  relativeTime,
  showUserDelete,
} from "../../Utils/utils";
import { FacilitySelect } from "../Common/FacilitySelect";
import Pagination from "../Common/Pagination";
import UserDetails from "../Common/UserDetails";
import UserDetailComponent from "../Common/UserDetailsComponet.js";
import ButtonV2, { Submit } from "../Common/components/ButtonV2";
import CircularProgress from "../Common/components/CircularProgress.js";
import Page from "../Common/components/Page.js";
import { FacilityModel } from "../Facility/models";
import TextFormField from "../Form/FormFields/TextFormField.js";
import SearchInput from "../Form/SearchInput";
import ConfirmHomeFacilityUpdateDialog from "./ConfirmHomeFacilityUpdateDialog";
import SkillsSlideOver from "./SkillsSlideOver";
import UnlinkFacilityDialog from "./UnlinkFacilityDialog";
import UserDeleteDialog from "./UserDeleteDialog";
import UserFilter from "./UserFilter";

const Loading = lazy(() => import("../Common/Loading"));

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
  const [expandSkillList, setExpandSkillList] = useState(false);
  const [expandFacilityList, setExpandFacilityList] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [expandWorkingHours, setExpandWorkingHours] = useState(false);
  const authUser = useAuthUser();
  const [weeklyHours, setWeeklyHours] = useState<string>("0");
  const userIndex = USER_TYPES.indexOf(authUser.user_type);
  const userTypes = authUser.is_superuser
    ? [...USER_TYPES]
    : USER_TYPES.slice(0, userIndex + 1);

  const [userData, setUserData] = useState<{
    show: boolean;
    username: string;
    name: string;
  }>({ show: false, username: "", name: "" });

  const [weeklyHoursError, setWeeklyHoursError] = useState<string>("");

  const extremeSmallScreenBreakpoint = 320;
  const isExtremeSmallScreen = width <= extremeSmallScreenBreakpoint;

  const {
    data: userListData,
    loading: userListLoading,
    refetch: refetchUserList,
  } = useQuery(routes.userList, {
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

  const { data: districtData, loading: districtDataLoading } = useQuery(
    routes.getDistrict,
    {
      prefetch: !!qParams.district,
      pathParams: { id: qParams.district },
    }
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

  const handleCancel = () => {
    setUserData({ show: false, username: "", name: "" });
  };

  const handleWorkingHourSubmit = async () => {
    const username = selectedUser;
    if (!username || !weeklyHours || +weeklyHours < 0 || +weeklyHours > 168) {
      setWeeklyHoursError("Value should be between 0 and 168");
      return;
    }
    const { res, data, error } = await request(routes.partialUpdateUser, {
      pathParams: { username },
      body: { weekly_working_hours: weeklyHours },
    });
    if (res && res.status === 200 && data) {
      Notification.Success({
        msg: "Working hours updated successfully",
      });
      setExpandWorkingHours(false);
      setSelectedUser(null);
    } else {
      Notification.Error({
        msg: "Error while updating working hours: " + (error || ""),
      });
    }
    setWeeklyHours("0");
    setWeeklyHoursError("");
    await refetchUserList();
  };

  const handleSubmit = async () => {
    const { res, error } = await request(routes.deleteUser, {
      pathParams: { username: userData.username },
    });
    if (res?.status === 204) {
      Notification.Success({
        msg: "User deleted successfully",
      });
    } else {
      Notification.Error({
        msg: "Error while deleting User: " + (error || ""),
      });
    }

    setUserData({ show: false, username: "", name: "" });
    await refetchUserList();
  };

  const handleDelete = (user: any) => {
    setUserData({
      show: true,
      username: user.username,
      name: `${user.first_name} ${user.last_name}`,
    });
  };

  let userList: any[] = [];

  userListData?.results &&
    userListData.results.length &&
    (userList = userListData.results.map((user: any, idx) => {
      const cur_online = isUserOnline(user);
      return (
        <div
          key={`usr_${user.id}`}
          id={`usr_${idx}`}
          className=" mt-6 w-full md:px-4 lg:w-1/2 xl:w-1/3"
        >
          <div className="relative block h-full overflow-visible rounded-lg bg-white shadow hover:border-primary-500">
            <div className="flex h-full flex-col justify-between @container">
              <div className="px-6 py-4">
                <div
                  className="flex flex-col
                flex-wrap justify-between gap-3 @sm:flex-row"
                >
                  {user.username && (
                    <div
                      id="username"
                      className="inline-flex w-fit items-center rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-medium leading-5 text-blue-800"
                    >
                      {user.username}
                    </div>
                  )}
                  <div className="min-width-50 shrink-0 text-sm text-gray-600">
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
                            cur_online ? "bg-primary-400" : "bg-gray-300"
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
                  {`${user.first_name} ${user.last_name}`}

                  {user.last_login && cur_online ? (
                    <div
                      className="h-4 w-4 rounded-full bg-primary-500"
                      aria-label="Online"
                    />
                  ) : null}
                  {showUserDelete(authUser, user) && (
                    <div
                      className="w-8 cursor-pointer rounded-lg bg-red-50 text-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(user)}
                    >
                      <CareIcon icon="l-trash" className="ml-[5px]" />
                    </div>
                  )}
                </div>

                <div
                  className={`flex ${
                    isExtremeSmallScreen
                      ? " flex-wrap "
                      : " flex-col justify-between md:flex-row "
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
                  {user.user_type === "Doctor" && (
                    <>
                      <div className="col-span-1">
                        <UserDetails
                          id="doctor-qualification"
                          title="Qualification"
                        >
                          {user.doctor_qualification ? (
                            <span className="font-semibold">
                              {user.doctor_qualification}
                            </span>
                          ) : (
                            <span className="text-gray-600">Unknown</span>
                          )}
                        </UserDetails>
                      </div>
                      <div className="col-span-1">
                        <UserDetails id="doctor-experience" title="Experience">
                          {user.doctor_experience_commenced_on ? (
                            <span className="font-semibold">
                              {dayjs().diff(
                                user.doctor_experience_commenced_on,
                                "years",
                                false
                              )}{" "}
                              years
                            </span>
                          ) : (
                            <span className="text-gray-600">Unknown</span>
                          )}
                        </UserDetails>
                      </div>
                      <div className="col-span-2">
                        <UserDetails
                          id="medical-council-registration"
                          title="Medical Council Registration"
                        >
                          {user.doctor_medical_council_registration ? (
                            <span className="font-semibold">
                              {user.doctor_medical_council_registration}
                            </span>
                          ) : (
                            <span className="text-gray-600">Unknown</span>
                          )}
                        </UserDetails>
                      </div>
                    </>
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
                    isExtremeSmallScreen
                      ? "flex flex-wrap "
                      : "grid grid-cols-2 "
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
                <div>
                  <UserDetails
                    id="working-hours"
                    title="Average weekly working hours"
                  >
                    {user.weekly_working_hours ? (
                      <span className="font-semibold">
                        {user.weekly_working_hours} hours
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </UserDetails>
                </div>
              </div>
              {user.username && (
                <div className="mb-0 mt-auto flex w-full flex-col justify-between gap-2 p-4">
                  <div className="flex flex-col gap-2 @sm:flex-row">
                    <ButtonV2
                      id="facilities"
                      className="flex w-full items-center @sm:w-1/2"
                      onClick={() => {
                        setExpandFacilityList(!expandFacilityList);
                        setSelectedUser(user);
                      }}
                    >
                      <CareIcon icon="l-hospital" className="text-lg" />
                      <p>Linked Facilities</p>
                    </ButtonV2>
                    <ButtonV2
                      id="skills"
                      className="flex w-full items-center @sm:w-1/2"
                      onClick={() => {
                        setExpandSkillList(true);
                        setSelectedUser(user.username);
                      }}
                    >
                      <CareIcon icon="l-award" className="text-xl" />
                      <p>Linked Skills</p>
                    </ButtonV2>
                  </div>
                  {["DistrictAdmin", "StateAdmin"].includes(
                    authUser.user_type
                  ) && (
                    <div className="flex-col md:flex-row">
                      <ButtonV2
                        id="avg-workinghour"
                        className="flex w-full items-center md:w-full"
                        onClick={() => {
                          setExpandWorkingHours(true);
                          setSelectedUser(user.username);
                          setWeeklyHours(user.weekly_working_hours);
                        }}
                      >
                        <CareIcon icon="l-clock" className="text-xl" />
                        <p>Set Average weekly working hours</p>
                      </ButtonV2>
                    </div>
                  )}
                </div>
              )}
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
        <div className="flex flex-wrap md:-mx-4">{userList}</div>
        <Pagination totalCount={userListData.count} />
      </div>
    );
  } else if (userListData?.results && userListData?.results.length === 0) {
    manageUsers = (
      <div>
        <h5> {t("no_users_found")}</h5>
      </div>
    );
  }

  return (
    <Page title={t("user_management")} hideBack={true} breadcrumbs={false}>
      {expandSkillList && (
        <SkillsSlideOver
          show={expandSkillList}
          setShow={setExpandSkillList}
          username={selectedUser}
        />
      )}
      <SlideOverCustom
        open={expandFacilityList}
        setOpen={setExpandFacilityList}
        slideFrom="right"
        title={t("facilities")}
        dialogClass="md:w-[400px]"
      >
        <UserFacilities user={selectedUser} />
      </SlideOverCustom>
      <SlideOverCustom
        open={expandWorkingHours}
        setOpen={(state) => {
          setExpandWorkingHours(state);
          setWeeklyHours("0");
          setWeeklyHoursError("");
        }}
        slideFrom="right"
        title={t("average_weekly_working_hours")}
        dialogClass="md:w-[400px]"
      >
        <div className="px-2">
          <dt className="mb-3 text-sm font-medium leading-5 text-black">
            {t("set_average_weekly_working_hours_for")} {selectedUser}
          </dt>
          <TextFormField
            name="weekly_working_hours"
            id="weekly_working_hours"
            value={weeklyHours}
            onChange={(e) => {
              setWeeklyHours(e.value);
            }}
            error={weeklyHoursError}
            required
            label=""
            type="number"
            min={0}
            max={168}
          />
          <div className="mt-2 text-right">
            <Submit onClick={handleWorkingHourSubmit} label={t("update")} />
          </div>
        </div>
      </SlideOverCustom>

      <div className="m-4 mt-5 grid grid-cols-1 sm:grid-cols-3 md:gap-5 md:px-2">
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

      <div className="pb-2 pl-6">
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
              qParams.district ? districtData?.name || "" : ""
            ),
          ]}
        />
      </div>

      <div className="px-3 md:px-6">
        <div>{manageUsers}</div>
      </div>
      {userData.show && (
        <UserDeleteDialog
          name={userData.name}
          handleCancel={handleCancel}
          handleOk={handleSubmit}
        />
      )}
    </Page>
  );
}

function UserFacilities(props: { user: any }) {
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
          className="z-40"
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
      {isLoading || userFacilitiesLoading ? (
        <div className="flex items-center justify-center">
          <CircularProgress />
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Home Facility section */}
          {user?.home_facility_object && (
            <div className="mt-2" id="home-facility">
              <div className="mb-2 ml-2 text-lg font-bold">
                {t("home_facility")}
              </div>
              <div className="relative rounded p-2 transition hover:bg-gray-200 focus:bg-gray-200 md:rounded-lg">
                <div className="flex items-center justify-between">
                  <span>{user?.home_facility_object?.name}</span>
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
                </div>
              </div>
              <hr className="my-2 border-gray-300" />
            </div>
          )}

          {/* Linked Facilities section */}
          {!!userFacilities?.results.length && (
            <div className="mt-2" id="linked-facility-list">
              <div className="mb-2 ml-2 text-lg font-bold">
                {t("linked_facilities")}
              </div>
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
                          "relative rounded p-2 transition hover:bg-gray-200 focus:bg-gray-200 md:rounded-lg"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span>{facility.name}</span>
                          <div className="flex items-center gap-2">
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
                            <button
                              id="unlink-facility-button"
                              className="tooltip text-lg text-red-600"
                              onClick={() =>
                                setUnlinkFacilityData({
                                  show: true,
                                  facility: facility,
                                  userName: username,
                                  isHomeFacility: false,
                                })
                              }
                            >
                              <CareIcon icon="l-link-broken" />
                              <span className="tooltip-text tooltip-left">
                                Unlink Facility
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
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
              replaceHomeFacility.newFacility
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
