import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";

import GenericAutocomplete, {
  GenericAutocompleteOption,
} from "@/components/ui/generic-autocomplete";

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

const getServiceIconName = (name: string): DuoToneIconName =>
  `d-${name}` as DuoToneIconName;

function ServiceItemContent({
  service,
}: {
  service: HealthcareServiceReadSpec;
}) {
  return (
    <div className="flex items-center gap-2 w-full min-w-0">
      <div className="relative size-6 rounded-sm shrink-0 flex items-center justify-center">
        <ColoredIndicator
          id={service.id}
          className="absolute inset-0 rounded-sm opacity-20"
        />
        <CareIcon
          icon={
            service.styling_metadata?.careIcon
              ? getServiceIconName(service.styling_metadata.careIcon)
              : "d-health-worker"
          }
          className="size-4 relative z-1"
        />
      </div>
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
  );
}

export const HealthcareServiceSelector = ({
  facilityId,
  selected,
  onSelect,
  clearSelection = false,
  internalType,
}: HealthcareServiceSelectorProps) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");

  const { data: services, isLoading } = useQuery({
    queryKey: ["healthcareServices", facilityId, searchValue, internalType],
    queryFn: query.debounced(healthcareServiceApi.listHealthcareService, {
      pathParams: { facilityId },
      queryParams: {
        limit: 50,
        ...(internalType && { internal_type: internalType }),
        ...(searchValue && { name: searchValue }),
      },
    }),
  });

  const options: GenericAutocompleteOption<HealthcareServiceReadSpec>[] = (
    services?.results ?? []
  ).map((s) => ({ label: s.name, value: s }));

  return (
    <GenericAutocomplete<HealthcareServiceReadSpec>
      options={options}
      value={selected}
      onChange={onSelect}
      getOptionKey={(s) => s.id}
      isLoading={isLoading}
      onSearch={setSearchValue}
      placeholder={t("select_healthcare_service")}
      inputPlaceholder={t("search")}
      noOptionsMessage={t("no_services_found")}
      enableRadio
      clearSelection={clearSelection}
      renderOption={(option) => <ServiceItemContent service={option.value} />}
      renderValue={(service) => <ServiceItemContent service={service} />}
      className="min-w-60"
    />
  );
};
