import * as Notification from "../../Utils/Notifications.js";

import { Button, CircularProgress } from "@material-ui/core";
import {
  addUserFacility,
  clearHomeFacility,
  deleteUser,
  deleteUserFacility,
  getDistrict,
  getUserList,
  getUserListFacility,
  partialUpdateUser,
} from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ConfirmHomeFacilityUpdateDialog from "./ConfirmHomeFacilityUpdateDialog";
import CountBlock from "../../CAREUI/display/Count";
import { FacilityModel } from "../Facility/models";
import { FacilitySelect } from "../Common/FacilitySelect";
import LinkFacilityDialog from "./LinkFacilityDialog";
import SearchInput from "../Form/SearchInput";
import SkillsSlideOver from "./SkillsSlideOver";
import SlideOverCustom from "../../CAREUI/interactive/SlideOver";
import { USER_TYPES } from "../../Common/constants";
import UnlinkFacilityDialog from "./UnlinkFacilityDialog";
import UserDeleteDialog from "./UserDeleteDialog";
import UserDetails from "../Common/UserDetails";
import UserFilter from "./UserFilter";
import { classNames } from "../../Utils/utils";
import loadable from "@loadable/component";
import moment from "moment";
import { navigate } from "raviger";
import useFilters from "../../Common/hooks/useFilters";
import useWindowDimensions from "../../Common/hooks/useWindowDimensions";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function ManageUsers() {
  const { width } = useWindowDimensions();
  const {
    qParams,
    updateQuery,
    Pagination,
    FilterBadges,
    advancedFilter,
    resultsPerPage,
  } = useFilters({ limit: 18 });
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  let manageUsers: any = null;
  const [users, setUsers] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [expandSkillList, setExpandSkillList] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [districtName, setDistrictName] = useState<string>();
  const [expandFacilityList, setExpandFacilityList] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const isSuperuser = currentUser.data.is_superuser;
  const userType = currentUser.data.user_type;
  const userIndex = USER_TYPES.indexOf(userType);
  const userTypes = isSuperuser
    ? [...USER_TYPES]
    : USER_TYPES.slice(0, userIndex + 1);

  const [userData, setUserData] = useState<{
    show: boolean;
    username: string;
    name: string;
  }>({ show: false, username: "", name: "" });

  const extremeSmallScreenBreakpoint = 320;
  const isExtremeSmallScreen =
    width <= extremeSmallScreenBreakpoint ? true : false;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const params = {
        limit: resultsPerPage,
        offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
        username: qParams.username,
        first_name: qParams.first_name,
        last_name: qParams.last_name,
        phone_number: qParams.phone_number,
        alt_phone_number: qParams.alt_phone_number,
        user_type: qParams.user_type,
        district_id: qParams.district_id,
      };
      if (qParams.district_id) {
        const dis = await dispatch(getDistrict(qParams.district_id));
        if (!status.aborted) {
          if (dis && dis.data) {
            setDistrictName(dis.data.name);
          }
        }
      } else {
        setDistrictName(undefined);
      }
      const res = await dispatch(getUserList(params));
      if (!status.aborted) {
        if (res && res.data) {
          setUsers(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [
      resultsPerPage,
      qParams.page,
      qParams.username,
      qParams.first_name,
      qParams.last_name,
      qParams.phone_number,
      qParams.alt_phone_number,
      qParams.user_type,
      qParams.district_id,
      dispatch,
    ]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const addUser = (
    <ButtonV2 className="w-full" onClick={() => navigate("/users/add")}>
      <CareIcon className="care-l-plus text-lg w-full" />
      <p>Add New User</p>
    </ButtonV2>
  );

  const handleCancel = () => {
    setUserData({ show: false, username: "", name: "" });
  };

  const handleSubmit = async () => {
    const username = userData.username;
    const res = await dispatch(deleteUser(username));
    if (res?.status === 204) {
      Notification.Success({
        msg: "User deleted successfully",
      });
    } else {
      Notification.Error({
        msg: "Error while deleting User: " + (res?.data?.detail || ""),
      });
    }

    setUserData({ show: false, username: "", name: "" });
    fetchData({ aborted: false });
  };

  const handleDelete = (user: any) => {
    setUserData({
      show: true,
      username: user.username,
      name: `${user.first_name} ${user.last_name}`,
    });
  };

  const showDelete = (user: any) => {
    const STATE_ADMIN_LEVEL = USER_TYPES.indexOf("StateAdmin");
    const STATE_READ_ONLY_ADMIN_LEVEL =
      USER_TYPES.indexOf("StateReadOnlyAdmin");
    const DISTRICT_ADMIN_LEVEL = USER_TYPES.indexOf("DistrictAdmin");
    const level = USER_TYPES.indexOf(user.user_type);
    const currentUserLevel = USER_TYPES.indexOf(currentUser.data.user_type);
    if (user.is_superuser) return true;

    if (currentUserLevel >= STATE_ADMIN_LEVEL)
      return user.state_object?.id === currentUser?.data?.state;
    if (
      currentUserLevel < STATE_READ_ONLY_ADMIN_LEVEL &&
      currentUserLevel >= DISTRICT_ADMIN_LEVEL &&
      currentUserLevel > level
    )
      return user?.district_object?.id === currentUser?.data?.district;
    return false;
  };

  let userList: any[] = [];

  users &&
    users.length &&
    (userList = users.map((user: any, idx) => {
      const cur_online = moment()
        .subtract(5, "minutes")
        .isBefore(user.last_login);
      return (
        <div
          key={`usr_${user.id}`}
          id={`usr_${idx}`}
          className=" w-full lg:w-1/2 xl:w-1/3 mt-6 md:px-4"
        >
          <div className="block rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 overflow-visible relative">
            <div className="h-full flex flex-col justify-between pb-36 sm:pb-28 md:pb-24">
              <div className="px-6 py-4">
                <div className="flex lg:flex-row gap-3 flex-col justify-between flex-wrap">
                  {user.username && (
                    <div
                      id="username"
                      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-blue-100 text-blue-800 w-fit"
                    >
                      {user.username}
                    </div>
                  )}
                  <div className="flex-shrink-0 text-sm text-gray-600 min-width-50">
                    {user.last_login && cur_online ? (
                      <span>
                        {" "}
                        <i className="fa-solid fa-clock"></i> Currently Online
                      </span>
                    ) : (
                      <>
                        <span>
                          <i className="fa-solid fa-clock"></i> Last Online:{" "}
                        </span>
                        <span
                          aria-label="Online"
                          className={classNames(
                            "shrink-0 inline-block h-2 w-2 rounded-full",
                            cur_online ? "bg-primary-400" : "bg-gray-300"
                          )}
                        ></span>
                        <span className="pl-2">
                          {user.last_login
                            ? moment(user.last_login).fromNow()
                            : "Never"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div id="name" className="font-bold text-2xl capitalize mt-2">
                  {`${user.first_name} ${user.last_name}`}

                  {user.last_login && cur_online ? (
                    <i
                      className="animate-pulse text-primary-500 fas fa-circle ml-1 opacity-75"
                      aria-label="Online"
                    ></i>
                  ) : null}
                  {showDelete(user) && (
                    <button
                      type="button"
                      className="m-3 px-3 py-2 self-end w-20 border border-red-500 text-center text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:text-white hover:bg-red-500 focus:outline-none focus:border-red-300 focus:ring-blue active:text-red-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
                      onClick={() => handleDelete(user)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div
                  className={`flex ${
                    isExtremeSmallScreen
                      ? " flex-wrap "
                      : " flex-col md:flex-row justify-between "
                  } md:grid md:grid-cols-4 gap-2`}
                >
                  {user.user_type && (
                    <div className="col-span-2">
                      <UserDetails id="role" title="Role">
                        <div className="font-semibold break-all">
                          {user.user_type}
                        </div>
                      </UserDetails>
                    </div>
                  )}
                  {user.district_object && (
                    <div className="col-span-2">
                      <UserDetails id="district" title="District">
                        <div className="font-semibold">
                          {user.district_object.name}
                        </div>
                      </UserDetails>
                    </div>
                  )}
                  {user.user_type === "Doctor" && (
                    <>
                      <div className="col-span-2">
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
                      <div className="col-span-2">
                        <UserDetails id="doctor-experience" title="Experience">
                          {user.doctor_experience_commenced_on ? (
                            <span className="font-semibold">
                              {moment().diff(
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
                      : "grid grid-cols-4 "
                  }`}
                >
                  {user.created_by && (
                    <div className="col-span-2">
                      <UserDetails id="created_by" title="Created by">
                        <div className="font-semibold break-all">
                          {user.created_by}
                        </div>
                      </UserDetails>
                    </div>
                  )}
                  {user.username && (
                    <div className="col-span-2">
                      <UserDetails id="home_facility" title="Home Facility">
                        <span className="font-semibold block">
                          {user.home_facility_object?.name ||
                            "No Home Facility"}
                        </span>
                      </UserDetails>
                    </div>
                  )}
                </div>
                {user.username && (
                  <div className="flex justify-between flex-col w-full md:flex-row gap-2 absolute bottom-0 sm:bottom-6 left-0 p-4">
                    <ButtonV2
                      id="facilities"
                      className="flex items-center w-full md:w-1/2"
                      onClick={() => {
                        setExpandFacilityList(!expandFacilityList);
                        setSelectedUser(user);
                      }}
                    >
                      <CareIcon className="care-l-hospital text-lg" />
                      <p>Linked Facilities</p>
                    </ButtonV2>
                    <ButtonV2
                      id="skills"
                      className="flex items-center w-full md:w-1/2"
                      onClick={() => {
                        setExpandSkillList(true);
                        setSelectedUser(user.username);
                      }}
                    >
                      <CareIcon className="care-l-award text-xl" />
                      <p>Linked Skills</p>
                    </ButtonV2>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }));

  if (isLoading || !users) {
    manageUsers = <Loading />;
  } else if (users && users.length) {
    manageUsers = (
      <div>
        <div className="flex flex-wrap md:-mx-4">{userList}</div>
        <Pagination totalCount={totalCount} />
      </div>
    );
  } else if (users && users.length === 0) {
    manageUsers = (
      <div>
        <h5> No Users Found</h5>
      </div>
    );
  }

  return (
    <div>
      {expandSkillList && (
        <SkillsSlideOver
          show={expandSkillList}
          setShow={setExpandSkillList}
          username={selectedUser}
        />
      )}
      <PageTitle
        title="User Management"
        hideBack={true}
        className="mx-5 px-2"
        breadcrumbs={false}
      />
      <SlideOverCustom
        open={expandFacilityList}
        setOpen={setExpandFacilityList}
        slideFrom="right"
        title="Facilities"
        dialogClass="md:w-[400px]"
        onCloseClick={() => {
          //fetchData({ aborted: false });
        }}
      >
        <UserFacilities user={selectedUser} />
      </SlideOverCustom>

      <div className="mt-5 grid grid-cols-1 md:gap-5 sm:grid-cols-3 m-4 md:px-2">
        <CountBlock
          text="Total Users"
          count={totalCount}
          loading={isLoading}
          icon={"user-injured"}
        />
        <div className="flex flex-col lg:flex-row justify-between col-span-2 lg:px-3 space-y-3 lg:space-y-0 lg:space-x-4 my-2">
          <div className="w-full">
            <SearchInput
              name="username"
              onChange={(e) => updateQuery({ [e.name]: e.value })}
              value={qParams.username}
              placeholder="Search by username"
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

      <div className="pl-6 pb-2">
        <FilterBadges
          badges={({ badge, value, phoneNumber }) => [
            badge("Username", "username"),
            badge("First Name", "first_name"),
            badge("Last Name", "last_name"),
            phoneNumber(),
            phoneNumber("WhatsApp no.", "alt_phone_number"),
            badge("Role", "user_type"),
            value("District", "district_id", districtName || ""),
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
    </div>
  );
}

function UserFacilities(props: { user: any }) {
  const { user } = props;
  const username = user.username;
  const dispatch: any = useDispatch();
  const [facilities, setFacilities] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const [linkFacility, setLinkFacility] = useState<{
    show: boolean;
    username: string;
  }>({ show: false, username: "" });
  const hideUnlinkFacilityModal = () => {
    setUnlinkFacilityData({
      show: false,
      facility: undefined,
      userName: "",
      isHomeFacility: false,
    });
  };

  const fetchFacilities = async () => {
    setIsLoading(true);
    const res = await dispatch(getUserListFacility({ username }));
    if (res && res.data) {
      setFacilities(res.data);
    }
    setIsLoading(false);
  };

  const updateHomeFacility = async (username: string, facility: any) => {
    setIsLoading(true);
    const res = await dispatch(
      partialUpdateUser(username, { home_facility: facility.id })
    );
    if (res && res.status === 200) user.home_facility_object = facility;
    fetchFacilities();
    setIsLoading(false);
  };

  const handleUnlinkFacilitySubmit = async () => {
    setIsLoading(true);
    if (unlinkFacilityData.isHomeFacility) {
      const res = await dispatch(
        clearHomeFacility(unlinkFacilityData.userName)
      );
      if (res && res.status === 204) user.home_facility_object = null;
    } else {
      await dispatch(
        deleteUserFacility(
          unlinkFacilityData.userName,
          String(unlinkFacilityData?.facility?.id)
        )
      );
    }
    fetchFacilities();
    setIsLoading(false);
    hideUnlinkFacilityModal();
  };

  const hideLinkFacilityModal = () => {
    setLinkFacility({
      show: false,
      username: "",
    });
  };

  const addFacility = async (username: string, facility: any) => {
    hideLinkFacilityModal();
    setIsLoading(true);
    const res = await dispatch(addUserFacility(username, String(facility.id)));
    if (res?.status !== 201) {
      Notification.Error({
        msg: "Error while linking facility",
      });
    }
    setIsLoading(false);
    setFacility(null);
    fetchFacilities();
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  return (
    <div className="h-full">
      {linkFacility.show && (
        <LinkFacilityDialog
          username={linkFacility.username}
          handleOk={addFacility}
          handleCancel={hideLinkFacilityModal}
        />
      )}
      {unlinkFacilityData.show && (
        <UnlinkFacilityDialog
          facilityName={unlinkFacilityData.facility?.name || ""}
          userName={unlinkFacilityData.userName}
          isHomeFacility={unlinkFacilityData.isHomeFacility}
          handleCancel={hideUnlinkFacilityModal}
          handleOk={handleUnlinkFacilitySubmit}
        />
      )}
      <div className="flex gap-2 mb-4 items-stretch">
        <FacilitySelect
          multiple={false}
          name="facility"
          showAll={false} // Show only facilities that user has access to link (not all facilities)
          showNOptions={8}
          selected={facility}
          setSelected={setFacility}
          errors=""
          className="z-40"
        />
        <Button
          color="primary"
          disabled={!facility}
          className="mt-1"
          onClick={() => addFacility(username, facility)}
          autoFocus
        >
          Add
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center">
          <CircularProgress className="text-primary-500" />
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Home Facility section */}
          {user?.home_facility_object && (
            <div className="mt-2">
              <div className="text-lg font-bold mb-2 ml-2">Home Facility</div>
              <div className="relative p-2 hover:bg-gray-200 focus:bg-gray-200 transition rounded md:rounded-lg cursor-pointer">
                <div className="flex justify-between items-center">
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
                      <CareIcon className="care-l-link-broken" />
                      <span className="tooltip-text tooltip-left">
                        Clear Home Facility
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <hr className="my-2 border-gray-300" />
            </div>
          )}

          {/* Linked Facilities section */}
          {facilities.length > 0 && (
            <div className="mt-2">
              <div className="text-lg font-bold mb-2 ml-2">
                Linked Facilities
              </div>
              <div className="flex flex-col">
                {facilities.map((facility: any, i: number) => {
                  if (user?.home_facility_object?.id === facility.id) {
                    // skip if it's a home facility
                    return null;
                  }
                  return (
                    <div
                      id={`facility_${i}`}
                      key={`facility_${i}`}
                      className={classNames(
                        "relative p-2 hover:bg-gray-200 focus:bg-gray-200 transition rounded md:rounded-lg cursor-pointer"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span>{facility.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            className="tooltip text-lg hover:text-primary-500"
                            onClick={() => {
                              if (user?.home_facility_object) {
                                // has previous home facility
                                setReplaceHomeFacility({
                                  show: true,
                                  userName: username,
                                  previousFacility: user?.home_facility_object,
                                  newFacility: facility,
                                });
                              } else {
                                // no previous home facility
                                updateHomeFacility(username, facility);
                              }
                            }}
                          >
                            <CareIcon className="care-l-estate" />
                            <span className="tooltip-text tooltip-left">
                              Set as home facility
                            </span>
                          </button>
                          <button
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
                            <CareIcon className="care-l-link-broken" />
                            <span className="tooltip-text tooltip-left">
                              Unlink Facility
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!user?.home_facility_object && facilities.length === 0 && (
            <div className="mb-2 mt-2 flex flex-col justify-center align-middle content-center h-96">
              <div className="w-full">
                <img
                  src="/images/404.svg"
                  alt="No linked facilities"
                  className="w-80 mx-auto"
                />
              </div>
              <p className="text-lg font-semibold text-center text-primary pt-4">
                No Linked Facilities
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
