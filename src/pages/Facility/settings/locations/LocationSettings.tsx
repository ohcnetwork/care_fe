import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CareUIPageTitle } from "@/components/ui/typography";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import { navigate } from "@/lib/router/navigate";
import { locationChildrenQuery } from "@/pages/Facility/locations/bed-board/locationQueries";
import locationApi from "@/types/location/locationApi";
import { buildLocationPath } from "@/types/location/utils";

import LocationView from "./LocationView";
import { LocationChildren } from "./components/LocationChildren";
import { LocationTreeNode } from "./components/LocationTreeNode";

interface LocationSettingsProps {
  facilityId: string;
  locationId?: string;
}

export default function LocationSettings({
  facilityId,
  locationId,
}: LocationSettingsProps) {
  const { t } = useTranslation();
  const [expandedLocations, setExpandedLocations] = useState<
    ReadonlySet<string>
  >(new Set());

  const { data: topLocations } = useQuery(
    locationChildrenQuery(facilityId, "", "kind"),
  );
  const { data: selectedLocation } = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
    enabled: !!locationId,
  });

  // When another location opens, expand the tree down to it, so the tree
  // shows where the open location sits.
  const [shownLocationId, setShownLocationId] = useState<string>();
  if (selectedLocation && shownLocationId !== selectedLocation.id) {
    setShownLocationId(selectedLocation.id);
    setExpandedLocations(
      (previous) =>
        new Set([
          ...previous,
          ...buildLocationPath(selectedLocation).map((location) => location.id),
        ]),
    );
  }

  const toggleExpanded = (id: string) =>
    setExpandedLocations((previous) => {
      const next = new Set(previous);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <Page
      title={selectedLocation?.name ?? t("locations")}
      hideTitleOnPage
      className="p-0"
    >
      <div className="container mx-auto space-y-4 pt-4">
        <CareUIPageTitle>{t("locations")}</CareUIPageTitle>

        <div className="flex items-start gap-4">
          <Card className="hidden max-h-[calc(100svh-10rem)] w-64 shrink-0 overflow-y-auto p-2 md:block">
            <nav aria-label={t("locations")}>
              {!topLocations ? (
                <div role="status" className="space-y-2 p-2">
                  <span className="sr-only">{t("loading")}</span>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-36" />
                </div>
              ) : topLocations.results.length ? (
                <ul>
                  {topLocations.results.map((location) => (
                    <LocationTreeNode
                      key={location.id}
                      location={location}
                      facilityId={facilityId}
                      selectedLocationId={locationId}
                      expandedLocations={expandedLocations}
                      onToggleExpand={toggleExpanded}
                      onSelect={(selected) =>
                        navigate({
                          to: "/facility/$facilityId/settings/locations/$id",
                          params: { facilityId, id: selected.id },
                        })
                      }
                    />
                  ))}
                </ul>
              ) : (
                <p className="p-2 text-sm text-muted-foreground">
                  {t("no_locations_available")}
                </p>
              )}
            </nav>
          </Card>

          <div className="min-w-0 flex-1">
            {locationId ? (
              <LocationView
                key={locationId}
                id={locationId}
                facilityId={facilityId}
              />
            ) : (
              <Card>
                <CardContent className="p-4 md:p-6">
                  <LocationChildren facilityId={facilityId} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
