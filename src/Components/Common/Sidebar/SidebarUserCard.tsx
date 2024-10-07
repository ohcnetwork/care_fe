import React from "react";
import { useTranslation } from "react-i18next";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { formatName } from "../../../Utils/utils";
import useAuthUser, { useAuthContext } from "../../../Common/hooks/useAuthUser";
import { ShrinkedSidebarItem, SidebarItem } from "./SidebarItem";

interface SidebarUserCardProps {
  shrinked: boolean;
  handleOverflow: (value: boolean) => void;
}

const SidebarUserCard: React.FC<SidebarUserCardProps> = ({
  shrinked,
  handleOverflow,
}) => {
  const { t } = useTranslation();
  const user = useAuthUser();
  const { signOut } = useAuthContext();

  const Item = shrinked ? ShrinkedSidebarItem : SidebarItem;

  return (
    <div
      className={`flex flex-col bg-primary-800 py-3 transition-all duration-300 ease-in-out ${shrinked ? "w-14" : "w-60"}`}
    >
      <Item
        text={t(formatName(user))}
        to="/user/profile"
        icon={
          <CareIcon
            icon="l-user-circle"
            className="text-3xl text-secondary-400"
          />
        }
        selected={false}
        handleOverflow={handleOverflow}
      />

      <Item
        text={t("sign_out")}
        to="#"
        icon={
          <CareIcon
            icon="l-sign-out-alt"
            className="text-2xl text-secondary-400"
          />
        }
        selected={false}
        do={signOut}
        handleOverflow={handleOverflow}
      />
    </div>
  );
};

export default SidebarUserCard;
