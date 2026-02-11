import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import { pharmacyDispenseServiceAtom } from "@/atoms/pharmacy";
import BackButton from "@/components/Common/BackButton";
import { InternalType } from "@/types/healthcareService/healthcareService";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";
import { useAtom } from "jotai";
import { ArrowLeft, Calendar, CalendarDays, Logs } from "lucide-react";

function LocationCard({
  location,
  facilityId,
  serviceType,
  serviceId,
}: {
  location: { id: string; name: string; description?: string };
  facilityId: string;
  serviceType: InternalType | undefined;
  serviceId: string;
}) {
  const { t } = useTranslation();
  const [, setPharmacyDispenseService] = useAtom(
    pharmacyDispenseServiceAtom(facilityId),
  );
  const getButtonTextAndLink = (
    facilityId: string,
    locationId: string,
    service_type: InternalType | undefined,
  ) => {
    switch (service_type) {
      case InternalType.pharmacy:
        return {
          text: t("view_prescriptions"),
          link: `/facility/${facilityId}/locations/${locationId}/medication_requests`,
          onClick: () => {
            setPharmacyDispenseService({ locationId, serviceId });
          },
        };
      case InternalType.lab:
        return {
          text: t("view_requests"),
          link: `/facility/${facilityId}/locations/${locationId}/service_requests`,
        };
      default:
        return {
          text: t("view_appointments"),
          link: `/facility/${facilityId}/locations/${locationId}/appointments`,
        };
    }
  };

  const { text, link, onClick } = getButtonTextAndLink(
    facilityId,
    location.id,
    serviceType,
  );

  return (
    <Link href={link} basePath="/" className="block" onClick={onClick}>
      <Card className="transition-all duration-200 hover:border-primary/50 hover:shadow-sm rounded-md">
        <CardContent className="flex items-start gap-3 py-3 px-4">
          <div className="shrink-0 relative size-10 rounded-sm flex p-4 items-center justify-center">
            <ColoredIndicator
              id={location.id}
              className="absolute inset-0 rounded-sm opacity-20"
            />
            <CareIcon icon="l-flask" className="size-6 relative z-10" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate text-gray-900 text-base">
                {location.name}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                {location.description}
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto px-3 text-xs border rounded-md bg-white py-2 flex items-center justify-center gap-1 text-gray-700">
              {text}
              <CareIcon icon="l-arrow-right" className="size-3 ml-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HealthcareServiceShow({
  facilityId,
  serviceId,
}: {
  facilityId: string;
  serviceId: string;
}) {
  const { t } = useTranslation();

  const { data: service, isLoading } = useQuery({
    queryKey: ["healthcareService", serviceId],
    queryFn: query(healthcareServiceApi.retrieveHealthcareService, {
      pathParams: {
        facilityId,
        healthcareServiceId: serviceId,
      },
    }),
  });

  return (
    <div className="container px-4 mx-auto max-w-4xl space-y-6">
      <BackButton to={`/facility/${facilityId}/services`}>
        <ArrowLeft />
        <span>{t("back_to_services")}</span>
      </BackButton>

      <div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              title: t("schedule"),
              description: t("schedule_information"),
              icon: Calendar,
              href: `/schedule`,
            },
            {
              title: t("appointments"),
              description: t("view_appointments"),
              icon: CalendarDays,
              href: `/appointments`,
            },
            {
              title: t("queues"),
              description: t("manage_token_queues_for_facility"),
              icon: Logs,
              href: `/queues`,
            },
          ].map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="block h-full transition-all duration-200 hover:ring-2 ring-primary-400 rounded-lg ring-offset-2"
            >
              <Card className="h-full border-0 shadow rounded-lg p-3">
                <CardContent className="p-0 flex flex-row items-center h-full gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <shortcut.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {shortcut.title}
                    </CardTitle>
                    <CardDescription className="text-gray-500 text-xs">
                      {shortcut.description}
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isLoading
            ? t("service_details")
            : service?.name || t("service_details")}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {t("accurate_diagnostic_tests")}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("available_locations")}
        </h2>

        <div className="space-y-2">
          {isLoading ? (
            <CardListSkeleton count={4} />
          ) : !service ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <CareIcon
                  icon="l-folder-open"
                  className="size-6 text-primary"
                />
              </div>
              <p className="text-lg font-semibold mb-1">
                {t("service_not_found")}
              </p>
              <BackButton>{t("back_to_services")}</BackButton>
            </Card>
          ) : service.locations.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <CareIcon icon="l-map-marker" className="size-6 text-primary" />
              </div>
              <p className="text-lg font-semibold mb-1">
                {t("no_locations_available")}
              </p>
            </Card>
          ) : (
            service.locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                facilityId={facilityId}
                serviceType={service.internal_type}
                serviceId={serviceId}
              />
            ))
          )}
        </div>
      </div>

      {/* Managing Organization Section */}
      {!isLoading && service?.managing_organization && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("managing_organization")}
          </h2>
          <Card className="transition-all duration-200 rounded-md">
            <CardContent className="flex items-start gap-3 py-3 px-4">
              <div className="shrink-0 relative size-10 rounded-sm flex p-4 items-center justify-center">
                <ColoredIndicator
                  id={service.managing_organization.id}
                  className="absolute inset-0 rounded-sm opacity-20"
                />
                <CareIcon icon="l-building" className="size-6 relative z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate text-gray-900 text-base">
                  {service.managing_organization.name}
                </h3>
                {service.managing_organization.description && (
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                    {service.managing_organization.description}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <CareIcon icon="l-tag" className="size-3" />
                  <span>{t("organization")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
