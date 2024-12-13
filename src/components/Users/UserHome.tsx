import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { userChildProps } from "@/components/Common/UserColumns";
import Error404 from "@/components/ErrorPages/404";
import LinkedFacilitiesTab from "@/components/Users/LinkedFacilitiesTab";
import LinkedSkillsTab from "@/components/Users/LinkedSkillsTab";
import UserBanner from "@/components/Users/UserBanner";
import UserSummaryTab from "@/components/Users/UserSummary";
import { UserModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";

import * as Notification from "@/Utils/Notifications";
import { editUserPermissions } from "@/Utils/permissions";
import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { classNames, formatName, keysOf } from "@/Utils/utils";

export interface UserHomeProps {
  username?: string;
  tab: string;
}
export interface tabChildProp {
  body: (childProps: userChildProps) => JSX.Element | undefined;
  hidden?: boolean;
}

export default function UserHome(props: UserHomeProps) {
  const { tab } = props;
  let { username } = props;
  const [userData, setUserData] = useState<UserModel>();
  const { t } = useTranslation();
  const authUser = useAuthUser();
  if (!username) {
    username = authUser.username;
  }

  const { loading, refetch: refetchUserDetails } = useTanStackQueryInstead(
    routes.getUserDetails,
    {
      pathParams: {
        username: username,
      },
      onResponse: ({ res, data, error }) => {
        if (res?.status === 200 && data) {
          setUserData(data);
        } else if (res?.status === 400) {
          navigate("/users");
        } else if (error) {
          Notification.Error({
            msg: "Error while fetching user details: " + (error?.message || ""),
          });
        }
      },
    },
  );

  if (loading || !userData) {
    return <Loading />;
  }

  const editPermissions = editUserPermissions(authUser, userData);

  const TABS: {
    PROFILE: tabChildProp;
    SKILLS: tabChildProp;
    FACILITIES: tabChildProp;
  } = {
    PROFILE: { body: UserSummaryTab },
    SKILLS: {
      body: LinkedSkillsTab,
      hidden: !editPermissions,
    },
    FACILITIES: {
      body: LinkedFacilitiesTab,
      hidden: !editPermissions,
    },
  };

  const normalizedTab = tab.toUpperCase();
  const isValidTab = (tab: string): tab is keyof typeof TABS =>
    Object.keys(TABS).includes(tab as keyof typeof TABS);
  const currentTab = isValidTab(normalizedTab) ? normalizedTab : undefined;

  if (!currentTab) {
    return <Error404 />;
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
                    {keysOf(TABS)
                      .filter((p) => !TABS[p].hidden)
                      .map((p) => {
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
                            <div className="px-3 py-1.5" id={p.toLowerCase()}>
                              {t(`USERMANAGEMENT_TAB__${p}`)}
                            </div>
                          </Link>
                        );
                      })}
                  </nav>
                </div>
              </div>
            </div>
            <SelectedTab
              userData={userData}
              username={username}
              {...props}
              refetchUserData={refetchUserDetails}
            />
          </>
        }
      </Page>
    </>
  );
}
