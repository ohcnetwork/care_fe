import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import { UserStatusIndicator } from "@/components/Users/UserListAndCard";

import { formatName } from "@/Utils/utils";
import { UserBase } from "@/types/user/user";

interface UserCardProps {
  user: UserBase;
  roleName: string;
  actions?: React.ReactNode;
}

export default function UserCard(props: UserCardProps) {
  const { user, actions, roleName } = props;

  const { t } = useTranslation();

  return (
    <Card
      key={user.id}
      className={`h-full ${user.deleted ? "opacity-60" : ""}`}
    >
      <CardContent className="p-4 flex flex-col h-full justify-between">
        <div className="flex items-start gap-3">
          <Avatar
            name={`${user.first_name} ${user.last_name}`}
            imageUrl={user.profile_picture_url}
            className="h-12 w-12 sm:h-14 sm:w-14 text-xl sm:text-2xl flex-shrink-0"
          />

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-start justify-between">
                <h1 className="text-base font-bold break-words pr-2">
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
                <div className="font-medium truncate">{roleName}</div>
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
        <div className="mt-2 -mx-2 -mb-2 sm:-mx-4 sm:-mb-4 rounded-md py-4 px-4 bg-gray-50 flex justify-end gap-2">
          {!user.deleted ? (
            <>
              {actions}
              <Button asChild variant="outline" size="sm">
                <Link href={`/users/${user.username}`}>
                  <CareIcon icon="l-arrow-up-right" className="text-lg mr-1" />
                  <span>{t("see_details")}</span>
                </Link>
              </Button>
            </>
          ) : (
            <div className="bg-gray-200 rounded-md px-2 py-1 text-sm inline-block">
              <CareIcon icon="l-archive" className="mr-2" />
              {t("archived")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
