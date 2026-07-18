import { CheckIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";

import {
  GenericAutocomplete,
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
  /** When true, render options as an inline radio group when count ≤ 5 */
  radio?: boolean;
}

const getIconName = (name: string): DuoToneIconName =>
  `d-${name}` as DuoToneIconName;

export const HealthcareServiceSelector = ({
  facilityId,
  selected,
  onSelect,
  clearSelection = false,
  internalType,
  radio = false,
}: HealthcareServiceSelectorProps) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [open, setOpen] = useState(false);

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
    // Always enabled in radio mode so we have data to decide the render mode;
    // otherwise only fetch while the dropdown is open.
    enabled: radio ? true : open,
  });

  const options: GenericAutocompleteOption<HealthcareServiceReadSpec>[] = (
    services?.results ?? []
  ).map((service) => ({
    key: service.id,
    label: service.name,
    value: service,
  }));

  const renderOption = (
    option: GenericAutocompleteOption<HealthcareServiceReadSpec>,
    isSelected: boolean,
  ) => {
    const service = option.value;
    return (
      <div className="flex items-center gap-2 w-full">
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
            aria-hidden="true"
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="truncate text-sm font-medium" title={service.name}>
            {service.name}
          </span>
          {service.extra_details && (
            <span
              className="text-xs text-gray-500 truncate"
              title={service.extra_details}
            >
              {service.extra_details}
            </span>
          )}
        </div>
        {isSelected && <CheckIcon className="ml-auto shrink-0" />}
      </div>
    );
  };

  const renderTrigger = (
    selectedOption: GenericAutocompleteOption<HealthcareServiceReadSpec> | null,
    placeholder: string,
  ) => {
    if (selectedOption) {
      const service = selectedOption.value;
      return (
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative size-6 rounded-sm flex items-center justify-center shrink-0">
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
              aria-hidden="true"
            />
          </div>
          <span className="truncate">{service.name}</span>
        </div>
      );
    }
    return <span className="text-gray-400">{placeholder}</span>;
  };

  return (
    <GenericAutocomplete<HealthcareServiceReadSpec>
      options={options}
      isLoading={isLoading}
      getOptionKey={(service) => service.id}
      value={selected}
      onChange={onSelect}
      onSearch={setSearchValue}
      onOpenChange={setOpen}
      placeholder={t("select_healthcare_service")}
      inputPlaceholder={t("search")}
      noOptionsMessage={t("no_services_found")}
      clearSelection={clearSelection}
      radio={radio}
      renderOption={renderOption}
      renderTrigger={renderTrigger}
      className="min-w-60"
      align="start"
    />
  );
};
