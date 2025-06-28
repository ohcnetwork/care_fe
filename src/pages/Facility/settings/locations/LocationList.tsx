import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { useView } from "@/Utils/useView";
import { LocationList as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import LocationMap from "./LocationMap";
import LocationSheet from "./LocationSheet";
import { LocationInfoCard } from "./components/LocationInfoCard";
import { LocationListView } from "./components/LocationListView";

interface Props {
  facilityId: string;
}

function createSearchMatcher(query: string) {
  const normalizedQuery = query.toLowerCase();
  return (name: string) => name.toLowerCase().includes(normalizedQuery);
}

function buildLocationHierarchy(locations: LocationListType[]) {
  const childrenMap = new Map<string, LocationListType[]>();
  const topLevelLocations: LocationListType[] = [];

  locations.forEach((location) => {
    if (!location.parent || Object.keys(location.parent).length === 0) {
      topLevelLocations.push(location);
    } else {
      const parentId = location.parent.id;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)?.push(location);
    }
  });

  return { childrenMap, topLevelLocations };
}

export default function LocationList({ facilityId }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationListType | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useView("locations", "list");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [{ childrenMap, topLevelLocations }, setLocationHierarchy] = useState<{
    childrenMap: Map<string, LocationListType[]>;
    topLevelLocations: LocationListType[];
  }>({ childrenMap: new Map(), topLevelLocations: [] });

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.facility.show, {
      pathParams: { id: facilityId },
    }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["locations", facilityId],
    queryFn: query.paginated(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {},
    }),
    enabled: !!facilityId,
  });

  useEffect(() => {
    setLocationHierarchy(buildLocationHierarchy(data?.results || []));
  }, [data?.results]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data?.results || [];

    const matchesSearch = createSearchMatcher(searchQuery);
    const matchedLocations = new Set<string>();

    // Helper function to add all children of a location
    const addAllChildren = (locationId: string) => {
      const children =
        data?.results?.filter((loc) => loc.parent?.id === locationId) || [];
      children.forEach((child) => {
        matchedLocations.add(child.id);
        // Recursively add all descendants
        addAllChildren(child.id);
      });
    };

    // First pass: Find direct matches and their children
    data?.results?.forEach((location) => {
      if (matchesSearch(location.name)) {
        matchedLocations.add(location.id);
        // If this location matches, add all its children
        addAllChildren(location.id);
      }
    });

    // Second pass: Add parent chain for any matched location
    data?.results?.forEach((location) => {
      if (matchedLocations.has(location.id)) {
        let current = location;
        while (current.parent?.id) {
          matchedLocations.add(current.parent.id);
          const parent = data?.results?.find(
            (loc) => loc.id === current.parent?.id,
          );
          if (!parent) break;
          current = parent;
        }
      }
    });

    return (
      data?.results?.filter((location) => matchedLocations.has(location.id)) ||
      []
    );
  }, [data?.results, searchQuery]);

  const matchesSearch = useMemo(
    () => createSearchMatcher(searchQuery),
    [searchQuery],
  );

  const hasMatchingChildren = useCallback(
    (parentId: string): boolean => {
      const children = childrenMap.get(parentId) || [];
      return children.some(
        (child: LocationListType) =>
          matchesSearch(child.name) || hasMatchingChildren(child.id),
      );
    },
    [childrenMap, matchesSearch],
  );

  const getChildren = (parentId: string): LocationListType[] => {
    const children = childrenMap.get(parentId) || [];
    if (!searchQuery) return children;

    return children.filter(
      (loc: LocationListType) =>
        matchesSearch(loc.name) || hasMatchingChildren(loc.id),
    );
  };

  const filteredTopLevelLocations = useMemo(() => {
    if (!searchQuery) return topLevelLocations;
    return topLevelLocations.filter(
      (loc: LocationListType) =>
        matchesSearch(loc.name) || hasMatchingChildren(loc.id),
    );
  }, [topLevelLocations, searchQuery, matchesSearch, hasMatchingChildren]);

  const handleAddLocation = () => {
    setSelectedLocation(null);
    setIsSheetOpen(true);
  };

  const handleEditLocation = (location: LocationListType) => {
    setSelectedLocation(location);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedLocation(null);
    queryClient.invalidateQueries({ queryKey: ["locations", facilityId] });
  };

  const toggleRow = (id: string) => {
    const newExpandedRows = { ...expandedRows };
    newExpandedRows[id] = !newExpandedRows[id];
    const children = getChildren(id);
    children.forEach((child) => {
      if (!child.has_children) {
        newExpandedRows[child.id] = !newExpandedRows[child.id];
      }
    });
    setExpandedRows(newExpandedRows);
  };

  useEffect(() => {
    if (!searchQuery) {
      setExpandedRows({});
      return;
    }

    const allLocations = data?.results || [];
    const matchesSearch = createSearchMatcher(searchQuery);

    const hasMatchingDescendant = (locationId: string): boolean => {
      const children = allLocations.filter(
        (loc) => loc.parent?.id === locationId,
      );
      return children.some(
        (child: LocationListType) =>
          matchesSearch(child.name) || hasMatchingDescendant(child.id),
      );
    };

    const newExpandedRows: Record<string, boolean> = {};
    allLocations.forEach((location) => {
      if (matchesSearch(location.name) || hasMatchingDescendant(location.id)) {
        let currentLoc = location;
        while (currentLoc.parent?.id) {
          newExpandedRows[currentLoc.parent.id] = true;
          const parentLoc = allLocations.find(
            (loc) => loc.id === currentLoc.parent?.id,
          );
          if (!parentLoc) {
            break;
          }
          currentLoc = parentLoc;
        }
      }
    });

    setExpandedRows(newExpandedRows);
  }, [searchQuery, data?.results]);

  return (
    <Page title={t("locations")} hideTitleOnPage={true} className="p-0">
      <div className="space-y-4">
        <h3 className="text-black">{t("locations")}</h3>
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="flex items-center justify-between w-full">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "list" | "map")}
              >
                <TabsList className="flex">
                  <TabsTrigger value="list" id="location-list-view">
                    <div className="flex items-center gap-1">
                      <CareIcon icon="l-list-ul" className="text-lg" />
                      <span>{t("list")}</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="map" id="location-map-view">
                    <div className="flex items-center gap-1">
                      <CareIcon icon="l-map" className="text-lg" />
                      <span>{t("map")}</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 w-full">
              <Input
                placeholder={t("filter_by_locations")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                className="w-full text-xs lg:text-sm"
              />
              <Button
                variant="primary"
                onClick={handleAddLocation}
                className="w-full lg:w-auto"
              >
                <CareIcon icon="l-plus" className="h-4 w-4 mr-2" />
                {t("add_location")}
              </Button>
            </div>
          </div>

          {activeTab === "list" ? (
            <>
              <LocationInfoCard />
              <LocationListView
                isLoading={isLoading}
                tableData={filteredData || []}
                searchQuery={searchQuery}
                filteredTopLevelLocations={filteredTopLevelLocations}
                expandedRows={expandedRows}
                toggleRow={toggleRow}
                getChildren={getChildren}
                handleEditLocation={handleEditLocation}
                setExpandedRows={setExpandedRows}
              />
            </>
          ) : (
            <LocationMap
              locations={filteredData || []}
              onLocationClick={handleEditLocation}
              facilityName={facilityData?.name || t("facility")}
              searchQuery={searchQuery}
            />
          )}

          <LocationSheet
            open={isSheetOpen}
            onOpenChange={handleSheetClose}
            facilityId={facilityId}
            location={selectedLocation || undefined}
          />
        </div>
      </div>
    </Page>
  );
}
