import { navigate } from "raviger";
import { toast } from "sonner";

import { OfflineWritesEntry } from "@/OfflineSupport/AppcacheDB";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";
import { UserBase } from "@/types/user/user";

/* Edit handlers for each type of offline write entry */

// Handler for creating and updating patient entries
export const handleCreateandUpdatePatientEdit = async (
  entry: OfflineWritesEntry,
  facilityId?: string,
) => {
  if (entry.type === "create_patient") {
    navigate(`/facility/${facilityId}/patient/create`, {
      query: {
        offlineEntryId: entry.id,
      },
    });
  } else if (entry.type === "update_patient") {
    navigate(`/facility/${facilityId}/patient/${entry.id}/edit`, {
      query: {
        offlineEntryId: entry.id,
      },
    });
  }
};

// Handler for creating encounter entries
export const handleCreateEncounterEdit = async (
  entry: OfflineWritesEntry,
  setSelectedEncounterEntry: (entry: OfflineWritesEntry | null) => void,
  setIsEncounterFormOpen: (open: boolean) => void,
) => {
  setSelectedEncounterEntry(entry);
  setIsEncounterFormOpen(true);
};

// Handler for encounter  action ( mark as complete)

export const handleEncounterAction = async (entry: OfflineWritesEntry) => {
  //Note: we use entry.id to navigate to the encounter updates page only because mark as complete is for already existing encounters
  navigate(`/facility/${entry.facilityId}/encounter/${entry.id}/updates`, {
    query: {
      offlineEntryId: entry.id,
    },
  });
};

export const handleCreateandUpdateResourceRequestEdit = async (
  entry: OfflineWritesEntry,
  facilityId?: string,
) => {
  if (entry.type === "create_resource_request") {
    // Extract related_patient from the payload
    const payload = entry.payload as ResourceRequest;
    const relatedPatient = payload?.related_patient;

    navigate(`/facility/${facilityId}/resource/new`, {
      query: {
        related_patient: relatedPatient,
        offlineEntryId: entry.id,
      },
    });
  } else if (entry.type === "update_resource_request") {
    navigate(`/facility/${facilityId}/resource/${entry.id}`, {
      query: {
        offlineEntryId: entry.id,
      },
    });
  }
};

export const handleAssignUserToPatientEdit = async (
  entry: OfflineWritesEntry,
  setSelectedUserAssignmentEntry: (entry: OfflineWritesEntry | null) => void,
  setIsUserAssignmentFormOpen: (open: boolean) => void,
) => {
  setSelectedUserAssignmentEntry(entry);
  setIsUserAssignmentFormOpen(true);
};

export const handleRemoveUserFromPatientEdit = async (
  entry: OfflineWritesEntry,
) => {
  // Extract user and patient info from normalized data
  const normalizedData = entry.normalizedData as {
    user: UserBase;
    patientName: string;
  };
  const userName =
    normalizedData?.user?.username ?? normalizedData?.user.first_name;
  const patientName = normalizedData?.patientName || "Unknown Patient";

  toast.info(
    `To remove user "${userName}" from patient "${patientName}", please go to the patient's profile and delete this record from the Users tab.`,
  );
};

// Handler for unsupported entry types
export const handleUnsupportedTypeEdit = (entry: OfflineWritesEntry) => {
  toast.info(`Edit functionality for ${entry.type} is not implemented yet`);
};

// ============================================================================
// DELETE HANDLERS
// ============================================================================

// TODO: Add delete handlers here
// export const handleDeletePatient = async (entry: OfflineWritesEntry) => { ... }
// export const handleDeleteEncounter = async (entry: OfflineWritesEntry) => { ... }

// ============================================================================
// RETRY HANDLERS
// ============================================================================

// TODO: Add retry handlers here
// export const handleRetryPatient = async (entry: OfflineWritesEntry) => { ... }
// export const handleRetryEncounter = async (entry: OfflineWritesEntry) => { ... }

// ============================================================================
// VIEW HANDLERS
// ============================================================================

// TODO: Add view handlers here
// export const handleViewPatient = async (entry: OfflineWritesEntry) => { ... }
// export const handleViewEncounter = async (entry: OfflineWritesEntry) => { ... }
