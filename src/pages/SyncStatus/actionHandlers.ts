import { navigate } from "raviger";
import { toast } from "sonner";

import { OfflineWritesEntry } from "@/OfflineSupport/AppcacheDB";
import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { SyncManager } from "@/OfflineSupport/syncmanger";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";
import { Appointment } from "@/types/scheduling/schedule";
import { UserBase } from "@/types/user/user";

/* Edit handlers for each type of offline write entry */

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

// Handler for appointment entries
export const handleAppointmentEdit = async (entry: OfflineWritesEntry) => {
  switch (entry.type) {
    case "create_appointment": {
      // Extract patient from normalized data
      const normalizedData = entry.normalizedData as Appointment;
      const patientId = normalizedData?.patient?.id;

      if (!patientId) {
        toast.error("Patient information not found in offline entry");
        return;
      }

      navigate(
        `/facility/${entry.facilityId}/patient/${patientId}/book-appointment`,
        {
          query: {
            offlineEntryId: entry.id,
          },
        },
      );
      break;
    }

    case "reschedule_appointment":
    case "update_appointment_status":
    case "cancel_appointment": {
      // Extract appointment and patient info from normalized data
      const normalizedData = entry.normalizedData as Appointment;

      // Extract the actual appointment ID from the offline entry ID
      let appointmentId: string;
      if (entry.id.startsWith("offline-")) {
        // For offline entries, extract the original appointment ID
        // Format: offline-{appointmentId}-{action}
        // Remove "offline-" prefix and get everything before the last "-"
        const withoutPrefix = entry.id.substring(8); // Remove "offline-"
        const lastDashIndex = withoutPrefix.lastIndexOf("-");
        if (lastDashIndex !== -1) {
          appointmentId = withoutPrefix.substring(0, lastDashIndex); // Everything before the last dash
        } else {
          appointmentId = withoutPrefix; // Fallback if no action suffix
        }
      } else {
        // For direct appointment IDs
        appointmentId = entry.id;
      }

      const patientId = normalizedData?.patient?.id;

      if (!patientId) {
        toast.error("Patient information not found in offline entry");
        return;
      }

      navigate(
        `/facility/${entry.facilityId}/patient/${patientId}/appointments/${appointmentId}`,
        {
          query: {
            offlineEntryId: entry.id,
          },
        },
      );
      break;
    }

    default:
      handleUnsupportedTypeEdit(entry);
      break;
  }
};

// Handler for unsupported entry types
export const handleUnsupportedTypeEdit = (entry: OfflineWritesEntry) => {
  toast.info(`Edit functionality for ${entry.type} is not implemented yet`);
};

// ============================================================================
// RETRY HANDLERS
// ============================================================================

// Global retry handler for all record types
export const handleRetryRecord = async (entry: OfflineWritesEntry) => {
  try {
    // Create a SyncManager instance to process the write
    const syncManager = new SyncManager({
      userId: entry.userId,
      facilityId: entry.facilityId,
      enableConflictDetection: true,
    });
    const result = await syncManager.processSingleWrite(entry);

    if (result.status === "success") {
      toast.success(`Successfully retried ${entry.type}`);
    } else {
      toast.error(`Retry failed: ${result.error || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Error retrying record:", error);
    toast.error("Failed to retry record");
  }
};

// ============================================================================
// DELETE HANDLERS
// ============================================================================

// Global delete handler for all record types
export const handleDeleteRecord = async (entry: OfflineWritesEntry) => {
  try {
    const db = new AppCacheDB();

    // Find all child records that are not successful
    const childRecords = await findChildRecords(entry.id);

    // Delete the main record
    await db.OfflineWrites.delete(entry.id);

    // Delete all child records
    for (const child of childRecords) {
      await db.OfflineWrites.delete(child.id);
    }

    toast.success(`Successfully deleted record`);

    return true;
  } catch (error) {
    console.error("Error deleting record:", error);
    toast.error("Failed to delete record");
    return false;
  }
};

// Helper function to find all child records recursively
async function findChildRecords(
  parentId: string,
): Promise<OfflineWritesEntry[]> {
  const db = new AppCacheDB();
  const allWrites = await db.OfflineWrites.toArray();
  const childRecords: OfflineWritesEntry[] = [];

  // Find direct children
  const directChildren = allWrites.filter(
    (write) => write.parentMutationId === parentId,
  );

  for (const child of directChildren) {
    // Only include children that are not successful
    if (child.syncStatus !== "success") {
      childRecords.push(child);

      // Recursively find children of this child
      const grandChildren = await findChildRecords(child.id);
      childRecords.push(...grandChildren);
    }
  }

  return childRecords;
}
