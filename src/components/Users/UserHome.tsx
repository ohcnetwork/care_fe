import { useState } from "react";
import Page from "../Common/components/Page";
import UserBanner from "./UserBanner";
import UserSummaryTab from "./UserSummary";
import routes from "@/Redux/api";
import useQuery from "@/Utils/request/useQuery";
import { UserModel } from "./models";
import Loading from "../Common/Loading";
import Error404 from "../ErrorPages/404";
import { classNames, formatName, keysOf } from "@/Utils/utils";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import LinkedFacilitiesTab from "./LinkedFacilitiesTab";
import RoleAndSkillsTab from "./RoleAndSkillsTab";

export interface UserHomeProps {
  username: string;
  tab: string;
}

export default function UserHome(props: UserHomeProps) {
  const { username, tab } = props;
  const [userData, setUserData] = useState<UserModel>();
  const { t } = useTranslation();

  const { loading } = useQuery(routes.getUserDetails, {
    pathParams: {
      username,
    },
    onResponse: ({ res, data }) => {
      if (res?.status === 200 && data) {
        setUserData(data);
      }
    },
  });

  const TABS = {
    PROFILE: UserSummaryTab,
    ROLE_SKILLS: RoleAndSkillsTab,
    FACILITIES: LinkedFacilitiesTab,
  };

  let currentTab = undefined;
  if (Object.keys(TABS).includes(tab.toUpperCase())) {
    currentTab = tab.toUpperCase() as keyof typeof TABS;
  }

  if (!currentTab) {
    return <Error404 />;
  }

  if (loading || !userData) {
    return <Loading />;
  }

  const SelectedTab = TABS[currentTab];

  return (
    <>
      <Page
        title={formatName(userData) || userData.username || t("manage_user")}
        crumbsReplacements={{ [username]: { name: username } }}
        focusOnLoad={true}
        backUrl="/users"
        hideTitleOnPage
      >
        {
          <>
            <UserBanner userData={userData} />
            <div className="mt-4 w-full border-b-2 border-secondary-200">
              <div className="overflow-x-auto sm:flex sm:items-baseline">
                <div className="mt-4 sm:mt-0">
                  <nav
                    className="flex space-x-6 overflow-x-auto"
                    id="usermanagement_tab_nav"
                  >
                    {keysOf(TABS).map((p) => {
                      return (
                        <Link
                          key={p}
                          className={classNames(
                            "min-w-max-content cursor-pointer whitespace-nowrap text-sm font-semibold capitalize",
                            currentTab === p
                              ? "border-b-2 border-primary-500 text-primary-600 hover:border-secondary-300"
                              : "text-secondary-700 hover:text-secondary-700",
                          )}
                          href={`/users/detail/${username}/${p.toLocaleLowerCase()}`}
                        >
                          <div className="px-3 py-1.5">
                            {t(`USERMANAGEMENT_TAB__${p}`)}
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>
            <SelectedTab userData={userData} {...props} />
          </>
        }
      </Page>
    </>
  );
}
