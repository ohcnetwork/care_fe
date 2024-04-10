import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { formatName } from "../../../Utils/utils";
import useAuthUser, { useAuthContext } from "../../../Common/hooks/useAuthUser";

const SidebarUserCard = ({ shrinked }: { shrinked: boolean }) => {
  const { t } = useTranslation();
  const user = useAuthUser();
  const { signOut } = useAuthContext();

  return (
    <div
      className={`my-2 flex ${
        shrinked ? "mx-auto flex-col" : "mx-5"
      } transition-all duration-200 ease-in-out`}
    >
      <Link href="/user/profile" className="flex-none py-3">
        <CareIcon icon="l-user-circle" className="text-3xl text-white" />
      </Link>
      <div className="flex cursor-pointer justify-center" onClick={signOut}>
        <CareIcon
          icon="l-sign-out-alt"
          className={`text-2xl text-gray-400 ${
            shrinked ? "visible" : "hidden"
          }`}
        />
      </div>
      <div
        className={`${
          shrinked ? "hidden" : "grow"
        } flex min-w-0 flex-col pb-2 pl-3`}
      >
        <div className="flex min-h-6 items-center">
          <Link
            href="/user/profile"
            className="flex-nowrap overflow-hidden break-words font-semibold text-white"
            id="profilenamelink"
          >
            {formatName(user)}
          </Link>
        </div>
        <div
          className="flex min-h-6 cursor-pointer items-center"
          onClick={signOut}
        >
          <CareIcon
            icon="l-sign-out-alt"
            className={`${shrinked ? "text-xl" : "mr-1"} text-gray-400`}
          />
          <p className="text-gray-400 text-opacity-80">{t("sign_out")}</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarUserCard;
