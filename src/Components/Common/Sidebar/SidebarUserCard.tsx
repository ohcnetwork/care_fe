import React from "react";
import { Link } from "raviger";
// import { useTranslation } from "react-i18next";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { formatName, formatDisplayName } from "../../../Utils/utils";
import useAuthUser, { useAuthContext } from "../../../Common/hooks/useAuthUser";
import { Avatar } from "@/Components/Common/Avatar";

interface SidebarUserCardProps {
  shrinked: boolean;
}

const SidebarUserCard: React.FC<SidebarUserCardProps> = ({ shrinked }) => {
  // const { t } = useTranslation();
  const user = useAuthUser();
  const { signOut } = useAuthContext();

  return (
    <div
      className={`mx-auto ${shrinked ? "space-y-2" : "flex items-center md:space-x-2"}`}
    >
      <Link
        href="/user/profile"
        className="tooltip relative cursor-pointer rounded-lg bg-gray-200 font-normal text-gray-900 transition hover:bg-gray-200 md:flex-none"
      >
        <div
          id="user-profile-name"
          className={`flex items-center justify-start transition ${shrinked ? "" : "px-2 py-1"}`}
        >
          <div className="flex-none text-lg">
            <Avatar
              name={formatDisplayName(user)}
              className="w-9 rounded-full border border-gray-300"
            />
          </div>
          {!shrinked && (
            <span className="flex w-full grow items-center pl-2 text-sm tracking-wide">
              {formatName(user)}
            </span>
          )}
        </div>
      </Link>
      <div
        onClick={signOut}
        className="tooltip relative flex cursor-pointer items-center justify-center rounded-lg p-2 font-normal text-gray-900 transition hover:bg-gray-200 md:mt-0 md:flex-none"
      >
        <div
          id="sign-out-button"
          className={`flex items-center justify-start transition-all duration-200 ease-in-out`}
        >
          <CareIcon icon="l-sign-out-alt" className="text-2xl text-gray-900" />

          {/* {!shrinked && (
            <div className="flex items-center w-full pl-4 text-sm tracking-wide text-gray-900">
              {t("sign_out")}
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default SidebarUserCard;
