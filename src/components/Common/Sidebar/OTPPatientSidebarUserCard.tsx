import React, { useContext } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar } from "@/components/Common/Avatar";

import { OTPPatientUserContext } from "@/Routers/OTPPatientRouter";

import { useSignOut } from "./Utils";

interface SidebarUserCardProps {
  shrinked: boolean;
}

const OTPPatientSidebarUserCard: React.FC<SidebarUserCardProps> = ({
  shrinked,
}) => {
  const { t } = useTranslation();

  const { selectedUser, phoneNumber } = useContext(OTPPatientUserContext);

  const signOut = useSignOut();

  return (
    <div
      className={` ${shrinked ? "space-y-2 px-2" : "flex items-center px-4"}`}
    >
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className={`tooltip relative w-full cursor-pointer items-center justify-between rounded-lg bg-gray-200 p-2 font-normal text-gray-900 transition hover:bg-gray-200 focus:outline-none focus:ring focus:ring-primary-300 ${
              shrinked ? "flex h-full flex-col-reverse" : "flex flex-row"
            }`}
          >
            <div
              id="user-profile-name"
              className="flex flex-1 items-center justify-start transition"
            >
              <div className="flex-none text-lg">
                <Avatar
                  {...(selectedUser != null && { name: selectedUser.name })}
                  icon={<CareIcon icon="l-phone-alt" className="h-4 w-4" />}
                  className="h-8 rounded-full text-black/50"
                />
              </div>
              <div className="max-w-32">
                {!shrinked && (
                  <p className="truncate pl-1 text-xs font-medium tracking-wide">
                    {selectedUser ? selectedUser.name : phoneNumber}
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
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-full">
          <DropdownMenuItem onClick={signOut} className="cursor-pointer">
            <div id="sign-out-button">{t("sign_out")}</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default OTPPatientSidebarUserCard;
