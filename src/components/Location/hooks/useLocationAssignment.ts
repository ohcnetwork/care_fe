import { useState } from "react";

import {
  EditingState,
  LocationSheetState,
} from "@/components/Location/utils/locationHelpers";
import { LocationAssociationStatus } from "@/types/location/association";

const initialState: LocationSheetState = {
  screen: "overview",
  action: "assign",
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

  const setScreenToOverview = () => {
    setSheetState((prev) => ({
      ...prev,
      screen: "overview",
    }));
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

  const browseBeds = (action: "move" | "assign" = "assign") => {
    setSheetState({
      screen: "assign",
      action,
      timeConfig: {
        start: new Date(),
        status: "active",
      },
    });
  };

  const confirmBedSelection = (
    status: LocationAssociationStatus,
    hasCurrentLocation: boolean,
  ) => {
    const action =
      status === "active" && hasCurrentLocation ? "move" : "assign";
    setSheetState({
      screen: "modify",
      action,
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
    setSheetState((prev) => ({ ...prev, action: "edit_time" }));
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
    setSheetState((prev) => ({ ...prev, action: "complete" }));
    setEditingState({
      locationId,
      timeConfig: {
        start: startTime,
        end: endTime,
        status: "completed",
      },
    });
  };

  const promotePlanned = (
    plannedLocationId: string,
    status: LocationAssociationStatus = "active",
  ) => {
    const timeConfig = {
      start: new Date(),
      status,
      end: undefined,
    };

    setSheetState({
      screen: "modify",
      action: "promote",
      timeConfig,
    });

    setEditingState({
      locationId: plannedLocationId,
      timeConfig,
    });
  };

  const promoteReserved = (
    reservedLocationId: string,
    originalStartTime: Date,
  ) => {
    const timeConfig = {
      start: originalStartTime,
      status: "active" as LocationAssociationStatus,
      end: undefined,
    };

    setSheetState({
      screen: "modify",
      action: "promote",
      timeConfig,
    });

    setEditingState({
      locationId: reservedLocationId,
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
    setScreenToOverview,
    setScreenToAssign,
    setScreenToModify,
    browseBeds,
    confirmBedSelection,
    startEditingTime,
    startCompletingStay,
    promotePlanned,
    promoteReserved,
  };
}
