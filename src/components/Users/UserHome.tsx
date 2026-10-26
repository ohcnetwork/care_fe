import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { ReactNode, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { userChildProps } from "@/components/Common/UserColumns";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import UserAvailabilityTab from "@/components/Users/UserAvailabilityTab";
import UserBanner from "@/components/Users/UserBanner";
import UserDepartmentsTab from "@/components/Users/UserDepartmentsTab";
import UserSummaryTab from "@/components/Users/UserSummary";
import UserThemeTab from "@/components/Users/UserThemeTab";

import useAuthUser from "@/hooks/useAuthUser";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { formatName, goBack, keysOf } from "@/Utils/utils";
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

function ProfileTabsList({
  activeTab,
  children,
}: {
  activeTab: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const list = listRef.current;
    if (!viewport || !list) return;

    const revealActiveTab = () => {
      const active = list.querySelector<HTMLElement>(
        '[role="tab"][aria-selected="true"]',
      );
      if (!active) return;
      const viewportBounds = viewport.getBoundingClientRect();
      const tabBounds = active.getBoundingClientRect();
      const offset =
        tabBounds.left < viewportBounds.left
          ? tabBounds.left - viewportBounds.left
          : Math.max(0, tabBounds.right - viewportBounds.right);
      // Scroll only this strip; scrollIntoView can also move the page vertically.
      viewport.scrollLeft += offset;
    };

    revealActiveTab();
    const observer = new ResizeObserver(revealActiveTab);
    observer.observe(viewport);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeTab]);

  return (
    <div ref={viewportRef} className="min-w-0 max-w-full overflow-x-auto pb-1">
      <TabsList
        ref={listRef}
        variant="line"
        id="usermanagement_tab_nav"
        aria-label={t("manage_user")}
        className="w-max min-w-full border-b border-border"
      >
        {children}
      </TabsList>
    </div>
  );
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

  const isOwnAccount = authUser.username === userData.username;
  const TABS = {
    PROFILE: {
      body: UserSummaryTab,
      hidden: false,
    },
    DEPARTMENTS: {
      body: UserDepartmentsTab,
      hidden: !props.facilityId,
    },
    AVAILABILITY: {
      body: UserAvailabilityTab,
      hidden: !props.facilityId || !canViewSchedule,
    },
    THEME: {
      body: UserThemeTab,
      hidden: !isOwnAccount,
    },
  } satisfies Record<string, TabChildProp>;

  const normalizedTab = tab.toUpperCase();
  const isValidTab = (tab: string): tab is keyof typeof TABS =>
    Object.keys(TABS).includes(tab as keyof typeof TABS);
  const currentTab = isValidTab(normalizedTab) ? normalizedTab : undefined;

  if (!currentTab || (currentTab === "THEME" && !isOwnAccount)) {
    return <ErrorPage />;
  }

  const SelectedTab = TABS[currentTab].body;
  const userUrl = props.facilityId
    ? `/facility/${props.facilityId}/users/${username}`
    : `/users/${username}`;

  return (
    <Page
      title={formatName(userData) || userData.username || t("manage_user")}
      hideTitleOnPage
    >
      <UserBanner userData={userData} />
      <Tabs value={currentTab} activationMode="manual" className="mt-4 w-full">
        <ProfileTabsList activeTab={currentTab}>
          {keysOf(TABS)
            .filter((key) => !TABS[key].hidden)
            .map((key) => (
              <TabsTrigger key={key} value={key} id={key.toLowerCase()} asChild>
                <Link basePath="/" href={`${userUrl}/${key.toLowerCase()}`}>
                  {t(`USERMANAGEMENT_TAB__${key}`)}
                </Link>
              </TabsTrigger>
            ))}
        </ProfileTabsList>
        <TabsContent value={currentTab}>
          <SelectedTab
            userData={userData}
            username={username}
            permissions={facilityData?.permissions ?? []}
          />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
