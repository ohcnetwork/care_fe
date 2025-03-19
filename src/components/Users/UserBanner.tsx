import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";

import { formatName } from "@/Utils/utils";
import { UserBase } from "@/types/user/user";

import { UserStatusIndicator } from "./UserListAndCard";

export default function UserBanner({ userData }: { userData: UserBase }) {
  if (!userData) {
    return;
  }

  return (
    <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row">
      <div className="mb-3 flex flex-col w-full justify-between gap-3 rounded p-3 shadow-sm transition-all duration-200 ease-in-out sm:flex-row md:p-6">
        <div className="flex flex-row gap-2 self-center">
          <Avatar
            imageUrl={userData?.profile_picture_url}
            name={formatName(userData, true)}
            className="h-20 w-20 md:mr-2 shrink-0"
          />
          <div className="grid grid-cols-1 self-center">
            <div className="flex flex-row items-center gap-3">
              <TooltipComponent content={formatName(userData)} side="top">
                <h1 className="text-xl font-bold truncate" id="users-name">
                  {formatName(userData)}
                </h1>
              </TooltipComponent>
              <div className="min-width-50 shrink-0 text-sm text-secondary-600">
                <UserStatusIndicator
                  user={userData}
                  addPadding
                  className="pl-0"
                />
              </div>
            </div>
            <TooltipComponent content={userData.username} side="bottom">
              <p
                id="username"
                className="text-sm font-light leading-relaxed text-secondary-600 truncate"
              >
                {userData.username}
              </p>
            </TooltipComponent>
          </div>
        </div>
      </div>
    </div>
  );
}
