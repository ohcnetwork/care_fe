import { useQuery } from "@tanstack/react-query";
import { Map, Marker, ZoomControl } from "pigeon-maps";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";

import { HttpMethod } from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { mergeAutocompleteOptions } from "@/Utils/utils";

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  isGettingLocation?: boolean;
  onGetCurrentLocation?: () => void;
}

const osmSearchLocationApi = {
  baseUrl: "https://nominatim.openstreetmap.org",
  path: "/search",
  method: HttpMethod.GET,
  TRes: [] as { display_name: string; lat: string; lon: string }[],
} as const;

export default function GeoLocationPicker({
  latitude,
  longitude,
  onLocationSelect,
  isGettingLocation,
  onGetCurrentLocation,
}: LocationPickerProps) {
  const { t } = useTranslation();

  const [selectedLocation, setSelectedLocation] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ["osm-location-search", searchQuery],
    queryFn: query.debounced(osmSearchLocationApi, {
      debounceInterval: 1500,
      queryParams: {
        format: "json",
        q: searchQuery,
        limit: 5,
      },
    }),
    enabled: selectedLocation !== searchQuery && searchQuery.trim().length >= 3,
    staleTime: 1000 * 60 * 5, // Cache results for 5 minutes
    retry: 1,
  });

  const handleLocationSelect = useCallback(
    (value: string) => {
      const option = searchResults?.find((r) => r.display_name === value);
      if (!option) {
        return;
      }
      setSearchQuery(option.display_name);
      setSelectedLocation(option.display_name);
      onLocationSelect(parseFloat(option.lat), parseFloat(option.lon));
    },
    [searchResults, onLocationSelect],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t("location_details")}</h3>
        {onGetCurrentLocation && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGetCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center gap-2"
            data-cy="get-location-button"
          >
            {isGettingLocation ? (
              <CareIcon icon="l-spinner" className="size-4 animate-spin mr-1" />
            ) : (
              <CareIcon icon="l-location-point" className="size-4 mr-1" />
            )}
            {isGettingLocation
              ? t("getting_location")
              : t("get_current_location")}
          </Button>
        )}
      </div>

      <div className="relative w-full">
        <Autocomplete
          options={mergeAutocompleteOptions(
            searchResults?.map(({ display_name }) => ({
              label: display_name,
              value: display_name,
            })) ?? [],
            selectedLocation
              ? {
                  label: selectedLocation,
                  value: selectedLocation,
                }
              : undefined,
          )}
          value={searchQuery}
          onChange={handleLocationSelect}
          onSearch={setSearchQuery}
          placeholder={t("search_for_location")}
          isLoading={isFetching}
          noOptionsMessage={
            searchQuery && !isFetching
              ? t("no_locations_found")
              : t("type_to_search")
          }
          disabled={isGettingLocation}
          data-cy="location-search"
        />
      </div>

      <div className="h-[25rem] w-full rounded-lg border border-gray-200 overflow-hidden">
        <Map
          height={400}
          center={latitude && longitude ? [latitude, longitude] : undefined}
          defaultZoom={16}
          onClick={({ latLng: [lat, lng] }) => onLocationSelect(lat, lng)}
        >
          <ZoomControl />
          {latitude && longitude && (
            <Marker width={40} anchor={[latitude, longitude]} />
          )}
        </Map>
      </div>
      <p className="text-sm text-gray-500">
        {t("click_on_map_to_select_location")}
      </p>
    </div>
  );
}
