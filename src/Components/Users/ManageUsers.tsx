/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useCallback, useState } from "react";
import loadable from "@loadable/component";
import { useDispatch, useSelector } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  addUserFacility,
  deleteUserFacility,
  getUserList,
  getUserListFacility,
  searchUser,
  deleteUser,
} from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { navigate } from "raviger";
import { USER_TYPES } from "../../Common/constants";
import { InputSearchBox } from "../Common/SearchBox";
import { FacilityModel } from "../Facility/models";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import { IconButton } from "@material-ui/core";
import LinkFacilityDialog from "./LinkFacilityDialog";
import UserDeleteDialog from "./UserDeleteDialog";
import classNames from "classnames";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));
import { SelectField } from "../Common/HelperInputFields";
import * as Notification from "../../Utils/Notifications.js";

export default function ManageUsers(props: any) {
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  let manageUsers: any = null;
  const [users, setUsers] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFacilityLoading, setIsFacilityLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);

  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const isSuperuser = currentUser.data.is_superuser;
  const userType = currentUser.data.user_type;
  const userIndex = USER_TYPES.indexOf(userType);
  const userTypes = isSuperuser
    ? [...USER_TYPES]
    : USER_TYPES.slice(0, userIndex + 1);
  const deleteUserTypes = isSuperuser
    ? [...USER_TYPES]
    : USER_TYPES.slice(0, userIndex);
  const [linkFacility, setLinkFacility] = useState<{
    show: boolean;
    username: string;
  }>({ show: false, username: "" });

  const [userData, setUserData] = useState<{
    show: boolean;
    username: string;
    name: string;
  }>({ show: false, username: "", name: "" });

  const [selectedRole, setSelectedRole] = useState("");

  const limit = userTypes.length ? 13 : 14;

  const USER_TYPE_OPTIONS = ["Select", ...USER_TYPES].map((user) => {
    return {
      text: user,
    };
  });

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getUserList({ limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setUsers(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatch, limit, offset]
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

  const searchByUserName = async (searchValue: string) => {
    setIsLoading(true);
    const res = await dispatch(
      searchUser({ limit, offset, username: searchValue })
    );
    if (res && res.data) {
      setUsers(res.data.results);
      setTotalCount(res.data.count);
    }
    setIsLoading(false);
  };

  const searchByName = async (searchValue: string) => {
    setIsLoading(true);
    const res = await dispatch(
      searchUser({ limit, offset, first_name: searchValue })
    );
    if (res && res.data) {
      setUsers(res.data.results);
      setTotalCount(res.data.count);
    }
    setIsLoading(false);
  };

  const searchByPhone = async (searchValue: string) => {
    setIsLoading(true);
    const res = await dispatch(
      searchUser({ limit, offset, phone_number: encodeURI(searchValue) })
    );
    if (res && res.data) {
      setUsers(res.data.results);
      setTotalCount(res.data.count);
    }
    setIsLoading(false);
  };

  const filterByRole = async (role: string) => {
    setIsLoading(true);
    setSelectedRole(role);
    role = role === "Select" ? "" : role;
    const res = await dispatch(
      searchUser({ limit, offset, user_type: encodeURI(role) })
    );
    if (res && res.data) {
      setUsers(res.data.results);
      setTotalCount(res.data.count);
    }
    setIsLoading(false);
  };

  const addUser = (
    <button
      className="px-4 py-1 rounded-md bg-green-500 mt-4 text-white text-lg font-semibold rounded shadow"
      onClick={() => navigate("/user/add")}
    >
      <i className="fas fa-plus mr-2"></i>
      Add New User
    </button>
  );

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

  const removeFacility = async (username: string, facility: any) => {
    setIsFacilityLoading(true);
    await dispatch(deleteUserFacility(username, String(facility.id)));
    setIsFacilityLoading(false);
    loadFacilities(username);
  };

  const showLinkFacilityModal = (username: string) => {
    setLinkFacility({
      show: true,
      username,
    });
  };

  const hideLinkFacilityModal = () => {
    setLinkFacility({
      show: false,
      username: "",
    });
  };

  const handleCancel = () => {
    setUserData({ show: false, username: "", name: "" });
  };

  const handleSubmit = async () => {
    let username = userData.username;
    let res = await dispatch(deleteUser(username));
    if (res.status >= 200) {
      Notification.Success({
        msg: "User deleted successfully",
      });
    }

    setUserData({ show: false, username: "", name: "" });
    window.location.reload();
  };

  const handleDelete = (user: any) => {
    setUserData({
      show: true,
      username: user.username,
      name: `${user.first_name} ${user.last_name}`,
    });
  };

  const facilityClassname = classNames({
    "align-baseline font-bold text-sm": true,
    "text-blue-500 hover:text-blue-800": !isFacilityLoading,
    "text-gray-500": isFacilityLoading,
  });

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
      <>
        {facilities.map((facility, i) => (
          <div key={`facility_${i}`} className="flex items-center mb-2">
            <div className="font-semibold">{facility.name}</div>
            <IconButton
              size="small"
              color="secondary"
              disabled={isFacilityLoading}
              onClick={() => removeFacility(username, facility)}
            >
              <DeleteForeverIcon />
            </IconButton>
          </div>
        ))}
        {showLinkFacility(username)}
      </>
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
    const STATE_ADMIN_LEVEL = USER_TYPES.indexOf("StateLabAdmin");
    const STATE_READ_ONLY_ADMIN_LEVEL =
      USER_TYPES.indexOf("StateReadOnlyAdmin");
    const DISTRICT_ADMIN_LEVEL = USER_TYPES.indexOf("DistrictAdmin");
    const level = USER_TYPES.indexOf(user.user_type);
    const currentUserLevel = USER_TYPES.indexOf(currentUser.data.user_type);
    if (
      currentUserLevel >= STATE_ADMIN_LEVEL &&
      currentUserLevel < STATE_READ_ONLY_ADMIN_LEVEL
    )
      return user.state_object.id === currentUser.data.state;
    if (currentUserLevel >= DISTRICT_ADMIN_LEVEL && currentUserLevel > level)
      return user.district_object.id === currentUser.data.district;
    return false;
  };

  let userList: any[] = [];
  if (users && users.length) {
    userList = users.map((user: any, idx: number) => {
      return (
        <div key={`usr_${user.id}`} className="w-full md:w-1/2 mt-6 md:px-4">
          <div className="block rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 overflow-hidden">
            <div className="h-full flex flex-col justify-between">
              <div className="px-6 py-4">
                {user.username && (
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-blue-100 text-blue-800">
                    {user.username}
                  </div>
                )}
                <div className="font-black text-2xl capitalize mt-2">
                  {`${user.first_name} ${user.last_name}`}
                </div>

                {user.user_type && (
                  <div className="mt-2">
                    <div className="text-gray-500 leading-relaxed font-light">
                      Role:
                    </div>
                    <div className="font-semibold">{user.user_type}</div>
                  </div>
                )}
                {user.local_body_object && (
                  <div className="mt-2">
                    <div className="text-gray-500 leading-relaxed font-light">
                      Location:
                    </div>
                    <div className="font-semibold">
                      {user.local_body_object.name}
                    </div>
                  </div>
                )}
                {user.district_object && (
                  <div className="mt-2">
                    <div className="text-gray-500 leading-relaxed font-light">
                      District:
                    </div>
                    <div className="font-semibold">
                      {user.district_object.name}
                    </div>
                  </div>
                )}
                {user.username && (
                  <div className="mt-2">
                    <div className="text-gray-500 leading-relaxed font-light">
                      Facilities:
                    </div>
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
                  </div>
                )}
              </div>
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
              {showDelete(user) && (
                <button
                  type="button"
                  className="m-3 px-3 py-2 self-end w-20 border border-red-500 text-center text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:text-red-500 focus:outline-none focus:border-red-300 focus:shadow-outline-blue active:text-red-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
                  onClick={() => handleDelete(user)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      );
    });
  }

  if (isLoading || !users) {
    manageUsers = <Loading />;
  } else if (users && users.length) {
    manageUsers = (
      <div>
        {userTypes.length && addUser}
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
        {userTypes.length && addUser}
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
        title="User Management"
        hideBack={true}
        className="mx-3 md:mx-8"
      />
      <div className="flex flex-col md:flex-row px-4 md:px-8">
        <div className="md:px-4">
          <div className="text-sm font-semibold mb-2">Search by User Name</div>
          <InputSearchBox
            search={searchByUserName}
            placeholder="Search by User Name"
            errors=""
          />
        </div>
        <div className="md:px-4">
          <div className="text-sm font-semibold mb-2">Search by Name</div>
          <InputSearchBox
            search={searchByName}
            placeholder="Search by First Name"
            errors=""
          />
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">Search by number</div>
          <InputSearchBox
            search={searchByPhone}
            placeholder="+919876543210"
            errors=""
          />
        </div>
        <div className="px-4">
          <div className="text-sm font-semibold">Filter By Role</div>
          <SelectField
            name="role"
            variant="outlined"
            margin="dense"
            value={selectedRole}
            options={USER_TYPE_OPTIONS}
            onChange={(e) => {
              filterByRole(e.target.value);
            }}
            errors=""
          />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 m-4 md:px-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Users
              </dt>
              <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                {totalCount}
              </dd>
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
