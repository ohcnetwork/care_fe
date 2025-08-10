import { navigate } from "raviger";
import { toast } from "sonner";

import { OfflineWritesEntry } from "@/OfflineSupport/AppcacheDB";
import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { SyncManager } from "@/OfflineSupport/syncmanger";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";
import { Appointment } from "@/types/scheduling/schedule";
import { UserBase } from "@/types/user/user";

/* Edit handlers for each type of offline write entry */

// Unified handler for structured questionnaire types (allergy, diagnosis, symptom, medication)
export const handleStructuredQuestionnaireEdit = async (
  entry: OfflineWritesEntry,
) => {
  // Check if this is a structured questionnaire type
  const structuredTypes = [
    "allergy_intolerance",
    "diagnosis",
    "symptom",
    "medication_request",
    "medication_statement",
  ];

  if (!structuredTypes.includes(entry.type as any)) {
    toast.error("Invalid entry type for structured questionnaire editing");
    return;
  }

  try {
    // Extract the payload to get questionnaire and patient/encounter info
    const payload = entry.payload as {
      requests: Array<{
        url: string;
        method: string;
        reference_id: string;
        body: {
          datapoints: Array<{
            encounter?: string;
            patient: string;
            id: string;
            [key: string]: any;
          }>;
          [key: string]: any;
        };
      }>;
    };

    if (!payload.requests || payload.requests.length === 0) {
      toast.error("No questionnaire data found in offline entry");
      return;
    }

    // Get the first request to extract navigation info
    const firstRequest = payload.requests[0];
    // Extract from datapoints array as per payload structure
    const datapoint = firstRequest.body.datapoints?.[0];
    if (!datapoint) {
      toast.error("No datapoint found in offline entry");
      return;
    }

    let patientId = datapoint.patient;
    const encounterId = datapoint.encounter;
    console.log("Extracted patient ID from URL:", patientId);
    // If patient ID is missing, try to extract from URL (especially for allergy type)
    if (!patientId) {
      try {
        // Extract patient ID from URL pattern: /api/v1/patient/{patientId}/...
        const urlMatch = payload.requests[0].url?.match(
          /\/api\/v1\/patient\/([^/]+)/,
        );
        if (urlMatch && urlMatch[1]) {
          patientId = urlMatch[1];
          console.log("Extracted patient ID from URL:", patientId);
        }
      } catch (urlError) {
        console.warn("Failed to extract patient ID from URL:", urlError);
      }
    }

    if (!patientId) {
      toast.error("Patient information not found in offline entry");
      return;
    }

    if (!encounterId) {
      toast.error("Encounter information not found in offline entry");
      return;
    }

    // Navigate to the specific questionnaire form with edit parameters
    navigate(
      `/facility/${entry.facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${entry.type}`,
      {
        query: {
          offlineEntryId: entry.id,
          editMode: "true",
        },
      },
    );
  } catch (error) {
    console.error("Error handling structured questionnaire edit:", error);
    toast.error("Failed to open questionnaire for editing");
  }
};

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

export const handleNonStructuredQuestionnaireEdit = async (
  entry: OfflineWritesEntry,
) => {
  if (entry.type !== "non_structured_questionnaire") {
    toast.error("Invalid entry type for questionnaire editing");
    return;
  }

  try {
    // Extract the payload to get questionnaire and patient/encounter info
    const payload = entry.payload as {
      requests: Array<{
        url: string;
        method: string;
        reference_id: string;
        body: {
          encounter?: string;
          patient: string;
          resource_id: string;
          results: Array<any>;
        };
      }>;
    };

    if (!payload.requests || payload.requests.length === 0) {
      toast.error("No questionnaire data found in offline entry");
      return;
    }

    // Get the first request to extract navigation info
    const firstRequest = payload.requests[0];
    const patientId = firstRequest.body.patient;
    const encounterId = firstRequest.body.encounter;

    // Navigate to questionnaire form with edit parameters
    if (encounterId) {
      navigate(
        `/facility/${entry.facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire`,
        {
          query: {
            offlineEntryId: entry.id,
            editMode: "true",
          },
        },
      );
    } else {
      navigate(
        `/facility/${entry.facilityId}/patient/${patientId}/questionnaire`,
        {
          query: {
            offlineEntryId: entry.id,
            editMode: "true",
          },
        },
      );
    }
  } catch (error) {
    console.error("Error handling questionnaire edit:", error);
    toast.error("Failed to open questionnaire for editing");
  }
};

