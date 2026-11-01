import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";

import ContactLink from "@/components/Common/ContactLink";

import { FeatureBadge } from "@/pages/Facility/Utils";
import {
  FACILITY_FEATURE_TYPES,
  type FacilityRead,
} from "@/types/facility/facility";
import { renderGeoOrganizations } from "@/types/organization/organization";

import FacilityDeleteDialog from "./FacilityDeleteDialog";
import { FacilityHomeCover } from "./FacilityHomeCover";
import { FacilityMapsLink } from "./FacilityMapLink";

interface FacilityHomeOverviewProps {
  facility: FacilityRead;
  actions: ReactNode;
  canUpdateFacility: boolean;
  canDelete: boolean;
  onEditCoverImage: () => void;
}

export function FacilityHomeOverview({
  facility: facilityData,
  actions,
  canUpdateFacility,
  canDelete,
  onEditCoverImage,
}: FacilityHomeOverviewProps) {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto pt-2">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="border-none bg-transparent shadow-none">
          <FacilityHomeCover
            facility={facilityData}
            canUpdateFacility={canUpdateFacility}
            onEditCoverImage={onEditCoverImage}
          />

          <div className="flex justify-end max-sm:flex-col-reverse flex-wrap sm:gap-2">
            {canUpdateFacility && (
              <div className="flex gap-1 max-sm:flex-col mt-10 sm:mt-4">
                {actions}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex flex-col [@media(min-width:60rem)]:flex-row gap-3">
              <Card className="basis-1/2">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1 sm:col-span-2 flex flex-col">
                      <span className="font-semibold">{t("address")}</span>
                      <span className="text-gray-700 whitespace-pre-wrap wrap-break-word text-sm">
                        {facilityData.address}
                      </span>
                    </div>

                    <div className="flex flex-col mt-2">
                      <span className="font-semibold">
                        {t("mobile_number")}
                      </span>
                      <span className="text-gray-700 truncate text-sm">
                        <ContactLink
                          tel={formatPhoneNumberIntl(
                            String(facilityData.phone_number),
                          )}
                        />
                      </span>
                    </div>
                    {facilityData.latitude && facilityData.longitude && (
                      <div className="flex flex-col mt-2">
                        <span className="font-semibold">
                          {t("location_details")}
                        </span>
                        <span className="text-sm">
                          <FacilityMapsLink
                            latitude={facilityData.latitude}
                            longitude={facilityData.longitude}
                          />
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="basis-1/2 ">
                <CardContent>
                  <div className="grid grid-cols-1 mt-6 sm:grid-cols-2 gap-4">
                    {facilityData.geo_organization &&
                      renderGeoOrganizations(facilityData.geo_organization).map(
                        (item, index) => (
                          <div key={index} className="flex flex-col">
                            <span className="font-semibold truncate">
                              {item.label}
                            </span>
                            <span className="text-gray-700 text-sm truncate">
                              {item.value}
                            </span>
                          </div>
                        ),
                      )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {facilityData.features?.some((feature: number) =>
              FACILITY_FEATURE_TYPES.some((f) => f.id === feature),
            ) && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="font-semibold text-lg">
                    {t("features")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {facilityData.features?.map((featureId: number) => (
                      <FeatureBadge key={featureId} featureId={featureId} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {facilityData.description && (
              <Card>
                <CardContent className="mt-4 wrap-break-word">
                  <Markdown
                    content={facilityData.description}
                    className="text-sm"
                  />
                </CardContent>
              </Card>
            )}
            {canDelete && (
              <Card className="border-2 border-red-400">
                <CardHeader className="pb-4">
                  <CardTitle className="font-semibold text-lg">
                    {t("danger_zone")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 border rounded-md border-gray-300">
                    <div>
                      <p className="text-sm font-medium">
                        {t("delete_facility")}
                      </p>
                      <p className="text-sm text-gray-700">
                        {t("delete_facility_description")}
                      </p>
                    </div>
                    <FacilityDeleteDialog facility={facilityData} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
