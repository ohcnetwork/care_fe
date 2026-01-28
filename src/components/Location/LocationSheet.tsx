import { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";

import { EncounterRead } from "@/types/emr/encounter/encounter";
import { LocationAssociationRead } from "@/types/location/association";
import { LocationRead } from "@/types/location/location";

import { useLocationAssignment } from "@/components/Location/hooks/useLocationAssignment";
import { useLocationDialogs } from "@/components/Location/hooks/useLocationDialogs";
import { useLocationMutations } from "@/components/Location/hooks/useLocationMutations";
import { useLocationNavigation } from "@/components/Location/hooks/useLocationNavigation";
import { LocationHistory as LocationHistoryComponent } from "@/components/Location/LocationHistory";
import {
  completeCurrentLocationAssociation,
  createDeleteLocationAssociationRequest,
  createLocationAssociationRequest,
  createLocationAssociationUpdateRequest,
  createLocationHistoryFromBed,
  createLocationUpdateOperationalStatusRequest,
  getCurrentLocations,
} from "@/components/Location/utils/locationHelpers";
import { LocationAssignmentView } from "@/components/Location/views/LocationAssignmentView";
import { LocationModifyView } from "@/components/Location/views/LocationModifyView";

interface LocationSheetProps {
  history: LocationAssociationRead[];
  facilityId: string;
  encounter: EncounterRead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "assign" | "history";
}

export function LocationSheet({
  history,
  facilityId,
  encounter,
  open,
  onOpenChange,
  defaultTab = "assign",
}: LocationSheetProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"assign" | "history">(defaultTab);

  // Custom hooks
  const navigation = useLocationNavigation({ facilityId, open, tab });
  const assignment = useLocationAssignment();
  const dialogs = useLocationDialogs();
  const mutations = useLocationMutations(encounter.id);

  // Derived state
  const { currentLocation, activeLocations, plannedLocations } = useMemo(
    () => getCurrentLocations(encounter),
    [encounter],
  );

  const selectedBedLocation = navigation.selectedBed
    ? createLocationHistoryFromBed(
        navigation.selectedBed,
        assignment.sheetState.timeConfig,
      )
    : undefined;

  // Reset handlers
  const resetAll = () => {
    navigation.resetNavigation();
    assignment.resetToInitial();
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetAll();
    }
  };

  // Bed status check handler
  const handleCheckBedStatus = (selectedBed: LocationRead) => {
    if (!selectedBed.current_encounter) return;

    if (selectedBed.current_encounter.status === "discharged") {
      dialogs.openDischargeDialog(selectedBed);
    } else {
      dialogs.openOccupiedDialog();
    }
  };

  // Discharge dialog handler
  const handleDischargeConfirm = () => {
    if (dialogs.selectedDischargedBed) {
      navigation.setSelectedBed(dialogs.selectedDischargedBed);
      assignment.setSheetState((prev) => ({
        ...prev,
        timeConfig: {
          start: new Date(),
          end: new Date(),
          status: "planned",
        },
      }));
    }
    dialogs.closeDischargeDialog();
  };

  // Assignment action handlers
  const handleMove = () => {
    assignment.startMove();
  };

  const handleCompleteBedStay = (location: LocationAssociationRead) => {
    assignment.startCompletingStay(
      location.id,
      new Date(location.start_datetime),
      new Date(),
    );
  };

  const handleUpdateTime = (location: LocationAssociationRead) => {
    assignment.startEditingTime(
      location.id,
      new Date(location.start_datetime),
      location.end_datetime ? new Date(location.end_datetime) : undefined,
      location.status,
    );
  };

  const handleAssignNowPlanned = (plannedLocation: LocationAssociationRead) => {
    assignment.startAssigningPlanned(plannedLocation.id, "active");
  };

  const handleCancelPlan = (
    status: "active" | "planned",
    locationToCancel: LocationAssociationRead,
  ) => {
    dialogs.openDeleteDialog(
      locationToCancel.location.id,
      locationToCancel.id,
      status,
    );
  };

  const handleConfirmDelete = async () => {
    if (!dialogs.locationToDelete) return;

    const requests = [];

    // Find the location being deleted from history
    const locationBeingDeleted = history.find(
      (loc) => loc.id === dialogs.locationToDelete?.associationId,
    );

    // Mark the deleted location as unoccupied
    if (locationBeingDeleted) {
      requests.push(
        createLocationUpdateOperationalStatusRequest(
          locationBeingDeleted.location,
          facilityId,
          "U",
        ),
      );
    }

    if (locationBeingDeleted?.status === "active") {
      activeLocations
        .filter((loc) => loc.id !== locationBeingDeleted?.id)
        .filter((loc) => loc.status === "reserved")
        .forEach((reservedLocation) => {
          requests.push(
            createDeleteLocationAssociationRequest(
              reservedLocation.location.id,
              reservedLocation.id,
              facilityId,
            ),
          );
          requests.push(
            createLocationUpdateOperationalStatusRequest(
              reservedLocation.location,
              facilityId,
              "U",
            ),
          );
        });
    }

    // Delete the location association
    requests.push(
      createDeleteLocationAssociationRequest(
        dialogs.locationToDelete.locationId,
        dialogs.locationToDelete.associationId,
        facilityId,
      ),
    );

    // Execute all requests in batch
    await mutations.executeBatch.mutateAsync({ requests });

    dialogs.closeDeleteDialog();
  };

  // Confirm time for new/move assignment
  const handleConfirmTime = async (
    currentPlannedLocation?: LocationAssociationRead,
  ) => {
    const requests = [];
    const selectedBed = navigation.selectedBed || navigation.selectedLinkedBed;
    if (
      currentLocation &&
      ((assignment.sheetState.action === "move" &&
        assignment.sheetState.timeConfig.status === "active") ||
        assignment.sheetState.action === "complete" ||
        (assignment.sheetState.action === "new" && currentPlannedLocation))
    ) {
      // Complete current location if keepBedActive is unchecked
      if (!assignment.keepBedActive) {
        requests.push(
          completeCurrentLocationAssociation(
            currentLocation,
            facilityId,
            encounter.id,
            new Date(),
          ),
        );
        requests.push(
          createLocationUpdateOperationalStatusRequest(
            currentLocation.location,
            facilityId,
            "U",
          ),
        );
      }
      // Update current location to reserved if keepBedActive is checked
      else {
        requests.push(
          createLocationAssociationUpdateRequest(
            currentLocation,
            {
              start: new Date(currentLocation.start_datetime),
              end: undefined,
              status: "reserved",
            },
            facilityId,
            encounter.id,
          ),
        );
      }
    }

    // Create new location association
    if (selectedBed) {
      requests.push(
        createLocationAssociationRequest(
          selectedBed.id,
          assignment.sheetState.timeConfig,
          facilityId,
          encounter.id,
        ),
      );
      // Mark location as occupied for active assignments
      requests.push(
        createLocationUpdateOperationalStatusRequest(
          selectedBed as LocationRead,
          facilityId,
          "O",
        ),
      );
    }
    // Update planned location to active
    else if (assignment.sheetState.action === "new" && currentPlannedLocation) {
      requests.push(
        createLocationAssociationUpdateRequest(
          currentPlannedLocation,
          {
            start: new Date(),
            status: "active",
          },
          facilityId,
          encounter.id,
        ),
      );
      requests.push(
        createLocationUpdateOperationalStatusRequest(
          currentPlannedLocation.location,
          facilityId,
          "O",
        ),
      );
    }

    if (requests.length > 0) {
      await mutations.executeBatch.mutateAsync({ requests });
      resetAll();
    }
  };

  // Confirm edit for existing location
  const handleConfirmEdit = async (location: LocationAssociationRead) => {
    const requests = [];

    const isUpdatingActiveLocation =
      currentLocation && currentLocation.id === location.id;

    // Complete current location if changing to a different location or changing status
    if (
      assignment.editingState.timeConfig.status === "active" &&
      currentLocation &&
      !isUpdatingActiveLocation
    ) {
      if (!assignment.keepBedActive) {
        requests.push(
          completeCurrentLocationAssociation(
            currentLocation,
            facilityId,
            encounter.id,
            new Date(),
          ),
        );
        requests.push(
          createLocationUpdateOperationalStatusRequest(
            currentLocation.location,
            facilityId,
            "U",
          ),
        );
      } else {
        requests.push(
          createLocationAssociationUpdateRequest(
            currentLocation,
            { ...assignment.editingState.timeConfig, status: "reserved" },
            facilityId,
            encounter.id,
          ),
        );
      }
    }

    // Update the selected location
    requests.push(
      createLocationAssociationUpdateRequest(
        location,
        assignment.editingState.timeConfig,
        facilityId,
        encounter.id,
      ),
    );

    // If completing an active location, also complete all reserved locations
    if (assignment.editingState.timeConfig.status === "completed") {
      if (location.status === "active") {
        requests.push(
          createLocationUpdateOperationalStatusRequest(
            location.location,
            facilityId,
            "U",
          ),
        );

        activeLocations.forEach((activeLocation) => {
          if (activeLocation.status === "reserved") {
            requests.push(
              completeCurrentLocationAssociation(
                activeLocation,
                facilityId,
                encounter.id,
                new Date(),
              ),
            );
            requests.push(
              createLocationUpdateOperationalStatusRequest(
                activeLocation.location,
                facilityId,
                "U",
              ),
            );
          }
        });
      } else if (location.status === "reserved") {
        requests.push(
          createLocationUpdateOperationalStatusRequest(
            location.location,
            facilityId,
            "U",
          ),
        );
      }
    }

    if (requests.length > 0) {
      await mutations.executeBatch.mutateAsync({ requests });
      resetAll();
    }
  };

  const handleAssignLinkedBed = async (location: LocationAssociationRead) => {
    const requests = [];
    if (currentLocation && assignment.sheetState.action === "move") {
      if (assignment.keepBedActive) {
        requests.push(
          createLocationAssociationUpdateRequest(
            currentLocation,
            {
              start: new Date(currentLocation.start_datetime),
              end: undefined,
              status: "reserved",
            },
            facilityId,
            encounter.id,
          ),
        );
        requests.push(
          createLocationUpdateOperationalStatusRequest(
            currentLocation.location,
            facilityId,
            "O",
          ),
        );
      } else {
        requests.push(
          completeCurrentLocationAssociation(
            currentLocation,
            facilityId,
            encounter.id,
            new Date(),
          ),
        );
        requests.push(
          createLocationUpdateOperationalStatusRequest(
            currentLocation.location,
            facilityId,
            "U",
          ),
        );
      }

      requests.push(
        createLocationAssociationUpdateRequest(
          location,
          {
            start: new Date(location.start_datetime || new Date()),
            end: undefined,
            status: "active",
          },
          facilityId,
          encounter.id,
        ),
      );
    }

    if (requests.length > 0) {
      await mutations.executeBatch.mutateAsync({ requests });
      resetAll();
    }
  };

  // Navigation handlers
  const handleGoBack = () => {
    if (assignment.sheetState.screen === "modify") {
      assignment.setScreenToAssign();
    } else {
      navigation.goBack();
    }
    navigation.clearBedSelection();
  };

  const handleScheduleForLater = () => {
    assignment.startNewAssignment("planned", !!currentLocation);
  };

  const handleAssignNow = () => {
    assignment.startNewAssignment("active", !!currentLocation);
  };

  const getDeleteDialogDescription = () => {
    const isReservedBed = activeLocations.some(
      (loc) =>
        loc.id === dialogs.locationToDelete?.associationId &&
        loc.status === "reserved",
    );
    if (dialogs.locationToDelete?.status === "active") {
      return activeLocations.length > 0 ? (
        <Trans
          i18nKey="are_you_sure_mark_as_error_multiple_beds"
          values={{
            beds: activeLocations.map((loc) => loc.location.name).join(", "),
          }}
          components={{
            strong: (
              <strong className="inline-block align-bottom truncate max-w-72 sm:max-w-full md:max-w-full lg:max-w-full xl:max-w-full" />
            ),
            br: <br />,
          }}
        />
      ) : (
        t("are_you_sure_mark_as_error_active_bed")
      );
    } else if (isReservedBed) {
      return t("are_you_sure_cancel_reserved_bed");
    }
    return t("are_you_sure_cancel_planned_bed");
  };

  // Create handler objects
  const assignmentHandlers = {
    sheetState: assignment.sheetState,
    setSheetState: assignment.setSheetState,
    isPending: mutations.isPending,
    editingState: assignment.editingState,
    setEditingState: assignment.setEditingState,
    keepBedActive: assignment.keepBedActive,
    onKeepBedActiveChange: assignment.setKeepBedActive,
    onMove: handleMove,
    onComplete: handleCompleteBedStay,
    onUpdateTime: handleUpdateTime,
    onCancel: handleCancelPlan,
    onCancelEdit: assignment.resetEditingState,
    onConfirmEdit: handleConfirmEdit,
    onConfirmTime: handleConfirmTime,
    onAssignLinkedBed: handleAssignLinkedBed,
  };

  const navigationHandlers = {
    onLocationClick: navigation.handleLocationClick,
    onBedSelect: navigation.setSelectedBed,
    onLinkedBedSelect: navigation.handleLinkedBedClick,
    onCheckBedStatus: handleCheckBedStatus,
    onSearchChange: navigation.setSearchTerm,
    onSearch: navigation.handleSearch,
    onShowAvailableChange: (value: boolean) => {
      navigation.setShowAvailableOnly(value);
      navigation.setBedsPage(1);
      navigation.setAllBeds([]);
    },
    onLoadMore: navigation.handleLoadMore,
    onClearSelection: navigation.clearBedSelection,
    onGoBack: handleGoBack,
    onAssignNowPlanned: handleAssignNowPlanned,
    onScheduleForLater: handleScheduleForLater,
    onAssignNow: handleAssignNow,
    showAvailableOnly: navigation.showAvailableOnly,
    searchTerm: navigation.searchTerm,
    isLoadingLocations: navigation.isLoadingLocations,
    isLoadingBeds: navigation.isLoadingBeds,
    hasMore: navigation.selectedLocation
      ? navigation.hasMoreBeds
      : navigation.hasMoreLocations,
  };

  // Render the appropriate screen
  const renderScreen = () => {
    switch (assignment.sheetState.screen) {
      case "modify":
        return (
          <LocationModifyView
            currentLocation={currentLocation}
            plannedLocations={plannedLocations}
            selectedBedLocation={selectedBedLocation}
            selectedLinkedBed={navigation.selectedLinkedBed}
            assignmentHandlers={assignmentHandlers}
            onAssignNowPlanned={handleAssignNowPlanned}
          />
        );

      case "assign":
      default:
        return (
          <LocationAssignmentView
            allLocations={navigation.allLocations}
            allBeds={navigation.allBeds}
            selectedLocation={navigation.selectedLocation}
            locationHistory={navigation.locationHistory}
            selectedBed={navigation.selectedBed}
            selectedLinkedBed={navigation.selectedLinkedBed || null}
            currentLocation={currentLocation}
            plannedLocations={plannedLocations}
            activeLocations={activeLocations}
            isPending={mutations.isPending}
            assignmentHandlers={assignmentHandlers}
            navigationHandlers={navigationHandlers}
          />
        );
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-3xl pr-2 pl-3">
          <SheetHeader className="space-y-1 px-1">
            <SheetTitle className="text-sm font-semibold">
              {t("update_location")}
            </SheetTitle>
          </SheetHeader>

          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as "assign" | "history")}
            className="mt-2"
          >
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

      {/* Discharge Dialog */}
      <ConfirmActionDialog
        open={dialogs.showDischargeDialog}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeDischargeDialog();
          }
        }}
        title={t("confirm_selection")}
        description={t("bed_available_soon_discharged_message")}
        onConfirm={handleDischargeConfirm}
        confirmText={t("proceed")}
      />

      {/* Delete Dialog */}
      <ConfirmActionDialog
        open={dialogs.showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeDeleteDialog();
          }
        }}
        title={t("confirm")}
        description={getDeleteDialogDescription()}
        onConfirm={handleConfirmDelete}
        confirmText={t("confirm")}
        variant="destructive"
      />

      {/* Occupied Dialog */}
      <ConfirmActionDialog
        open={dialogs.showOccupiedDialog}
        onOpenChange={(open) => {
          if (!open) {
            dialogs.closeOccupiedDialog();
          }
        }}
        title={t("bed_occupied")}
        description={t("bed_unavailable_message")}
        onConfirm={dialogs.closeOccupiedDialog}
        confirmText={t("close")}
        hideCancel
      />
    </>
  );
}
