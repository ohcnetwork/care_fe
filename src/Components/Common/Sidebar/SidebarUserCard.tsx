import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { handleSignOut } from "../../../Utils/utils";
import useAuthUser from "../../../Common/hooks/useAuthUser";

const SidebarUserCard = ({ shrinked }: { shrinked: boolean }) => {
  const { t } = useTranslation();
  const user = useAuthUser();
  const profileName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

  return (
    <div
      className={`my-2 flex ${
        shrinked ? "mx-auto flex-col" : "mx-5"
      } transition-all duration-200 ease-in-out`}
    >
      <Link href="/user/profile" className="flex-none py-3">
        <CareIcon className="care-l-user-circle text-3xl text-white" />
      </Link>
      <div
        className="flex cursor-pointer justify-center"
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
        } flex min-w-0 flex-col pb-2 pl-3`}
      >
        <div className="min-h-6 flex items-center">
          <Link
            href="/user/profile"
            className="flex-nowrap overflow-hidden break-words font-semibold text-white"
          >
            {profileName}
          </Link>
        </div>
        <div
          className="min-h-6 flex cursor-pointer items-center"
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
