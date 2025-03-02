import { useQuery } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import { useView } from "@/Utils/useView";
import { LocationList as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import LocationSheet from "./LocationSheet";
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

    const hasMatchingDescendant = (locationId: string): boolean => {
      const children = childrenMap.get(locationId) || [];
      return children.some(
        (child: LocationListType) =>
          matchesSearch(child.name) || hasMatchingDescendant(child.id),
      );
    };

    return data?.results?.filter(
      (location) =>
        matchesSearch(location.name) || hasMatchingDescendant(location.id),
    );
  }, [data?.results, searchQuery, childrenMap]);

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
      <div className="md:px-6 space-y-6">
        <h2 className="text-black">{t("locations")}</h2>
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
                  {/* Map view will be added later
                  <TabsTrigger value="map" id="location-map-view">
                    <div className="flex items-center gap-1">
                      <CareIcon icon="l-map" className="text-lg" />
                      <span>{t("map")}</span>
                    </div>
                  </TabsTrigger>
                  */}
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

          {activeTab === "list" && (
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <div className="p-2 bg-blue-100 rounded-sm shrink-0 self-center">
                  <CareIcon
                    icon="l-info-circle"
                    className="h-5 w-5 text-blue-900"
                  />
                </div>
                <div className="min-w-0 space-y-2 text-xs md:text-sm text-blue-800">
                  <div className="flex flex-wrap items-center">
                    <Trans
                      i18nKey="click_add_main_location"
                      components={{
                        strong: <strong className="font-semibold mx-1" />,
                      }}
                    />
                  </div>
                  {/* Desktop view text */}
                  <div className="hidden lg:flex items-center">
                    <Trans
                      i18nKey="click_manage_sub_locations"
                      components={{
                        ArrowIcon: (
                          <CareIcon
                            icon="l-arrow-up-right"
                            className="h-4 w-4 mr-1"
                          />
                        ),
                        strong: <strong className="font-semibold ml-1" />,
                      }}
                    />
                  </div>
                  {/* Mobile and Tablet view text */}
                  <div className="lg:hidden flex flex-wrap items-center">
                    <Trans
                      i18nKey="click_manage_sub_locations_mobile"
                      components={{
                        ArrowIcon: (
                          <CareIcon
                            icon="l-arrow-up-right"
                            className="h-4 w-4 mx-1"
                          />
                        ),
                        PenLine: <PenLine className="h-4 w-4 mx-1" />,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map view will be added later, for now always show list view */}
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
