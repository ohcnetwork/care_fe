import { ChevronRight, LogOut, SquarePen, User2Icon } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar } from "@/components/Common/Avatar";
import { UserFacilityModel } from "@/components/Users/models";

import useAuthUser, { useAuthContext } from "@/hooks/useAuthUser";
import useBreakpoints from "@/hooks/useBreakpoints";

import { formatName } from "@/Utils/utils";
import { Organization, getOrgLabel } from "@/types/organization/organization";

enum DashboardTabs {
  TAB_FACILITIES = "Facilities",
  TAB_ASSOCIATIONS = "Associations",
  TAB_GOVERNANCE = "Governance",
}

type TabContentProps = {
  tabId: string;
  tabItems: UserFacilityModel[] | Organization[];
  description: string;
  renderChild: (item: UserFacilityModel | Organization) => JSX.Element;
};

export default function UserDashboard() {
  const user = useAuthUser();
  const { signOut } = useAuthContext();
  const facilities = user.facilities || [];
  const { t } = useTranslation();

  const organizations = user.organizations || [];
  const associations = organizations.filter((org) => org.org_type === "role");
  const governance = organizations.filter((org) => org.org_type === "govt");

  const tabsData = [
    { id: DashboardTabs.TAB_FACILITIES, items: facilities },
    { id: DashboardTabs.TAB_ASSOCIATIONS, items: associations },
    { id: DashboardTabs.TAB_GOVERNANCE, items: governance },
  ];

  const availableTabs = tabsData
    .filter((tab) => tab.items.length > 0)
    .map((tab) => tab.id);

  const [activeTab, setActiveTab] = useState<DashboardTabs | null>(
    availableTabs.length > 0 ? availableTabs[0] : null,
  );

  const isMobile = useBreakpoints({ default: true, sm: false });

  return (
    <div className="container mx-auto space-y-4 md:space-y-8 max-w-5xl px-4 py-4 md:p-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center rounded-lg w-full justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Avatar
            name={formatName(user)}
            imageUrl={user.read_profile_picture_url}
            className="h-14 w-14 md:h-16 md:w-16"
          />
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-xl md:text-2xl font-bold">
              {t("hey_user", {
                user: [user.prefix, user.first_name].filter(Boolean).join(" "),
              })}
            </h1>
            <p className="text-sm md:text-base text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {user.is_superuser && (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link
                href="/admin/questionnaire"
                className="gap-2 text-inherit flex items-center"
              >
                <User2Icon className="size-4" />
                {t("admin_dashboard")}
              </Link>
            </Button>
          )}

          {isMobile ? (
            <>
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <Link href={`/users/${user.username}`}>
                  <SquarePen className="size-4" />
                  {t("edit_profile")}
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={signOut}
                data-cy="sign-out-button"
              >
                <LogOut className="size-4" />
                {t("sign_out")}
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-cy="user-dashboard-menu-trigger"
                  variant="outline"
                  size="sm"
                  className="px-2 w-full sm:w-auto"
                >
                  <CareIcon icon="l-ellipsis-v" className="text-inherit" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem className="cursor-pointer flex items-center gap-2 text-xs w-full">
                  <Link
                    href={`/users/${user.username}`}
                    className="flex items-center gap-2 w-full text-inherit"
                  >
                    <SquarePen className="size-4" />
                    {t("edit_profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-cy="sign-out-button"
                  className="cursor-pointer flex items-center gap-2 text-xs w-full"
                  onClick={signOut}
                >
                  <LogOut className="size-4" />
                  {t("sign_out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {availableTabs.length > 0 && (
        <div className="w-full">
          <div
            className="flex border-b border-gray-200"
            role="tablist"
            data-cy="dashboard-sections"
            aria-label="Dashboard Sections"
          >
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                role="tab"
                id={`${tab.toLowerCase()}-tab`}
                aria-selected={activeTab === tab}
                aria-controls={`${tab.toLowerCase()}-panel`}
                className={`px-4 py-2 text-sm md:text-base font-medium transition-all duration-75 ${
                  activeTab === tab
                    ? "border-b-2 border-green-600 text-green-700"
                    : "text-gray-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tabs Content */}
          <div className="mt-4">
            {activeTab === DashboardTabs.TAB_FACILITIES && (
              <TabContent
                tabId="facilities-panel"
                tabItems={facilities}
                description={t("dashboard_tab_facilities")}
                renderChild={(facility) => {
                  return (
                    <Link
                      key={facility.id}
                      href={`/facility/${facility.id}/overview`}
                    >
                      <Card className="transition-all hover:shadow-md hover:border-primary/20 border-gray-200">
                        <CardContent className="flex items-center gap-3 p-3 md:p-4">
                          <Avatar
                            name={facility.name}
                            className="size-12 md:size-14"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate text-sm md:text-base">
                              {facility.name}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-500 truncate">
                              {t("view_facility_details")}
                            </p>
                          </div>
                          <ChevronRight className="size-4 md:size-5 text-gray-500" />
                        </CardContent>
                      </Card>
                    </Link>
                  );
                }}
              />
            )}

            {activeTab === DashboardTabs.TAB_ASSOCIATIONS && (
              <TabContent
                tabId="associations-panel"
                tabItems={associations}
                description={t("dashboard_tab_associations")}
                renderChild={(association) => (
                  <Link
                    key={association.id}
                    href={`/organization/${association.id}`}
                  >
                    <Card className="transition-all hover:shadow-md hover:border-primary/20 border-gray-200">
                      <CardContent className="flex items-center gap-3 p-3 md:p-4">
                        <Avatar
                          name={association.name}
                          className="size-12 md:size-14"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate text-sm md:text-base">
                            {association.name}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-500 truncate">
                            {"org_type" in association &&
                              getOrgLabel(
                                association.org_type,
                                association.metadata,
                              )}
                          </p>
                        </div>
                        <ChevronRight className="size-4 md:size-5 text-gray-500" />
                      </CardContent>
                    </Card>
                  </Link>
                )}
              />
            )}

            {activeTab === DashboardTabs.TAB_GOVERNANCE && (
              <TabContent
                tabId="governance-panel"
                tabItems={governance}
                description={t("dashboard_tab_governance")}
                renderChild={(governanceOrg) => (
                  <Link
                    key={governanceOrg.id}
                    href={`/organization/${governanceOrg.id}`}
                  >
                    <Card className="transition-all hover:shadow-md hover:border-primary/20 border-gray-200">
                      <CardContent className="flex items-center gap-3 p-3 md:p-4">
                        <Avatar
                          name={governanceOrg.name}
                          className="size-12 md:size-14"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate text-sm md:text-base">
                            {governanceOrg.name}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-500 truncate">
                            {"org_type" in governanceOrg &&
                              getOrgLabel(
                                governanceOrg.org_type,
                                governanceOrg.metadata,
                              )}
                          </p>
                        </div>
                        <ChevronRight className="size-4 md:size-5 text-gray-500" />
                      </CardContent>
                    </Card>
                  </Link>
                )}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const TabContent = ({
  tabId,
  tabItems,
  description,
  renderChild,
}: TabContentProps) => {
  return (
    <section
      className="space-y-3 md:space-y-4"
      id={tabId}
      role="tabpanel"
      aria-labelledby={tabId}
    >
      <p className="text-sm text-gray-800 font-normal px-1">{description}</p>

      <div
        className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        data-cy={`${tabId}-list`}
      >
        {tabItems.map((item: UserFacilityModel | Organization) => {
          return renderChild(item);
        })}
      </div>
    </section>
  );
};
