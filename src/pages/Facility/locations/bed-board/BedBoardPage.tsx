import { useQuery } from "@tanstack/react-query";
import {
  BedDouble,
  ChevronsUpDown,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import { navigate } from "@/lib/router/navigate";
import { cn } from "@/lib/utils";
import { LocationRead } from "@/types/location/location";
import { buildLocationPath } from "@/types/location/utils";

import { BedBoard } from "./BedBoard";
import { BedBoardTree } from "./BedBoardTree";
import { BedBoardTreeSkeleton } from "./BedBoardTreeSkeleton";
import { locationQuery, myLocationsQuery } from "./locationQueries";
import { useLocationsWithBeds } from "./useLocationsWithBeds";

interface BedBoardPageProps {
  facilityId: string;
  locationId?: string;
}

/** Find patients by where they are: the user's locations and their beds. */
export default function BedBoardPage({
  facilityId,
  locationId,
}: BedBoardPageProps) {
  const { t } = useTranslation();
  const [treeOpen, setTreeOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: myLocations, isLoading: isLoadingMyLocations } = useQuery(
    myLocationsQuery(facilityId),
  );
  // Reception, stores and the like hold no beds: leave them out of the board.
  const { locations: assigned, isLoading: isCheckingBeds } =
    useLocationsWithBeds(facilityId, myLocations?.results);
  // A location assigned along with one of its parents is listed once, under
  // that parent.
  const assignedIds = new Set(assigned.map((location) => location.id));
  const roots = assigned.filter(
    (location) =>
      !buildLocationPath(location)
        .slice(0, -1)
        .some((ancestor) => assignedIds.has(ancestor.id)),
  );
  const rootIds = new Set(roots.map((root) => root.id));
  const isLoading = isLoadingMyLocations || isCheckingBeds;
  const { data: selectedLocation } = useQuery({
    ...locationQuery(facilityId, locationId ?? ""),
    enabled: !!locationId,
  });
  const inUse = roots.filter((root) => root.status === "active");
  const firstRootId = isLoading
    ? undefined
    : (inUse.find((root) => root.has_beds) ?? inUse[0] ?? roots[0])?.id;

  // Open the first location in use that has beds instead of an empty board.
  useEffect(() => {
    if (!locationId && firstRootId) {
      navigate({
        to: "/facility/$facilityId/encounters/locations/$locationId",
        params: { facilityId, locationId: firstRootId },
        replace: true,
      });
    }
  }, [facilityId, locationId, firstRootId]);

  const openLocation = (location: LocationRead) => {
    setTreeOpen(false);
    navigate({
      to: "/facility/$facilityId/encounters/locations/$locationId",
      params: { facilityId, locationId: location.id },
    });
  };

  if (!locationId) {
    return isLoading || firstRootId ? (
      <div role="status" className="space-y-4 py-4">
        <span className="sr-only">{t("loading")}</span>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    ) : (
      <EmptyState
        icon={<BedDouble className="size-8 text-placeholder-foreground" />}
        title={t(
          myLocations?.results.length
            ? "no_beds_found"
            : "no_locations_assigned_to_you",
        )}
        description={
          myLocations?.results.length ? t("no_locations_with_beds") : undefined
        }
        className="mt-4 py-16"
      />
    );
  }

  const tree = (
    <BedBoardTree
      facilityId={facilityId}
      roots={roots}
      selectedLocationId={locationId}
      selectedLocation={
        selectedLocation?.id === locationId ? selectedLocation : undefined
      }
      onSelect={openLocation}
    />
  );

  const hasTree = isLoading || roots.length > 0;
  const treeContent = isLoading ? <BedBoardTreeSkeleton /> : tree;

  return (
    <div className="mt-2 mb-4 flex items-stretch md:mt-4 md:mb-0 md:h-[calc(100svh-6.5rem)] md:overflow-clip md:rounded-lg md:border md:border-border md:bg-card md:shadow-xs">
      {hasTree && (
        <aside
          className={cn(
            "hidden shrink-0 border-r border-border transition-all duration-200 motion-reduce:transition-none md:block",
            sidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0",
          )}
          inert={!sidebarOpen}
        >
          <div className="flex h-full w-64 flex-col">
            <h2 className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-sm font-semibold">
              <MapPin className="size-4" aria-hidden="true" />
              {t("locations")}
            </h2>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {treeContent}
            </div>
          </div>
        </aside>
      )}
      <div className="flex min-h-0 min-w-0 flex-1">
        <BedBoard
          key={locationId}
          embedded
          facilityId={facilityId}
          locationId={locationId}
          onOpenLocation={openLocation}
          // The breadcrumb links only to places the tree shows: a parent above
          // the user's locations may not be open to them.
          canOpenAncestor={
            roots.length > 0
              ? (ancestor, ancestors) =>
                  ancestors
                    .slice(0, ancestors.indexOf(ancestor) + 1)
                    .some((step) => rootIds.has(step.id))
              : undefined
          }
          leading={
            roots.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-2 hidden size-8 md:inline-flex"
                  onClick={() => setSidebarOpen((open) => !open)}
                  aria-expanded={sidebarOpen}
                  aria-label={t(sidebarOpen ? "close_sidebar" : "open_sidebar")}
                >
                  {sidebarOpen ? (
                    <PanelLeftClose aria-hidden="true" />
                  ) : (
                    <PanelLeftOpen aria-hidden="true" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between md:hidden"
                  onClick={() => setTreeOpen(true)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MapPin aria-hidden="true" />
                    <span className="truncate">{t("change_location")}</span>
                  </span>
                  <ChevronsUpDown
                    className="text-muted-foreground"
                    aria-hidden="true"
                  />
                </Button>
              </>
            )
          }
        />
      </div>
      <Drawer open={treeOpen} onOpenChange={setTreeOpen} direction="bottom">
        <DrawerContent aria-describedby={undefined} height="fixed">
          <DrawerHeader showCloseButton className="border-b shadow-2xs">
            <DrawerTitle>{t("locations")}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody className="p-2">{treeContent}</DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
