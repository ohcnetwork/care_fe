import { Avatar } from "@/components/Common/Avatar";

import { formatDisplayName, formatName } from "@/Utils/utils";
import { UserBase } from "@/types/user/user";

import { UserStatusIndicator } from "./UserListAndCard";

export default function UserBanner({ userData }: { userData: UserBase }) {
  if (!userData) {
    return;
  }

  return (
    <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row">
      <div className="mb-3 flex w-full flex-col justify-between gap-3 rounded bg-white p-3 shadow-sm transition-all duration-200 ease-in-out sm:flex-row md:p-6">
        <div className="flex flex-row gap-2 self-center">
          <Avatar
            imageUrl={userData?.profile_picture_url}
            name={formatDisplayName(userData)}
            className="h-20 w-20 md:mr-2 lg:mr-3 lg:h-16 lg:w-16"
          />
          <div className="flex flex-col self-center">
            <div className="flex flex-row items-center gap-3">
              <h1 className="text-xl font-bold" id="users-name">
                {formatName(userData)}
              </h1>
              <div className="min-width-50 shrink-0 text-sm text-secondary-600">
                <UserStatusIndicator user={userData} addPadding />
              </div>
            </div>

            <span
              id="username"
              className="text-sm font-light leading-relaxed text-secondary-600"
            >
              {userData.username}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
