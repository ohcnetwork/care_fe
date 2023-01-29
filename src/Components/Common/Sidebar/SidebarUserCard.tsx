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
        shrinked ? "mx-auto flex-col" : "mx-5"
      } transition-all duration-200 ease-in-out`}
    >
      <Link href="/user/profile" className="flex-none py-3">
        <CareIcon className="care-l-user-circle text-3xl text-white" />
      </Link>
      <div
        className="cursor-pointer flex justify-center"
        onClick={() => handleSignOut(true)}
      >
        <CareIcon
          className={`care-l-sign-out-alt text-2xl text-gray-400 ${
            shrinked ? "visible" : "hidden"
          }`}
        />
      </div>
      <div
        className={`${
          shrinked ? "hidden" : "grow"
        } pl-3 flex flex-col min-w-0 pb-2`}
      >
        <div className="min-h-6 flex items-center">
          <Link
            href="/user/profile"
            className="font-semibold text-white flex-nowrap overflow-hidden break-words"
          >
            {profileName}
          </Link>
        </div>
        <div
          className="min-h-6 flex items-center cursor-pointer"
          onClick={() => handleSignOut(true)}
        >
          <CareIcon
            className={`care-l-sign-out-alt ${
              shrinked ? "text-xl" : "mr-1"
            } text-gray-400`}
          />
          <p className="text-gray-400 text-opacity-80">{t("sign_out")}</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarUserCard;
