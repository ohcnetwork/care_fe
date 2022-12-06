import { useCallback, useEffect, useState } from "react";
import loadable from "@loadable/component";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  addUserFacility,
  deleteUserFacility,
  getUserListFacility,
  deleteUser,
  getFacilityUsers,
  getAnyFacility,
} from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { USER_TYPES, RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import { FacilityModel } from "../Facility/models";

import { IconButton, CircularProgress } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import LinkFacilityDialog from "../Users/LinkFacilityDialog";
import UserDeleteDialog from "../Users/UserDeleteDialog";
import * as Notification from "../../Utils/Notifications.js";
import UserDetails from "../Common/UserDetails";
import UnlinkFacilityDialog from "../Users/UnlinkFacilityDialog";
import { classNames } from "../../Utils/utils";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function FacilityUsers(props: any) {
  const { facilityId } = props;
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  let manageUsers: any = null;
  const [users, setUsers] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFacilityLoading, setIsFacilityLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [offset, setOffset] = useState(0);
  const [facilityData, setFacilityData] = useState({
    name: "",
    district_object_id: 0,
  });

  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const [linkFacility, setLinkFacility] = useState<{
    show: boolean;
    username: string;
  }>({ show: false, username: "" });

  const [userData, setUserData] = useState<{
    show: boolean;
    username: string;
    name: string;
  }>({ show: false, username: "", name: "" });

  const [unlinkFacilityData, setUnlinkFacilityData] = useState<{
    show: boolean;
    userName: string;
    facility?: FacilityModel;
  }>({ show: false, userName: "", facility: undefined });

  const limit = RESULTS_PER_PAGE_LIMIT;

  useEffect(() => {
    async function fetchFacilityName() {
      if (facilityId) {
        const res = await dispatch(getAnyFacility(facilityId));
        setFacilityData({
          name: res?.data?.name || "",
          district_object_id: res?.data?.district_object?.id || 0,
        });
      } else {
        setFacilityData({
          name: "",
          district_object_id: 0,
        });
      }
    }
    fetchFacilityName();
  }, [dispatch, facilityId]);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        getFacilityUsers(facilityId, { offset, limit })
      );

      if (!status.aborted) {
        if (res && res.data) {
          setUsers(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatch, facilityId, offset, limit]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const loadFacilities = async (username: string) => {
    if (isFacilityLoading) {
      return;
    }
    setIsFacilityLoading(true);
    const res = await dispatch(getUserListFacility({ username }));
    if (res && res.data) {
      const updated = users.map((user) => {
        return user.username === username
          ? {
              ...user,
              facilities: res.data,
            }
          : user;
      });
      setUsers(updated);
    }
    setIsFacilityLoading(false);
  };

  const showLinkFacilityModal = (username: string) => {
    setLinkFacility({
      show: true,
      username,
    });
  };

  const hideUnlinkFacilityModal = () => {
    setUnlinkFacilityData({
      show: false,
      facility: undefined,
      userName: "",
    });
  };

  const hideLinkFacilityModal = () => {
    setLinkFacility({
      show: false,
      username: "",
    });
  };

  const handleUnlinkFacilitySubmit = async () => {
    setIsFacilityLoading(true);
    await dispatch(
      deleteUserFacility(
        unlinkFacilityData.userName,
        String(unlinkFacilityData?.facility?.id)
      )
    );
    setIsFacilityLoading(false);
    loadFacilities(unlinkFacilityData.userName);
    hideUnlinkFacilityModal();
  };

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

  const facilityClassname = classNames(
    "align-baseline font-bold text-sm",
    isFacilityLoading ? "text-gray-500" : "text-blue-500 hover:text-blue-800"
  );

  const showLinkFacility = (username: string) => {
    return (
      <a
        onClick={() => showLinkFacilityModal(username)}
        className={facilityClassname}
        href="#"
      >
        Link new facility
      </a>
    );
  };

  const showFacilities = (username: string, facilities: FacilityModel[]) => {
    if (!facilities || !facilities.length) {
      return (
        <>
          <div className="font-semibold">No Facilities!</div>
          {showLinkFacility(username)}
        </>
      );
    }
    return (
      <div className="sm:col-start-2 col-span-full sm:col-span-3">
        <div className="mb-2">
          {facilities.map((facility, i) => (
            <div
              key={`facility_${i}`}
              className="border-2 font-gbold inline-block rounded-md pl-3 py-1 mr-3 mt-2"
            >
              <div className="flex items-center  space-x-1">
                <div className="font-semibold">{facility.name}</div>
                <IconButton
                  size="small"
                  color="secondary"
                  disabled={isFacilityLoading}
                  onClick={() =>
                    setUnlinkFacilityData({
                      show: true,
                      facility: facility,
                      userName: username,
                    })
                  }
                >
                  <CloseIcon />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
        {showLinkFacility(username)}
        {unlinkFacilityData.show && (
          <UnlinkFacilityDialog
            facilityName={unlinkFacilityData.facility?.name || ""}
            userName={unlinkFacilityData.userName}
            handleCancel={hideUnlinkFacilityModal}
            handleOk={handleUnlinkFacilitySubmit}
          />
        )}
      </div>
    );
  };

  const addFacility = async (username: string, facility: any) => {
    hideLinkFacilityModal();
    setIsFacilityLoading(true);
    await dispatch(addUserFacility(username, String(facility.id)));
    setIsFacilityLoading(false);
    loadFacilities(username);
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
      return facilityData?.district_object_id === currentUser?.data?.district;
    return false;
  };

  let userList: any[] = [];

  users &&
    users.length &&
    (userList = users.map((user: any) => {
      return (
        <div
          key={`usr_${user.id}`}
          className=" w-full lg:w-1/2 xl:w-1/3 mt-6 md:px-4"
        >
          <div className="block rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 overflow-hidden">
            <div className="h-full flex flex-col justify-between">
              <div className="px-6 py-4">
                <div className="flex lg:flex-row flex-col justify-between">
                  {user.username && (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-blue-100 text-blue-800 w-fit">
                      {user.username}
                    </div>
                  )}
                  <div className="flex-shrink-0 text-sm text-gray-600 min-width-50">
                    Last Online:{" "}
                    <span
                      aria-label="Online"
                      className={
                        "shrink-0 inline-block h-2 w-2 rounded-full " +
                        (moment()
                          .subtract(5, "minutes")
                          .isBefore(user.last_login)
                          ? "bg-primary-400"
                          : "bg-gray-300")
                      }
                    ></span>
                    <span className="pl-2">
                      {user.last_login
                        ? moment(user.last_login).fromNow()
                        : "Never"}
                    </span>
                  </div>
                </div>
                <div className="font-bold text-2xl capitalize mt-2">
                  {`${user.first_name} ${user.last_name}`}

                  {user.last_login &&
                  moment().subtract(5, "minutes").isBefore(user.last_login) ? (
                    <i
                      className="animate-pulse text-primary-500 fas fa-circle ml-1 opacity-75"
                      aria-label="Online"
                    ></i>
                  ) : null}
                  {showDelete(user) && (
                    <button
                      type="button"
                      className="m-3 px-3 py-2 self-end w-20 border border-red-500 text-center text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:text-red-500 focus:outline-none focus:border-red-300 focus:ring-blue active:text-red-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
                      onClick={() => handleDelete(user)}
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="flex justify-between">
                  {user.user_type && (
                    <UserDetails title="Role">
                      <div className="font-semibold">{user.user_type}</div>
                    </UserDetails>
                  )}
                  {user.district_object && (
                    <UserDetails title="District">
                      <div className="font-semibold">
                        {user.district_object.name}
                      </div>
                    </UserDetails>
                  )}
                </div>
                {user.local_body_object && (
                  <UserDetails title="Location">
                    <div className="font-semibold">
                      {user.local_body_object.name}
                    </div>
                  </UserDetails>
                )}
                <div className="flex justify-between">
                  {user.created_by && (
                    <UserDetails title="Created by">
                      <div className="font-semibold">{user.created_by}</div>
                    </UserDetails>
                  )}
                  {user.phone_number && (
                    <div className="mt-2 bg-gray-50 border-t px-6 py-2">
                      <div className="flex py-4 justify-between">
                        <div>
                          <div className="text-gray-500 leading-relaxed">
                            Phone:
                          </div>
                          <a
                            href={`tel:${user.phone_number}`}
                            className="font-semibold"
                          >
                            {user.phone_number || "-"}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {user.username && (
                  <UserDetails title="Facilities">
                    {user.facilities &&
                      showFacilities(user.username, user.facilities)}
                    {!user.facilities && (
                      <a
                        onClick={() => loadFacilities(user.username)}
                        className={`inline-block ${facilityClassname}`}
                        href="#"
                      >
                        Click here to show
                      </a>
                    )}
                  </UserDetails>
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
    );
  } else if (users && users.length === 0) {
    manageUsers = (
      <div>
        <div>
          <h5> No Users Found</h5>
        </div>
      </div>
    );
  }

  return (
    <div>
      {linkFacility.show && (
        <LinkFacilityDialog
          username={linkFacility.username}
          handleOk={addFacility}
          handleCancel={hideLinkFacilityModal}
        />
      )}
      <PageTitle
        title={`Users - ${facilityData?.name}`}
        hideBack={true}
        className="mx-3 md:mx-8"
        breadcrumbs={false}
      />

      <div className="mt-5 grid grid-cols-1 md:gap-5 sm:grid-cols-3 m-4 md:px-4">
        <div className="bg-white overflow-hidden shadow col-span-1 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Users
              </dt>
              {/* Show spinner until count is fetched from server */}
              {isLoading ? (
                <dd className="mt-4 text-5xl leading-9">
                  <CircularProgress className="text-primary-500" />
                </dd>
              ) : (
                <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                  {totalCount}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>

      <div className="px-3 md:px-8">
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
