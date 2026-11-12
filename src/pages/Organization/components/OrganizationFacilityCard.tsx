import { ArrowUpRight, Settings } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";

import { cn } from "@/lib/utils";

import { FacilityListRead } from "@/types/facility/facility";
import { renderGeoOrganizations } from "@/types/organization/organization";

interface Props {
  facility: FacilityListRead;
  showSettings?: boolean;
}

export function OrganizationFacilityCard({ facility, showSettings }: Props) {
  const { t } = useTranslation();

  // The list API returns an empty object when a facility has no geo organization.
  const geoPath = facility.geo_organization?.name
    ? renderGeoOrganizations(facility.geo_organization).map((d) => d.value)
    : [];
  const location = geoPath.slice(0, 2).join(", ") || facility.address;
  const fullLocation = geoPath.join(", ") || facility.address;

  return (
    <Card className="@container/facility-card flex h-full flex-col overflow-hidden">
      <div
        className={cn(
          "aspect-5/2 shrink-0 overflow-hidden bg-muted",
          facility.read_cover_image_url && "border-b border-border",
        )}
      >
        {facility.read_cover_image_url ? (
          <img
            src={facility.read_cover_image_url}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center overflow-hidden"
            aria-hidden="true"
          >
            <Avatar
              name={facility.name}
              className="rounded-none after:hidden [&_text]:text-2xl! [&_text]:font-bold"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-4">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3
            className="min-w-0 flex-1 text-base font-semibold text-foreground"
            title={facility.name}
          >
            {facility.name}
          </h3>
          {facility.facility_type && (
            <Badge
              variant="secondary"
              className="max-w-1/2"
              title={facility.facility_type}
            >
              <span>{facility.facility_type}</span>
            </Badge>
          )}
        </div>

        {location && (
          <p
            className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground"
            title={fullLocation}
          >
            <span className="truncate">{location}</span>
          </p>
        )}
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-2 border-t border-border bg-muted/40 px-4 py-3",
          showSettings ? "justify-between" : "",
        )}
      >
        <Button
          variant="outline"
          size="default"
          className={showSettings ? "" : "w-full"}
          asChild
        >
          <Link href={`/facility/${facility.id}/settings/general`}>
            {t("view_facility")}
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        </Button>
        {showSettings && (
          <Button
            variant="ghost"
            size="icon"
            className="@2xs/facility-card:w-auto"
            title={t("settings")}
            asChild
          >
            <Link href={`/facility/${facility.id}/settings/departments`}>
              <Settings data-icon="inline-start" />
              <span className="sr-only @2xs/facility-card:not-sr-only">
                {t("settings")}
              </span>
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
