import { ChevronRight, Folder, FolderOpen, PenLine } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { LocationList, LocationTypeIcons } from "@/types/location/location";

interface Props {
  location: LocationList;
  onEdit?: (location: LocationList) => void;
  className?: string;
}

export function LocationCard({ location, onEdit, className }: Props) {
  const { t } = useTranslation();
  const Icon =
    LocationTypeIcons[location.form as keyof typeof LocationTypeIcons] ||
    Folder;

  return (
    <Card className={cn("overflow-hidden bg-white", className)}>
      <div className="flex flex-col h-full">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
              <Icon className="h-5 w-5" />
            </div>

            <div className="flex grow flex-col min-w-0">
              <h3 className="truncate text-lg font-semibold">
                {location.name}
              </h3>
              <p className="text-sm text-gray-500">
                {t(`location_form__${location.form}`)}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
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
                    <FolderOpen className="h-3 w-3" />
                    {t("has_child_locations")}
                  </Badge>
                )}
              </div>
            </div>

            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(location)}
                className="shrink-0"
              >
                <PenLine className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-auto border-t border-gray-100 bg-gray-50 p-4">
          <div className="flex justify-end">
            <Button variant="outline" asChild>
              <Link
                href={`/location/${location.id}`}
                className="flex items-center gap-2"
              >
                {t("view_details")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
