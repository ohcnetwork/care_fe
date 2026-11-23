import { ImagePlus } from "lucide-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";

import ContactLink from "@/components/Common/ContactLink";
import { FacilityMapsLink } from "@/components/Facility/FacilityMapLink";

import { type FacilityRead } from "@/types/facility/facility";
import { renderGeoOrganizations } from "@/types/organization/organization";

interface FacilitySettingsOverviewProps {
  facility: FacilityRead;
  actions: ReactNode;
  settingsActions?: ReactNode;
  canUpdateFacility: boolean;
  onEditCoverImage: () => void;
}

export function FacilitySettingsOverview({
  facility,
  actions,
  settingsActions,
  canUpdateFacility,
  onEditCoverImage,
}: FacilitySettingsOverviewProps) {
  const { t } = useTranslation();
  const geoPath = facility.geo_organization
    ? renderGeoOrganizations(facility.geo_organization)
        .map(({ value }) => value)
        .join(", ")
    : "";
  const phoneNumber = facility.phone_number
    ? formatPhoneNumberIntl(String(facility.phone_number))
    : undefined;
  const hasLocation = Boolean(facility.latitude && facility.longitude);

  return (
    <div className="space-y-6">
      <section aria-label={facility.name} data-cy="facility-settings-header">
        <Card className="overflow-hidden">
          <div
            className="relative h-48 border-b border-border bg-muted sm:h-40"
            data-cy="facility-cover"
          >
            {facility.read_cover_image_url ? (
              <>
                <img
                  src={facility.read_cover_image_url}
                  alt={facility.name}
                  className="h-full w-full object-cover"
                  data-cy="facility-cover-image"
                />
                {canUpdateFacility && (
                  <Button
                    variant="outline"
                    className="absolute right-4 bottom-4"
                    onClick={onEditCoverImage}
                  >
                    <ImagePlus aria-hidden="true" />
                    {t("edit_cover_photo")}
                  </Button>
                )}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("facility_settings_cover_empty")}
                </p>
                {canUpdateFacility && (
                  <Button
                    variant="ghost"
                    className="underline underline-offset-4"
                    onClick={onEditCoverImage}
                  >
                    <ImagePlus aria-hidden="true" />
                    {t("facility_settings_add_cover")}
                  </Button>
                )}
              </div>
            )}
          </div>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="min-w-0 flex-1 basis-64 space-y-2">
              <h2 className="break-words text-2xl leading-tight font-semibold">
                {facility.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge
                  variant="secondary"
                  className="max-w-full whitespace-normal"
                >
                  {facility.facility_type}
                </Badge>
              </div>
            </div>
            {actions && (
              <div className="flex w-full flex-wrap gap-4 sm:w-auto">
                {actions}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="facility-details-heading" className="min-w-0">
          <Card>
            <CardHeader className="border-b border-border py-4">
              <CardTitle>
                <h2
                  id="facility-details-heading"
                  className="text-base font-semibold"
                >
                  {t("facility_details")}
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-4" data-cy="facility-contact">
              <div className="min-w-0 break-words leading-6">
                {facility.address && (
                  <p className="whitespace-pre-wrap">{facility.address}</p>
                )}
                {geoPath && <p className="text-muted-foreground">{geoPath}</p>}
              </div>
              {(phoneNumber || hasLocation) && (
                // Offset ghost padding and border so the first link lines up with the address.
                <div className="-my-1.5 -ml-3.25 flex flex-wrap items-center gap-x-2">
                  {facility.phone_number && phoneNumber && (
                    <ContactLink
                      tel={String(facility.phone_number)}
                      label={phoneNumber}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "text-foreground underline underline-offset-4",
                      )}
                    />
                  )}
                  {facility.latitude && facility.longitude && (
                    <FacilityMapsLink
                      latitude={facility.latitude}
                      longitude={facility.longitude}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "text-foreground underline underline-offset-4",
                      )}
                    />
                  )}
                </div>
              )}
            </CardContent>
            {facility.description && (
              <CardContent
                className="space-y-1 border-t border-border py-4"
                data-cy="facility-description"
              >
                <h3 className="text-muted-foreground">{t("description")}</h3>
                <Markdown
                  content={facility.description}
                  className="break-words text-sm leading-6"
                />
              </CardContent>
            )}
          </Card>
        </section>
        {settingsActions && (
          <aside className="min-w-0">{settingsActions}</aside>
        )}
      </div>
    </div>
  );
}
