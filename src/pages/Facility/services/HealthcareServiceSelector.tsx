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

  const getIconName = (name: string): DuoToneIconName =>
    `d-${name}` as DuoToneIconName;

  const results = services?.results ?? [];
  const serviceMap = new Map(results.map((s) => [s.id, s]));

  const options: GenericAutocompleteOption<string>[] = results.map(
    (service) => ({
      label: service.name,
      value: service.id,
    }),
  );

  const renderServiceRow = (id: string) => {
    const service = serviceMap.get(id);
    if (!service) return null;
    return (
      <div className="flex items-center gap-2 w-full min-w-0">
        <div className="relative size-6 shrink-0 rounded-sm flex items-center justify-center">
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

  return (
    <GenericAutocomplete<string>
      options={options}
      isLoading={isLoading}
      value={selected?.id ?? null}
      onChange={(id) => {
        onSelect(id ? (serviceMap.get(id) ?? null) : null);
      }}
      onSearch={setSearchValue}
      placeholder={t("select_healthcare_service")}
      inputPlaceholder={t("search")}
      noOptionsMessage={t("no_services_found")}
      enableRadio={true}
      showClearButton={clearSelection}
      renderOption={(option) => renderServiceRow(option.value)}
      renderTrigger={(opt) =>
        opt ? (
          renderServiceRow(opt.value)
        ) : (
          <span className="text-gray-400">
            {t("select_healthcare_service")}
          </span>
        )
      }
      className="min-w-60"
    />
  );
};
