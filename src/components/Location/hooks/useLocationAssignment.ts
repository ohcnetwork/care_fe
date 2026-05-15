import { useState } from "react";

import {
  EditingState,
  LocationSheetState,
} from "@/components/Location/utils/locationHelpers";
import { LocationAssociationStatus } from "@/types/location/association";

const initialState: LocationSheetState = {
  screen: "assign",
  action: "new",
  timeConfig: {
    start: new Date(),
    status: "active",
  },
};

const initialEditingState: EditingState = {
  locationId: null,
  timeConfig: {
    start: new Date(),
    status: "active",
  },
};

export function useLocationAssignment() {
  const [sheetState, setSheetState] =
    useState<LocationSheetState>(initialState);
  const [editingState, setEditingState] =
    useState<EditingState>(initialEditingState);
  const [keepBedActive, setKeepBedActive] = useState(false);

  const resetToInitial = () => {
    setSheetState(initialState);
    setEditingState(initialEditingState);
    setKeepBedActive(false);
  };

  const resetEditingState = () => {
    setSheetState(initialState);
    setEditingState(initialEditingState);
  };

  const setScreenToAssign = () => {
    setSheetState((prev) => ({
      ...prev,
      screen: "assign",
    }));
  };

  const setScreenToModify = () => {
    setSheetState((prev) => ({
      ...prev,
      screen: "modify",
    }));
  };

  const startMove = () => {
    setSheetState({
      screen: "assign",
      action: "move",
      timeConfig: {
        start: new Date(),
        status: "active",
      },
    });
  };

  const startNewAssignment = (
    status: LocationAssociationStatus,
    hasCurrentLocation: boolean,
  ) => {
    setSheetState({
      screen: "modify",
      action: hasCurrentLocation ? "move" : "new",
      timeConfig: {
        start: new Date(),
        ...(status === "planned" ? { end: new Date() } : {}),
        status,
      },
    });
  };

  const startEditingTime = (
    locationId: string,
    startTime: Date,
    endTime?: Date,
    status: LocationAssociationStatus = "active",
  ) => {
    setEditingState({
      locationId,
      timeConfig: {
        start: startTime,
        end: endTime,
        status,
      },
    });
  };

  const startCompletingStay = (
    locationId: string,
    startTime: Date,
    endTime: Date = new Date(),
  ) => {
    setEditingState({
      locationId,
      timeConfig: {
        start: startTime,
        end: endTime,
        status: "completed",
      },
    });
  };

  const startAddReserved = () => {
    setSheetState({
      screen: "assign",
      action: "add_reserved",
      timeConfig: {
        start: new Date(),
        status: "reserved",
      },
    });
  };

  const startAssigningPlanned = (
    plannedLocationId: string,
    startTime: Date,
    status: LocationAssociationStatus = "active",
  ) => {
    const timeConfig = {
      start: startTime,
      status,
      end: new Date(),
    };

    setSheetState({
      screen: "modify",
      action: "new",
      timeConfig,
    });

    setEditingState({
      locationId: plannedLocationId,
      timeConfig,
    });
  };

  return {
    // State
    sheetState,
    editingState,
    keepBedActive,

    // Setters
    setSheetState,
    setEditingState,
    setKeepBedActive,

    // Actions
    resetToInitial,
    resetEditingState,
    setScreenToAssign,
    setScreenToModify,
    startMove,
    startNewAssignment,
    startEditingTime,
    startCompletingStay,
    startAddReserved,
    startAssigningPlanned,
  };
}
