import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, RotateCcw, Wrench, X } from "lucide-react";
import { Link } from "raviger";
import { Trans, useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
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
import { useDefaultEncounterClass } from "@/hooks/useDefaultEncounterClass";
import useUserPreferences from "@/hooks/useUserPreferences";

import { getPermissions } from "@/common/Permissions";

import {
  AppointmentDuoIcon,
  HeartDuoIcon,
  StethoscopeDuoIcon,
} from "@/CAREUI/icons/CustomIcons";
import {
  DashboardLinkContext,
  processCustomDashboardLinks,
  type DashboardShortcutIcon,
} from "@/Utils/dashboardLinks";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import facilityApi from "@/types/facility/facilityApi";
import careConfig from "@careConfig";

interface FacilityOverviewProps {
  facilityId: string;
}

export function FacilityOverview({ facilityId }: FacilityOverviewProps) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "overview_greeting_morning"
      : hour < 18
        ? "overview_greeting_afternoon"
        : "overview_greeting_evening";
  const { hasPermission } = usePermissions();
  const { customLinks, resetCustomLinks, removeCustomLink } =
    useUserPreferences();
  const { defaultClass: defaultEncounterClass } = useDefaultEncounterClass();

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId },
    }),
  });

  const { canViewAppointments, canListEncounters } = getPermissions(
    hasPermission,
    facilityData?.permissions ?? [],
  );

  // Default shortcuts
  const defaultShortcuts: Array<{
    title: string;
    description: string;
    icon: DashboardShortcutIcon;
    href: string;
    visible: boolean;
  }> = [
    {
      title: t("appointments"),
      description: t("view_appointments"),
      icon: AppointmentDuoIcon,
      href: `/facility/${facilityId}/appointments`,
      visible: canViewAppointments,
    },
    {
      title:
        defaultEncounterClass === "all"
          ? t("all_encounters")
          : t("encounter_class_encounters", {
              encounterClassName: t(
                `encounter_class__${defaultEncounterClass}`,
              ),
            }),
      description: t("view_and_manage_encounters"),
      icon: StethoscopeDuoIcon,
      href: `/facility/${facilityId}/encounters/patients/${defaultEncounterClass}`,
      visible: canListEncounters,
    },
    {
      title: t("services"),
      description: t("view_services"),
      icon: HeartDuoIcon,
      href: `/facility/${facilityId}/services`,
      visible: true,
    },
  ];

  const context: DashboardLinkContext = {
    facilityId,
    userId: user?.id,
    username: user?.username,
  };

  const customDashboardLinks = processCustomDashboardLinks(
    careConfig.customShortcuts,
    context,
  );

  // Combine default and custom dashboard links
  const shortcuts = [...defaultShortcuts, ...customDashboardLinks];
  // Filter pinned links for this facility (or show all if no facilityId specified)
  const pinnedLinks = customLinks.filter(
    (link) => !link.facilityId || link.facilityId === facilityId,
  );

  return (
    <Page
      title={t("overview")}
      hideTitleOnPage
      className="md:px-0 max-w-5xl xl:max-w-10/12 mx-auto"
    >
      <div className="space-y-8">
        {/* Welcome Header */}
        <div
          data-cy="facility-overview-greeting"
          className="relative overflow-hidden rounded-xl border border-inverse-border shadow-inner bg-linear-to-r from-sky-50 to-emerald-100 text-gray-900"
        >
          <img
            src="/images/home-banner.svg"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 size-full select-none object-cover object-right"
          />

          <div className="relative z-10 max-w-xl p-4 md:p-8">
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
            <p className="text-gray-700">{t("welcome_back")}</p>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="">
          <h2 className="text-lg pl-1 font-semibold text-foreground">
            {t("quick_links")}
          </h2>
          <div
            className="grid gap-3 sm:gap-4 mt-1"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, max(14rem, 20%)), 1fr))",
            }}
          >
            {shortcuts
              .filter((shortcut) => shortcut.visible)
              .map((shortcut) => (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="block h-full min-w-0 rounded-lg ring-primary-400 ring-offset-2 transition-all duration-200 hover:ring hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="flex h-full flex-col gap-1.5 overflow-hidden rounded-lg border-0 bg-card p-1 shadow-sm">
                    <CardContent className="flex flex-1 flex-col gap-1.5 p-0">
                      <div className="min-h-25 rounded-t rounded-b-lg bg-muted-background px-3 py-2.5 sm:min-h-28 sm:px-4 sm:py-3">
                        <div className="w-fit">
                          <shortcut.icon className="size-7 sm:size-8" />
                        </div>
                        <CardTitle className="text-sm mt-2 font-semibold text-foreground sm:text-base">
                          {shortcut.title}
                        </CardTitle>
                        <CardDescription className="truncate text-sm font-normal text-soft-foreground">
                          {shortcut.description}
                        </CardDescription>
                      </div>
                      <div className="flex h-7 items-center justify-between gap-1 px-3 py-1 sm:px-4">
                        <span className="min-w-0 truncate text-xs font-medium text-muted-foreground sm:text-sm">
                          {t("go_to_page", { page: shortcut.title })}
                        </span>
                        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground sm:size-4" />
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
              <h2 className="text-base/9 font-semibold text-foreground">
                {t("pinned_links")}
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-soft-foreground transition-all hover:text-muted-foreground focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/pinned-links:opacity-100"
                    aria-label={t("actions")}
                  >
                    <Wrench />
                  </Button>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomLink(link.link)}
                    className="absolute -top-2 -right-2 z-10 size-6 rounded-full bg-muted-background p-0 text-soft-foreground shadow-sm transition-opacity hover:bg-red-100 hover:text-red-600 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                    aria-label={t("remove")}
                  >
                    <X className="size-4" />
                  </Button>
                  <Link
                    href={link.link}
                    className="block h-full rounded-xl ring-primary-400 ring-offset-2 transition-all duration-200 hover:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                  >
                    <Card className="h-full rounded-xl border border-border bg-muted p-1">
                      <CardContent className="flex min-h-17 items-center justify-between gap-2 rounded-lg bg-card p-3 shadow-sm">
                        <div className="min-w-0 space-y-2">
                          {link.description && (
                            <CardDescription className="truncate text-sm font-medium text-soft-foreground">
                              {link.description}
                            </CardDescription>
                          )}
                          <CardTitle className="truncate text-base font-semibold leading-tight text-foreground">
                            {link.title}
                          </CardTitle>
                        </div>
                        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
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
