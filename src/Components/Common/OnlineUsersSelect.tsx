import { CircularProgress } from "@material-ui/core";
import React, { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import moment from "moment";
import { getUserList } from "../../Redux/actions";
import { UserModel } from "../Users/models";
import { classNames } from "../../Utils/utils";

type UserFetchState = {
  loading: boolean;
  users: Array<UserModel>;
  searchTerm: string;
  searchFieldRef: React.RefObject<HTMLInputElement>;
};

type Props = {
  selectedUser: UserModel | null;
  userId: string;
  onSelect: (user: UserModel | null) => void;
  user_type: string;
  outline?: boolean;
};

const initialState: UserFetchState = {
  loading: false,
  users: new Array<UserModel>(),
  searchTerm: "",
  searchFieldRef: React.createRef<HTMLInputElement>(),
};

export const OnlineUsersSelect = (props: Props) => {
  const dispatchAction: any = useDispatch();
  const { selectedUser, userId, onSelect, user_type, outline } = props;
  const [state, setState] = useState(initialState);
  const { loading, users, searchTerm, searchFieldRef } = state;
  const [isDropdownExpanded, setDropdownExpand] = useState(false);

  const fetchUsers = useCallback(
    async (status: statusType) => {
      setState({ ...state, loading: true });
      const params = {
        user_type: user_type,
        ordering: "-last-login",
        search_text: searchTerm,
      };
      const res = await dispatchAction(getUserList(params));
      if (!status.aborted) {
        if (res && res.data) {
          setState({ ...state, loading: false, users: res.data.results });
        }
      }
    },
    [dispatchAction, searchTerm]
  );

  useAbortableEffect(
    (status: statusType) => {
      const debounce_timer = setTimeout(() => {
        fetchUsers(status);
      }, 1000);
      return () => clearTimeout(debounce_timer);
    },
    [searchTerm]
  );

  useEffect(() => {
    if (isDropdownExpanded && searchFieldRef.current) {
      searchFieldRef.current.focus();
    }
  }, [isDropdownExpanded]);

  return (
    <div className="pb-2">
      <div className="space-y-1">
        <label
          id="listbox-label"
          className="block text-sm leading-5 font-medium text-gray-700"
        >
          Assigned to
        </label>
        <div className="relative">
          <div className="relative flex-1">
            <span className="flex w-full rounded-md flex-col md:flex-row">
              <button
                onClick={(_) => {
                  setDropdownExpand(true);
                }}
                type="button"
                aria-haspopup="listbox"
                aria-expanded="true"
                aria-labelledby="listbox-label"
                className={classNames(
                  "border-2 h-14 cursor-default relative w-full rounded-md pl-3 pr-10 py-2 text-left transition ease-in-out duration-150 sm:text-sm sm:leading-5",
                  isDropdownExpanded &&
                    outline &&
                    "ring-primary-500 border-primary-500"
                )}
              >
                <input
                  ref={searchFieldRef}
                  name="searchTerm"
                  type="text"
                  placeholder="Search by name or username"
                  className={classNames(
                    "py-2 pl-3 w-full outline-none focus:ring-gray-200 border-none",
                    !isDropdownExpanded && "hidden"
                  )}
                  value={searchTerm}
                  onBlur={(_) => {
                    setDropdownExpand(false);
                  }}
                  onChange={(e) =>
                    setState({ ...state, searchTerm: e.target.value })
                  }
                  onKeyUp={(e) => e.preventDefault()}
                />
                <div
                  className={classNames(
                    "flex items-center justify-between",
                    isDropdownExpanded && "hidden"
                  )}
                >
                  <div className="space-x-3 flex items-center overflow-hidden">
                    <span
                      aria-label="Online"
                      className={
                        "shrink-0 inline-block h-2 w-2 rounded-full " +
                        (selectedUser
                          ? moment()
                              .subtract(5, "minutes")
                              .isBefore(selectedUser?.last_login)
                            ? "bg-primary-400"
                            : "bg-gray-300"
                          : "bg-blue-400")
                      }
                    ></span>
                    <span className="block truncate">
                      {selectedUser
                        ? selectedUser?.first_name +
                          " " +
                          selectedUser?.last_name
                        : `Assign a ${
                            user_type == "Doctor" ? "Doctor" : "Volunteer"
                          }`}
                    </span>
                  </div>
                </div>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </span>
            {isDropdownExpanded && (
              <div
                role="listbox"
                aria-labelledby="listbox-label"
                aria-activedescendant="listbox-item-3"
                className="multiselect-dropdown__search-dropdown w-full border border-gray-400 bg-white mt-1 rounded-lg shadow-lg px-4 py-2 z-50"
              >
                {!loading ? (
                  users.map((user: UserModel) => {
                    return (
                      <button
                        key={user.id}
                        onMouseDown={(_) => {
                          setDropdownExpand(false);
                          onSelect(user);
                          setState({
                            ...state,
                            searchTerm: "",
                          });
                        }}
                        id="listbox-item-0"
                        role="option"
                        className="flex text-xs py-1 items-center justify-between w-full hover:bg-gray-200 focus:outline-none focus:bg-gray-200"
                      >
                        <div className="flex items-center space-x-3">
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
                          <span className="font-normal block truncate">
                            {user.first_name} {user.last_name}{" "}
                            {user.home_facility_object?.name && (
                              <span className="text-gray-700 ml-2">
                                {user.home_facility_object?.name}
                              </span>
                            )}
                          </span>
                        </div>
                        {user.id?.toString() == userId && (
                          <span className="flex items-center">
                            <svg
                              className="h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="w-1/12 mx-auto">
                    <CircularProgress />
                  </div>
                )}
              </div>
            )}
          </div>
          <div
            className={
              !isDropdownExpanded
                ? "z-50  absolute right-10 top-[14px]"
                : "hidden"
            }
            onClick={(_) => {
              onSelect(null);
              setDropdownExpand(false);
            }}
          >
            <div className="px-2 rounded-lg hover:bg-gray-100 cursor-pointer bg-white">
              <i className="fa-solid fa-xmark text-lg text-gray-600"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
