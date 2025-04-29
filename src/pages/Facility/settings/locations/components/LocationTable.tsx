import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Folder,
  FolderOpen,
  PenLine,
  Trash,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import mutate from "@/Utils/request/mutate";
import { LocationList, LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

// Animated version of TableRow
const AnimatedTableRow = motion(TableRow);

interface Props {
  locations: LocationList[];
  onEdit?: (location: LocationList) => void;
  onView?: (location: LocationList) => void;
  onMoveUp?: (location: LocationList) => void;
  onMoveDown?: (location: LocationList) => void;
  facilityId: string;
  isFirstPage?: boolean;
  isLastPage?: boolean;
  currentPage?: number;
  setPage?: (page: number) => void;
}

export function LocationTable({
  locations,
  onEdit,
  onView,
  onMoveUp,
  onMoveDown,
  facilityId,
  isFirstPage = true,
  isLastPage = true,
  currentPage = 1,
  setPage,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const deleteLocation = useMutation({
    mutationFn: (locationId: string) => {
      return mutate(locationApi.delete, {
        pathParams: { facility_id: facilityId, id: locationId },
      })({});
    },
    onSuccess: () => {
      // If this is the last item on the page and not the first page
      if (locations.length === 1 && currentPage > 1 && setPage) {
        setPage(currentPage - 1);
      }

      queryClient.invalidateQueries({
        queryKey: ["locations", facilityId],
      });
      toast.success(t("location_removed_successfully"));
    },
  });

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("name")}</TableHead>
            <TableHead>{t("type")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("availability")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location, index) => {
            const Icon =
              LocationTypeIcons[
                location.form as keyof typeof LocationTypeIcons
              ] || Folder;

            const isFirst = index === 0;
            const isLast = index === locations.length - 1;

            // Only hide buttons if we're at absolute boundaries
            const hideUpButton = isFirstPage && isFirst;
            const hideDownButton = isLastPage && isLast;

            const canView = location.mode === "kind" && onView;

            return (
              <AnimatedTableRow
                key={location.id}
                layout="position"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                }}
                className={cn(
                  "hover:bg-gray-50 group",
                  canView && "cursor-pointer",
                )}
                onClick={canView ? () => onView?.(location) : undefined}
                data-cy="view-location-row"
              >
                <TableCell>
                  <div className="font-medium flex items-center gap-2 py-2">
                    <Icon className="size-4 text-gray-500" />
                    <span
                      className={
                        location.mode === "instance"
                          ? ""
                          : "group-hover:underline group-hover:text-primary"
                      }
                    >
                      {location.name}
                    </span>
                    {location.has_children && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              <FolderOpen className="size-3 text-gray-400" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("has_child_locations")}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>{t(`location_form__${location.form}`)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      location.status === "active" ? "outline" : "secondary"
                    }
                  >
                    {t(location.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      !location.current_encounter ? "outline" : "destructive"
                    }
                  >
                    {location.current_encounter
                      ? t("unavailable")
                      : t("available")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex items-center justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center space-x-1">
                      <TooltipProvider>
                        {/* Move Up button or spacer */}
                        {onMoveUp && !hideUpButton ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onMoveUp(location)}
                                data-cy="move-up-location-button"
                              >
                                <ArrowUp className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isFirst && !isFirstPage
                                ? t("move_to_previous_page")
                                : t("move_up")}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="size-9"></div>
                        )}

                        {/* Move Down button or spacer */}
                        {onMoveDown && !hideDownButton ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onMoveDown(location)}
                                data-cy="move-down-location-button"
                              >
                                <ArrowDown className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isLast && !isLastPage
                                ? t("move_to_next_page")
                                : t("move_down")}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="size-9"></div>
                        )}

                        {/* Edit button or spacer */}
                        {onEdit ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(location)}
                                data-cy="edit-location-button"
                              >
                                <PenLine className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("edit")}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="size-9"></div>
                        )}

                        {/* Delete button or spacer */}
                        {!location.has_children &&
                        !location.current_encounter ? (
                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    data-cy="delete-location-button"
                                  >
                                    <Trash className="size-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>{t("delete")}</TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("remove_location", {
                                    name: location.name,
                                  })}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("are_you_sure_want_to_delete", {
                                    name: location.name,
                                  })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {t("cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  data-cy="remove-location-button"
                                  onClick={() =>
                                    deleteLocation.mutate(location.id)
                                  }
                                  className={buttonVariants({
                                    variant: "destructive",
                                  })}
                                >
                                  {t("remove")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <div className="size-9"></div>
                        )}
                      </TooltipProvider>
                    </div>
                  </div>
                </TableCell>
              </AnimatedTableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
