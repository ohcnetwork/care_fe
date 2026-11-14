import {
  ChevronRight,
  LogOut,
  Search,
  SquarePen,
  User2Icon,
} from "lucide-react";
import { Link } from "raviger";
import { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";

import { useAccessibleRoleOrganizationsList } from "@/hooks/useAccessibleRoleOrganizationsList";
import useAuthUser, { useAuthContext } from "@/hooks/useAuthUser";
import useBreakpoints from "@/hooks/useBreakpoints";

import { formatName } from "@/Utils/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { FacilityBareMinimum } from "@/types/facility/facility";
import { Organization, getOrgLabel } from "@/types/organization/organization";

enum DashboardTabs {
  TAB_FACILITIES = "Facilities",
  TAB_ASSOCIATIONS = "Responsibilities",
  TAB_GOVERNANCE = "Governance",
}

type TabContentProps = {
  tabId: string;
  tabItems: FacilityBareMinimum[] | Organization[];
  description: string;
  renderChild: (item: FacilityBareMinimum | Organization) => React.ReactNode;
  isLoading?: boolean;
};

export default function UserDashboard() {
  const user = useAuthUser();
  const { signOut } = useAuthContext();
  const facilities = user.facilities || [];
  const { t } = useTranslation();

  const organizations = user.organizations || [];
  const governance = organizations.filter((org) => org.org_type === "govt");

  // Fetch accessible role organizations from dedicated API (includes user's role per org)
  const { data: accessibleRoleOrgs, isLoading: isLoadingRoleOrgs } =
    useAccessibleRoleOrganizationsList();
  const responsibilityItems = accessibleRoleOrgs?.results || [];
  // Extract organizations for tab items
  const responsibilities = responsibilityItems.map((item) => item.organization);
  // Map org ID → role name for showing designation on cards
  const roleByOrgId = new Map(
    responsibilityItems
      .filter((item) => item.role)
      .map((item) => [item.organization.id, item.role!.name]),
  );

  const tabsData = [
    { id: DashboardTabs.TAB_FACILITIES, items: facilities },
    { id: DashboardTabs.TAB_ASSOCIATIONS, items: responsibilities },
    { id: DashboardTabs.TAB_GOVERNANCE, items: governance },
  ];

  const availableTabs = tabsData
    .filter(
      (tab) =>
        tab.items.length > 0 ||
        (tab.id === DashboardTabs.TAB_ASSOCIATIONS && isLoadingRoleOrgs),
    )
    .map((tab) => tab.id);

  const [activeTab, setActiveTab] = useState<DashboardTabs | null>(
    availableTabs.length > 0 ? availableTabs[0] : null,
  );

  const isMobile = useBreakpoints({ default: true, sm: false });
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "overview_greeting_morning"
      : hour < 18
        ? "overview_greeting_afternoon"
        : "overview_greeting_evening";

  return (
    <div className="relative isolate">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle,var(--color-primary)_1px,transparent_1px)] bg-size-[16px_16px] opacity-10 mask-[linear-gradient(to_bottom,black_60%,transparent)]"
      />
      <div className="container mx-auto space-y-4 md:space-y-8 max-w-5xl px-4 py-4 md:p-6">
        {/* Welcome Section */}
        <div
          data-cy="dashboard-greeting"
          className="relative overflow-hidden rounded-xl border border-inverse-border inset-shadow-sm bg-linear-to-r from-sky-50 to-emerald-100 text-foreground"
        >
          <img
            src="/images/home-banner.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full select-none object-cover object-right"
          />
          <div className="relative z-10 flex flex-col gap-4 p-4 md:p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col items-center gap-4 sm:flex-row">
              <div className="shrink-0 rounded-md ring-2 ring-white shadow-sm">
                <Avatar
                  name={formatName(user, true)}
                  imageUrl={user.profile_picture_url}
                  className="size-16 md:size-20"
                />
              </div>
              <div className="min-w-0 space-y-2 text-center sm:text-left">
                <h1 className="text-xl/8 font-medium wrap-break-word text-gray-600">
                  <Trans
                    i18nKey={greeting}
                    values={{ name: formatName(user) }}
                    components={{
                      name: <span className="font-semibold text-gray-950" />,
                      wave: <span aria-hidden="true" />,
                    }}
                  />
                </h1>
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:w-auto">
              {user.is_superuser && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-auto min-w-max"
                  asChild
                >
                  <Link
                    href="/admin/questionnaires"
                    className="gap-2 text-inherit flex items-center"
                  >
                    <User2Icon className="size-4" />
                    {t("admin_dashboard")}
                  </Link>
                </Button>
              )}

              {isMobile ? (
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 flex-1"
                    asChild
                  >
                    <Link href={`/users/${user.username}`}>
                      <SquarePen className="size-4" />
                      {t("edit_profile")}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 flex-1"
                    onClick={signOut}
                  >
                    <LogOut className="size-4" />
                    {t("sign_out")}
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-auto">
                      <CareIcon icon="l-ellipsis-v" className="text-inherit" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer flex items-center gap-2 text-xs w-full"
                    >
                      <Link
                        href={`/users/${user.username}`}
                        className="flex items-center gap-2 w-full text-inherit"
                      >
                        <SquarePen className="size-4" />
                        {t("edit_profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
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
        </div>

        {availableTabs.length > 0 && (
          <Tabs
            value={activeTab?.toLowerCase() ?? ""}
            onValueChange={(value) => {
              const tab = availableTabs.find(
                (item) => item.toLowerCase() === value,
              );
              if (tab) setActiveTab(tab);
            }}
            className="w-full"
          >
            <div className="max-w-full overflow-x-auto pb-1">
              <TabsList
                variant="line"
                className="w-full justify-start border-b border-border"
                aria-label={t("dashboard_sections")}
              >
                {availableTabs.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab.toLowerCase()}
                    id={`${tab.toLowerCase()}-tab`}
                    aria-controls={`${tab.toLowerCase()}-panel`}
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tabs Content */}
            <div>
              {activeTab === DashboardTabs.TAB_FACILITIES && (
                <TabContent
                  tabId="facilities-panel"
                  tabItems={facilities}
                  description={t("dashboard_tab_facilities")}
                  renderChild={(facility) => (
                    <FacilityCard key={facility.id} facility={facility} />
                  )}
                />
              )}

              {activeTab === DashboardTabs.TAB_ASSOCIATIONS && (
                <TabContent
                  tabId="responsibilities-panel"
                  tabItems={responsibilities}
                  description={t("dashboard_tab_associations")}
                  isLoading={isLoadingRoleOrgs}
                  renderChild={(association) => {
                    const roleName = roleByOrgId.get(association.id);
                    return (
                      <Link
                        key={association.id}
                        href={`/responsibilities/${association.id}`}
                        className="h-full"
                      >
                        <Card className="h-full group/dashboard-card rounded-2xl border-border bg-card shadow-sm ring-1 ring-foreground/5 transition-all hover:border-primary/40 hover:shadow-lg">
                          <CardContent className="flex h-full items-center gap-3 p-3 md:p-4">
                            <Avatar
                              name={association.name}
                              className="size-12 md:size-14"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate text-sm md:text-base">
                                {association.name}
                              </h3>
                              {roleName && (
                                <p className="text-xs md:text-sm text-muted-foreground truncate">
                                  {roleName}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="size-4 md:size-5 text-muted-foreground transition-transform group-hover/dashboard-card:translate-x-0.5 group-hover/dashboard-card:text-primary" />
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  }}
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
                      <Card className="group/dashboard-card rounded-2xl border-border bg-card shadow-sm ring-1 ring-foreground/5 transition-all hover:border-primary/40 hover:shadow-lg">
                        <CardContent className="flex items-center gap-3 p-3 md:p-4">
                          <Avatar
                            name={governanceOrg.name}
                            className="size-12 md:size-14"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate text-sm md:text-base">
                              {governanceOrg.name}
                            </h3>
                            <p className="text-xs md:text-sm text-muted-foreground truncate">
                              {"org_type" in governanceOrg &&
                                getOrgLabel(
                                  governanceOrg.org_type,
                                  governanceOrg.metadata,
                                )}
                            </p>
                          </div>
                          <ChevronRight className="size-4 md:size-5 text-muted-foreground transition-transform group-hover/dashboard-card:translate-x-0.5 group-hover/dashboard-card:text-primary" />
                        </CardContent>
                      </Card>
                    </Link>
                  )}
                />
              )}
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function FacilityCard({ facility }: { facility: FacilityBareMinimum }) {
  const { t } = useTranslation();
  return (
    <Link href={`/facility/${facility.id}/overview`}>
      <Card className="group/dashboard-card rounded-2xl border-border bg-card shadow-sm ring-1 ring-foreground/5 transition-all hover:border-primary/40 hover:shadow-lg">
        <CardContent className="flex items-center gap-3 p-3 md:p-4">
          <Avatar name={facility.name} className="size-12 md:size-14" />
          <div className="min-w-0 flex-1">
            <TooltipComponent content={facility.name}>
              <h3 className="font-medium truncate text-sm md:text-base">
                {facility.name}
              </h3>
            </TooltipComponent>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {t("view_facility_details")}
            </p>
          </div>
          <ChevronRight className="size-4 md:size-5 text-muted-foreground transition-transform group-hover/dashboard-card:translate-x-0.5 group-hover/dashboard-card:text-primary" />
        </CardContent>
      </Card>
    </Link>
  );
}

const TabContent = ({
  tabId,
  tabItems,
  description,
  renderChild,
  isLoading,
}: TabContentProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const filteredItems = useMemo(() => {
    if (tabItems.length <= 1) return tabItems;
    const query = search.trim().toLowerCase();
    return tabItems.filter((item) => item.name.toLowerCase().includes(query));
  }, [tabItems, search]);
  return (
    <TabsContent
      value={tabId.replace(/-panel$/, "")}
      className="space-y-3 md:space-y-4"
      id={tabId}
    >
      <p className="px-1 text-sm font-normal text-soft-foreground">
        {description}
      </p>
      {tabItems.length > 1 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder={t("search")}
            aria-label={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="group/dashboard-card rounded-2xl border-border bg-card shadow-sm ring-1 ring-foreground/5 transition-all hover:border-primary/40 hover:shadow-lg"
            >
              <CardContent className="flex items-center gap-3 p-3 md:p-4">
                <div className="size-12 md:size-14 rounded-md bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5 text-primary" />}
          title={t("no_results_found")}
          className="border-solid"
        />
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item: FacilityBareMinimum | Organization) => {
            return renderChild(item);
          })}
        </div>
      )}
    </TabsContent>
  );
};
