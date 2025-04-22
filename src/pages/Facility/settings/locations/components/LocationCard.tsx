import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { LocationList, LocationTypeIcons } from "@/types/location/location";

interface Props {
  location: LocationList;
  onView?: (location: LocationList) => void;
  className?: string;
  facilityId: string;
}

export function LocationCard({ location, onView, className }: Props) {
  const { t } = useTranslation();
  const Icon =
    LocationTypeIcons[location.form as keyof typeof LocationTypeIcons] ||
    Folder;

  return (
    <Card className={cn("overflow-hidden bg-white h-full", className)}>
      <div className="flex flex-col h-full">
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="size-12 shrink-0 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
              <Icon className="size-5" />
            </div>

            <div className="flex grow flex-col min-w-0 overflow-hidden">
              <h3 className="truncate text-base sm:text-lg font-semibold">
                {location.name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {t(`location_form__${location.form}`)}
              </p>

              <div className="mt-2 flex flex-wrap gap-2 overflow-hidden">
                <Badge
                  variant={
                    location.status === "active" ? "default" : "secondary"
                  }
                >
                  {t(location.status)}
                </Badge>
                <Badge
                  variant={
                    !location.current_encounter ? "default" : "destructive"
                  }
                  className="capitalize"
                >
                  {location.current_encounter
                    ? t("unavailable")
                    : t("available")}
                </Badge>
                {location.has_children && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <FolderOpen className="size-3" />
                    {t("has_child_locations")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-gray-100 bg-gray-50 p-4">
          <div className="flex justify-between">
            <div className="ml-auto">
              <Button
                data-cy="view-details-location-button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => onView?.(location)}
              >
                {t("view_details")}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
