import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "@/CAREUI/display/Card";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Avatar } from "@/components/Common/Avatar";
import { UserAssignedModel, UserModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";
import useWindowDimensions from "@/hooks/useWindowDimensions";

import { USER_TYPES, USER_TYPE_OPTIONS } from "@/common/constants";

import {
  classNames,
  formatName,
  isUserOnline,
  relativeTime,
} from "@/Utils/utils";

import Tabs from "../Common/Tabs";
import SearchInput from "../Form/SearchInput";

interface UserListViewProps {
  users: UserModel[] | UserAssignedModel[];
  onSearch: (username: string) => void;
  searchValue: string;
}

export default function UserListView({
  users,
  onSearch,
  searchValue,
}: UserListViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <div className="mb-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="sm:w-1/2">
          <SearchInput
            id="search-by-username"
            name="username"
            onChange={(e) => onSearch(e.value)}
            value={searchValue}
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
      {activeTab === 0 ? (
        <UserGrid users={users} />
      ) : (
        <UserList users={users} />
      )}
    </>
  );
}

export const GetUserTypes = () => {
  const authUser = useAuthUser();

  const userIndex = USER_TYPES.indexOf(authUser.user_type);
  const readOnlyUsers = USER_TYPE_OPTIONS.filter((user) => user.readOnly);
  const defaultAllowedUserTypes = USER_TYPE_OPTIONS.slice(0, userIndex + 1);

  // Superuser gets all options
  if (authUser.is_superuser) {
    return [...USER_TYPE_OPTIONS];
  }

  switch (authUser.user_type) {
    case "StaffReadOnly":
      return readOnlyUsers.slice(0, 1);
    case "DistrictReadOnlyAdmin":
      return readOnlyUsers.slice(0, 2);
    case "StateReadOnlyAdmin":
      return readOnlyUsers.slice(0, 3);
    case "Pharmacist":
      return USER_TYPE_OPTIONS.slice(0, 1);
    case "Nurse":
    case "Staff":
      return [...defaultAllowedUserTypes, USER_TYPE_OPTIONS[6]];
    default:
      return defaultAllowedUserTypes;
  }
};

export const CanUserAccess = (user: UserModel | UserAssignedModel) => {
  const allowedTypes = GetUserTypes().map((type) => type.id);
  return allowedTypes.includes(user.user_type);
};

const getNameAndStatusCard = (
  user: UserModel | UserAssignedModel,
  cur_online: boolean,
) => {
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
          <UserStatusIndicator user={user} />
        </div>
      </div>
      <span className="text-sm text-gray-500">{user.username}</span>
    </div>
  );
};
const UserCard = ({ user }: { user: UserModel | UserAssignedModel }) => {
  const cur_online = isUserOnline(user);
  const { width } = useWindowDimensions();
  const mediumScreenBreakpoint = 640;
  const isMediumScreen = width <= mediumScreenBreakpoint;
  const { t } = useTranslation();

  return (
    <Card key={`usr_${user.id}`} id={`usr_${user.id}`} className="relative">
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
            <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-2">
              <div className="text-sm">
                <div className="text-gray-500">{t("role")}</div>
                <div className="font-medium">{user.user_type}</div>
              </div>
              <div className="text-sm">
                <div className="text-gray-500">{t("home_facility")}</div>
                <div className="font-medium">
                  {user.home_facility_object?.name || t("no_home_facility")}
                </div>
              </div>
              {"district_object" in user && user.district_object && (
                <div className="text-sm">
                  <div className="text-gray-500">{t("district")}</div>
                  <div className="font-medium">{user.district_object.name}</div>
                </div>
              )}
              {"district" in user && user.district && (
                <div className="text-sm">
                  <div className="text-gray-500">{t("district")}</div>
                  <div className="font-medium">{user.district}</div>
                </div>
              )}
              {user.weekly_working_hours && (
                <div className="text-sm">
                  <div className="text-gray-500">
                    {t("average_weekly_working_hours")}
                  </div>
                  <div className="font-medium">{user.weekly_working_hours}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        {CanUserAccess(user) && (
          <button
            onClick={() => navigate(`/users/${user.username}`)}
            className="flex flex-grow-0 items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs"
          >
            <CareIcon icon="l-arrow-up-right" className="text-lg" />
            <span>{t("more_details")}</span>
          </button>
        )}
      </div>
    </Card>
  );
};
export const UserGrid = ({
  users,
}: {
  users?: UserModel[] | UserAssignedModel[];
}) => (
  <div className="grid grid-cols-1 gap-4 @xl:grid-cols-3 @4xl:grid-cols-4 @6xl:grid-cols-5 sm:grid-cols-2">
    {users?.map((user) => <UserCard key={user.id} user={user} />)}
  </div>
);

const UserListHeader = () => {
  const { t } = useTranslation();
  return (
    <thead>
      <tr className="bg-gray-50 text-sm font-medium text-gray-500">
        <th className="px-4 py-3 text-left">{t("name")}</th>
        <th className="w-32 px-4 py-3 text-left">{t("status")}</th>
        <th className="px-4 py-3 text-left">{t("role")}</th>
        <th className="px-4 py-3 text-left">{t("home_facility")}</th>
        <th className="px-4 py-3 text-left">{t("district")}</th>
        <th className="px-4 py-3"></th>
      </tr>
    </thead>
  );
};

const UserListRow = ({ user }: { user: UserModel | UserAssignedModel }) => {
  const { t } = useTranslation();
  return (
    <tr
      key={`usr_${user.id}`}
      id={`usr_${user.id}`}
      className="hover:bg-gray-50"
    >
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
        <UserStatusIndicator user={user} addPadding />
      </td>
      <td className="px-4 py-4 text-sm">{user.user_type}</td>
      <td className="px-4 py-4 text-sm">
        {user.home_facility_object?.name || t("no_home_facility")}
      </td>
      <td className="px-4 py-4 text-sm">
        {"district_object" in user && user.district
          ? user.district_object?.name
          : "district" in user && user.district
            ? user.district
            : ""}
      </td>
      <td className="px-4 py-4">
        {CanUserAccess(user) && (
          <button
            onClick={() => navigate(`/users/${user.username}`)}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-xs"
          >
            <CareIcon icon="l-arrow-up-right" className="text-lg" />
            <span>{t("more_details")}</span>
          </button>
        )}
      </td>
    </tr>
  );
};
export const UserList = ({
  users,
}: {
  users?: UserModel[] | UserAssignedModel[];
}) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200">
      <UserListHeader />
      <tbody className="divide-y divide-gray-200 bg-white">
        {users?.map((user) => <UserListRow key={user.id} user={user} />)}
      </tbody>
    </table>
  </div>
);

export const UserStatusIndicator = ({
  user,
  className,
  addPadding = false,
}: {
  user: UserModel | UserAssignedModel;
  className?: string;
  addPadding?: boolean;
}) => {
  const cur_online = isUserOnline(user);
  const { t } = useTranslation();
  return (
    <div
      className={classNames(
        "inline-flex items-center gap-2 rounded-full",
        addPadding ? "px-3 py-1" : "pypx",
        cur_online ? "bg-green-100" : "bg-gray-100",
        className,
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
          "whitespace-nowrap text-xs",
          cur_online ? "text-green-700" : "text-gray-500",
        )}
      >
        {cur_online
          ? t("online")
          : user.last_login
            ? relativeTime(user.last_login)
            : t("never")}
      </span>
    </div>
  );
};
