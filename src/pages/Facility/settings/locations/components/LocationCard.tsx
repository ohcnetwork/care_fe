import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  MoreVertical,
  PenLine,
  Trash,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import mutate from "@/Utils/request/mutate";
import { LocationList, LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface Props {
  location: LocationList;
  onEdit?: (location: LocationList) => void;
  onView?: (location: LocationList) => void;
  onMoveUp?: (location: LocationList) => void;
  onMoveDown?: (location: LocationList) => void;
  className?: string;
  facilityId: string;
  index?: number;
  totalCount?: number;
  isFirstPage?: boolean;
  isLastPage?: boolean;
  currentPage?: number;
  setPage?: (page: number) => void;
}

export function LocationCard({
  location,
  onEdit,
  onView,
  onMoveUp,
  onMoveDown,
  className,
  facilityId,
  index = 0,
  totalCount = 0,
  isFirstPage = true,
  isLastPage = true,
  currentPage = 1,
  setPage,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const Icon =
    LocationTypeIcons[location.form as keyof typeof LocationTypeIcons] ||
    Folder;

  const isFirst = index === 0;
  const isLast = totalCount > 0 && index === totalCount - 1;

  // Only hide buttons if we're at absolute boundaries
  const hideUpButton = isFirstPage && isFirst;
  const hideDownButton = isLastPage && isLast;

  const { mutate: removeLocation } = useMutation({
    mutationFn: mutate(locationApi.delete, {
      pathParams: { facility_id: facilityId, id: location.id },
    }),
    onSuccess: () => {
      // If this is the last item on the page and not the first page
      if (totalCount === 1 && currentPage > 1 && setPage) {
        setPage(currentPage - 1);
      }

      queryClient.invalidateQueries({
        queryKey: ["locations", facilityId],
      });
      toast.success(t("location_removed_successfully"));
    },
  });

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
                    location.status === "active" ? "primary" : "secondary"
                  }
                  className="capitalize whitespace-nowrap"
                >
                  {t(location.status)}
                </Badge>
                <Badge
                  variant={
                    !location.current_encounter ? "green" : "destructive"
                  }
                  className="capitalize"
                >
                  {location.current_encounter
                    ? t("unavailable")
                    : t("available")}
                </Badge>
                {location.has_children && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 whitespace-nowrap"
                  >
                    <FolderOpen className="size-3" />
                    {t("has_child_locations")}
                  </Badge>
                )}
              </div>
            </div>

            {(onEdit ||
              (!location.has_children && !location.current_encounter)) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onMoveUp && !hideUpButton && (
                    <DropdownMenuItem onClick={() => onMoveUp(location)}>
                      <span className="block xl:hidden">
                        <CareIcon icon="l-arrow-up" className="mr-2" />
                      </span>
                      <span className="hidden xl:block">
                        <CareIcon icon="l-arrow-left" className="mr-2" />
                      </span>
                      {isFirst && !isFirstPage ? (
                        t("move_to_previous_page")
                      ) : (
                        <>
                          <span className="block xl:hidden">
                            {t("move_up")}
                          </span>
                          <span className="hidden xl:block">
                            {t("move_left")}
                          </span>
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {onMoveDown && !hideDownButton && (
                    <DropdownMenuItem onClick={() => onMoveDown(location)}>
                      <span className="block xl:hidden">
                        <CareIcon icon="l-arrow-down" className="mr-2" />
                      </span>
                      <span className="hidden xl:block">
                        <CareIcon icon="l-arrow-right" className="mr-2" />
                      </span>
                      {isLast && !isLastPage ? (
                        t("move_to_next_page")
                      ) : (
                        <>
                          <span className="block xl:hidden">
                            {t("move_down")}
                          </span>
                          <span className="hidden xl:block">
                            {t("move_right")}
                          </span>
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(location)}>
                      <PenLine className="size-4 mr-2" />
                      {t("edit")}
                    </DropdownMenuItem>
                  )}
                  {!location.has_children && !location.current_encounter && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-destructive"
                          data-cy="delete-location-button"
                        >
                          <Trash className="size-4 mr-2" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("remove_location", { name: location.name })}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("are_you_sure_want_to_delete", {
                              name: location.name,
                            })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            data-cy="remove-location-button"
                            onClick={() => removeLocation({})}
                            className={buttonVariants({
                              variant: "destructive",
                            })}
                          >
                            {t("remove")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="mt-auto border-t border-gray-100 bg-gray-50 p-4">
          <div className="flex justify-between items-center">
            <div className="ml-auto">
              {location.form !== "bd" && onView && (
                <Button
                  data-cy="view-details-location-button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => onView?.(location)}
                >
                  {t("view_details")}
                  <ChevronRight className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
