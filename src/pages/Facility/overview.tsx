import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Box,
  Calendar,
  Database,
  RotateCcw,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Page from "@/components/Common/Page";

import useAuthUser from "@/hooks/useAuthUser";
import useUserPreferences from "@/hooks/useUserPreferences";

import { getPermissions } from "@/common/Permissions";

import {
  DashboardLinkContext,
  processCustomDashboardLinks,
} from "@/Utils/dashboardLinks";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import facilityApi from "@/types/facility/facilityApi";
import careConfig from "@careConfig";

interface FacilityOverviewProps {
  facilityId: string;
}

export function FacilityOverview({ facilityId }: FacilityOverviewProps) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const { hasPermission } = usePermissions();
  const { customLinks, resetCustomLinks, removeCustomLink } =
    useUserPreferences();

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId },
    }),
  });

  const { canViewSchedule, canListEncounters } = getPermissions(
    hasPermission,
    facilityData?.permissions ?? [],
  );

  // Default shortcuts
  const defaultShortcuts = [
    {
      title: t("my_schedules"),
      description: t("manage_my_schedule"),
      icon: Calendar,
      href: `/facility/${facilityId}/users/${user?.username}/availability`,
      visible: canViewSchedule,
    },
    {
      title: t("encounters"),
      description: t("manage_facility_users"),
      icon: Users,
      href: `/facility/${facilityId}/encounters/patients/${careConfig.defaultEncounterType || "all"}`,
      visible: canListEncounters,
    },
    {
      title: t("services"),
      description: t("view_services"),
      icon: Box,
      href: `/facility/${facilityId}/services`,
      visible: true,
    },
  ];

  // Process custom dashboard links from environment
  const iconMap = {
    Calendar,
    Users,
    Box,
    Database,
  };

  const context: DashboardLinkContext = {
    facilityId,
    userId: user?.id,
    username: user?.username,
  };

  const customDashboardLinks = processCustomDashboardLinks(
    careConfig.customShortcuts,
    context,
    iconMap,
  );

  // Combine default and custom dashboard links
  const shortcuts = [...defaultShortcuts, ...customDashboardLinks];
  // Filter pinned links for this facility (or show all if no facilityId specified)
  const pinnedLinks = customLinks.filter(
    (link) => !link.facilityId || link.facilityId === facilityId,
  );

  return (
    <Page title="">
      <div className="container mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="rounded-lg">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                {t("hey_user", {
                  user: [user.prefix, user.first_name]
                    .filter(Boolean)
                    .join(" "),
                })}
              </h1>
              <p className="text-muted-foreground">
                {t("welcome_back_to_hospital_dashboard")}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            {t("quick_actions")}
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {shortcuts
              .filter((shortcut) => shortcut.visible)
              .map((shortcut) => (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="block h-full transition-all duration-200 hover:ring-2 ring-primary-400 rounded-xl ring-offset-2"
                >
                  <Card className="h-full border-0 shadow rounded-xl p-4">
                    <CardContent className="p-0 flex flex-row items-center h-full gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <shortcut.icon className="size-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {shortcut.title}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          {shortcut.description}
                        </CardDescription>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>

        {/* Pinned Links Section */}
        {pinnedLinks.length > 0 && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                {t("pinned_links")}
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-lg hover:bg-muted-background text-muted-foreground hover:text-muted-foreground transition-colors">
                    <Wrench className="size-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={resetCustomLinks}>
                    <RotateCcw className="size-4" />
                    {t("reset_pinned_links")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {pinnedLinks.map((link) => (
                <div
                  key={link.link}
                  className="relative group block h-full transition-all duration-200 hover:ring-2 ring-primary-400 rounded-xl ring-offset-2"
                >
                  <button
                    onClick={() => removeCustomLink(link.link)}
                    className="absolute -top-2 -right-2 z-10 p-1 rounded-full bg-muted-background hover:bg-red-100 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    aria-label={t("remove")}
                  >
                    <X className="size-4" />
                  </button>
                  <Link href={link.link} className="block h-full">
                    <Card className="h-full border border-border shadow-sm rounded-xl p-5">
                      <CardContent className="p-0 flex flex-row items-center justify-between h-full gap-4">
                        <div className="space-y-1">
                          {link.description && (
                            <CardDescription className="text-muted-foreground text-sm">
                              {link.description}
                            </CardDescription>
                          )}
                          <CardTitle className="text-xl font-semibold text-foreground">
                            {link.title}
                          </CardTitle>
                        </div>
                        <ArrowUpRight className="size-5 text-placeholder-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

export default FacilityOverview;
