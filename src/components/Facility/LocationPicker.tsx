import { Map, Marker, ZoomControl } from "pigeon-maps";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  showResults: boolean;
  noResultsFound: boolean;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationSelect,
  isGettingLocation,
  onGetCurrentLocation,
}: LocationPickerProps) {
  const { t } = useTranslation();
  const [searchState, setSearchState] = useState<SearchState>({
    query: "",
    results: [],
    isSearching: false,
    showResults: false,
    noResultsFound: false,
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hide results when search query is empty
  useEffect(() => {
    if (!searchState.query.trim()) {
      setSearchState((prev) => ({
        ...prev,
        showResults: false,
        results: [],
        noResultsFound: false,
      }));
    }
  }, [searchState.query]);

  // Handle clicks outside the search container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchState((prev) => ({ ...prev, showResults: false }));
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchState((prev) => ({
        ...prev,
        showResults: false,
        results: [],
        noResultsFound: false,
      }));
      return;
    }

    setSearchState((prev) => ({
      ...prev,
      isSearching: true,
      showResults: true,
      noResultsFound: false,
    }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&limit=5`,
      );

      const data = await response.json();
      setSearchState((prev) => ({
        ...prev,
        results: data,
        noResultsFound: data.length === 0,
        isSearching: false,
      }));
    } catch (error) {
      console.error("Search error:", error);
      setSearchState((prev) => ({
        ...prev,
        noResultsFound: true,
        isSearching: false,
      }));
    }
  }, []);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 500); // 500ms debounce delay
    },
    [performSearch],
  );

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      onLocationSelect(parseFloat(result.lat), parseFloat(result.lon));
      setSearchState((prev) => ({
        ...prev,
        query: result.display_name,
        showResults: false,
      }));
    },
    [onLocationSelect],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchState((prev) => ({
      ...prev,
      query: value,
      ...(value.trim() === "" && {
        showResults: false,
        results: [],
        noResultsFound: false,
      }),
    }));

    if (value.trim().length >= 3) {
      debouncedSearch(value);
    }
  };

  const handleClearInput = useCallback(() => {
    setSearchState((prev) => ({
      ...prev,
      query: "",
      showResults: false,
      results: [],
      noResultsFound: false,
    }));

    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputFocus = () => {
    // Show previous results if we have a search query and results
    if (
      searchState.query.trim() &&
      (searchState.results.length > 0 || searchState.noResultsFound)
    ) {
      setSearchState((prev) => ({ ...prev, showResults: true }));
    }
  };

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
        <div ref={searchContainerRef} className="relative w-full">
          <Input
            ref={inputRef}
            type="text"
            placeholder={t("search_for_location")}
            value={searchState.query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="w-full text-sm pr-10"
            data-cy="location-search"
            aria-label={t("search_for_location")}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchState.isSearching ? (
              <CareIcon
                icon="l-spinner"
                className="h-4 w-4 animate-spin text-primary"
              />
            ) : (
              searchState.query && (
                <button
                  type="button"
                  onClick={handleClearInput}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={t("clear_search")}
                  data-cy="clear-search-button"
                >
                  <CareIcon icon="l-times" className="h-4 w-4" />
                </button>
              )
            )}
          </div>
          {searchState.showResults && searchState.query.trim() && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
              {searchState.noResultsFound ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  {t("no_locations_found")}
                </div>
              ) : (
                searchState.results.length > 0 && (
                  <ul className="max-h-60 overflow-auto py-1 text-sm">
                    {searchState.results.map((result, index) => (
                      <li
                        key={index}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleResultClick(result)}
                      >
                        {result.display_name}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          )}
        </div>
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
            <Marker
              width={40}
              anchor={[latitude, longitude]}
              onClick={() => {}}
            />
          )}
        </Map>
      </div>
      <p className="text-sm text-gray-500">
        {t("click_on_map_to_select_location")}
      </p>
    </div>
  );
}
