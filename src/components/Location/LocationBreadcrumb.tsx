import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

import { LocationRead } from "@/types/location/location";

interface LocationBreadcrumbProps {
  selectedLocation: LocationRead | null;
  locationHistory: LocationRead[];
  onLocationClick: (location: LocationRead) => void;
  onRootClick: () => void;
}

export function LocationBreadcrumb({
  selectedLocation,
  locationHistory,
  onLocationClick,
  onRootClick,
}: LocationBreadcrumbProps) {
  const { t } = useTranslation();

  if (!selectedLocation) {
    return <></>;
  }

  return (
    <Breadcrumb className="mt-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 font-normal"
            onClick={onRootClick}
          >
            {t("locations")}
          </Button>
        </BreadcrumbItem>
        {locationHistory.slice(0, -1).map((location) => (
          <Fragment key={location.id}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 font-normal"
                onClick={() => onLocationClick(location)}
              >
                {location.name}
              </Button>
            </BreadcrumbItem>
          </Fragment>
        ))}
        {locationHistory.length > 0 && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {locationHistory[locationHistory.length - 1].name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
