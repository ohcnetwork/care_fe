
import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getUserList } from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { navigate } from "hookrouter";
import { USER_TYPES } from "../../Common/constants";



export default function ManageUsers(props: any) {
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  let manageUsers: any = null;
  const [users, setUsers] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);

  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const isSuperuser = currentUser.data.is_superuser;
  const userType = currentUser.data.user_type;
  const userIndex = USER_TYPES.indexOf(userType);
  const userTypes = isSuperuser ? [...USER_TYPES] : USER_TYPES.slice(0, userIndex + 1);

  const limit = userTypes.length ? 13 : 14;

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

  const addUser = (<button className="px-4 py-1 rounded-md bg-green-500 text-white text-lg font-semibold rounded shadow"
    onClick={() => navigate("/user/add")}>
    <i className="fas fa-plus mr-2"></i>
    Add New User
  </button >);

  let userList: any[] = [];
  if (users && users.length) {
    userList = users.map((user: any, idx: number) => {
      return (
        <div key={`usr_${user.id}`} className="w-full md:w-1/2 mt-6 md:px-4">
          <div
            className="block rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 overflow-hidden"
          >
            <div className="h-full flex flex-col justify-between">
              <div className="px-6 py-4">
                {user.username && (
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium leading-5 bg-blue-100 text-blue-800">
                    {user.username}
                  </div>)}
                <div className="font-black text-2xl capitalize mt-2">
                  {`${user.first_name} ${user.last_name}`}
                </div>

                {user.user_type && (
                  <div className="mt-2">
                    <div className="text-gray-500 leading-relaxed font-light">Role:</div>
                    <div className="font-semibold">{user.user_type}</div>
                  </div>)}
                {user.local_body_object && (
                  <div className="mt-2">
                    <div className="text-gray-500 leading-relaxed font-light">Location:</div>
                    <div className="font-semibold">{user.local_body_object.name}</div>
                  </div>)}
                {user.district_object && (
                  <div className="mt-2">
                    <div className="text-gray-500 leading-relaxed font-light">District:</div>
                    <div className="font-semibold">{user.district_object.name}</div>
                  </div>)}
              </div>
              <div className="mt-2 bg-gray-50 border-t px-6 py-2">
                <div className="flex py-4 justify-between">
                  <div>
                    <div className="text-gray-500 leading-relaxed">Phone:</div>
                    <div className="font-semibold">{user.phone_number || "-"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    });
  }

  if (isLoading || !users) {
    manageUsers = <Loading />;
  } else if (users && users.length) {
    manageUsers = (<div>
      {userTypes.length && addUser}
      <div className="flex flex-wrap md:-mx-4">
        {userList}
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
    </div>);
  } else if (users && users.length === 0) {
    manageUsers = (<div>
      {userTypes.length && addUser}
      <div>
        <h5> No Users Found</h5>
      </div>
    </div>);
  }

  return (
    <div>
      <PageTitle title="Users" hideBack={true} />
      <div className="px-3 md:px-8">
        <div>
          {manageUsers}
        </div>
      </div>
    </div>
  );
}
