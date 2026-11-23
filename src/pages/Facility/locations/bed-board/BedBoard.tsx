import { useQueries, useQuery } from "@tanstack/react-query";
import { ChevronRight, Search } from "lucide-react";
import { Fragment, type ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { TagBadges } from "@/components/Tags/TagBadges";

import { LocationRead, LocationTypeIcons } from "@/types/location/location";
import { buildLocationPath } from "@/types/location/utils";

import { BedGridSkeleton } from "./BedGridSkeleton";
import { BedSection } from "./BedSection";
import { type BedFilter, BedStateFilter } from "./BedStateFilter";
import { countBeds, getBedState, matchesBedSearch } from "./bedState";
import { locationChildrenQuery, locationQuery } from "./locationQueries";
import { useLocationsWithBeds } from "./useLocationsWithBeds";

interface BedBoardProps {
  facilityId: string;
  locationId: string;
  onOpenLocation: (location: LocationRead) => void;
  hideBreadcrumb?: boolean;
  /** Rendered above the title, e.g. the button that opens the tree on a phone. */
  leading?: ReactNode;
}

/**
 * Every bed of one location: its own beds, then the beds of each room
 * directly inside it. Render it with `key={locationId}` so the search and
 * the filter start empty for each location.
 */
export function BedBoard({
  facilityId,
  locationId,
  onOpenLocation,
  hideBreadcrumb = false,
  leading,
}: BedBoardProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BedFilter>("all");

  const { data: location, isLoading: isLoadingLocation } = useQuery(
    locationQuery(facilityId, locationId),
  );
  // The flags say what the location holds, so an empty branch costs no request.
  const { data: subLocations, isLoading: isLoadingSubLocations } = useQuery({
    ...locationChildrenQuery(facilityId, locationId, "kind"),
    enabled: !!location?.has_sub_locations,
  });
  const { data: ownBedList, isLoading: isLoadingOwnBeds } = useQuery({
    ...locationChildrenQuery(facilityId, locationId, "instance"),
    enabled: !!location?.has_beds,
  });
  const rooms = subLocations?.results.filter((room) => room.has_beds) ?? [];
  // Sub-locations without beds of their own are offered only when a bed sits
  // somewhere below them, so no link leads to an empty branch.
  const { locations: deeperAreas, isLoading: isCheckingDeeperAreas } =
    useLocationsWithBeds(
      facilityId,
      subLocations?.results.filter((area) => !area.has_beds),
    );
  const roomBedLists = useQueries({
    queries: rooms.map((room) =>
      locationChildrenQuery(facilityId, room.id, "instance"),
    ),
  });

  if (isLoadingLocation) {
    return (
      <div
        role="status"
        className="min-w-0 flex-1 space-y-4 rounded-lg border border-border bg-card p-4 shadow-xs md:p-6"
      >
        <span className="sr-only">{t("loading")}</span>
        {leading}
        <Skeleton className="h-7 w-56 max-w-full" />
        <BedGridSkeleton />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-w-0 flex-1 space-y-4 rounded-lg border border-border bg-card p-4 shadow-xs md:p-6">
        {leading}
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t("location_not_found")}
        </p>
      </div>
    );
  }

  // A link can point at a bed itself: show that one bed.
  const ownBeds =
    location.mode === "instance" ? [location] : (ownBedList?.results ?? []);
  const sections = rooms.map((room, index) => ({
    room,
    beds: roomBedLists[index]?.data?.results ?? [],
    isLoading: roomBedLists[index]?.isLoading ?? false,
  }));
  const allBeds = [...ownBeds, ...sections.flatMap((section) => section.beds)];
  const isLoadingBeds =
    isLoadingSubLocations ||
    isLoadingOwnBeds ||
    isCheckingDeeperAreas ||
    sections.some((section) => section.isLoading);

  const isVisible = (bed: LocationRead) =>
    matchesBedSearch(bed, search) &&
    (filter === "all" || getBedState(bed) === filter);
  const visibleOwnBeds = ownBeds.filter(isVisible);
  const visibleSections = sections
    .map((section) => ({
      ...section,
      visibleBeds: section.beds.filter(isVisible),
    }))
    .filter((section) => section.visibleBeds.length > 0);
  const hasVisibleBeds =
    visibleOwnBeds.length > 0 || visibleSections.length > 0;

  const ancestors = buildLocationPath(location).slice(0, -1);

  return (
    <section
      aria-labelledby={headingId}
      data-cy="bed-board"
      className="min-w-0 flex-1 space-y-4 rounded-lg border border-border bg-card p-4 shadow-xs md:p-6"
    >
      {leading}
      <div className="space-y-2">
        {!hideBreadcrumb && ancestors.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {ancestors.map((ancestor) => (
                <Fragment key={ancestor.id}>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <button
                        type="button"
                        className="cursor-pointer"
                        onClick={() => onOpenLocation(ancestor)}
                      >
                        {ancestor.name}
                      </button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2
            id={headingId}
            className="text-xl leading-tight font-semibold break-words"
          >
            {location.name}
          </h2>
          {location.status !== "active" && (
            <Badge variant="secondary" size="sm">
              {t("inactive")}
            </Badge>
          )}
          <TagBadges tags={location.tags} size="xs" hierarchyDisplay />
        </div>
      </div>

      {allBeds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="relative min-w-0 flex-1 basis-56 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              className="pl-9"
              aria-label={t("search_beds_or_patients")}
              placeholder={t("search_beds_or_patients")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <BedStateFilter
            value={filter}
            onChange={setFilter}
            counts={countBeds(allBeds)}
          />
        </div>
      )}

      {visibleOwnBeds.length > 0 && (
        <BedSection
          facilityId={facilityId}
          beds={visibleOwnBeds}
          counts={countBeds(ownBeds)}
        />
      )}
      {visibleSections.map((section) => (
        <BedSection
          key={section.room.id}
          facilityId={facilityId}
          room={section.room}
          onOpenRoom={onOpenLocation}
          beds={section.visibleBeds}
          counts={countBeds(section.beds)}
        />
      ))}

      {isLoadingBeds ? (
        <div role="status">
          <span className="sr-only">{t("loading")}</span>
          <BedGridSkeleton />
        </div>
      ) : allBeds.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t(
            deeperAreas.length > 0
              ? "no_beds_in_location_pick_area"
              : "no_beds_in_location",
          )}
        </p>
      ) : (
        !hasVisibleBeds && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("no_beds_match_filters")}
          </p>
        )
      )}

      {deeperAreas.length > 0 && (
        <nav aria-label={t("more_areas")} className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t("more_areas")}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {deeperAreas.map((area) => {
              const Icon = LocationTypeIcons[area.form];
              return (
                <li key={area.id} className="min-w-0 max-w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="max-w-full"
                    onClick={() => onOpenLocation(area)}
                  >
                    <Icon aria-hidden="true" />
                    <span className="truncate">{area.name}</span>
                    <ChevronRight
                      className="text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </section>
  );
}
