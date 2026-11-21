import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Muted } from "@/components/ui/typography";

import { locationChildrenQuery } from "@/pages/Facility/locations/bed-board/locationQueries";
import LocationSheet from "@/pages/Facility/settings/locations/LocationSheet";
import { useLocationActions } from "@/pages/Facility/settings/locations/useLocationActions";
import { LocationRead } from "@/types/location/location";

import { LocationLists } from "./LocationLists";

interface LocationChildrenProps {
  facilityId: string;
  /** The location whose contents are listed. Leave out for the top of the facility. */
  parent?: LocationRead;
}

/**
 * What a location holds: the locations inside it as a list to open, and its
 * beds as a grid. Everything is loaded, so the search filters as you type.
 */
export function LocationChildren({
  facilityId,
  parent,
}: LocationChildrenProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  // `null` is closed; without a location it adds one; with one it manages it.
  const [sheet, setSheet] = useState<{ location?: LocationRead } | null>(null);
  const [toDelete, setToDelete] = useState<LocationRead | null>(null);
  const { remove, move, refresh } = useLocationActions(facilityId);

  const parentId = parent?.id ?? "";
  // A request is skipped only when the parent says it holds nothing of that
  // kind. Without the flag, the request is made.
  const holdsSubLocations = parent?.has_sub_locations !== false;
  // Beds sit inside a location, never at the top of the facility.
  const holdsBeds = !!parent && parent.has_beds !== false;
  const subLocationsQuery = useQuery({
    ...locationChildrenQuery(facilityId, parentId, "kind"),
    enabled: holdsSubLocations,
  });
  const bedsQuery = useQuery({
    ...locationChildrenQuery(facilityId, parentId, "instance"),
    enabled: holdsBeds,
  });
  // A skipped request is not refreshed, so rows cached on an earlier visit
  // are not shown once the parent says it holds none.
  const subLocations = holdsSubLocations
    ? (subLocationsQuery.data?.results ?? [])
    : [];
  const beds = holdsBeds ? (bedsQuery.data?.results ?? []) : [];
  // A failed request is not an empty list: say so and offer to try again.
  // A request the parent's flag has switched off is no longer asked for, so
  // an error it left behind does not count.
  const failed = [
    ...(holdsSubLocations ? [subLocationsQuery] : []),
    ...(holdsBeds ? [bedsQuery] : []),
  ].filter((query) => query.isError);
  const isEmpty = subLocations.length + beds.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder={t("search_by_name")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full sm:w-72"
        />
        <Button variant="primary" onClick={() => setSheet({})}>
          <Plus aria-hidden="true" />
          {t("add_location")}
        </Button>
      </div>

      {failed.length > 0 && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
        >
          <Muted>{t("failed_to_load_locations")}</Muted>
          <Button
            variant="outline"
            size="sm"
            onClick={() => failed.forEach((query) => query.refetch())}
          >
            {t("retry")}
          </Button>
        </div>
      )}

      {subLocationsQuery.isLoading || bedsQuery.isLoading ? (
        <div role="status" className="space-y-2">
          <span className="sr-only">{t("loading")}</span>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isEmpty ? (
        failed.length === 0 && (
          <EmptyState
            className="rounded-xl border border-dashed"
            icon={<MapPin className="size-6 text-muted-foreground" />}
            title={t(
              parent ? "no_child_locations_found" : "no_locations_found",
            )}
          />
        )
      ) : (
        <LocationLists
          facilityId={facilityId}
          subLocations={subLocations}
          beds={beds}
          search={search}
          showSubLocationHeading={!!parent}
          onManage={(location) => setSheet({ location })}
          onMove={move}
          onDelete={setToDelete}
        />
      )}

      <LocationSheet
        open={!!sheet}
        onOpenChange={(open) => {
          if (open) return;
          setSheet(null);
          // A new bed or sub-location changes what the parent holds.
          refresh();
        }}
        facilityId={facilityId}
        location={sheet?.location}
        parentId={parent?.id}
      />
      <ConfirmActionDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("remove_name", { name: toDelete?.name })}
        description={t("are_you_sure_want_to_delete", { name: toDelete?.name })}
        confirmText={t("remove")}
        onConfirm={() => toDelete && remove(toDelete)}
        variant="destructive"
      />
    </div>
  );
}
