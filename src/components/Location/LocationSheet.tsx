import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import { stringifyNestedObject } from "@/Utils/utils";
import { LocationHistory } from "@/types/emr/encounter";
import {
  LocationAssociationStatus,
  LocationAssociationUpdate,
} from "@/types/location/association";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import { LocationSearch } from "./LocationSearch";
import { LocationTree } from "./LocationTree";

interface LocationSheetProps {
  trigger: React.ReactNode;
  history: LocationHistory[];
  facilityId: string;
  encounterId: string;
}

interface LocationState extends LocationHistory {
  displayStatus: LocationAssociationStatus;
}

interface ValidationError {
  message: string;
  field: "start_datetime" | "end_datetime";
}

// Omit id field for creation
type LocationAssociationCreate = Omit<LocationAssociationUpdate, "id">;

export function LocationSheet({
  trigger,
  history,
  facilityId,
  encounterId,
}: LocationSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const initialState = {
    location: "",
    status: "active",
    start_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    encounter: encounterId,
  };
  const [newLocation, setNewLocation] = useState(initialState);

  const [locations, setLocations] = useState<LocationState[]>([]);

  useEffect(() => {
    setLocations(
      history.map((loc) => ({
        ...loc,
        displayStatus: loc.status,
        end_datetime: loc.status === "active" ? undefined : loc.end_datetime,
      })),
    );
  }, [history]);

  function validateTimes(
    status: LocationAssociationStatus,
    startTime: string,
    endTime?: string,
  ): ValidationError | null {
    const now = new Date();
    const start = parseISO(startTime);

    if (!startTime) {
      return { message: t("start_time_required"), field: "start_datetime" };
    }

    if (status !== "active" && !endTime) {
      return { message: t("end_time_required"), field: "end_datetime" };
    }

    if (endTime) {
      const end = parseISO(endTime);
      if (isBefore(end, start)) {
        return {
          message: t("start_time_must_be_before_end_time"),
          field: "end_datetime",
        };
      }
    }

    if (
      (status === "planned" || status === "reserved") &&
      isBefore(start, now)
    ) {
      return {
        message: t("planned_reserved_cannot_be_in_past"),
        field: "start_datetime",
      };
    }

    if (status === "active" && isAfter(start, now)) {
      return {
        message: t("active_location_cannot_be_in_future"),
        field: "start_datetime",
      };
    }

    return null;
  }

  const handleLocationUpdate = (updatedLocation: LocationState) => {
    setLocations((prevLocations) =>
      prevLocations.map((loc) =>
        loc.id === updatedLocation.id
          ? {
              ...updatedLocation,
              end_datetime:
                updatedLocation.status === "active"
                  ? undefined
                  : updatedLocation.end_datetime,
            }
          : loc,
      ),
    );
  };

  const [selectedLocation, setSelectedLocation] = useState<LocationList | null>(
    null,
  );

  const updateAssociation = useMutation({
    mutationFn: (location: LocationAssociationUpdate) => {
      const validationError = validateTimes(
        location.status,
        location.start_datetime,
        location.end_datetime,
      );

      if (validationError) {
        throw new Error(validationError.message);
      }

      return mutate(locationApi.updateAssociation, {
        pathParams: {
          facility_external_id: facilityId,
          location_external_id: location.location,
          external_id: location.id,
        },
      })(location);
    },
    onSuccess: () => {
      toast.success(t("location_association_updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["encounter", encounterId] });
    },
  });

  const { mutate: createAssociation, isPending } = useMutation({
    mutationFn: (data: LocationAssociationCreate) => {
      const validationError = validateTimes(
        data.status,
        data.start_datetime,
        data.end_datetime,
      );

      if (validationError) {
        throw new Error(validationError.message);
      }

      return mutate(locationApi.createAssociation, {
        pathParams: {
          facility_external_id: facilityId,
          location_external_id: selectedLocation?.id,
        },
      })(data);
    },
    onSuccess: () => {
      toast.success(t("location_association_created_successfully"));
      queryClient.invalidateQueries({ queryKey: ["encounter", encounterId] });
      setNewLocation(initialState);
      setSelectedLocation(null);
    },
  });

  const renderLocation = (location: LocationState) => (
    <div
      key={location.id}
      className="space-y-3 px-2 mr-2 py-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-foreground/80">
          <Badge
            variant={location.status === "active" ? "primary" : "secondary"}
          >
            {t(`${location.status}`)}
          </Badge>
        </label>
        <div className="flex items-center gap-2">
          <Select
            value={location.status}
            onValueChange={(val: LocationAssociationStatus) => {
              handleLocationUpdate({
                ...location,
                status: val,
                end_datetime:
                  val === "active" ? undefined : location.end_datetime,
              });
            }}
          >
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder={t("select_a_status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("active")}</SelectItem>
              <SelectItem value="planned">{t("planned")}</SelectItem>
              <SelectItem value="reserved">{t("reserved")}</SelectItem>
              <SelectItem value="completed">{t("completed")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() =>
              updateAssociation.mutate({
                ...location,
                encounter: encounterId,
                location: location.location.id,
              })
            }
            disabled={updateAssociation.isPending}
          >
            {updateAssociation.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
      <Badge variant="secondary" className="text-xs bg-blue-200">
        {stringifyNestedObject(location.location, " < ")}
      </Badge>
      <div className="flex flex-row flex-wrap gap-2">
        {(location.status === "active" ||
          location.status === "planned" ||
          location.status === "reserved") && (
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-500">{t("start_time")}</label>
            <Input
              type="datetime-local"
              value={format(
                new Date(location.start_datetime),
                "yyyy-MM-dd'T'HH:mm",
              )}
              onChange={(e) =>
                handleLocationUpdate({
                  ...location,
                  start_datetime: e.target.value,
                })
              }
              className="h-9 w-auto"
            />
          </div>
        )}
        {location.status !== "active" && (
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-500">{t("end_time")}</label>
            <Input
              type="datetime-local"
              value={
                location.end_datetime
                  ? format(
                      new Date(location.end_datetime),
                      "yyyy-MM-dd'T'HH:mm",
                    )
                  : undefined
              }
              onChange={(e) =>
                handleLocationUpdate({
                  ...location,
                  end_datetime: e.target.value,
                })
              }
              className="h-9"
            />
          </div>
        )}
      </div>
    </div>
  );

  // Get locations by their original display status
  const activeLocation = locations.find(
    (loc) => loc.displayStatus === "active",
  );
  const plannedLocations = locations.filter(
    (loc) => loc.displayStatus === "planned",
  );
  const reservedLocations = locations.filter(
    (loc) => loc.displayStatus === "reserved",
  );

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg pr-2 pl-3">
        <SheetHeader className="space-y-1 px-1">
          <SheetTitle className="text-xl font-semibold">
            {t("update_location")}
          </SheetTitle>
          <p className="text-sm text-gray-500">
            {t("manage_patient_location_and_transfers")}
          </p>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div className="space-y-3 px-1">
            {/* Active Location */}
            {activeLocation && renderLocation(activeLocation)}

            {/* Reserved Locations */}
            {reservedLocations.map((location) => renderLocation(location))}

            {/* Planned Locations */}
            {plannedLocations.map((location) => renderLocation(location))}

            <div className="space-y-4 pt-6 mt-2 border-t">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <label className="text-sm font-medium text-foreground/80">
                  {t("add_new_location")}
                </label>
              </div>
              <div className="space-y-4 rounded-lg border p-4 bg-card">
                <LocationSearch
                  mode="instance"
                  form="bd"
                  facilityId={facilityId}
                  onSelect={(location) => setSelectedLocation(location)}
                  value={selectedLocation}
                />
                {selectedLocation && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="grid gap-2">
                      <label className="text-sm text-gray-500">
                        {t("status")}
                      </label>
                      <Select
                        value={newLocation.status}
                        onValueChange={(val: LocationAssociationStatus) =>
                          setNewLocation((prev) => ({ ...prev, status: val }))
                        }
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder={t("select_a_status")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{t("active")}</SelectItem>
                          <SelectItem value="planned">
                            {t("planned")}
                          </SelectItem>
                          <SelectItem value="reserved">
                            {t("reserved")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(newLocation.status === "active" ||
                      newLocation.status === "planned" ||
                      newLocation.status === "reserved") && (
                      <div className="grid gap-2">
                        <label className="text-sm text-gray-500">
                          {t("start_time")}
                        </label>
                        <Input
                          type="datetime-local"
                          value={newLocation.start_datetime}
                          onChange={(e) =>
                            setNewLocation((prev) => ({
                              ...prev,
                              start_datetime: e.target.value,
                            }))
                          }
                          className="h-9"
                        />
                      </div>
                    )}
                    {newLocation.status !== "active" && (
                      <div className="grid gap-2">
                        <label className="text-sm text-gray-500">
                          {t("end_time")}
                        </label>
                        <Input
                          type="datetime-local"
                          value={newLocation.end_datetime}
                          onChange={(e) =>
                            setNewLocation((prev) => ({
                              ...prev,
                              end_datetime: e.target.value,
                            }))
                          }
                          className="h-9"
                        />
                      </div>
                    )}
                    <Button
                      onClick={() => {
                        createAssociation({
                          ...newLocation,
                          status:
                            newLocation.status as LocationAssociationStatus,
                          location: selectedLocation.id,
                        });
                      }}
                      className="w-full"
                      disabled={isPending}
                    >
                      {isPending
                        ? t("creating")
                        : t("create_location_association")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {history.map((item, index) => (
              <div key={index}>
                <LocationTree
                  location={item.location}
                  datetime={item.start_datetime}
                  isLatest={index === 0}
                  showTimeline
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
