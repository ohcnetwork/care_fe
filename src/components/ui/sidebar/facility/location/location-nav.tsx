import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import query from "@/Utils/request/query";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { InternalType } from "@/types/healthcareService/healthcareService";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

export function LocationNav() {
  const { t } = useTranslation();

  const { facility } = useCurrentFacility();
  const { location } = useCurrentLocation();

  const baseUrl = `/facility/${facility?.id}/locations/${location?.id}`;

  // Fetch healthcare services for the current location
  const { data: healthcareServices, isLoading: isLoadingHealthcareServices } =
    useQuery({
      queryKey: ["healthcareServices", facility?.id, location?.id],
      queryFn: query(healthcareServiceApi.listHealthcareService, {
        pathParams: { facilityId: facility?.id || "" },
      }),
      enabled: !!facility?.id && !!location?.id,
    });

  // Get available service types for this location
  const availableServiceTypes = new Set(
    healthcareServices?.results
      ?.filter((service) =>
        service.locations?.some((loc) => loc.id === location?.id),
      )
      .map((service) => service.internal_type)
      .filter(Boolean) || [],
  );

  // Check if we have healthcare services data and if any services are configured for this location
  const hasHealthcareServicesForLocation = healthcareServices?.results?.some(
    (service) => service.locations?.some((loc) => loc.id === location?.id),
  );

  // Show all services if:
  // 1. Healthcare services are still loading, OR
  // 2. No healthcare services are configured for this location (backward compatibility), OR
  // 3. Healthcare services exist for this location (filtered by type)
  const shouldShowAllServices =
    isLoadingHealthcareServices || !hasHealthcareServicesForLocation;

  const allLinks = [
    {
      name: t("beds"),
      url: `${baseUrl}/beds`,
      icon: <CareIcon icon="l-bed" />,
    },
    {
      name: t("laboratory"),
      url: `${baseUrl}/laboratory`,
      icon: <CareIcon icon="l-microscope" />,
      children: [
        {
          name: t("service_requests"),
          url: `${baseUrl}/service_requests`,
        },
      ],
      show:
        shouldShowAllServices || availableServiceTypes.has(InternalType.lab),
    },
    {
      name: t("pharmacy"),
      url: `${baseUrl}/pharmacy`,
      icon: <CareIcon icon="l-medical-drip" />,
      children: [
        {
          name: t("prescription_queue"),
          url: `${baseUrl}/medication_requests`,
        },
        {
          name: "℞ " + t("dispense"),
          url: `${baseUrl}/medication_dispense`,
        },
      ],
      show:
        shouldShowAllServices ||
        availableServiceTypes.has(InternalType.pharmacy),
    },
    {
      name: "Food Service",
      url: `${baseUrl}/food_service`,
      icon: <CareIcon icon="l-utensils-alt" />,
      children: [
        {
          name: "Canteen Orders",
          url: `${baseUrl}/nutrition_orders`,
        },
      ],
      show:
        shouldShowAllServices || availableServiceTypes.has(InternalType.food),
    },
    {
      name: t("inventory"),
      url: `${baseUrl}/inventory`,
      icon: <CareIcon icon="l-shop" />,
      children: [
        {
          name: t("items"),
          url: `${baseUrl}/inventory`,
        },
        {
          header: t("internal_transfers"),
          name: t("to_receive"),
          url: `${baseUrl}/internal_transfers/to_receive`,
        },
        {
          name: t("to_dispatch"),
          url: `${baseUrl}/internal_transfers/to_dispatch`,
        },
        {
          header: t("external_supply"),
          // headerIcon: <CareIcon icon="l-box" className="text-gray-400" />,
          name: t("purchase_orders"),
          url: `${baseUrl}/external_supply/purchase_orders`,
        },
        {
          name: t("inward_entry"),
          url: `${baseUrl}/external_supply/inward_entry`,
        },
      ],
    },
  ];

  // Filter links based on availability and show property
  const filteredLinks = allLinks.filter((link) => link.show !== false);

  return <NavMain links={filteredLinks} />;
}
