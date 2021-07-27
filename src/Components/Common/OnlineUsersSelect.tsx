import loadable from "@loadable/component";
import { CircularProgress } from "@material-ui/core";
import React, {
  useCallback,
  useReducer,
  useState,
  useEffect,
  useRef,
} from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import moment from "moment";
import { getUserList } from "../../Redux/actions";
import classNames from "classnames";

export const OnlineUsersSelect = (props: any) => {
  const dispatchAction: any = useDispatch();
  const { selectedUser, userId, onSelect, user_type } = props;
  const initalState = {
    loading: false,
    users: new Array<any>(),
    searchTerm: "",
  };
  const [state, setState] = useState(initalState);
  const [isExpanded, setIsExpanded] = useState(false);
  const searchFieldRef = useRef<any>(null);

  const fetchUsers = useCallback(
    async (status: statusType) => {
      setState({ ...state, loading: true });
      const params = {
        user_type: user_type,
        ordering: "-last-login",
        search_text: state.searchTerm,
      };
      const res = await dispatchAction(getUserList(params));
      if (!status.aborted) {
        if (res && res.data) {
          setState({ ...state, loading: false, users: res.data.results });
        }
      }
    },
    [dispatchAction, state.searchTerm]
  );

  useAbortableEffect(
    (status: statusType) => {
      const debounce_timer = setTimeout(() => {
        fetchUsers(status);
      }, 1000);
      return () => clearTimeout(debounce_timer);
    },
    [state.searchTerm]
  );

  useEffect(() => {
    if (isExpanded) {
      searchFieldRef.current.focus();
    }
  }, [isExpanded]);

  const handleSearchTermChange = (e: any) => {
    const { value } = e.target;
    setState({ ...state, searchTerm: value });
  };

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
          <span className="inline-block w-full rounded-md shadow-sm">
            <button
              onClick={(_) => setIsExpanded(true)}
              type="button"
              aria-haspopup="listbox"
              aria-expanded="true"
              aria-labelledby="listbox-label"
              className="cursor-default relative w-full rounded-md border border-gray-300 bg-white pl-3 pr-10 py-2 text-left focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition ease-in-out duration-150 sm:text-sm sm:leading-5"
            >
              <input
                ref={searchFieldRef}
                name="searchTerm"
                type="text"
                placeholder="Search by name or username"
                className={classNames("py-2 pl-3 w-full outline-none", {
                  hidden: !isExpanded,
                })}
                value={state.searchTerm}
                onChange={handleSearchTermChange}
                onKeyUp={(e) => e.preventDefault()}
              />
              <div
                className={classNames("flex items-center justify-between", {
                  hidden: isExpanded,
                })}
              >
                <div className="space-x-3 flex items-center">
                  <span
                    aria-label="Online"
                    className={
                      "flex-shrink-0 inline-block h-2 w-2 rounded-full " +
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
                      ? selectedUser?.first_name + " " + selectedUser?.last_name
                      : `Assign a ${
                          user_type == "Doctor" ? "Doctor" : "Volunteer"
                        }`}
                  </span>
                </div>
                <div
                  className="btn btn-default"
                  onClick={(_) => {
                    onSelect("");
                  }}
                >
                  {" "}
                  Clear
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
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </button>
          </span>
          {isExpanded && (
            <div
              role="listbox"
              aria-labelledby="listbox-label"
              aria-activedescendant="listbox-item-3"
              className="multiselect-dropdown__search-dropdown w-full border border-gray-400 bg-white mt-1 rounded-lg shadow-lg px-4 py-2 z-50"
            >
              {!state.loading ? (
                state.users.map((user: any) => {
                  return (
                    <button
                      key={user.id}
                      onClick={(_) => {
                        setIsExpanded(false);
                        onSelect(user);
                        setState({ ...state, searchTerm: "" });
                      }}
                      id="listbox-item-0"
                      role="option"
                      className="flex text-xs py-1 items-center justify-between w-full hover:bg-gray-200 focus:outline-none focus:bg-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          aria-label="Online"
                          className={
                            "flex-shrink-0 inline-block h-2 w-2 rounded-full " +
                            (moment()
                              .subtract(5, "minutes")
                              .isBefore(user.last_login)
                              ? "bg-primary-400"
                              : "bg-gray-300")
                          }
                        ></span>
                        <span className="font-normal block truncate">
                          {user.first_name} {user.last_name}
                        </span>
                      </div>
                      {user.id == userId && (
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
                              clip-rule="evenodd"
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
      </div>
    </div>
  );
};
