import { useState } from "react";

import { LocationAssociationStatus } from "@/types/location/association";
import { LocationRead } from "@/types/location/location";

export function useLocationDialogs() {
  const [showDischargeDialog, setShowDischargeDialog] = useState(false);
  const [showOccupiedDialog, setShowOccupiedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDischargedBed, setSelectedDischargedBed] =
    useState<LocationRead | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<{
    locationId: string;
    associationId: string;
    status: LocationAssociationStatus;
  } | null>(null);

  const openDischargeDialog = (bed: LocationRead) => {
    setSelectedDischargedBed(bed);
    setShowDischargeDialog(true);
  };

  const closeDischargeDialog = () => {
    setShowDischargeDialog(false);
    setSelectedDischargedBed(null);
  };

  const openOccupiedDialog = () => {
    setShowOccupiedDialog(true);
  };

  const closeOccupiedDialog = () => {
    setShowOccupiedDialog(false);
  };

  const openDeleteDialog = (
    locationId: string,
    associationId: string,
    status: LocationAssociationStatus,
  ) => {
    setLocationToDelete({ locationId, associationId, status });
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setLocationToDelete(null);
  };

  return {
    // Discharge dialog
    showDischargeDialog,
    selectedDischargedBed,
    openDischargeDialog,
    closeDischargeDialog,

    // Occupied dialog
    showOccupiedDialog,
    openOccupiedDialog,
    closeOccupiedDialog,

    // Delete dialog
    showDeleteDialog,
    locationToDelete,
    openDeleteDialog,
    closeDeleteDialog,
  };
}
