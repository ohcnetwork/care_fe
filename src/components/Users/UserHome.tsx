import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { userChildProps } from "@/components/Common/UserColumns";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import UserAvailabilityTab from "@/components/Users/UserAvailabilityTab";
import UserBanner from "@/components/Users/UserBanner";
import UserSummaryTab from "@/components/Users/UserSummary";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { formatName, keysOf } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import facilityApi from "@/types/facility/facilityApi";
import userApi from "@/types/user/userApi";

export interface UserHomeProps {
  username?: string;
  tab: string;
  facilityId?: string;
}
export interface TabChildProp {
  body: (childProps: userChildProps) => React.ReactNode | undefined;
  hidden?: boolean;
}

export default function UserHome(props: UserHomeProps) {
  const { tab } = props;
  let { username, facilityId } = props;
  const { t } = useTranslation();
  const authUser = useAuthUser();
  if (!username) {
    username = authUser.username;
  }
  const { hasPermission } = usePermissions();
  const { goBack } = useAppHistory();

  const {
    data: userData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["getUserDetails", username],
    queryFn: query(userApi.get, {
      pathParams: {
        username: username,
      },
    }),
  });

  const { data: facilityData } = useQuery({
    queryKey: ["getFacilityDetails", props.facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId: facilityId ?? "" },
    }),
    enabled: !!facilityId,
  });

  const { canViewSchedule } = getPermissions(
    hasPermission,
    facilityId ? (facilityData?.permissions ?? []) : authUser.permissions,
  );

  if (isError) {
    goBack("/");
  }

  if (isLoading || !userData) {
    return <Loading />;
  }

  const TABS = {
    PROFILE: {
      body: UserSummaryTab,
      hidden: false,
    },
    AVAILABILITY: {
      body: UserAvailabilityTab,
      hidden: !props.facilityId || !canViewSchedule,
    },
  } satisfies Record<string, TabChildProp>;

  const normalizedTab = tab.toUpperCase();
  const isValidTab = (tab: string): tab is keyof typeof TABS =>
    Object.keys(TABS).includes(tab as keyof typeof TABS);
  const currentTab = isValidTab(normalizedTab) ? normalizedTab : undefined;

  if (!currentTab) {
    return <ErrorPage />;
  }

  const SelectedTab = TABS[currentTab].body;
  const userUrl = props.facilityId
    ? `/facility/${props.facilityId}/users/${username}`
    : `/users/${username}`;

  return (
    <>
      <Page
        title={formatName(userData) || userData.username || t("manage_user")}
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
                            className={cn(
                              "min-w-max-content cursor-pointer whitespace-nowrap text-sm font-semibold capitalize",
                              currentTab === p
                                ? "border-b-2 border-primary-500 text-primary-600 hover:border-secondary-300"
                                : "text-secondary-700 hover:text-secondary-700",
                            )}
                            href={`${userUrl}/${p.toLocaleLowerCase()}`}
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
              permissions={facilityData?.permissions ?? []}
            />
          </>
        }
      </Page>
    </>
  );
}
