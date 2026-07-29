import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Box,
  Calendar,
  ChartLine,
  Database,
  HeartPulse,
  RotateCcw,
  Stethoscope,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Link } from "raviger";
import { Trans, useTranslation } from "react-i18next";

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
import { formatName } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import { useCareApps } from "@/hooks/useCareApps";
import facilityApi from "@/types/facility/facilityApi";
import careConfig from "@careConfig";
import { useMemo } from "react";

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

  const careApps = useCareApps();
  const isAnalyticsEnabled = useMemo(
    () =>
      careApps.some(
        (app) => !app.isLoading && app.plugin === "care_analytics_fe",
      ),
    [careApps],
  );

  const { canViewAppointments, canListEncounters } = getPermissions(
    hasPermission,
    facilityData?.permissions ?? [],
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  };

  // Default shortcuts
  const defaultShortcuts = [
    {
      title: t("appointments"),
      description: t("view_appointments"),
      icon: Calendar,
      href: `/facility/${facilityId}/appointments`,
      visible: canViewAppointments,
    },
    {
      title: t("encounters"),
      description: t("manage_facility_users"),
      icon: Stethoscope,
      href: `/facility/${facilityId}/encounters/patients/${careConfig.defaultEncounterType || "all"}`,
      visible: canListEncounters,
    },
    {
      title: t("services"),
      description: t("view_services"),
      icon: HeartPulse,
      href: `/facility/${facilityId}/services`,
      visible: true,
    },
    {
      title: t("analytics"),
      description: t("view_analytics"),
      icon: ChartLine,
      href: `/facility/${facilityId}/analytics`,
      visible: isAnalyticsEnabled,
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
        <div className="relative border-3 border-white overflow-hidden text-gray-900 rounded-xl bg-[linear-gradient(to_right,#F9FAFB_0%,#F0F0E6_60%)] sm:bg-[linear-gradient(to_right,#F9FAFB_0%, #F9FAFB_70%, #F0F0E6_100%)] lg:bg-[linear-gradient(to_right,#F5F8FF_0%,#F9FAFB_50%,#F0F0E6_100%)]">
          <div
            className="absolute w-full h-full bg-right bg-no-repeat bg-contain rounded-lg mix-blend-darken -right-8 md:right-0"
            style={{ backgroundImage: "url('/images/home-banner-icon.webp')" }}
            aria-hidden="true"
          />
          <div
            className="absolute left-0 w-full h-full bg-left bg-no-repeat bg-contain mix-blend-darken"
            style={{ backgroundImage: "url('/images/home-banner-sun.png')" }}
            aria-hidden="true"
          />

          <div className="relative z-10 p-4 md:p-8 max-w-[250px] md:max-w-[280px] lg:max-w-lg">
            <h1 className="mb-2 font-bold text-gray-900 text-2xl wrap-break-word">
              <Trans
                i18nKey="greet_user"
                values={{
                  time_of_day: getGreeting(),
                  user: formatName(user),
                }}
                components={{
                  1: <span className="text-gray-700 font-semibold" />,
                  2: <span className="text-gray-900 font-bold" />,
                }}
              />
            </h1>
            <p>{t("welcome_back")}</p>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            {t("quick_links")}
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {shortcuts
              .filter((shortcut) => shortcut.visible)
              .map((shortcut) => (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="block h-full transition-all duration-200 hover:ring-2 ring-primary-400 rounded-xl ring-offset-2"
                >
                  <Card className="h-full overflow-hidden border-0 shadow rounded-xl">
                    <CardContent className="flex flex-col h-full p-1">
                      <div className="p-6 space-y-3 bg-gray-100 rounded-xl">
                        <div className="p-3 rounded-lg bg-primary/10 w-fit">
                          <shortcut.icon className="size-6 text-primary" />
                        </div>
                        <CardTitle className="m-0 text-lg">
                          {shortcut.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                          {shortcut.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center justify-between p-4">
                        <span className="text-sm font-medium text-gray-700">
                          {t("go_to")} {shortcut.title}
                        </span>
                        <ArrowUpRight className="text-gray-400 size-4" />
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
              <h2 className="text-xl font-semibold text-gray-900">
                {t("pinned_links")}
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
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
                    className="absolute -top-2 -right-2 z-10 p-1 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    aria-label={t("remove")}
                  >
                    <X className="size-4" />
                  </button>
                  <Link href={link.link} className="block h-full">
                    <Card className="h-full border border-gray-200 shadow-sm rounded-xl p-5">
                      <CardContent className="p-0 flex flex-row items-center justify-between h-full gap-4">
                        <div className="space-y-1">
                          {link.description && (
                            <CardDescription className="text-gray-500 text-sm">
                              {link.description}
                            </CardDescription>
                          )}
                          <CardTitle className="text-xl font-semibold text-gray-900">
                            {link.title}
                          </CardTitle>
                        </div>
                        <ArrowUpRight className="size-5 text-gray-400 shrink-0" />
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
