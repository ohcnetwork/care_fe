import { get } from "lodash";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { handleSignOut } from "../../../Utils/utils";

const SidebarUserCard = ({ shrinked }: { shrinked: boolean }) => {
  const { t } = useTranslation();
  const { currentUser } = useSelector((state) => state) as any;

  const firstName = get(currentUser, "data.first_name", "");
  const lastName = get(currentUser, "data.last_name", "");
  const profileName = `${firstName} ${lastName}`.trim();

  return (
    <div
      className={`flex my-2 ${
        shrinked ? "mx-auto" : "mx-5"
      } transition-all duration-200 ease-in-out`}
    >
      <Link href="/user/profile" className="flex-none">
        <CareIcon className="care-l-user-circle h-8 text-white" />
      </Link>
      <div
        className={`${shrinked ? "hidden" : "grow"} pl-3 flex flex-col min-w-0`}
      >
        <div className="min-h-6 flex items-center">
          <Link
            href="/user/profile"
            className="font-semibold text-white flex-nowrap overflow-hidden break-words"
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
