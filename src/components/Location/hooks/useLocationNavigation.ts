import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import query from "@/Utils/request/query";
import { LocationAssociationRead } from "@/types/location/association";
import { LocationRead } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

const ITEMS_PER_PAGE = 20;

interface UseLocationNavigationProps {
  facilityId: string;
  open: boolean;
  tab: "assign" | "history";
}

export function useLocationNavigation({
  facilityId,
  open,
  tab,
}: UseLocationNavigationProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationRead | null>(
    null,
  );
  const [locationHistory, setLocationHistory] = useState<LocationRead[]>([]);
  const [selectedBed, setSelectedBed] = useState<LocationRead | null>(null);
  const [selectedLinkedBed, setSelectedLinkedBed] = useState<
    LocationAssociationRead | undefined
  >();
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationsPage, setLocationsPage] = useState(1);
  const [bedsPage, setBedsPage] = useState(1);
  const [hasMoreLocations, setHasMoreLocations] = useState(true);
  const [hasMoreBeds, setHasMoreBeds] = useState(true);
  const [allLocations, setAllLocations] = useState<LocationRead[]>([]);
  const [allBeds, setAllBeds] = useState<LocationRead[]>([]);

  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: [
      "locations",
      facilityId,
      locationsPage,
      searchTerm,
      selectedLocation?.id,
    ],
    queryFn: async ({ signal }) => {
      const response = await query(locationApi.list, {
        pathParams: { facility_id: facilityId },
        queryParams: {
          limit: ITEMS_PER_PAGE,
          offset: (locationsPage - 1) * ITEMS_PER_PAGE,
          name: searchTerm,
          mode: "kind",
          parent: selectedLocation?.id,
          ...(!selectedLocation ? { mine: true } : {}),
        },
        signal,
      })({ signal });
      return response;
    },
    enabled: open && tab === "assign",
  });

  const { data: bedsData, isLoading: isLoadingBeds } = useQuery({
    queryKey: [
      "beds",
      facilityId,
      selectedLocation?.id,
      bedsPage,
      showAvailableOnly,
      searchTerm,
    ],
    queryFn: async ({ signal }) => {
      const response = await query(locationApi.list, {
        pathParams: { facility_id: facilityId },
        queryParams: {
          limit: ITEMS_PER_PAGE,
          offset: (bedsPage - 1) * ITEMS_PER_PAGE,
          mode: "instance",
          name: searchTerm,
          parent: selectedLocation?.id,
          available: showAvailableOnly ? "true" : undefined,
          status: "active",
          ...(!selectedLocation ? { mine: true } : {}),
        },
        signal,
      })({ signal });
      return response;
    },
    enabled: !!selectedLocation && !!facilityId && tab === "assign",
  });

  useEffect(() => {
    if (locationsData) {
      if (locationsPage === 1) {
        setAllLocations(locationsData.results);
      } else {
        setAllLocations((prev) => [...prev, ...locationsData.results]);
      }
      setHasMoreLocations(locationsData.count > locationsPage * ITEMS_PER_PAGE);
    }
  }, [locationsData, locationsPage]);

  useEffect(() => {
    if (bedsData) {
      if (bedsPage === 1) {
        setAllBeds(bedsData.results);
      } else {
        setAllBeds((prev) => [...prev, ...bedsData.results]);
      }
      setHasMoreBeds(bedsData.count > bedsPage * ITEMS_PER_PAGE);
    }
    setSelectedBed(null);
  }, [bedsData, bedsPage]);

  const handleLocationClick = (location: LocationRead) => {
    if (selectedLinkedBed) {
      setSelectedLinkedBed(undefined);
    }
    const locationIndex = locationHistory.findIndex(
      (loc) => loc.id === location.id,
    );

    if (locationIndex !== -1) {
      setLocationHistory((prev) => prev.slice(0, locationIndex + 1));
    } else {
      setLocationHistory((prev) => [...prev, location]);
    }

    setSelectedLocation(location);
    setLocationsPage(1);
    setBedsPage(1);
    setAllLocations([]);
    setAllBeds([]);
    setSelectedBed(null);
    setSearchTerm("");
  };

  const handleLinkedBedClick = (bed: LocationAssociationRead) => {
    setSelectedLinkedBed(bed);
    setSelectedBed(null);
  };

  const handleBedSelect = (bed: LocationRead) => {
    setSelectedBed(bed);
    setSelectedLinkedBed(undefined);
  };

  const clearBedSelection = () => {
    setSelectedBed(null);
    setSelectedLinkedBed(undefined);
  };

  const handleLoadMore = () => {
    if (selectedLocation) {
      setBedsPage((prev) => prev + 1);
    } else {
      setLocationsPage((prev) => prev + 1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocationsPage(1);
    setBedsPage(1);
    setAllLocations([]);
    setAllBeds([]);
  };

  const goBack = () => {
    setLocationHistory([]);
    setSelectedLocation(null);
    setSelectedBed(null);
    setLocationsPage(1);
    setAllLocations([]);
    setHasMoreLocations(true);
    setBedsPage(1);
    setAllBeds([]);
    setHasMoreBeds(true);
    setSearchTerm("");
  };

  const resetNavigation = () => {
    setSelectedLocation(null);
    setLocationHistory([]);
    setSelectedBed(null);
    setShowAvailableOnly(false);
    setSearchTerm("");
    setLocationsPage(1);
    setBedsPage(1);
    setAllLocations([]);
    setAllBeds([]);
    setHasMoreLocations(true);
    setHasMoreBeds(true);
    if (locationsData?.results) {
      setAllLocations(locationsData.results);
    }
  };

  return {
    // State
    selectedLocation,
    locationHistory,
    selectedBed,
    selectedLinkedBed,
    showAvailableOnly,
    searchTerm,
    allLocations,
    allBeds,
    hasMoreLocations,
    hasMoreBeds,
    isLoadingLocations,
    isLoadingBeds,

    // Setters
    setSelectedBed: handleBedSelect,
    setShowAvailableOnly,
    setSearchTerm,
    setBedsPage,
    setAllBeds,

    // Handlers
    handleLocationClick,
    handleLinkedBedClick,
    handleLoadMore,
    handleSearch,
    clearBedSelection,
    goBack,
    resetNavigation,
  };
}
