import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
  createCompleteLocationRequest,
  createLocationAssociationRequest,
  createLocationHistoryFromBed,
  createLocationUpdateOperationalStatusRequest,
  createLocationUpdateRequest,
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

  const selectedBedDetails = navigation.selectedBed
    ? navigation.allBeds.find((bed) => bed.id === navigation.selectedBed)
    : null;

  const selectedBedLocation = selectedBedDetails
    ? createLocationHistoryFromBed(
        selectedBedDetails,
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
      navigation.setSelectedBed(dialogs.selectedDischargedBed.id);
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

  const handleConfirmDelete = () => {
    if (!dialogs.locationToDelete) return;

    mutations.unlinkLocation.mutate({
      facilityId,
      locationId: dialogs.locationToDelete.locationId,
      associationId: dialogs.locationToDelete.associationId,
      encounterId: encounter.id,
      status: dialogs.locationToDelete.status,
    });

    dialogs.closeDeleteDialog();
  };

  // Confirm time for new/move assignment
  const handleConfirmTime = async (
    currentPlannedLocation?: LocationAssociationRead,
  ) => {
    const requests = [];

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
          createCompleteLocationRequest(
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
          createLocationUpdateRequest(
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

    // Update planned location to active
    if (assignment.sheetState.action === "new" && currentPlannedLocation) {
      requests.push(
        createLocationUpdateRequest(
          currentPlannedLocation,
          {
            start: new Date(),
            status: "active",
          },
          facilityId,
          encounter.id,
        ),
      );
    }
    // Create new location association
    else if (navigation.selectedBed) {
      requests.push(
        createLocationAssociationRequest(
          navigation.selectedBed,
          assignment.sheetState.timeConfig,
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
          createCompleteLocationRequest(
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
          createLocationUpdateRequest(
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
      createLocationUpdateRequest(
        location,
        assignment.editingState.timeConfig,
        facilityId,
        encounter.id,
      ),
    );

    // If completing an active location, also complete all reserved locations
    if (
      location.status === "active" &&
      assignment.editingState.timeConfig.status === "completed"
    ) {
      activeLocations.forEach((activeLocation) => {
        if (activeLocation.status === "reserved") {
          requests.push(
            createCompleteLocationRequest(
              activeLocation,
              facilityId,
              encounter.id,
              new Date(),
            ),
          );
        }
      });
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
          createLocationUpdateRequest(
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
          createCompleteLocationRequest(
            currentLocation,
            facilityId,
            encounter.id,
            new Date(),
          ),
        );
      }

      requests.push(
        createLocationUpdateRequest(
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
        description={
          dialogs.locationToDelete?.status === "active"
            ? t("are_you_sure_mark_as_error_active_bed")
            : t("are_you_sure_cancel_planned_bed")
        }
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
