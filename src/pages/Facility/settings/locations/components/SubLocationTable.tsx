import { Link } from "@tanstack/react-router";
import { Bed, FolderOpen, PenLine } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { navigate } from "@/lib/router/navigate";
import { LocationRead, LocationTypeIcons } from "@/types/location/location";

import { LocationActionsMenu } from "./LocationActionsMenu";

interface SubLocationTableProps {
  facilityId: string;
  locations: LocationRead[];
  onManage: (location: LocationRead) => void;
  /** Reordering is offered only when the list is not filtered. */
  onMove?: (location: LocationRead, direction: "up" | "down") => void;
  onDelete: (location: LocationRead) => void;
}

/**
 * Locations that hold other locations or beds. The name is a link to the
 * location, and a click anywhere else on the row opens it too.
 */
export function SubLocationTable({
  facilityId,
  locations,
  onManage,
  onMove,
  onDelete,
}: SubLocationTableProps) {
  const { t } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("type")}</TableHead>
          <TableHead className="text-right">
            <span className="sr-only">{t("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {locations.map((location, index) => {
          const Icon = LocationTypeIcons[location.form];
          const canDelete =
            !location.has_children && !location.current_encounter;

          return (
            <TableRow
              key={location.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() =>
                navigate({
                  to: "/facility/$facilityId/settings/locations/$id",
                  params: { facilityId, id: location.id },
                })
              }
            >
              <TableCell>
                <div className="flex items-center gap-2 py-1 font-medium">
                  <Icon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Link
                    to="/facility/$facilityId/settings/locations/$id"
                    params={{ facilityId, id: location.id }}
                    className="min-w-0 break-words underline-offset-4 hover:underline"
                    // The row opens it as well: one click, one navigation.
                    onClick={(event) => event.stopPropagation()}
                  >
                    {location.name}
                  </Link>
                  {location.has_sub_locations && (
                    <span
                      role="img"
                      aria-label={t("has_sub_locations")}
                      title={t("has_sub_locations")}
                    >
                      <FolderOpen className="size-3.5 text-muted-foreground" />
                    </span>
                  )}
                  {location.has_beds && (
                    <span
                      role="img"
                      aria-label={t("has_beds")}
                      title={t("has_beds")}
                    >
                      <Bed className="size-3.5 text-muted-foreground" />
                    </span>
                  )}
                  {/* Nearly every location is active: say so only when one is not. */}
                  {location.status !== "active" && (
                    <Badge variant="secondary" size="sm">
                      {t(location.status)}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {t(`location_form__${location.form}`)}
              </TableCell>
              <TableCell onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t("edit_location")}
                    aria-label={t("edit_location")}
                    onClick={() => onManage(location)}
                  >
                    <PenLine aria-hidden="true" />
                  </Button>
                  <LocationActionsMenu
                    locationName={location.name}
                    onMoveUp={
                      onMove && index > 0
                        ? () => onMove(location, "up")
                        : undefined
                    }
                    onMoveDown={
                      onMove && index < locations.length - 1
                        ? () => onMove(location, "down")
                        : undefined
                    }
                    onDelete={canDelete ? () => onDelete(location) : undefined}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
