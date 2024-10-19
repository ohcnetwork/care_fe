import React from "react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { formatName, formatDisplayName } from "../../../Utils/utils";
import useAuthUser, { useAuthContext } from "../../../Common/hooks/useAuthUser";
import { Avatar } from "@/Components/Common/Avatar";
import { Button } from "@/Components/ui/button";
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
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className={`tooltip relative w-full cursor-pointer items-center justify-between rounded-lg bg-gray-200 p-2 font-normal text-gray-900 transition hover:bg-gray-200 focus:outline-none focus:ring focus:ring-violet-300 ${shrinked ? "flex h-full flex-col-reverse" : "flex flex-row"}`}
          >
            <div
              id="user-profile-name"
              className="flex flex-1 items-center justify-start transition"
            >
              <div className="flex-none text-lg">
                <Avatar
                  name={formatDisplayName(user)}
                  className="h-8 rounded-full text-black/50"
                />
              </div>
              <div className="max-w-32">
                {!shrinked && (
                  <p className="truncate pl-1 text-xs font-medium tracking-wide">
                    {formatName(user)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-center rounded-full bg-gray-300/50">
              <CareIcon
                icon="l-angle-up"
                className="text-xl text-gray-600"
                aria-label="Up arrow icon"
              />
            </div>
            <div>
              <DropdownMenuContent align="end" className="w-full">
                <Link
                  className="block text-sm capitalize text-gray-900"
                  href="/user/profile"
                >
                  <DropdownMenuItem className="cursor-pointer">
                    <div id="profile-button">{t("profile")}</div>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="cursor-pointer" onClick={signOut}>
                  <div id="sign-out-button">{t("sign_out")}</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </Button>
        </DropdownMenuTrigger>
      </DropdownMenu>
    </div>
  );
};

export default SidebarUserCard;
