import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";

import GenericAutocomplete from "@/components/ui/generic-autocomplete";

import query from "@/Utils/request/query";
import {
  HealthcareServiceReadSpec,
  InternalType,
} from "@/types/healthcareService/healthcareService";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

type DuoToneIconName = keyof typeof duoToneIcons;

interface HealthcareServiceSelectorProps {
  selected: HealthcareServiceReadSpec | null;
  onSelect: (service: HealthcareServiceReadSpec | null) => void;
  facilityId: string;
  clearSelection?: boolean;
  internalType?: InternalType;
}

const getIconName = (name: string): DuoToneIconName =>
  `d-${name}` as DuoToneIconName;

const ServiceIcon = ({ service }: { service: HealthcareServiceReadSpec }) => (
  <div className="relative size-6 rounded-sm flex items-center justify-center">
    <ColoredIndicator
      id={service.id}
      className="absolute inset-0 rounded-sm opacity-20"
    />
    <CareIcon
      icon={
        service.styling_metadata?.careIcon
          ? getIconName(service.styling_metadata.careIcon)
          : "d-health-worker"
      }
      className="size-4 relative z-1"
    />
  </div>
);

export const HealthcareServiceSelector = ({
  facilityId,
  selected,
  onSelect,
  clearSelection = false,
  internalType,
}: HealthcareServiceSelectorProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { data: services, isFetching } = useQuery({
    queryKey: ["healthcareServices", facilityId, searchValue, internalType],
    queryFn: query.debounced(healthcareServiceApi.listHealthcareService, {
      pathParams: { facilityId },
      queryParams: {
        limit: 50,
        ...(internalType && { internal_type: internalType }),
        ...(searchValue && { name: searchValue }),
      },
    }),
    enabled: open,
  });

  return (
    <GenericAutocomplete<HealthcareServiceReadSpec>
      options={services?.results ?? []}
      value={selected?.id ?? ""}
      onChange={(id) =>
        onSelect(services?.results.find((s) => s.id === id) ?? null)
      }
      onOpenChange={setOpen}
      onSearch={setSearchValue}
      isLoading={isFetching}
      filter={false}
      className="min-w-60 justify-start"
      showClearButton={clearSelection}
      placeholder={t("select_healthcare_service")}
      inputPlaceholder={t("search")}
      noOptionsMessage={t("no_services_found")}
      getOptionValue={(service) => service.id}
      getOptionLabel={(service) => service.name}
      renderSelected={(service) => (
        <div className="flex items-center gap-2 min-w-0">
          <ServiceIcon service={service} />
          <span className="truncate">{service.name}</span>
        </div>
      )}
      renderOption={(service) => (
        <div className="flex items-center gap-2 w-full">
          <ServiceIcon service={service} />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="truncate text-sm font-medium" title={service.name}>
              {service.name}
            </span>
            {service.extra_details && (
              <span className="text-xs text-gray-500 truncate">
                {service.extra_details}
              </span>
            )}
          </div>
        </div>
      )}
    />
  );
};
