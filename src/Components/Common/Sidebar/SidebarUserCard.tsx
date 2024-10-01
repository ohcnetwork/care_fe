import React from "react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { formatName, formatDisplayName } from "../../../Utils/utils";
import useAuthUser, { useAuthContext } from "../../../Common/hooks/useAuthUser";
import { Avatar } from "@/Components/Common/Avatar";

interface SidebarUserCardProps {
  shrinked: boolean;
}

const SidebarUserCard: React.FC<SidebarUserCardProps> = ({ shrinked }) => {
  const { t } = useTranslation();
  const user = useAuthUser();
  const { signOut } = useAuthContext();

  return (
    <div className="my-2 flex flex-col">
      <Link
        href="/user/profile"
        className="tooltip relative ml-1 mr-3 h-full min-h-[40px] flex-1 cursor-pointer rounded-lg font-normal text-gray-900 transition-all duration-200 ease-in-out hover:bg-gray-200 md:h-11 md:flex-none"
      >
        <div
          className={`flex h-full items-center justify-start transition-all duration-200 ease-in-out ${shrinked ? "pl-2" : "pl-5 pr-4"}`}
        >
          <div className="flex-none text-lg">
            <Avatar name={formatDisplayName(user)} className="w-6" />
          </div>
          {!shrinked && (
            <span className="flex w-full grow items-center pl-4 text-sm tracking-wide">
              {formatName(user)}
            </span>
          )}
        </div>
      </Link>
      <div
        onClick={signOut}
        className="tooltip relative ml-1 mr-3 h-full min-h-[40px] flex-1 cursor-pointer rounded-lg font-normal text-gray-900 transition-all duration-200 ease-in-out hover:bg-gray-200 md:h-11 md:flex-none"
      >
        <div
          className={`flex h-full items-center justify-start transition-all duration-200 ease-in-out ${shrinked ? "pl-2" : "pl-5 pr-4"}`}
        >
          <div className="flex-none text-lg">
            <CareIcon
              icon="l-sign-out-alt"
              className="text-2xl text-gray-900"
            />
          </div>

          {!shrinked && (
            <div className="flex w-full items-center pl-4 text-sm tracking-wide text-gray-900">
              {t("sign_out")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarUserCard;
