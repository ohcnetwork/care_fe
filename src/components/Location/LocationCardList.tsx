import { Building2, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";

import {
  LocationList,
  LocationTypeBadgeColors,
} from "@/types/location/location";

interface LocationCardListProps {
  locations: LocationList[];
  onLocationClick: (location: LocationList) => void;
  className?: string;
}

export function LocationCardList({
  locations,
  onLocationClick,
  className = "",
}: LocationCardListProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-4", className)}>
      {locations.map((location) => (
        <Card
          key={location.id}
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onLocationClick(location)}
        >
          <CardHeader className="p-4">
            <div className="flex justify-between items-center mb-2">
              <Building2 className="size-5 text-blue-500" />
              <Badge
                variant="secondary"
                className={LocationTypeBadgeColors[location.form]}
              >
                {t(`location_form__${location.form}`)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">{location.name}</p>
              <ChevronRight className="size-5" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