// Handler for appointment entries
export const handleAppointmentQuestionnaireEdit = async (
  entry: OfflineWritesEntry,
) => {
  if (entry.type !== "appointment") {
    toast.error("Invalid entry type for appointment editing");
    return;
  }

  try {
    // Extract the payload to get patient and slot info
    const payload = entry.payload as {
      requests: Array<{
        url: string;
        method: string;
        reference_id: string;
        body: {
          note: string;
          patient: string;
          tags: string[];
        };
      }>;
    };

    if (!payload.requests || payload.requests.length === 0) {
      toast.error("No appointment data found in offline entry");
      return;
    }

    // Get the first request to extract patient info
    const firstRequest = payload.requests[0];
    const patientId = firstRequest.body.patient;

    if (!patientId) {
      toast.error("Patient information not found in offline entry");
      return;
    }

    // Navigate to patient questionnaire form with edit parameters
    navigate(
      `/facility/${entry.facilityId}/patient/${patientId}/questionnaire`,
      {
        query: {
          offlineEntryId: entry.id,
          editMode: "true",
        },
      },
    );
  } catch (error) {
    console.error("Error handling appointment edit:", error);
    toast.error("Failed to open appointment questionnaire for editing");
  }
};

// Handler for files entries
export const handleFilesQuestionnaireEdit = async () => {
  toast.error("offline edit for files type is not supported");
  return;
};

// Handler for encounter entries
export const handleEncounterQuestionnaireEdit = async (
  entry: OfflineWritesEntry,
) => {
  if (entry.type !== "encounter") {
    toast.error("Invalid entry type for encounter editing");
    return;
  }

  try {
    // Extract the payload to get encounter and patient info
    const payload = entry.payload as {
      requests: Array<{
        url: string;
        method: string;
        reference_id: string;
        body: {
          discharge_summary_advice?: string | null;
          encounter_class: string;
          external_identifier?: string | null;
          facility: string;
          hospitalization?: Record<string, any>;
          patient: string;
          period: {
            start: string;
            end?: string | null;
          };
          priority: string;
          status: string;
        };
      }>;
    };

    if (!payload.requests || payload.requests.length === 0) {
      toast.error("No encounter data found in offline entry");
      return;
    }

    // Get the first request to extract encounter and patient info
    const firstRequest = payload.requests[0];
    const patientId = firstRequest.body.patient;

    // Extract encounter ID from URL - format: /api/v1/encounter/{encounterId}/
    const urlMatch = firstRequest.url.match(/\/api\/v1\/encounter\/([^/]+)\//);
    const encounterId = urlMatch ? urlMatch[1] : null;

    if (!patientId) {
      toast.error("Patient information not found in offline entry");
      return;
    }

    if (!encounterId) {
      toast.error("Encounter information not found in offline entry");
      return;
    }

    // Navigate to encounter questionnaire form with edit parameters
    navigate(
      `/facility/${entry.facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/encounter`,
      {
        query: {
          offlineEntryId: entry.id,
          editMode: "true",
        },
      },
    );
  } catch (error) {
    console.error("Error handling encounter edit:", error);
    toast.error("Failed to open encounter questionnaire for editing");
  }
};

// Handler for time_of_death entries
export const handleTimeOfDeathEdit = async (entry: OfflineWritesEntry) => {
  if (entry.type !== "time_of_death") {
    toast.error("Invalid entry type for time of death editing");
    return;
  }

  try {
    // Extract the payload to get patient info
    const payload = entry.payload as {
      requests: Array<{
        url: string;
        method: string;
        reference_id: string;
        body: {
          deceased_datetime: string;
        };
      }>;
    };

    if (!payload.requests || payload.requests.length === 0) {
      toast.error("No time of death data found in offline entry");
      return;
    }

    // Get the first request to extract patient info
    const firstRequest = payload.requests[0];

    // Extract patient ID from URL - format: /api/v1/patient/{patientId}/
    const urlMatch = firstRequest.url.match(/\/api\/v1\/patient\/([^/]+)\//);
    const patientId = urlMatch ? urlMatch[1] : null;

    if (!patientId) {
      toast.error("Patient information not found in offline entry");
      return;
    }

    // Navigate to patient questionnaire form with edit parameters
    navigate(
      `/facility/${entry.facilityId}/patient/${patientId}/questionnaire`,
      {
        query: {
          offlineEntryId: entry.id,
          editMode: "true",
        },
      },
    );
  } catch (error) {
    console.error("Error handling time of death edit:", error);
    toast.error("Failed to open time of death questionnaire for editing");
  }
};

export const handleUnsupportedTypeEdit = (entry: OfflineWritesEntry) => {
  toast.info(`Edit functionality for ${entry.type} is not implemented yet`);
};

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
