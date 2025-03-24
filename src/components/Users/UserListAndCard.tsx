import { t } from "i18next";
import { Link, usePathParams } from "raviger";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";

import useAuthUser from "@/hooks/useAuthUser";

import { formatName, isUserOnline, relativeTime } from "@/Utils/utils";
import { UserBase } from "@/types/user/user";

export const UserStatusIndicator = ({
  user,
  addPadding = false,
  className = "",
}: {
  user: UserBase;
  className?: string;
  addPadding?: boolean;
}) => {
  const authUser = useAuthUser();
  const isAuthUser = user.id === authUser.external_id;
  const { t } = useTranslation();

  return (
    <span
      title={`${new Date(user.last_login).toLocaleString()}`}
      className={`${addPadding ? "px-3 py-1" : "py-px"} ${className}`}
    >
      {isUserOnline(user) || isAuthUser ? (
        <Badge variant="secondary" className="bg-green-100 whitespace-nowrap">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500 mr-2" />
          <span className="text-xs text-green-700">{t("online")}</span>
        </Badge>
      ) : user.last_login ? (
        <Badge variant="secondary" className="bg-yellow-100 whitespace-nowrap">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-yellow-500 mr-2" />
          <span className="text-xs text-yellow-700">
            {relativeTime(user.last_login)}
          </span>
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="bg-gray-100 whitespace-nowrap text-wrap"
        >
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-gray-500 mr-2" />
          <span className="text-xs text-gray-700">{t("never_logged_in")}</span>
        </Badge>
      )}
    </span>
  );
};
const UserCard = ({ user }: { user: UserBase }) => {
  const { facilityId } = usePathParams("/facility/:facilityId/*")!;
  return (
    <Card key={user.id} className="h-full">
      <CardContent className="p-4 sm:p-6 flex flex-col h-full justify-between">
        <div className="flex items-start gap-3">
          <Avatar
            name={formatName(user, true)}
            imageUrl={
              "profile_picture_url" in user ? user.profile_picture_url : ""
            }
            className="h-12 w-12 sm:h-14 sm:w-14 text-xl sm:text-2xl flex-shrink-0"
          />

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-start justify-between">
                <h1 className="text-base font-bold break-words pr-2 w-[50%] text-wrap">
                  {formatName(user)}
                </h1>
                <span className="text-sm text-gray-500">
                  <UserStatusIndicator user={user} />
                </span>
              </div>
              <span className="text-sm text-gray-500 mr-2 break-words">
                {user.username}
              </span>
            </div>
            <div className="mt-4 -ml-12 sm:ml-0 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-gray-500">{t("role")}</div>
                <div className="font-medium truncate">
                  {user.user_type ?? "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">{t("phone_number")}</div>
                <div className="font-medium truncate">
                  {user.phone_number
                    ? formatPhoneNumberIntl(user.phone_number)
                    : "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 -mx-2 -mb-2 sm:-mx-4 sm:-mb-4 rounded-md py-4 px-4 bg-gray-50 flex justify-end">
          <Button
            asChild
            id={`see-details-${user.username}`}
            variant="outline"
            size="sm"
          >
            <Link href={`/facility/${facilityId}/users/${user.username}`}>
              <CareIcon icon="l-arrow-up-right" className="text-lg mr-1" />
              <span>{t("see_details")}</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
export const UserGrid = ({ users }: { users?: UserBase[] }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
    {users?.map((user) => <UserCard key={user.id} user={user} />)}
  </div>
);

const UserListHeader = () => {
  return (
    <thead>
      <tr className="bg-gray-50 text-sm font-medium text-gray-500">
        <th className="px-4 py-3 text-left">{t("name")}</th>
        <th className="w-32 px-10 py-3 text-left">{t("status")}</th>
        <th className="px-10 py-3 text-left">{t("role")}</th>
        <th className="px-4 py-3 text-left">{t("contact_number")}</th>
      </tr>
    </thead>
  );
};

const UserListRow = ({ user }: { user: UserBase }) => {
  const { facilityId } = usePathParams("/facility/:facilityId/*")!;
  return (
    <tr
      key={`usr_${user.id}`}
      id={`usr_${user.id}`}
      className="hover:bg-gray-50"
    >
      <td className="px-4 py-4 lg:pr-20">
        <div className="flex items-center gap-3">
          <Avatar
            imageUrl={
              "profile_picture_url" in user ? user.profile_picture_url : ""
            }
            name={formatName(user, true) ?? ""}
            className="h-10 w-10 text-lg"
          />
          <div className="flex flex-col">
            <h1 id={`name-${user.username}`} className="text-sm font-medium">
              {formatName(user)}
            </h1>
            <span
              id={`username-${user.username}`}
              className="text-xs text-gray-500"
            >
              {user.username}
            </span>
          </div>
        </div>
      </td>
      <td className="flex-0 px-6 py-4">
        <UserStatusIndicator user={user} addPadding />
      </td>
      <td id="role" className="px-10 py-4 text-sm">
        {user.user_type}
      </td>
      <td id="contact" className="px-4 py-4 text-sm whitespace-nowrap">
        {user.phone_number ? formatPhoneNumberIntl(user.phone_number) : "-"}
      </td>
      <td className="px-4 py-4">
        <Button
          asChild
          id={`see-details-${user.username}`}
          variant="outline"
          size="sm"
        >
          <Link href={`/facility/${facilityId}/users/${user.username}`}>
            <CareIcon icon="l-arrow-up-right" className="text-lg mr-1" />
            <span>{t("see_details")}</span>
          </Link>
        </Button>
      </td>
    </tr>
  );
};
export const UserList = ({ users }: { users?: UserBase[] }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="relative min-w-full divide-y divide-gray-200">
        <UserListHeader />
        <tbody className="divide-y divide-gray-200 bg-white">
          {users?.map((user) => <UserListRow key={user.id} user={user} />)}
        </tbody>
      </table>
    </div>
  );
};
interface UserListAndCardViewProps {
  users: UserBase[];
  activeTab: "card" | "list";
}

export default function UserListAndCardView({
  users,
  activeTab,
}: UserListAndCardViewProps) {
  const { t } = useTranslation();

  return (
    <>
      {users.length > 0 ? (
        <>
          {activeTab === "card" ? (
            <UserGrid users={users} />
          ) : (
            <UserList users={users} />
          )}
        </>
      ) : (
        <div className="h-full space-y-2 rounded-lg bg-white p-7 shadow">
          <div className="flex w-full items-center justify-center text-xl font-bold text-secondary-500">
            {t("no_users_found")}
          </div>
        </div>
      )}
    </>
  );
}
