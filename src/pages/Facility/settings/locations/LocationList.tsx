import { useQuery } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { Link } from "raviger";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { useView } from "@/Utils/useView";
import { LocationList as LocationListType } from "@/types/location/location";
import { getLocationFormLabel } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import LocationSheet from "./LocationSheet";

interface Props {
  facilityId: string;
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

  const LIMIT = 1000;

  const { data, isLoading } = useQuery({
    queryKey: ["locations", facilityId, searchQuery],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        limit: LIMIT,
        name: searchQuery || undefined,
      },
    }),
    enabled: !!facilityId,
  });

  const tableData = data?.results || [];
  const { childrenMap, topLevelLocations } = useMemo(
    () => buildLocationHierarchy(tableData),
    [tableData],
  );

  const getChildren = useCallback(
    (parentId: string) => {
      const children = childrenMap.get(parentId) || [];
      if (!searchQuery) return children;

      return children.filter((loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    },
    [childrenMap, searchQuery],
  );

  const filteredTopLevelLocations = useMemo(() => {
    if (!searchQuery) return topLevelLocations;
    return topLevelLocations.filter((loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [topLevelLocations, searchQuery]);

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
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const LocationRow = ({
    location,
    expandedRows,
    toggleRow,
    getChildren,
    indent,
  }: {
    location: LocationListType;
    expandedRows: Record<string, boolean>;
    toggleRow: (id: string) => void;
    getChildren: (parentId: string) => LocationListType[];
    indent: number;
  }) => {
    const { t } = useTranslation();
    const isMobile = useBreakpoints({ default: true, sm: false });
    const children = getChildren(location.id);
    const isTopLevel =
      !location.parent || Object.keys(location.parent).length === 0;
    const isExpanded = expandedRows[location.id];

    const toggleAllChildren = () => {
      setExpandedRows((prevExpandedRows) => {
        const newExpandedRows = { ...prevExpandedRows };
        const toggleChildren = (parentId: string, expand: boolean) => {
          getChildren(parentId).forEach((child) => {
            newExpandedRows[child.id] = expand;
            toggleChildren(child.id, expand);
          });
        };
        const shouldExpand = !children.every(
          (child) => prevExpandedRows[child.id],
        );
        newExpandedRows[location.id] = shouldExpand;
        toggleChildren(location.id, shouldExpand);
        return newExpandedRows;
      });
    };

    const allExpanded = children.every((child) => expandedRows[child.id]);

    return (
      <>
        <TableRow
          className="group hover:bg-muted/50"
          style={{ "--indent": `${indent}rem` } as React.CSSProperties}
        >
          <TableCell
            className={`${
              isTopLevel
                ? "bg-white font-bold text-gray-900"
                : "bg-white font-medium text-gray-900"
            } flex justify-between lg:flex-row flex-col pl-[var(--indent)] flex-wrap gap-2`}
          >
            <div className="flex items-center">
              {children.length > 0 ? (
                <Button
                  size="icon"
                  variant="link"
                  onClick={() => toggleRow(location.id)}
                >
                  {isExpanded ? (
                    <CareIcon icon="l-angle-down" className="h-5 w-5" />
                  ) : (
                    <CareIcon icon="l-angle-right" className="h-5 w-5" />
                  )}
                </Button>
              ) : location.parent ? (
                <CareIcon
                  icon="l-corner-down-right-alt"
                  className="h-4 w-4 text-gray-400 ml-4 mr-2"
                />
              ) : (
                <div className="w-8" />
              )}
              {location.name}
            </div>
            {isTopLevel && (
              <div className="flex justify-between items-center gap-2">
                <div className="flex-1">
                  {children.length > 0 && (
                    <Button
                      variant="white"
                      size={isMobile ? "xs" : "sm"}
                      onClick={toggleAllChildren}
                      className="opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                    >
                      <CareIcon
                        icon={allExpanded ? "l-minus" : "l-plus"}
                        className="h-4 w-4"
                      />
                      <span className="hidden lg:inline">
                        {t(allExpanded ? "collapse_all" : "expand_all")}
                      </span>
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="white"
                    size={isMobile ? "xs" : "sm"}
                    onClick={() => handleEditLocation(location)}
                    className="opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <PenLine className="h-4 w-4" />
                    <span className="hidden lg:inline">{t("edit")}</span>
                  </Button>

                  <Button
                    variant="white"
                    size={isMobile ? "xs" : "sm"}
                    asChild
                    className="opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link
                      href={`/location/${location.id}`}
                      className="text-gray-900 flex items-center"
                    >
                      <CareIcon icon="l-eye" className="h-4 w-4" />
                      <span className="hidden lg:inline">
                        {t("see_details")}
                      </span>
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </TableCell>
          <TableCell className="hidden sm:table-cell border-l bg-white font-semibold text-gray-900">
            {getLocationFormLabel(location.form)}
          </TableCell>
        </TableRow>
        {isExpanded &&
          children.map((child) => (
            <LocationRow
              key={child.id}
              location={child}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
              getChildren={getChildren}
              indent={indent + 1}
            />
          ))}
      </>
    );
  };

  const renderListView = () => {
    if (isLoading) {
      return <TableSkeleton count={6} />;
    }

    if (!tableData?.length) {
      return (
        <Card className="col-span-full">
          <CardContent className="p-6 text-center text-gray-500">
            {searchQuery
              ? t("no_locations_found")
              : t("no_locations_available")}
          </CardContent>
        </Card>
      );
    }

    return (
      <Table className="border rounded-lg w-full overflow-hidden">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80%] border text-gray-700 bg-gray-200">
              {t("name")}
            </TableHead>
            <TableHead className="hidden sm:table-cell bg-gray-200 text-gray-700">
              {t("location_form")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTopLevelLocations.map((location) => (
            <LocationRow
              key={location.id}
              location={location}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
              getChildren={getChildren}
              indent={1}
            />
          ))}
        </TableBody>
      </Table>
    );
  };

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
                  <div className="flex flex-wrap items-baseline">
                    <span className="inline-block mr-1">{t("click")}</span>
                    <span className="inline-block font-semibold mr-1">
                      {t("add_location")}
                    </span>
                    <span className="inline-block">
                      {t("to_add_main_location")}.
                    </span>
                  </div>
                  {/* Desktop view text */}
                  <div className="hidden lg:flex flex-wrap items-baseline">
                    <span className="inline-block mr-1">
                      {t("hover_focus_reveal")}
                    </span>
                    <span className="inline-block font-semibold mr-1">
                      {t("see_details")}
                    </span>
                    <span className="inline-block break-words">
                      {t("open_manage_sub_locations")}
                    </span>
                  </div>
                  {/* Mobile and Tablet view text */}
                  <div className="flex lg:hidden flex-wrap items-baseline">
                    <span className="inline-block break-words">
                      {t("click_on")}{" "}
                      <span className="inline-flex items-center gap-1">
                        "<PenLine className="h-4 w-4" />"
                      </span>{" "}
                      {t("to_edit")},{" "}
                      <span className="inline-flex items-center gap-1">
                        "<CareIcon icon="l-eye" className="h-4 w-4" />"
                      </span>{" "}
                      {t("open_manage_sub_locations")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {
            activeTab === "list"
              ? renderListView()
              : /* Map view will be added later
            <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">{t("map_view_coming_soon")}</p>
            </div>
            */
                renderListView() // Default to list view for now
          }

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
