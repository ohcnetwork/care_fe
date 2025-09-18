import { useQuery } from "@tanstack/react-query";
import { Bed, Filter, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import useFilters from "@/hooks/useFilters";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import Page from "@/components/Common/Page";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { BedStatusLegend } from "@/components/Location/BedStatusLegend";

import query from "@/Utils/request/query";
import {
  LOCATION_TYPE_BADGE_COLORS,
  LocationList,
  LocationTypeIcons,
} from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import useCurrentFacility from "./utils/useCurrentFacility";

interface BedAvailabilityDashboardProps {
  facilityId: string;
}

interface BedStats {
  total: number;
  available: number;
  occupied: number;
  reserved: number;
}

interface WardStats extends BedStats {
  id: string;
  name: string;
  form: string;
  beds: LocationList[];
}

export default function BedAvailabilityDashboard({
  facilityId,
}: BedAvailabilityDashboardProps) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Use query parameters for filters to enable URL sharing and navigation
  const { qParams, updateQuery } = useFilters({
    limit: 0, // Disable pagination as we want to show all wards
    cacheBlacklist: ["refresh"], // Don't cache refresh parameter
  });

  const searchQuery = (qParams.search as string) || "";
  const selectedWard = (qParams.ward as string) || "all";
  const selectedStatus = (qParams.status as string) || "all";

  // Fetch all locations for the facility
  const {
    data: locations,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["facility-locations-all", facilityId, qParams.refresh],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { limit: 1000 }, // Get all locations
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Process locations to extract wards and beds
  const { wards, overallStats } = useMemo(() => {
    if (!locations?.results) {
      return {
        wards: [],
        overallStats: { total: 0, available: 0, occupied: 0, reserved: 0 },
      };
    }

    const allLocations = locations.results;
    const wardMap = new Map<string, WardStats>();
    let totalBeds = 0;
    let availableBeds = 0;
    let occupiedBeds = 0;
    let reservedBeds = 0;

    // Process all locations to find wards and beds
    allLocations.forEach((location) => {
      if (location.form === "bd") {
        // This is a bed
        totalBeds++;

        if (location.current_encounter) {
          if (location.current_encounter.status === "discharged") {
            availableBeds++; // Discharged patients make beds available
          } else {
            occupiedBeds++;
          }
        } else {
          availableBeds++;
        }

        // Find the parent ward for this bed
        const ward = location.parent;
        if (ward) {
          const wardId = ward.id;
          if (!wardMap.has(wardId)) {
            wardMap.set(wardId, {
              id: wardId,
              name: ward.name,
              form: ward.form,
              total: 0,
              available: 0,
              occupied: 0,
              reserved: 0,
              beds: [],
            });
          }

          const wardStats = wardMap.get(wardId)!;
          wardStats.total++;
          wardStats.beds.push(location);

          if (location.current_encounter) {
            if (location.current_encounter.status === "discharged") {
              wardStats.available++;
            } else {
              wardStats.occupied++;
            }
          } else {
            wardStats.available++;
          }
        }
      }
    });

    return {
      wards: Array.from(wardMap.values()),
      overallStats: {
        total: totalBeds,
        available: availableBeds,
        occupied: occupiedBeds,
        reserved: reservedBeds,
      },
    };
  }, [locations]);

  // Filter wards based on search and filters
  const filteredWards = useMemo(() => {
    return wards.filter((ward) => {
      const matchesSearch = ward.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesWard = selectedWard === "all" || ward.id === selectedWard;
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "available" && ward.available > 0) ||
        (selectedStatus === "occupied" && ward.occupied > 0) ||
        (selectedStatus === "reserved" && ward.reserved > 0);

      return matchesSearch && matchesWard && matchesStatus;
    });
  }, [wards, searchQuery, selectedWard, selectedStatus]);

  const handleRefresh = () => {
    // Update query params to trigger refetch and allow URL sharing of refresh state
    updateQuery({ refresh: Date.now().toString() });
    refetch();
  };

  if (isLoading) {
    return (
      <Page title={t("bed_availability_dashboard")}>
        <div className="p-6">
          <CardGridSkeleton count={6} />
        </div>
      </Page>
    );
  }

  return (
    <Page title={t("bed_availability_dashboard")}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("bed_availability_dashboard")}
            </h1>
            <p className="text-gray-600">
              {facility?.name} - {t("real_time_bed_status")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="size-4" />
              {t("refresh")}
            </Button>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Filter className="size-4" />
                  {t("filters")}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t("filter_options")}</SheetTitle>
                  <SheetDescription>
                    {t("filter_bed_availability_by_ward_and_status")}
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="ward-filter">{t("ward_unit")}</Label>
                    <Select
                      value={selectedWard}
                      onValueChange={(value) =>
                        updateQuery({
                          ward: value === "all" ? undefined : value,
                        })
                      }
                    >
                      <SelectTrigger id="ward-filter">
                        <SelectValue placeholder={t("select_ward")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("all_wards")}</SelectItem>
                        {wards.map((ward) => (
                          <SelectItem key={ward.id} value={ward.id}>
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status-filter">
                      {t("availability_status")}
                    </Label>
                    <Select
                      value={selectedStatus}
                      onValueChange={(value) =>
                        updateQuery({
                          status: value === "all" ? undefined : value,
                        })
                      }
                    >
                      <SelectTrigger id="status-filter">
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("all_statuses")}</SelectItem>
                        <SelectItem value="available">
                          {t("available")}
                        </SelectItem>
                        <SelectItem value="occupied">
                          {t("occupied")}
                        </SelectItem>
                        <SelectItem value="reserved">
                          {t("reserved")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
          <Input
            type="text"
            placeholder={t("search_wards_units")}
            value={searchQuery}
            onChange={(e) =>
              updateQuery({ search: e.target.value || undefined })
            }
            className="pl-10"
          />
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t("total_beds")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">
                {t("available")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {overallStats.available}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">
                {t("occupied")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {overallStats.occupied}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-600">
                {t("reserved")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {overallStats.reserved}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bed Status Legend */}
        <BedStatusLegend />

        {/* Ward/Unit Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("wards_units")} ({filteredWards.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredWards.map((ward) => (
              <WardCard key={ward.id} ward={ward} facilityId={facilityId} />
            ))}
          </div>
        </div>

        {filteredWards.length === 0 && (
          <div className="text-center py-12">
            <Bed className="mx-auto size-12 text-gray-400 mb-4" />
            <p className="text-gray-600">
              {searchQuery || selectedWard !== "all" || selectedStatus !== "all"
                ? t("no_wards_match_filters")
                : t("no_wards_found")}
            </p>
          </div>
        )}
      </div>
    </Page>
  );
}

interface WardCardProps {
  ward: WardStats;
  facilityId: string;
}

function WardCard({ ward }: WardCardProps) {
  const { t } = useTranslation();
  const Icon = LocationTypeIcons[ward.form as keyof typeof LocationTypeIcons];

  const occupancyRate =
    ward.total > 0 ? Math.round((ward.occupied / ward.total) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="size-5 text-blue-500" />
            <CardTitle className="text-lg">{ward.name}</CardTitle>
          </div>
          <Badge
            variant={
              LOCATION_TYPE_BADGE_COLORS[
                ward.form as keyof typeof LOCATION_TYPE_BADGE_COLORS
              ]
            }
          >
            {t(`location_form__${ward.form}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">
              {ward.available}
            </div>
            <div className="text-xs text-gray-600">{t("available")}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {ward.occupied}
            </div>
            <div className="text-xs text-gray-600">{t("occupied")}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-600">{ward.total}</div>
            <div className="text-xs text-gray-600">{t("total")}</div>
          </div>
        </div>

        {/* Occupancy Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t("occupancy_rate")}</span>
            <span className="font-medium">{occupancyRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                occupancyRate < 60
                  ? "bg-green-500"
                  : occupancyRate < 80
                    ? "bg-yellow-500"
                    : "bg-red-500",
              )}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        {/* Bed Visual Grid */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            {t("bed_layout")}
          </div>
          <div className="grid grid-cols-5 gap-1">
            {ward.beds.slice(0, 15).map((bed) => {
              const isOccupied =
                !!bed.current_encounter &&
                bed.current_encounter.status !== "discharged";
              return (
                <div
                  key={bed.id}
                  className={cn(
                    "size-6 rounded-sm border-2 flex items-center justify-center",
                    isOccupied
                      ? "bg-blue-100 border-blue-300"
                      : "bg-green-100 border-green-300",
                  )}
                  title={`${bed.name}: ${isOccupied ? t("occupied") : t("available")}`}
                >
                  <Bed
                    className={cn(
                      "size-3",
                      isOccupied ? "text-blue-600" : "text-green-600",
                    )}
                  />
                </div>
              );
            })}
            {ward.beds.length > 15 && (
              <div className="size-6 rounded-sm border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  +{ward.beds.length - 15}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
