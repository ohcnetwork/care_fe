import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Encounter, LocationHistory } from "@/types/emr/encounter";
import { LocationAssociationStatus } from "@/types/location/association";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import { LocationActionButtons } from "./LocationActionButtons";
import { LocationCardWrapper } from "./LocationCardWrapper";
import { LocationHistory as LocationHistoryComponent } from "./LocationHistory";
import { LocationNavigation } from "./LocationNavigation";

type LocationScreen = "view" | "assign" | "modify";
type LocationAction = "move" | "complete" | "cancel" | "new";

interface LocationTimeConfig {
  start: Date;
  end?: Date;
  status: LocationAssociationStatus;
}

interface LocationSheetState {
  screen: LocationScreen;
  action: LocationAction;
  timeConfig: LocationTimeConfig;
}

interface EditingState {
  locationId: string | null;
  timeConfig: LocationTimeConfig;
}

interface LocationSheetProps {
  trigger: React.ReactNode;
  history: LocationHistory[];
  facilityId: string;
  encounter: Encounter;
}

const ITEMS_PER_PAGE = 10;

export function LocationSheet({
  trigger,
  history,
  facilityId,
  encounter,
}: LocationSheetProps) {
  const { t } = useTranslation();
  const [showDischargeDialog, setShowDischargeDialog] = useState(false);
  const [showOccupiedDialog, setShowOccupiedDialog] = useState(false);
  const [selectedDischargedBed, setSelectedDischargedBed] =
    useState<LocationList | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<LocationList | null>(
    null,
  );
  const [locationHistory, setLocationHistory] = useState<LocationList[]>([]);
  const [selectedBed, setSelectedBed] = useState<string | null>(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationsPage, setLocationsPage] = useState(1);
  const [bedsPage, setBedsPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<{
    location: string;
    id: string;
  } | null>(null);
  const [hasMoreLocations, setHasMoreLocations] = useState(true);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [hasMoreBeds, setHasMoreBeds] = useState(true);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const initialState = {
    screen: "assign" as LocationScreen,
    action: "new" as LocationAction,
    timeConfig: {
      start: new Date(),
      status: "active" as LocationAssociationStatus,
    },
  };

  const initialEditingState = {
    locationId: null,
    timeConfig: {
      start: new Date(),
      status: "active" as LocationAssociationStatus,
    },
  };

  const [sheetState, setSheetState] =
    useState<LocationSheetState>(initialState);
  const [editingState, setEditingState] =
    useState<EditingState>(initialEditingState);

  const [allLocations, setAllLocations] = useState<LocationList[]>([]);
  const [allBeds, setAllBeds] = useState<LocationList[]>([]);

  const resetStates = (type: "all" | "edit" = "all") => {
    if (type === "all") {
      setSelectedLocation(null);
      setLocationHistory([]);
      setSelectedBed(null);
      setShowAvailableOnly(false);
      setSearchTerm("");
      setLocationsPage(1);
      setBedsPage(1);
      setAllLocations([]);
      setAllBeds([]);
      setHasMoreLocations(true);
      setHasMoreBeds(true);
      setSheetState(initialState);
      setEditingState(initialEditingState);
    } else {
      setEditingState(initialEditingState);
    }
  };

  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: [
      "locations",
      facilityId,
      locationsPage,
      searchTerm,
      selectedLocation?.id,
    ],
    queryFn: async ({ signal }) => {
      const response = await query(locationApi.list, {
        pathParams: { facility_id: facilityId },
        queryParams: {
          limit: ITEMS_PER_PAGE,
          offset: (locationsPage - 1) * ITEMS_PER_PAGE,
          name: searchTerm,
          mode: "kind",
          parent: selectedLocation?.id,
          ...(!selectedLocation ? { mine: true } : {}),
        },
        signal,
      })({ signal });
      return response;
    },
  });

  const { data: bedsData, isLoading: isLoadingBeds } = useQuery({
    queryKey: [
      "beds",
      facilityId,
      selectedLocation?.id,
      bedsPage,
      showAvailableOnly,
      searchTerm,
    ],
    queryFn: async ({ signal }) => {
      const response = await query(locationApi.list, {
        pathParams: { facility_id: facilityId },
        queryParams: {
          limit: ITEMS_PER_PAGE,
          offset: (bedsPage - 1) * ITEMS_PER_PAGE,
          mode: "instance",
          name: searchTerm,
          parent: selectedLocation?.id,
          available: showAvailableOnly ? "true" : undefined,
          ...(!selectedLocation ? { mine: true } : {}),
        },
        signal,
      })({ signal });
      return response;
    },
    enabled: !!selectedLocation && !!facilityId,
  });

  useEffect(() => {
    if (locationsData && open) {
      if (locationsPage === 1) {
        setAllLocations(locationsData.results);
      } else {
        setAllLocations((prev) => [...prev, ...locationsData.results]);
      }
      setHasMoreLocations(locationsData.count > locationsPage * ITEMS_PER_PAGE);
    }
  }, [locationsData, locationsPage, open]);

  useEffect(() => {
    if (bedsData) {
      if (bedsPage === 1) {
        setAllBeds(bedsData.results);
      } else {
        setAllBeds((prev) => [...prev, ...bedsData.results]);
      }
      setHasMoreBeds(bedsData.count > bedsPage * ITEMS_PER_PAGE);
    }
    setSelectedBed(null);
  }, [bedsData, bedsPage]);

  const handleLocationClick = (location: LocationList) => {
    // Find the index of the clicked location in the history
    const locationIndex = locationHistory.findIndex(
      (loc) => loc.id === location.id,
    );

    if (locationIndex !== -1) {
      // If location is in history, slice the history up to that point
      setLocationHistory((prev) => prev.slice(0, locationIndex + 1));
    } else {
      // If it's a new location, append it to history
      setLocationHistory((prev) => [...prev, location]);
    }

    setSelectedLocation(location);
    setLocationsPage(1);
    setBedsPage(1);
    setAllLocations([]);
    setAllBeds([]);
    setSelectedBed(null);
    setSearchTerm("");
  };

  const handleLoadMore = () => {
    if (selectedLocation) {
      setBedsPage((prev) => prev + 1);
    } else {
      setLocationsPage((prev) => prev + 1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocationsPage(1);
    setBedsPage(1);
    setAllLocations([]);
    setAllBeds([]);
  };

  const checkBedStatus = async (selectedBed: LocationList) => {
    if (!selectedBed.current_encounter) return;

    if (selectedBed.current_encounter.status === "discharged") {
      setSelectedDischargedBed(selectedBed);
      setShowDischargeDialog(true);
    } else {
      setShowOccupiedDialog(true);
    }
  };

  const handleDischargeConfirm = () => {
    if (selectedDischargedBed) {
      setSelectedBed(selectedDischargedBed.id);
      setSheetState((prev) => ({
        ...prev,
        timeConfig: {
          start: new Date(),
          end: new Date(),
          status: "planned",
        },
      }));
    }
    setShowDischargeDialog(false);
    setSelectedDischargedBed(null);
  };

  const handleMoveToAnotherBed = () => {
    setSheetState((prev) => ({
      ...prev,
      screen: "assign",
      action: "move",
      timeConfig: {
        start: new Date(),
        status: "active",
      },
    }));
  };

  const getCurrentLocations = () => {
    const activeLocation = encounter.location_history.find(
      (loc) => loc.status === "active",
    );
    const plannedLocations = encounter.location_history.filter(
      (loc) => loc.status === "planned",
    );
    return { activeLocation, plannedLocations };
  };

  const handleCompleteBedStay = (location: LocationHistory) => {
    if (!location) return;

    setEditingState({
      locationId: location.id,
      timeConfig: {
        start: new Date(location.start_datetime),
        end: new Date(),
        status: "completed",
      },
    });
  };

  const handleUpdateTime = (location: LocationHistory) => {
    if (!location) return;

    setEditingState({
      locationId: location.id,
      timeConfig: {
        start: new Date(location.start_datetime),
        end: location.end_datetime
          ? new Date(location.end_datetime)
          : undefined,
        status: location.status as LocationAssociationStatus,
      },
    });
  };

  const handleAssignNow = () => {
    const currentLocation = getCurrentLocations().plannedLocations[0];
    if (!currentLocation) return;

    const timeConfig = {
      start: new Date(),
      status: "active" as LocationAssociationStatus,
      end: undefined,
    };

    setSheetState((prev) => ({
      ...prev,
      screen: "modify",
      action: "new",
      timeConfig,
    }));

    setEditingState({
      locationId: currentLocation.id,
      timeConfig,
    });
  };
  const { mutate: unlinkLocation } = useMutation({
    mutationFn: ({ location, id }: { location: string; id: string }) => {
      return mutate(locationApi.deleteAssociation, {
        pathParams: {
          facility_external_id: facilityId,
          location_external_id: location,
          external_id: id,
        },
      })({ encounter: encounter.id, status: "completed" });
    },
    onSuccess: () => {
      if (locationStatus === "active") {
        toast.success(t("bed_active_removed_due_to_error"));
      } else {
        toast.success(t("bed_planned_cancelled"));
      }
      queryClient.invalidateQueries({ queryKey: ["encounter", encounter.id] });
    },
    onError: () => {
      toast.error(t("error_removing_bed_assignment"));
    },
  });
  const handleCancelPlan = (status: "active" | "planned") => {
    const { activeLocation, plannedLocations } = getCurrentLocations();
    const locationToCancel =
      status === "active" ? activeLocation : plannedLocations[0];

    if (!locationToCancel) return;

    setLocationToDelete({
      location: locationToCancel.location.id,
      id: locationToCancel.id,
    });
    setLocationStatus(status);
    setShowDeleteDialog(true);
    setSheetState((prev) => ({
      ...prev,
      screen: "assign",
      action: "new",
      timeConfig: {
        start: new Date(locationToCancel.start_datetime),
        end: new Date(),
        status: "completed",
      },
    }));
  };
  const confirmDeletePlan = () => {
    if (!locationToDelete) return;
    unlinkLocation({
      location: locationToDelete.location,
      id: locationToDelete.id,
    });
    setShowDeleteDialog(false);
    setLocationToDelete(null);
  };
  const handleConfirmTime = async () => {
    const requests = [];
    const { activeLocation, plannedLocations } = getCurrentLocations();
    const currentPlannedLocation = plannedLocations[0];

    if (
      activeLocation &&
      ((sheetState.action === "move" &&
        sheetState.timeConfig.status === "active") ||
        sheetState.action === "complete" ||
        (sheetState.action === "new" && currentPlannedLocation))
    ) {
      requests.push({
        url: `/api/v1/facility/${facilityId}/location/${activeLocation.location.id}/association/${activeLocation.id}/`,
        method: "PUT",
        reference_id: "completeCurrentLocation",
        body: {
          encounter: encounter.id,
          end_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
          status: "completed",
          start_datetime: activeLocation.start_datetime,
        },
      });
    }

    if (sheetState.action === "new" && currentPlannedLocation) {
      requests.push({
        url: `/api/v1/facility/${facilityId}/location/${currentPlannedLocation.location.id}/association/${currentPlannedLocation.id}/`,
        method: "PUT",
        reference_id: "updatePlannedLocation",
        body: {
          encounter: encounter.id,
          start_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
          status: "active" as LocationAssociationStatus,
          end_datetime: null,
        },
      });
    } else if (selectedBed) {
      requests.push({
        url: `/api/v1/facility/${facilityId}/location/${selectedBed}/association/`,
        method: "POST",
        reference_id: "createLocationAssociation",
        body: {
          encounter: encounter.id,
          start_datetime: format(
            sheetState.timeConfig.start,
            "yyyy-MM-dd'T'HH:mm:ss",
          ),
          ...(sheetState.timeConfig.end && {
            end_datetime: format(
              sheetState.timeConfig.end,
              "yyyy-MM-dd'T'HH:mm:ss",
            ),
          }),
          status: sheetState.timeConfig.status,
        },
      });
    }

    if (requests.length === 0) {
      toast.error(t("no_changes_to_save"));
      return;
    }

    try {
      await executeBatch({ requests });
    } catch (error) {
      console.error("Error executing batch request:", error);
      toast.error(t("error_updating_location"));
      return;
    }
  };

  const handleCancelEdit = () => resetStates("edit");

  const createLocationUpdateRequest = (
    location: LocationHistory,
    config: LocationTimeConfig,
  ) => ({
    url: `/api/v1/facility/${facilityId}/location/${location.location.id}/association/${location.id}/`,
    method: "PUT" as const,
    reference_id: "updateLocation",
    body: {
      encounter: encounter.id,
      start_datetime: format(config.start, "yyyy-MM-dd'T'HH:mm:ss"),
      ...(config.status === "active"
        ? { end_datetime: null }
        : config.end
          ? {
              end_datetime: format(config.end, "yyyy-MM-dd'T'HH:mm:ss"),
            }
          : {}),
      status: config.status,
    },
  });

  const handleConfirmEdit = async (location: LocationHistory) => {
    const requests = [];
    const { activeLocation } = getCurrentLocations();

    // Determine if we're updating the currently active location
    const isUpdatingActiveLocation =
      activeLocation && activeLocation.id === location.id;

    // Only complete the current active location if we're changing to a different location
    // or changing the status from active to something else
    if (
      editingState.timeConfig.status === "active" &&
      activeLocation &&
      !isUpdatingActiveLocation
    ) {
      requests.push(
        createLocationUpdateRequest(activeLocation, {
          start: new Date(activeLocation.start_datetime),
          end: new Date(),
          status: "completed",
        }),
      );
    }

    // Always update the selected location with new time settings
    requests.push(
      createLocationUpdateRequest(location, editingState.timeConfig),
    );

    try {
      await executeBatch({ requests });
      handleCancelEdit();
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error(t("error_updating_location"));
    }
  };

  const renderScreen = () => {
    const { activeLocation, plannedLocations } = getCurrentLocations();
    const selectedBedDetails = selectedBed
      ? allBeds.find((bed) => bed.id === selectedBed)
      : null;

    const selectedBedLocation: LocationHistory | undefined = selectedBedDetails
      ? {
          id: selectedBedDetails.id,
          location: selectedBedDetails,
          start_datetime: format(
            sheetState.timeConfig.start,
            "yyyy-MM-dd'T'HH:mm:ss",
          ),
          end_datetime: sheetState.timeConfig.end
            ? format(sheetState.timeConfig.end, "yyyy-MM-dd'T'HH:mm:ss")
            : undefined,
          status: sheetState.timeConfig.status,
        }
      : undefined;

    const renderLocationCard = (
      locationHistory: LocationHistory,
      status: LocationAssociationStatus,
    ) => (
      <LocationCardWrapper
        key={locationHistory.id}
        locationHistory={locationHistory}
        status={status}
        editingState={editingState}
        setEditingState={setEditingState}
        handleCancelEdit={handleCancelEdit}
        handleConfirmEdit={handleConfirmEdit}
        isPending={isPending}
      >
        {sheetState.action !== "move" && (
          <div className="flex justify-end gap-2">
            <LocationActionButtons
              status={status}
              location={locationHistory}
              onMove={handleMoveToAnotherBed}
              onComplete={
                status === "active" ? handleCompleteBedStay : undefined
              }
              onUpdateTime={handleUpdateTime}
              onCancel={() =>
                status === "active" || status === "planned"
                  ? handleCancelPlan(status)
                  : undefined
              }
              onAssignNow={status === "planned" ? handleAssignNow : undefined}
            />
          </div>
        )}
      </LocationCardWrapper>
    );

    const locationCards = (
      <>
        {activeLocation && renderLocationCard(activeLocation, "active")}
        {plannedLocations.map((location) =>
          renderLocationCard(location, "planned"),
        )}
      </>
    );

    switch (sheetState.screen) {
      case "modify":
        return (
          <div className="space-y-4">
            {locationCards}
            {selectedBedLocation &&
            (sheetState.action === "new" || sheetState.action === "move") &&
            !editingState.locationId ? (
              <LocationCardWrapper
                locationHistory={selectedBedLocation}
                status={sheetState.timeConfig.status}
                editingState={{
                  locationId: selectedBedLocation.id,
                  timeConfig: sheetState.timeConfig,
                }}
                setEditingState={(newState) => {
                  if ("timeConfig" in newState) {
                    setSheetState((prev) => ({
                      ...prev,
                      timeConfig: newState.timeConfig,
                    }));
                  } else {
                    setSheetState((prev) => ({
                      ...prev,
                      timeConfig: (
                        newState as (prev: EditingState) => EditingState
                      )({
                        locationId: selectedBedLocation.id,
                        timeConfig: prev.timeConfig,
                      }).timeConfig,
                    }));
                  }
                }}
                handleCancelEdit={() =>
                  setSheetState((prev) => ({ ...prev, screen: "assign" }))
                }
                handleConfirmEdit={handleConfirmTime}
                isPending={isPending}
              />
            ) : null}
          </div>
        );

      case "assign":
        if (
          sheetState.action === "move" ||
          (!activeLocation && !plannedLocations.length)
        ) {
          return (
            <div className="space-y-2" data-cy="location-assign-screen">
              {locationCards}
              <LocationNavigation
                locations={allLocations}
                beds={allBeds}
                selectedLocation={selectedLocation}
                locationHistory={locationHistory}
                selectedBed={selectedBed}
                showAvailableOnly={showAvailableOnly}
                searchTerm={searchTerm}
                isLoadingLocations={isLoadingLocations}
                isLoadingBeds={isLoadingBeds}
                hasMore={selectedLocation ? hasMoreBeds : hasMoreLocations}
                onLocationClick={handleLocationClick}
                onBedSelect={setSelectedBed}
                onCheckBedStatus={checkBedStatus}
                onSearchChange={setSearchTerm}
                onSearch={handleSearch}
                onShowAvailableChange={(value) => {
                  setShowAvailableOnly(value);
                  setBedsPage(1);
                  setAllBeds([]);
                }}
                onLoadMore={handleLoadMore}
                onClearSelection={() => setSelectedBed(null)}
                onGoBack={goBack}
              />

              <div
                className="mt-8 flex justify-end gap-2"
                data-cy="location-navigation-buttons"
              >
                <Button
                  variant="outline"
                  disabled={!selectedBed}
                  onClick={() => {
                    setSheetState((prev) => ({
                      ...prev,
                      screen: "modify",
                      action: getCurrentLocations().activeLocation
                        ? "move"
                        : "new",
                      timeConfig: {
                        start: new Date(),
                        end: new Date(),
                        status: "planned",
                      },
                    }));
                  }}
                >
                  {t("schedule_for_later")}
                </Button>
                <Button
                  variant="primary"
                  disabled={!selectedBed}
                  onClick={() => {
                    setSheetState((prev) => ({
                      ...prev,
                      screen: "modify",
                      action: getCurrentLocations().activeLocation
                        ? "move"
                        : "new",
                      timeConfig: {
                        start: new Date(),
                        status: "active",
                      },
                    }));
                  }}
                >
                  {t("assign_bed_now")}
                </Button>
              </div>
            </div>
          );
        }

        return <div className="space-y-2">{locationCards}</div>;

      default:
        return null;
    }
  };

  const { mutate: executeBatch, isPending } = useMutation({
    mutationFn: mutate(routes.batchRequest, { silent: true }),
    onSuccess: () => {
      toast.success(t("bed_assigned_successfully"));
      resetStates();
      queryClient.invalidateQueries({
        queryKey: ["encounter", encounter.id],
      });
    },
    onError: (error) => {
      // Type cast to access the results property safely
      const errorData = error.cause as {
        results?: Array<{
          reference_id: string;
          status_code: number;
          data: {
            errors?: Array<{
              msg?: string;
              error?: string;
              type?: string;
              loc?: string[];
            }>;
            non_field_errors?: string[];
            detail?: string;
          };
        }>;
      };

      if (errorData?.results) {
        // Filter results for error status codes
        const failedResults = errorData.results.filter(
          (result) => result.status_code !== 200,
        );

        // Process each failed result to extract error messages
        let errorDisplayed = false;
        failedResults.forEach((result) => {
          const errors = result.data?.errors || [];
          const nonFieldErrors = result.data?.non_field_errors || [];
          const detailError = result.data?.detail;

          // Display each error message
          errors.forEach((error) => {
            const message = error.msg || error.error || t("validation_failed");
            toast.error(message);
            errorDisplayed = true;
          });

          // Display non-field errors
          nonFieldErrors.forEach((message) => {
            toast.error(message);
            errorDisplayed = true;
          });

          // Display detail error if present
          if (detailError) {
            toast.error(detailError);
            errorDisplayed = true;
          }
        });

        // If no specific errors were found but we still had failures
        if (failedResults.length > 0 && !errorDisplayed) {
          toast.error(t("error_updating_location"));
        }
      } else {
        // Generic error if we couldn't parse the error response
        toast.error(t("error_updating_location"));
      }
    },
  });

  const goBack = () => {
    if (sheetState.screen === "modify") {
      setSheetState((prev) => ({
        ...prev,
        screen: "assign",
        ...(sheetState.action === "new" && {
          timeConfig: {
            start: new Date(),
            status: "active",
          },
        }),
      }));
    } else {
      // When clicking the root breadcrumb, reset everything to initial state
      setLocationHistory([]);
      setSelectedLocation(null);
      setSelectedBed(null);
      setLocationsPage(1);
      setAllLocations([]);
      setHasMoreLocations(true);
      setBedsPage(1);
      setAllBeds([]);
      setHasMoreBeds(true);
      setSearchTerm("");
    }
    setSelectedBed(null);
  };

  return (
    <>
      <Sheet
        onOpenChange={(open) => {
          setOpen(open);
          // Reset states when closing the sheet
          if (!open) {
            resetStates();
          }
        }}
      >
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent className="w-full sm:max-w-3xl pr-2 pl-3">
          <SheetHeader className="space-y-1 px-1">
            <SheetTitle className="text-sm font-semibold">
              {t("update_location")}
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="assign" className="mt-2">
            <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent p-0 h-auto rounded-none">
              <TabsTrigger
                value="assign"
                className="border-0 data-[state=active]:border-b-2 px-2 text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-800  data-[state=active]:border-primary-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              >
                {t("assign_location")}
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="border-0 data-[state=active]:border-b px-2 text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-800  data-[state=active]:border-primary-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              >
                {t("location_history")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assign" className="mt-2">
              <ScrollArea className="h-[calc(100vh-13rem)] md:h-[calc(100vh-8rem)] p-3 md:p-4">
                {renderScreen()}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="mt-2">
              <ScrollArea className="h-[calc(100vh-13rem)] md:h-[calc(100vh-8rem)]">
                <LocationHistoryComponent history={history} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={showDischargeDialog}
        onOpenChange={setShowDischargeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm_selection")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bed_available_soon_discharged_message")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDischargeDialog(false);
                setSelectedDischargedBed(null);
              }}
            >
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDischargeConfirm}>
              {t("proceed")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {locationStatus === "active"
                ? t("are_you_sure_mark_as_error_active_bed")
                : t("are_you_sure_cancel_planned_bed")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setLocationToDelete(null);
              }}
            >
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              onClick={confirmDeletePlan}
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showOccupiedDialog}
        onOpenChange={setShowOccupiedDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bed_occupied")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bed_unavailable_message")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowOccupiedDialog(false)}>
              {t("close")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
