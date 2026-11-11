import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  LucideIcon,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { userChildProps } from "@/components/Common/UserColumns";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import UserAvailabilityTab from "@/components/Users/UserAvailabilityTab";
import UserBanner from "@/components/Users/UserBanner";
import UserDepartmentsTab from "@/components/Users/UserDepartmentsTab";
import { UserProfileEditSection } from "@/components/Users/UserForm";
import UserPreferencesTab from "@/components/Users/UserPreferencesTab";
import UserSecurityTab from "@/components/Users/UserSecurityTab";
import UserSummaryTab from "@/components/Users/UserSummary";
import UserThemeTab from "@/components/Users/UserThemeTab";
import EditUserSheet from "@/pages/Organization/components/EditUserSheet";

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
  icon: LucideIcon;
}

export default function UserHome(props: UserHomeProps) {
  const { tab } = props;
  let { username, facilityId } = props;
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const [showEditUserSheet, setShowEditUserSheet] = useState(false);
  const [editSection, setEditSection] = useState<UserProfileEditSection>();
  const openEditUser = (section?: UserProfileEditSection) => {
    setEditSection(section);
    setShowEditUserSheet(true);
  };
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

  const { data: facilityData, isLoading: isLoadingFacility } = useQuery({
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
    return <ErrorPage />;
  }

  if (isLoading || !userData || (facilityId && isLoadingFacility)) {
    return <Loading />;
  }

  const isOwnAccount = authUser.username === userData.username;
  const TABS = {
    PROFILE: {
      body: UserSummaryTab,
      hidden: false,
      icon: UserRound,
    },
    DEPARTMENTS: {
      body: UserDepartmentsTab,
      hidden: !props.facilityId,
      icon: Building2,
    },
    AVAILABILITY: {
      body: UserAvailabilityTab,
      hidden: !props.facilityId || !canViewSchedule,
      icon: CalendarDays,
    },
    THEME: {
      body: UserThemeTab,
      hidden: !isOwnAccount,
      icon: Palette,
    },
    SECURITY: {
      body: UserSecurityTab,
      hidden:
        !authUser.is_superuser &&
        (!isOwnAccount || userData.is_service_account),
      icon: ShieldCheck,
    },
    PREFERENCES: {
      body: UserPreferencesTab,
      hidden: !isOwnAccount,
      icon: SlidersHorizontal,
    },
  } satisfies Record<string, TabChildProp>;

  const normalizedTab = tab.toUpperCase();
  const isValidTab = (tab: string): tab is keyof typeof TABS =>
    Object.keys(TABS).includes(tab as keyof typeof TABS);
  const currentTab = isValidTab(normalizedTab) ? normalizedTab : undefined;

  if (!currentTab || TABS[currentTab].hidden) {
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
      className="mx-auto w-full max-w-6xl px-4 pb-10"
    >
      {(authUser.is_superuser || isOwnAccount) && (
        <EditUserSheet
          existingUsername={username}
          open={showEditUserSheet}
          setOpen={setShowEditUserSheet}
          initialSection={editSection}
        />
      )}
      <Tabs value={currentTab} activationMode="manual" className="w-full gap-0">
        <div className="border-b border-border pb-4">
          <UserBanner
            userData={userData}
            onEdit={
              authUser.is_superuser || isOwnAccount
                ? () => openEditUser()
                : undefined
            }
          />
          <TabsList
            id="usermanagement_tab_nav"
            aria-label={t("manage_user")}
            className="grid h-auto w-full grid-cols-2 gap-1 sm:flex sm:w-fit sm:flex-wrap sm:justify-start"
          >
            {keysOf(TABS)
              .filter((key) => !TABS[key].hidden)
              .map((key) => {
                const Icon = TABS[key].icon;
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    id={key.toLowerCase()}
                    className="min-h-11 min-w-0 whitespace-normal sm:flex-none sm:px-4"
                    asChild
                  >
                    <Link basePath="/" href={`${userUrl}/${key.toLowerCase()}`}>
                      <Icon
                        className="size-4"
                        strokeWidth={1.7}
                        aria-hidden="true"
                      />
                      {t(`USERMANAGEMENT_TAB__${key}`)}
                    </Link>
                  </TabsTrigger>
                );
              })}
          </TabsList>
        </div>
        <TabsContent value={currentTab}>
          <SelectedTab
            userData={userData}
            username={username}
            permissions={facilityData?.permissions ?? []}
            onEdit={
              authUser.is_superuser || isOwnAccount ? openEditUser : undefined
            }
          />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
