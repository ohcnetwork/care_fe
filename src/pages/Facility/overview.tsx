import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Box,
  Calendar,
  Database,
  LucideIcon,
  RotateCcw,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Link } from "raviger";
import { type ComponentType, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";

import {
  CalendarDuoIcon,
  ChartDuoIcon,
  HeartDuoIcon,
  StethoscopeDuoIcon,
} from "@/CAREUI/icons/CustomIcons";

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

interface FacilityOverviewProps {
  facilityId: string;
}

type ShortcutIcon = LucideIcon | ComponentType<{ className?: string }>;

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
    if (hour < 12) return t("morning");
    if (hour < 18) return t("afternoon");
    return t("evening");
  };

  // Default shortcuts
  const defaultShortcuts: Array<{
    title: string;
    description: string;
    icon: ShortcutIcon;
    href: string;
    visible: boolean;
  }> = [
    {
      title: t("appointments"),
      description: t("view_appointments"),
      icon: CalendarDuoIcon,
      href: `/facility/${facilityId}/appointments`,
      visible: canViewAppointments,
    },
    {
      title: t("all_encounters"),
      description: t("view_and_manage_encounters"),
      icon: StethoscopeDuoIcon,
      href: `/facility/${facilityId}/encounters/patients/${careConfig.defaultEncounterType || "all"}`,
      visible: canListEncounters,
    },
    {
      title: t("services"),
      description: t("view_services"),
      icon: HeartDuoIcon,
      href: `/facility/${facilityId}/services`,
      visible: true,
    },
    {
      title: t("analytics"),
      description: t("view_analytics"),
      icon: ChartDuoIcon,
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
      <div className="container mx-auto space-y-8 max-w-6xl">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(to_right,#F9FAFB_0%,#F0F0E6_60%)] pr-36 text-gray-900 sm:bg-[linear-gradient(to_right,#F5F8FF_0%,#F9FAFB_45%,#F0F0E6_100%)] sm:pr-40 md:pr-48">
          <div
            className="absolute -right-8 size-full rounded-lg bg-contain bg-right bg-no-repeat mix-blend-darken md:right-0"
            style={{ backgroundImage: "url('/images/home-banner-icon.webp')" }}
            aria-hidden="true"
          />
          <div
            className="absolute left-0 size-full bg-contain bg-left bg-no-repeat mix-blend-darken"
            style={{ backgroundImage: "url('/images/home-banner-sun.png')" }}
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-xl p-4 md:p-8">
            <h1 className="mb-2 text-xl/8 font-medium wrap-break-word text-gray-600">
              <Trans
                i18nKey="greet_user"
                values={{
                  time_of_day: getGreeting(),
                  user: formatName(user),
                }}
                components={{
                  1: <span className="text-xl/8 font-medium text-gray-600" />,
                  2: <span className="text-xl/8 font-semibold text-gray-950" />,
                }}
              />
            </h1>
            <p className="text-gray-700">{t("welcome_back")}</p>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="">
          <h2 className="text-base/9 font-semibold text-gray-950">
            {t("quick_links")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {shortcuts
              .filter((shortcut) => shortcut.visible)
              .map((shortcut) => (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="block h-full min-w-0 rounded-lg ring-primary-400 ring-offset-2 transition-all duration-200 hover:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                >
                  <Card className="flex h-full flex-col gap-[5px] overflow-hidden rounded-lg border-0 bg-white p-1 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.10),0_1px_2px_0_rgb(0_0_0_/_0.06)]">
                    <CardContent className="flex flex-1 flex-col gap-[5px] p-0">
                      <div className="min-h-[100px] space-y-2 rounded-t rounded-b-lg bg-gray-100 px-3 py-2.5 sm:min-h-[115px] sm:space-y-3 sm:px-4 sm:py-3">
                        <div className="w-fit">
                          <shortcut.icon className="size-7 text-primary sm:size-8" />
                        </div>
                        <CardTitle className="m-0 text-sm leading-6 font-semibold text-gray-950 sm:text-base/9">
                          {shortcut.title}
                        </CardTitle>
                        <CardDescription className="truncate text-[11px] leading-4 font-normal text-gray-700 sm:text-xs sm:leading-normal">
                          {shortcut.description}
                        </CardDescription>
                      </div>
                      <div className="flex h-7 items-center justify-between gap-1 px-3 py-1 sm:px-4">
                        <span className="min-w-0 truncate text-xs font-medium text-gray-700 sm:text-sm">
                          {t("go_to")} {shortcut.title}
                        </span>
                        <ArrowUpRight className="size-3.5 shrink-0 text-gray-700 sm:size-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>

        {/* Pinned Links Section */}
        {pinnedLinks.length > 0 && (
          <div className="group/pinned-links">
            <div className="flex items-center justify-between">
              <h2 className="text-base/9 font-semibold text-gray-950">
                {t("pinned_links")}
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all opacity-0 group-hover/pinned-links:opacity-100 focus-visible:opacity-100">
                    <Wrench className="size-4" />
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
                <div key={link.link} className="relative group block h-full">
                  <button
                    onClick={() => removeCustomLink(link.link)}
                    className="absolute -top-2 -right-2 z-10 p-1 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    aria-label={t("remove")}
                  >
                    <X className="size-4" />
                  </button>
                  <Link
                    href={link.link}
                    className="block h-full rounded-xl ring-primary-400 ring-offset-2 transition-all duration-200 hover:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                  >
                    <Card className="h-full rounded-xl border border-gray-200 bg-gray-100 p-1">
                      <CardContent className="flex min-h-[68px] items-center justify-between gap-2 rounded-lg bg-white p-3 shadow-[0_1px_2px_0_rgb(0_0_0_/_0.10),0_1px_1px_0_rgb(0_0_0_/_0.06)]">
                        <div className="min-w-0 space-y-2">
                          {link.description && (
                            <CardDescription className="truncate text-sm font-medium text-gray-500">
                              {link.description}
                            </CardDescription>
                          )}
                          <CardTitle className="truncate text-base font-semibold leading-tight text-gray-950">
                            {link.title}
                          </CardTitle>
                        </div>
                        <ArrowUpRight className="size-4 shrink-0 text-gray-600" />
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
