import { CheckIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";

import GenericAutocomplete, {
  GenericAutoCompleteOption,
} from "@/components/ui/generic-autocomplete";

import { cn } from "@/lib/utils";

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

  const options: GenericAutoCompleteOption<HealthcareServiceReadSpec>[] =
    useMemo(
      () =>
        services?.results.map((service) => ({
          label: service.name,
          value: service,
          key: service.id,
        })) || [],
      [services?.results],
    );

  const renderOption = (
    option: GenericAutoCompleteOption<HealthcareServiceReadSpec>,
    isSelected: boolean,
  ) => {
    const service = option.value;
    return (
      <div className="flex items-center gap-2 w-full">
        <CheckIcon
          className={cn("size-4", isSelected ? "opacity-100" : "opacity-0")}
        />
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
  };

  const renderRadioOption = (
    option: GenericAutoCompleteOption<HealthcareServiceReadSpec>,
  ) => {
    const service = option.value;
    return (
      <div className="flex items-center gap-1 w-full min-w-0">
        <div className="relative size-5 rounded-sm flex items-center justify-center">
          <ColoredIndicator
            id={service.id}
            className="absolute inset-0 rounded-3xl opacity-20"
          />
          <CareIcon
            icon={
              service.styling_metadata?.careIcon
                ? getIconName(service.styling_metadata.careIcon)
                : "d-health-worker"
            }
            className="size-3 relative z-1"
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
  };

  const renderSelected = (
    option: GenericAutoCompleteOption<HealthcareServiceReadSpec>,
  ) => {
    const service = option.value;
    return (
      <div className="flex items-center gap-2">
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
        <span className="truncate min-w-0 flex-1">{service.name}</span>
      </div>
    );
  };

  const valueCompare = (
    a: HealthcareServiceReadSpec | null,
    b: HealthcareServiceReadSpec | null,
  ) => a?.id === b?.id;

  return (
    <GenericAutocomplete<HealthcareServiceReadSpec>
      options={options}
      value={selected}
      onChange={onSelect}
      onSearch={setSearchValue}
      isLoading={isLoading}
      placeholder={t("select_healthcare_service")}
      inputPlaceholder={t("search")}
      noOptionsMessage={t("no_services_found")}
      showClearButton={clearSelection}
      renderOption={renderOption}
      renderRadioOption={renderRadioOption}
      renderSelected={renderSelected}
      valueCompare={valueCompare}
      enableRadio
      className="sm:min-w-60"
      align="start"
    />
  );
};
