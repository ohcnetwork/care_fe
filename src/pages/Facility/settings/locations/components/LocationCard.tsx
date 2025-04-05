import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Folder, FolderOpen, PenLine } from "lucide-react";
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

import mutate from "@/Utils/request/mutate";
import { LocationList, LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface Props {
  location: LocationList;
  onEdit?: (location: LocationList) => void;
  onView?: (location: LocationList) => void;
  className?: string;
  facilityId: string;
}

export function LocationCard({
  location,
  onEdit,
  onView,
  className,
  facilityId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const Icon =
    LocationTypeIcons[location.form as keyof typeof LocationTypeIcons] ||
    Folder;

  const { mutate: removeLocation } = useMutation({
    mutationFn: mutate(locationApi.delete, {
      pathParams: { facility_id: facilityId, id: location.id },
    }),
    onSuccess: () => {
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

            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(location)}
                className="shrink-0"
              >
                <PenLine className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-auto border-t border-gray-100 bg-gray-50 p-4">
          <div className="flex justify-between">
            {!location.has_children && !location.current_encounter && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="white" data-cy="delete-location-button">
                    <CareIcon icon="l-trash" />
                  </Button>
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
                      className={buttonVariants({ variant: "destructive" })}
                    >
                      {t("remove")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
