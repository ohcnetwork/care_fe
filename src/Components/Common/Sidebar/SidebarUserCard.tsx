import { get } from "lodash";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Profile } from "../../../Common/icons";

const SidebarUserCard = ({ shrinked }: { shrinked: boolean }) => {
  const { t } = useTranslation();
  const { currentUser } = useSelector((state) => state) as any;

  const firstName = get(currentUser, "data.first_name", "");
  const lastName = get(currentUser, "data.last_name", "");
  const profileName = `${firstName} ${lastName}`.trim();

  const signOut = () => {
    localStorage.removeItem("care_access_token");
    localStorage.removeItem("care_refresh_token");
    localStorage.removeItem("shift-filters");
    localStorage.removeItem("external-filters");
    localStorage.removeItem("lsg-ward-data");
    navigate("/");
    window.location.reload();
  };

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
          onClick={signOut}
          className="text-gray-100 text-opacity-60 cursor-pointer text-sm"
        >
          {t("sign_out")}
        </p>
      </div>
    </div>
  );
};

export default SidebarUserCard;
