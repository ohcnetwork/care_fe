import { useQuery } from "@tanstack/react-query";
import { Map, Marker, ZoomControl } from "pigeon-maps";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  isGettingLocation?: boolean;
  onGetCurrentLocation?: () => void;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchState {
  query: string;
  debouncedQuery: string;
  selectedLocationText: string;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationSelect,
  isGettingLocation,
  onGetCurrentLocation,
}: LocationPickerProps) {
  const { t } = useTranslation();
  const [searchState, setSearchState] = useState<LocationSearchState>({
    query: "",
    debouncedQuery: "",
    selectedLocationText: "",
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchState.query.trim().length < 3) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      setSearchState((prev) => ({
        ...prev,
        debouncedQuery: "",
      }));

      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchState((prev) => ({
        ...prev,
        debouncedQuery: prev.query,
      }));
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchState.query]);

  // Search query using TanStack Query
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["locationSearch", searchState.debouncedQuery],
    queryFn: async () => {
      if (!searchState.debouncedQuery.trim()) return [];

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchState.debouncedQuery,
        )}&limit=5`,
        {
          headers: {
            "User-Agent": "OHCN-Care-Application/1.0",
          },
        },
      );

      if (!response.ok) throw new Error("Network response was not ok");
      return response.json() as Promise<SearchResult[]>;
    },
    enabled: searchState.debouncedQuery.trim().length >= 3,
    staleTime: 1000 * 60 * 5, // Cache results for 5 minutes
    retry: 1,
  });

  const handleLocationSelect = useCallback(
    (value: string) => {
      const selectedResult = searchResults.find(
        (result) => result.display_name === value,
      );

      if (selectedResult) {
        onLocationSelect(
          parseFloat(selectedResult.lat),
          parseFloat(selectedResult.lon),
        );

        setSearchState((prev) => ({
          ...prev,
          query: selectedResult.display_name,
          selectedLocationText: selectedResult.display_name,
        }));
      }
    },
    [searchResults, onLocationSelect],
  );

  const handleLocationSearch = useCallback((query: string) => {
    setSearchState((prev) => ({
      ...prev,
      query,
      selectedLocationText: "",
    }));
  }, []);

  // Convert search results to autocomplete options
  const locationOptions = searchResults.map((result) => ({
    label: result.display_name,
    value: result.display_name,
  }));

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
              <CareIcon
                icon="l-spinner"
                className="h-4 w-4 animate-spin mr-1"
              />
            ) : (
              <CareIcon icon="l-location-point" className="h-4 w-4 mr-1" />
            )}
            {isGettingLocation
              ? t("getting_location")
              : t("get_current_location")}
          </Button>
        )}
      </div>

      <div className="relative w-full">
        <Autocomplete
          options={locationOptions}
          value={searchState.selectedLocationText || ""}
          onChange={handleLocationSelect}
          onSearch={handleLocationSearch}
          placeholder={t("search_for_location")}
          noOptionsMessage={
            searchState.debouncedQuery && !isLoading
              ? t("no_locations_found")
              : t("type_to_search")
          }
          disabled={isGettingLocation}
          data-cy="location-search"
        />
      </div>

      <div className="h-[400px] w-full rounded-lg border overflow-hidden">
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
