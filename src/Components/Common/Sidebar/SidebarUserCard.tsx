import { get } from "lodash";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Profile } from "../../../Common/icons";
import { handleSignOut } from "../../../Utils/utils";

const SidebarUserCard = ({ shrinked }: { shrinked: boolean }) => {
  const { t } = useTranslation();
  const { currentUser } = useSelector((state) => state) as any;

  const firstName = get(currentUser, "data.first_name", "");
  const lastName = get(currentUser, "data.last_name", "");
  const profileName = `${firstName} ${lastName}`.trim();

  return (
    <div
      className={`flex ${
        shrinked ? "mx-auto" : "mx-10"
      } transition-all duration-200 ease-in-out`}
    >
      <Link href="/user/profile" className="w-8 h-8 fill-white flex-none">
        <Profile />
      </Link>
      <div className={`${shrinked ? "hidden" : "grow"} pl-3 flex flex-col`}>
        <div className="h-6 flex items-center">
          <Link
            href="/user/profile"
            className="font-semibold text-white flex-nowrap overflow-hidden truncate"
          >
            {profileName}
          </Link>
        </div>
        <p
          onClick={() => handleSignOut(true)}
          className="text-gray-100 text-opacity-60 cursor-pointer text-sm"
        >
          {t("sign_out")}
        </p>
      </div>
    </div>
  );
};

export default SidebarUserCard;
