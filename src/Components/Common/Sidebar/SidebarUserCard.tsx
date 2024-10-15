import React from "react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { formatName, formatDisplayName } from "../../../Utils/utils";
import useAuthUser, { useAuthContext } from "../../../Common/hooks/useAuthUser";
import { Avatar } from "@/Components/Common/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";

interface SidebarUserCardProps {
  shrinked: boolean;
}

const SidebarUserCard: React.FC<SidebarUserCardProps> = ({ shrinked }) => {
  const { t } = useTranslation();
  const user = useAuthUser();
  const { signOut } = useAuthContext();

  return (
    <div
      className={` ${shrinked ? "space-y-2 px-2" : "flex items-center px-4"}`}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className={`tooltip relative flex w-full cursor-pointer items-center justify-between rounded-lg bg-gray-200 px-2 py-1 font-normal text-gray-900 transition hover:bg-gray-200 ${shrinked ? "flex-col" : "flex-row"}`}
          >
            <div
              id="user-profile-name"
              className={`flex flex-1 items-center justify-start transition ${shrinked ? "" : ""}`}
            >
              <div className="flex-none text-lg">
                <Avatar
                  name={formatDisplayName(user)}
                  className="w-9 rounded-lg border-gray-300"
                />
              </div>
              {!shrinked && (
                <span className="flex w-full grow items-center pl-1 text-xs font-medium tracking-wide">
                  {formatName(user)}
                </span>
              )}
            </div>
            <div className="flex w-8 shrink-0 items-center justify-center rounded-full bg-gray-300/50 p-1">
              <CareIcon icon="l-angle-up" className="text-xl text-gray-700" />
            </div>
            <div>
              <DropdownMenuContent align="end" className="w-full">
                <Link
                  className="block text-sm capitalize text-gray-900"
                  href="/user/profile"
                >
                  <DropdownMenuItem className="cursor-pointer">
                    {t("profile")}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="cursor-pointer" onClick={signOut}>
                  <div id="sign-out-button">{t("sign_out")}</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </div>
        </DropdownMenuTrigger>
      </DropdownMenu>
    </div>
  );
};

export default SidebarUserCard;
