import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Box,
  Calendar,
  ChartLine,
  HeartPulse,
  Stethoscope,
  Users,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import Page from "@/components/Common/Page";

import useAuthUser from "@/hooks/useAuthUser";

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
      href: `/facility/${facilityId}/users/${user?.username}/availability`,
      visible: canViewSchedule,
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
      visible: true,
    },
  ];

  // Process custom dashboard links from environment
  const iconMap = {
    Calendar,
    Users,
    Box,
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

  return (
    <Page title="">
      <div className="container mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="relative rounded-lg overflow-hidden text-gray-900">
          <div
            className="absolute inset-0 bg-cover bg-center rounded-lg"
            style={{ backgroundImage: "url('/images/home_banner.svg')" }}
            aria-hidden="true"
            role="img"
          />
          <div className="relative z-10 p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {t("hey_user", {
                time_of_day: getGreeting(),
                user: [user.prefix, user.first_name].filter(Boolean).join(" "),
              })}
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
                  <Card className="h-full border-0 shadow rounded-xl overflow-hidden">
                    <CardContent className="p-1 flex flex-col h-full">
                      <div className="p-6 bg-gray-100 rounded-xl space-y-3">
                        <div className="p-3 rounded-lg bg-primary/10 w-fit">
                          <shortcut.icon className="size-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg m-0">
                          {shortcut.title}
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                          {shortcut.description}
                        </CardDescription>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {t("go_to")} {shortcut.title}
                        </span>
                        <ArrowUpRight className="size-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </Page>
  );
}

export default FacilityOverview;
