import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import { userChildProps } from "@/components/Common/UserColumns";
import Error404 from "@/components/ErrorPages/404";
import LinkedFacilitiesTab from "@/components/Users/LinkedFacilitiesTab";
import RoleAndSkillsTab from "@/components/Users/RoleAndSkillsTab";
import { UserModel } from "@/components/Users/models";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { classNames, formatName, keysOf } from "@/Utils/utils";

import Page from "../Common/Page";
import UserBanner from "./UserBanner";
import UserSummaryTab from "./UserSummary";

export interface UserHomeProps {
  username: string;
  tab: string;
}
export interface tabChildProp {
  body: (childProps: userChildProps) => JSX.Element | undefined;
  name?: string;
}

export default function UserHome(props: UserHomeProps) {
  const { username, tab } = props;
  const [userData, setUserData] = useState<UserModel>();
  const { t } = useTranslation();

  const { loading } = useQuery(routes.getUserDetails, {
    query: {
      username: username,
    },
    onResponse: ({ res, data }) => {
      if (res?.status === 200 && data) {
        setUserData(data);
      } else if (res?.status === 400) {
        navigate("/users");
      }
    },
  });

  const roleInfoBeVisible = () => {
    if (["Doctor", "Nurse"].includes(userData?.user_type ?? "")) return true;
    return false;
  };

  const TABS: {
    PROFILE: tabChildProp;
    ROLE_SKILLS: tabChildProp;
    FACILITIES: tabChildProp;
  } = {
    PROFILE: { body: UserSummaryTab },
    ROLE_SKILLS: {
      body: RoleAndSkillsTab,
      name: roleInfoBeVisible() ? "ROLE_SKILLS" : "SKILLS",
    },
    FACILITIES: { body: LinkedFacilitiesTab },
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

  const SelectedTab = TABS[currentTab].body;

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
                      const tabName = TABS[p]?.name ?? p;
                      return (
                        <Link
                          key={p}
                          className={classNames(
                            "min-w-max-content cursor-pointer whitespace-nowrap text-sm font-semibold capitalize",
                            currentTab === p
                              ? "border-b-2 border-primary-500 text-primary-600 hover:border-secondary-300"
                              : "text-secondary-700 hover:text-secondary-700",
                          )}
                          href={`/users/${username}/${p.toLocaleLowerCase()}`}
                        >
                          <div className="px-3 py-1.5">
                            {t(`USERMANAGEMENT_TAB__${tabName}`)}
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
