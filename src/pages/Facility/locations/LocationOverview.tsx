import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bed,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FilePlus2,
  Package,
  Pill,
} from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { TagBadges } from "@/components/Tags/TagBadges";

import query from "@/Utils/request/query";
import { LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import { LocationFormPicker } from "./components/LocationFormPicker";
import LocationPage from "./components/LocationPage";

interface LocationOverviewProps {
  facilityId: string;
  locationId: string;
}

export function LocationOverview({
  facilityId,
  locationId,
}: LocationOverviewProps) {
  const { t } = useTranslation();
  const baseUrl = `/facility/${facilityId}/locations/${locationId}`;
  const {
    data: location,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
  });

  const linkGroups = [
    {
      title: t("patient_care"),
      icon: Bed,
      links: [
        { label: t("beds"), path: "/beds" },
        { label: t("service_requests"), path: "/service_requests" },
      ],
    },
    {
      title: t("pharmacy"),
      icon: Pill,
      links: [
        { label: t("prescription_queue"), path: "/medication_requests" },
        { label: t("dispense"), path: "/medication_dispense" },
        { label: t("medication_return"), path: "/medication_return" },
      ],
    },
    {
      title: t("inventory"),
      icon: Package,
      links: [
        { label: t("items"), path: "/inventory/summary" },
        { label: t("to_receive"), path: "/inventory/internal/receive/" },
        { label: t("to_dispatch"), path: "/inventory/internal/dispatch/" },
        {
          label: t("purchase_orders"),
          path: "/inventory/external/orders/outgoing",
        },
        {
          label: t("purchase_deliveries"),
          path: "/inventory/external/deliveries/incoming",
        },
      ],
    },
    {
      title: t("scheduling"),
      icon: CalendarDays,
      links: [
        { label: t("schedule"), path: "/schedule" },
        { label: t("appointments"), path: "/appointments" },
        { label: t("queues"), path: "/queues" },
      ],
    },
  ];

  const LocationIcon = location && LocationTypeIcons[location.form];

  return (
    <LocationPage title={t("overview")}>
      <div className="space-y-6" data-cy="location-overview-page">
        <section
          aria-label={t("location_details")}
          className="rounded-[10px] border border-neutral-200 bg-white p-4 shadow-xs"
        >
          {isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-5 w-32" />
            </div>
          ) : isError || !location ? (
            <div
              className="flex flex-wrap items-center justify-between gap-3"
              role="alert"
            >
              <p className="text-sm text-neutral-600">
                {t("location_load_error")}
              </p>
              <Button
                variant="outline"
                className="h-12 border-neutral-400 text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
                onClick={() => refetch()}
              >
                {t("try_again")}
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              {LocationIcon && (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                  <LocationIcon className="size-5" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-xl font-semibold text-neutral-950">
                    {location.name}
                  </h2>
                  <Badge
                    variant="outline"
                    size="xs"
                    className="h-5 rounded-sm border-neutral-400/40 px-2 py-0 text-neutral-700"
                  >
                    {t(`location_form__${location.form}`)}
                  </Badge>
                  <Badge
                    variant={
                      location.status === "active" ? "green" : "secondary"
                    }
                    size="xs"
                    className={
                      location.status === "active"
                        ? "h-5 rounded-sm border-green-500/40 px-2 py-0"
                        : "h-5 rounded-sm border-neutral-400/40 bg-neutral-100 px-2 py-0 text-neutral-700"
                    }
                  >
                    {t(location.status)}
                  </Badge>
                </div>
                {location.description && (
                  <p className="max-w-3xl break-words text-sm text-neutral-600">
                    {location.description}
                  </p>
                )}
                <TagBadges tags={location.tags ?? []} size="xs" />
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="location-forms-heading" className="space-y-3">
          <h2 id="location-forms-heading" className="text-lg font-semibold">
            {t("forms")}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <LocationFormPicker
              facilityId={facilityId}
              locationId={locationId}
              disabled={!location || isError}
              trigger={
                <button
                  type="button"
                  disabled={!location || isError}
                  className="group flex items-center gap-4 rounded-[10px] border border-neutral-200 bg-white p-4 shadow-xs text-left transition-colors hover:bg-neutral-100/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:pointer-events-none disabled:opacity-50"
                >
                  <FilePlus2
                    className="size-5 shrink-0 text-neutral-700"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-neutral-950">
                      {t("submit_forms")}
                    </span>
                    <span className="mt-1 block text-sm text-neutral-600">
                      {t("location_forms_description")}
                    </span>
                  </span>
                  <ChevronDown
                    className="size-4 shrink-0 text-neutral-400 group-hover:text-neutral-700"
                    aria-hidden="true"
                  />
                </button>
              }
            />
            <Link
              basePath="/"
              href={`${baseUrl}/responses`}
              className="group flex items-center gap-4 rounded-[10px] border border-neutral-200 bg-white p-4 shadow-xs transition-colors hover:bg-neutral-100/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <ClipboardList
                className="size-5 shrink-0 text-neutral-700"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-950">
                  {t("responses")}
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {t("location_responses_description")}
                </p>
              </div>
              <ArrowRight
                className="size-4 shrink-0 text-neutral-400 group-hover:text-neutral-700"
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="location-quick-links-heading"
          className="space-y-3"
        >
          <h2
            id="location-quick-links-heading"
            className="text-lg font-semibold"
          >
            {t("quick_links")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {linkGroups.map(({ title, icon: Icon, links }) => (
              <div
                key={title}
                className="rounded-[10px] border border-neutral-200 bg-white shadow-xs"
              >
                <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
                  <Icon
                    className="size-4 text-neutral-500"
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-semibold text-neutral-950">
                    {title}
                  </h3>
                </div>
                <ul className="p-2">
                  {links.map(({ label, path }) => (
                    <li key={path}>
                      <Link
                        basePath="/"
                        href={`${baseUrl}${path}`}
                        className="group flex min-h-12 md:min-h-10 items-center justify-between gap-3 rounded-md px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-100/50 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                      >
                        {label}
                        <ArrowRight
                          className="size-4 shrink-0 text-neutral-400 group-hover:text-neutral-700"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </LocationPage>
  );
}
