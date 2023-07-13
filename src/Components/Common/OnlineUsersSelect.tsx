import CircularProgress from "../Common/components/CircularProgress";
import React, { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import moment from "moment";
import { getUserList } from "../../Redux/actions";
import { UserModel } from "../Users/models";
import { classNames } from "../../Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "./components/ButtonV2";
import { FieldLabel } from "../Form/FormFields/FormField";

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

/**
 * This component consists temperory design hacks made to look identical to a
 * form field during the consultation form redesign.
 *
 * However to make the design and functionallity consistent, this component is
 * to be converted to use `AutocompleteFormField` along with `useAsyncOptions`
 * hook and `prefixIcon` for the online state of the users.
 */
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
        <FieldLabel>Assigned to</FieldLabel>
        <div className="relative">
          <div className="relative flex-1">
            <span className="flex w-full flex-col rounded-md md:flex-row">
              <button
                onClick={(_) => {
                  setDropdownExpand(true);
                }}
                type="button"
                aria-haspopup="listbox"
                aria-expanded="true"
                aria-labelledby="listbox-label"
                className={classNames(
                  "relative w-full cursor-default rounded-md border border-gray-400 pl-3 pr-10 text-left transition duration-150 ease-in-out sm:text-sm sm:leading-5",
                  (isDropdownExpanded &&
                    outline &&
                    "border-primary-500 py-0.5 ring-primary-500") ||
                    "py-3"
                )}
              >
                <input
                  ref={searchFieldRef}
                  name="searchTerm"
                  type="text"
                  placeholder="Search by name or username"
                  className={classNames(
                    "w-full border-0 pl-3 focus:outline-none focus:ring-0",
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
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span
                      aria-label="Online"
                      className={
                        "inline-block h-2 w-2 shrink-0 rounded-full " +
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
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
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
                className="multiselect-dropdown__search-dropdown z-50 mt-1 w-full rounded-lg border border-gray-400 bg-white px-4 py-2 shadow-lg"
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
                        className="flex w-full items-center justify-between py-1 text-xs hover:bg-gray-200 focus:bg-gray-200 focus:outline-none"
                      >
                        <div className="flex items-center space-x-3">
                          <span
                            aria-label="Online"
                            className={
                              "inline-block h-2 w-2 shrink-0 rounded-full " +
                              (moment()
                                .subtract(5, "minutes")
                                .isBefore(user.last_login)
                                ? "bg-primary-400"
                                : "bg-gray-300")
                            }
                          ></span>
                          <span className="block truncate font-normal">
                            {user.first_name} {user.last_name}{" "}
                            {user.home_facility_object?.name && (
                              <span className="ml-2 text-gray-700">
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
                  <div className="mx-auto w-1/12">
                    <CircularProgress />
                  </div>
                )}
              </div>
            )}
          </div>
          <ButtonV2
            type="button"
            variant="secondary"
            ghost
            circle
            className={`absolute right-8 top-1/2 -translate-y-1/2 p-1 ${
              isDropdownExpanded && "hidden"
            }`}
            onClick={(_) => {
              onSelect(null);
              setDropdownExpand(false);
            }}
          >
            <CareIcon className="care-l-times text-gray-600" />
          </ButtonV2>
        </div>
      </div>
    </div>
  );
};
