import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import CreateEncounterForm from "@/components/Encounter/CreateEncounterForm";
import { AddUserSheet } from "@/components/Patient/PatientDetailsTab/PatientUsers";

import useAuthUser from "@/hooks/useAuthUser";

import { AppCacheDB, OfflineWritesEntry } from "@/OfflineSupport/AppcacheDB";
import { OfflineKeyMap } from "@/OfflineSupport/offlineKeys";
import { checkParentSyncStatus } from "@/OfflineSupport/offlineWriteHelpers";
import { getPendingAndRetryableWrites } from "@/OfflineSupport/writeQueue";
import { useSync } from "@/context/SyncContext";

import {
  handleAppointmentEdit,
  handleAppointmentQuestionnaireEdit,
  handleAssignUserToPatientEdit,
  handleCreateEncounterEdit,
  handleCreateandUpdatePatientEdit,
  handleCreateandUpdateResourceRequestEdit,
  handleDeleteRecord,
  handleEncounterAction,
  handleEncounterQuestionnaireEdit,
  handleFilesQuestionnaireEdit,
  handleNonStructuredQuestionnaireEdit,
  handleRemoveUserFromPatientEdit,
  handleRetryRecord,
  handleStructuredQuestionnaireEdit,
  handleTimeOfDeathEdit,
  handleUnsupportedTypeEdit,
} from "./actionHandlers";

async function getWritesByStatus(
  userId: string,
  facilityId: string | undefined,
  status: OfflineWritesEntry["syncStatus"],
): Promise<OfflineWritesEntry[]> {
  const db = new AppCacheDB();
  let query = db.OfflineWrites.where("userId").equals(userId);

  if (facilityId) {
    query = query.and((w) => w.facilityId === facilityId);
  }

  return query.and((w) => w.syncStatus === status).toArray();
}

function useSyncData(facilityId?: string, refreshTrigger?: number) {
  const [syncData, setSyncData] = React.useState({
    lastSync: "Never",
    statistics: {
      pending: 0,
      failed: 0,
      conflicted: 0,
      blocked: 0,
      successful: 0,
      total: 0,
    },
  });
  const { isSyncing } = useSync();
  const user = useAuthUser();

  React.useEffect(() => {
    async function fetchSyncData() {
      try {
        const db = new AppCacheDB();
        const userId = user.external_id;

        let query = db.OfflineWrites.where("userId").equals(userId);

        if (facilityId) {
          query = query.and((w) => w.facilityId === facilityId);
        }

        const allWrites = await query.toArray();

        const statistics = {
          pending: allWrites.filter((w) => w.syncStatus === "pending").length,
          failed: allWrites.filter((w) => w.syncStatus === "failed").length,
          conflicted: allWrites.filter((w) => w.syncStatus === "conflict")
            .length,
          blocked: allWrites.filter((w) => w.syncStatus === "blocked").length,
          successful: allWrites.filter((w) => w.syncStatus === "success")
            .length,
          total: allWrites.length,
        };

        const successfulWrites = allWrites.filter(
          (w) => w.syncStatus === "success",
        );
        let lastSync = "Never";
        if (successfulWrites.length > 0) {
          const lastSuccessfulWrite = successfulWrites.sort(
            (a, b) =>
              (b.serverTimestamp ? new Date(b.serverTimestamp).getTime() : 0) -
              (a.serverTimestamp ? new Date(a.serverTimestamp).getTime() : 0),
          )[0];

          if (lastSuccessfulWrite.serverTimestamp) {
            const lastSyncDate = new Date(lastSuccessfulWrite.serverTimestamp);
            const now = new Date();
            const diffInHours = Math.floor(
              (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60),
            );

            if (diffInHours < 1) {
              lastSync = "Just now";
            } else if (diffInHours < 24) {
              lastSync = `${diffInHours} hours ago`;
            } else {
              const diffInDays = Math.floor(diffInHours / 24);
              lastSync = `${diffInDays} days ago`;
            }
          }
        }

        setSyncData({ lastSync, statistics });
      } catch (error) {
        console.error("Failed to fetch sync data:", error);
      }
    }

    fetchSyncData();
  }, [isSyncing, user.external_id, facilityId, refreshTrigger]);

  return { syncData };
}

interface StatusCardProps {
  title: string;
  count: number;
  status: string;
  color: "blue" | "red" | "orange" | "gray" | "green";
  icon:
    | "l-clock"
    | "l-exclamation-triangle"
    | "l-exclamation-circle"
    | "l-ban"
    | "l-check-circle";
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  count,
  status,
  color,
  icon,
}) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    red: "bg-red-50 border-red-200",
    orange: "bg-orange-50 border-orange-200",
    gray: "bg-gray-50 border-gray-200",
    green: "bg-green-50 border-green-200",
  };

  const badgeColors = {
    blue: "blue",
    red: "destructive",
    orange: "orange",
    gray: "secondary",
    green: "green",
  };

  return (
    <Card className={`border ${colorClasses[color]} shadow-sm`}>
      <CardHeader className="flex flex-col space-y-2 p-4">
        <div className="flex items-center justify-between">
          <div className=" flex flex-row items-center gap-1 md:gap-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Badge variant={badgeColors[color] as any} className="text-xs">
              {status}
            </Badge>
          </div>
          <CareIcon
            icon={icon}
            className={`h-4 w-4 ${
              color === "blue"
                ? "text-blue-500"
                : color === "red"
                  ? "text-red-500"
                  : color === "orange"
                    ? "text-orange-500"
                    : color === "gray"
                      ? "text-gray-500"
                      : "text-green-500"
            }`}
          />
        </div>
        <span className="text-xl font-bold">{count}</span>
      </CardHeader>
    </Card>
  );
};

const SyncStatusHeader: React.FC<{
  facilityId?: string;
  refreshTrigger?: number;
}> = ({ facilityId, refreshTrigger }) => {
  const { syncData } = useSyncData(facilityId, refreshTrigger);
  const { startSync, isSyncing } = useSync();
  const user = useAuthUser();
  const { open: isSidebarOpen } = useSidebar();

  const handleSyncNow = async () => {
    try {
      const pendingWrites = await getPendingAndRetryableWrites(
        user.external_id,
        facilityId,
      );

      if (pendingWrites.length === 0) {
        toast.info("No offline records to sync");
        return;
      }

      await startSync(user.external_id, facilityId);
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to start sync", {
        description: "Please try again later.",
      });
    }
  };

  return (
    <div
      className={`flex flex-col  justify-between ${isSidebarOpen ? "md:flex-col" : "md:flex-row"} lg:flex-row gap-4 mb-6`}
    >
      <div>
        <p className="text-gray-600 mt-1">
          Monitor and manage your offline data synchronization
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CareIcon icon="l-clock" className="w-4 h-4" />
          <span>Last Sync: {syncData.lastSync}</span>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleSyncNow}
          disabled={isSyncing}
        >
          {isSyncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>
    </div>
  );
};

// Overview section component
const SyncStatusOverview: React.FC<{
  facilityId?: string;
  refreshTrigger?: number;
}> = ({ facilityId, refreshTrigger }) => {
  const { open: isSidebarOpen } = useSidebar();
  const { syncData } = useSyncData(facilityId, refreshTrigger);

  return (
    <div
      className={`grid gap-4 sm:grid-cols-1 ${isSidebarOpen ? "md:grid-cols-1" : "md:grid-cols-2"} lg:grid-cols-2 xl:grid-cols-3`}
    >
      <StatusCard
        title="Pending"
        count={syncData.statistics.pending}
        status="Ready to sync"
        color="blue"
        icon="l-clock"
      />
      <StatusCard
        title="Failed"
        count={syncData.statistics.failed}
        status="Need attention"
        color="red"
        icon="l-exclamation-triangle"
      />
      <StatusCard
        title="Conflicted"
        count={syncData.statistics.conflicted}
        status="User action required"
        color="orange"
        icon="l-exclamation-circle"
      />
      <StatusCard
        title="Blocked"
        count={syncData.statistics.blocked}
        status="Waiting for parent sync"
        color="gray"
        icon="l-ban"
      />
      <StatusCard
        title="Successful"
        count={syncData.statistics.successful}
        status="Synced today"
        color="green"
        icon="l-check-circle"
      />
    </div>
  );
};

const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
};

const getResourceTypeDisplay = (entry: OfflineWritesEntry) => {
  const typeMap: Record<keyof typeof OfflineKeyMap, string> = {
    create_patient: "Create Patient",
    update_patient: "Patient Update",
    create_encounter: "Create Encounter",
    mark_encounter_as_complete: "Encounter as Complete",
    create_resource_request: "Create Resource Request",
    update_resource_request: "Update Resource Request",
    assign_user_to_patient: "User Assignment",
    remove_user_from_patient: "User Removal",
    create_appointment: "Create Appointment",
    update_appointment_status: "Appointment Update",
    cancel_appointment: "Appointment Cancel",
    reschedule_appointment: "Appointment Reschedule",
    non_structured_questionnaire: "Non-structured Questionnaire",
    update_encounter_questionnaire: "Update Encounter Questionnaire",
    structured_questionnair: "Structured Questionnaire",
    allergy_intolerance: "Allergy Intolerance",
    diagnosis: "Diagnosis",
    medication_request: "Medication Request",
    medication_statement: "Medication Statement",
    symptom: "Symptom",
    encounter: "Encounter",
    appointment: "Appointment",
    files: "Files",
    time_of_death: "Time of Death",
    charge_item: "Charge Item",
    service_request: "Service Request",
  };

  return (
    typeMap[entry.type as keyof typeof OfflineKeyMap] ||
    entry.resourceType ||
    entry.type
  );
};

const PendingWritesTable: React.FC<{
  facilityId?: string;
  onEdit: (entry: OfflineWritesEntry) => void;
  onRetry: (entry: OfflineWritesEntry) => void;
  onDelete: (entry: OfflineWritesEntry) => void;

  refreshTrigger: number;
}> = ({ facilityId, onEdit, onRetry, onDelete, refreshTrigger }) => {
  const [pendingWrites, setPendingWrites] = React.useState<
    OfflineWritesEntry[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const user = useAuthUser();
  const { isSyncing } = useSync();
  React.useEffect(() => {
    async function fetchPendingWrites() {
      try {
        setIsLoading(true);
        const writes = await getWritesByStatus(
          user.external_id,
          facilityId,
          "pending",
        );
        setPendingWrites(writes);
      } catch (error) {
        console.error("Error fetching pending writes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPendingWrites();
  }, [user.external_id, facilityId, refreshTrigger, isSyncing]);

  const handleEdit = (entry: OfflineWritesEntry) => {
    onEdit(entry);
  };

  const handleRetry = (entry: OfflineWritesEntry) => {
    onRetry(entry);
  };

  const handleDelete = (entry: OfflineWritesEntry) => {
    onDelete(entry);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CareIcon
          icon="l-spinner"
          className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin"
        />
        <p>Loading pending writes...</p>
      </div>
    );
  }

  if (pendingWrites.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CareIcon
          icon="l-check-circle"
          className="w-8 h-8 mx-auto mb-2 text-gray-400"
        />
        <p>No pending writes found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-gray-200">
            <TableHead>Type</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {pendingWrites.map((entry) => (
            <TableRow key={entry.id} className="divide-x divide-gray-200">
              <TableCell className="font-medium">
                <div className="font-semibold text-gray-900">
                  {getResourceTypeDisplay(entry)}
                </div>
                <div className="text-xs text-gray-500">ID: {entry.id}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">
                  {formatTimeAgo(entry.clientTimestamp)}
                </div>
              </TableCell>

              <TableCell className="text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(entry)}
                    className="h-8 w-8 p-0"
                  >
                    <CareIcon icon="l-edit" className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetry(entry)}
                    className="h-8 w-8 p-0"
                  >
                    <CareIcon icon="l-refresh" className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(entry)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <CareIcon icon="l-trash" className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const FailedWritesTable: React.FC<{
  facilityId?: string;
  onEdit: (entry: OfflineWritesEntry) => void;
  onRetry: (entry: OfflineWritesEntry) => void;
  onDelete: (entry: OfflineWritesEntry) => void;

  refreshTrigger: number;
}> = ({
  facilityId,
  onEdit,
  onRetry,
  onDelete,

  refreshTrigger,
}) => {
  const [failedWrites, setFailedWrites] = React.useState<OfflineWritesEntry[]>(
    [],
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const user = useAuthUser();
  const { isSyncing } = useSync();
  React.useEffect(() => {
    async function fetchFailedWrites() {
      try {
        setIsLoading(true);
        const writes = await getWritesByStatus(
          user.external_id,
          facilityId,
          "failed",
        );
        setFailedWrites(writes);
      } catch (error) {
        console.error("Failed to fetch failed writes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFailedWrites();
  }, [user.external_id, facilityId, refreshTrigger, isSyncing]);

  const handleEdit = (entry: OfflineWritesEntry) => {
    onEdit(entry);
  };

  const handleRetry = (entry: OfflineWritesEntry) => {
    onRetry(entry);
  };

  const handleDelete = (entry: OfflineWritesEntry) => {
    onDelete(entry);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CareIcon
          icon="l-spinner"
          className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin"
        />
        <p>Loading failed writes...</p>
      </div>
    );
  }

  if (failedWrites.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CareIcon
          icon="l-check-circle"
          className="w-8 h-8 mx-auto mb-2 text-gray-400"
        />
        <p>No failed writes found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-gray-200">
            <TableHead>Type</TableHead>
            <TableHead>Failed At</TableHead>
            <TableHead>Error</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {failedWrites.map((entry) => (
            <TableRow key={entry.id} className="divide-x divide-gray-200">
              <TableCell className="font-medium">
                <div className="font-semibold text-gray-900">
                  {getResourceTypeDisplay(entry)}
                </div>
                <div className="text-xs text-gray-500">ID: {entry.id}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">
                  {entry.lastAttemptAt
                    ? formatTimeAgo(entry.lastAttemptAt)
                    : formatTimeAgo(entry.clientTimestamp)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-red-600 max-w-xs truncate">
                  {entry.lastError}
                </div>
              </TableCell>
              <TableCell className="text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(entry)}
                    className="h-8 w-8 p-0"
                  >
                    <CareIcon icon="l-edit" className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetry(entry)}
                    className="h-8 w-8 p-0"
                  >
                    <CareIcon icon="l-refresh" className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(entry)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <CareIcon icon="l-trash" className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ConflictedWritesTable: React.FC<{
  facilityId?: string;
  onRetry: (entry: OfflineWritesEntry) => void;
  onDelete: (entry: OfflineWritesEntry) => void;
  setIsEditDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditConfirmEntry: React.Dispatch<
    React.SetStateAction<OfflineWritesEntry | null>
  >;
  refreshTrigger: number;
}> = ({
  facilityId,
  onRetry,
  onDelete,
  setIsEditDialogOpen,
  setEditConfirmEntry,
  refreshTrigger,
}) => {
  const [conflictedWrites, setConflictedWrites] = React.useState<
    OfflineWritesEntry[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const user = useAuthUser();
  const { isSyncing } = useSync();
  React.useEffect(() => {
    async function fetchConflictedWrites() {
      try {
        setIsLoading(true);
        const writes = await getWritesByStatus(
          user.external_id,
          facilityId,
          "conflict",
        );
        setConflictedWrites(writes);
      } catch (error) {
        console.error("Error fetching conflicted writes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConflictedWrites();
  }, [user.external_id, facilityId, refreshTrigger, isSyncing]);

  const handleEdit = (entry: OfflineWritesEntry) => {
    setEditConfirmEntry(entry);
    setIsEditDialogOpen(true);
  };

  const handleRetry = (entry: OfflineWritesEntry) => {
    onRetry(entry);
  };

  const handleDelete = (entry: OfflineWritesEntry) => {
    onDelete(entry);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (conflictedWrites.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No conflicted writes found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Resource</TableHead>
            <TableHead>Last Attempt</TableHead>
            <TableHead>Conflict Details</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {conflictedWrites.map((entry) => (
            <TableRow key={entry.id} className="divide-x divide-gray-200">
              <TableCell className="font-medium">
                <div className="font-semibold text-gray-900">
                  {getResourceTypeDisplay(entry)}
                </div>
                <div className="text-xs text-gray-500">ID: {entry.id}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">
                  {entry.lastAttemptAt
                    ? formatTimeAgo(entry.lastAttemptAt)
                    : formatTimeAgo(entry.clientTimestamp)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-orange-600 max-w-xs truncate">
                  {entry.lastError || "Data conflict detected"}
                </div>
              </TableCell>
              <TableCell className="text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(entry)}
                    className="h-8 w-8 p-0"
                  >
                    <CareIcon icon="l-edit" className="size-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetry(entry)}
                    className="h-8 w-8 p-0"
                  >
                    <CareIcon icon="l-refresh" className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(entry)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <CareIcon icon="l-trash" className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const BlockedWritesTable: React.FC<{
  facilityId?: string;
  onDelete: (entry: OfflineWritesEntry) => void;
  refreshTrigger: number;
}> = ({ facilityId, onDelete, refreshTrigger }) => {
  const [blockedWrites, setBlockedWrites] = React.useState<
    OfflineWritesEntry[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const user = useAuthUser();
  const { isSyncing } = useSync();
  React.useEffect(() => {
    async function fetchBlockedWrites() {
      try {
        setIsLoading(true);
        const writes = await getWritesByStatus(
          user.external_id,
          facilityId,
          "blocked",
        );
        setBlockedWrites(writes);
      } catch (error) {
        console.error("Error fetching blocked writes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlockedWrites();
  }, [user.external_id, facilityId, refreshTrigger, isSyncing]);

  const handleDelete = (entry: OfflineWritesEntry) => {
    onDelete(entry);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (blockedWrites.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No blocked writes found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Resource</TableHead>
            <TableHead>Last Attempt</TableHead>
            <TableHead>Blocked By</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {blockedWrites.map((entry) => (
            <TableRow key={entry.id} className="divide-x divide-gray-200">
              <TableCell className="font-medium">
                <div className="font-semibold text-gray-900">
                  {getResourceTypeDisplay(entry)}
                </div>
                <div className="text-xs text-gray-500">ID: {entry.id}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">
                  {entry.lastAttemptAt
                    ? formatTimeAgo(entry.lastAttemptAt)
                    : formatTimeAgo(entry.clientTimestamp)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-red-600 max-w-xs truncate">
                  {entry.parentMutationId || "Unknown parent"}
                </div>
              </TableCell>
              <TableCell className="text-left">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(entry)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <CareIcon icon="l-trash" className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const SyncStatusTabs: React.FC<{
  facilityId?: string;
  onEdit: (entry: OfflineWritesEntry) => void;
  onRetry: (entry: OfflineWritesEntry) => void;
  onDelete: (entry: OfflineWritesEntry) => void;
  setIsEditDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditConfirmEntry: React.Dispatch<
    React.SetStateAction<OfflineWritesEntry | null>
  >;
  refreshTrigger: number;
}> = ({
  facilityId,
  onEdit,
  onRetry,
  onDelete,
  setIsEditDialogOpen,
  setEditConfirmEntry,
  refreshTrigger,
}) => {
  const [activeTab, setActiveTab] = React.useState("pending");
  const { syncData } = useSyncData(facilityId, refreshTrigger);

  const tabs = [
    { value: "pending", label: "Pending", count: syncData.statistics.pending },
    { value: "failed", label: "Failed", count: syncData.statistics.failed },
    {
      value: "conflicted",
      label: "Conflicted",
      count: syncData.statistics.conflicted,
    },
    { value: "blocked", label: "Blocked", count: syncData.statistics.blocked },
  ];

  return (
    <div className="">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap mt-6 gap-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="overflow-y-auto max-w-[calc(100%)] max-sm:hidden text-gray-950"
            >
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    <span className="text-gray-950 font-medium text-sm">
                      {tab.label}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="sm:hidden">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {tabs.map((tab) => (
                  <SelectItem key={tab.value} value={tab.value}>
                    <span className="text-gray-950 font-medium text-sm">
                      {tab.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === "pending" && (
          <PendingWritesTable
            facilityId={facilityId}
            onEdit={onEdit}
            onRetry={onRetry}
            onDelete={onDelete}
            refreshTrigger={refreshTrigger}
          />
        )}
        {activeTab === "failed" && (
          <FailedWritesTable
            facilityId={facilityId}
            onEdit={onEdit}
            onRetry={onRetry}
            onDelete={onDelete}
            refreshTrigger={refreshTrigger}
          />
        )}
        {activeTab === "conflicted" && (
          <ConflictedWritesTable
            facilityId={facilityId}
            onRetry={onRetry}
            onDelete={onDelete}
            refreshTrigger={refreshTrigger}
            setIsEditDialogOpen={setIsEditDialogOpen}
            setEditConfirmEntry={setEditConfirmEntry}
          />
        )}
        {activeTab === "blocked" && (
          <BlockedWritesTable
            facilityId={facilityId}
            onDelete={onDelete}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>
    </div>
  );
};

const SyncStatusPage: React.FC<{ facilityId?: string }> = ({ facilityId }) => {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const [selectedEncounterEntry, setSelectedEncounterEntry] =
    React.useState<OfflineWritesEntry | null>(null);
  const [isEncounterFormOpen, setIsEncounterFormOpen] = React.useState(false);
  const [selectedUserAssignmentEntry, setSelectedUserAssignmentEntry] =
    React.useState<OfflineWritesEntry | null>(null);
  const [isUserAssignmentFormOpen, setIsUserAssignmentFormOpen] =
    React.useState(false);
  const [deleteConfirmEntry, setDeleteConfirmEntry] =
    React.useState<OfflineWritesEntry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editConfirmEntry, setEditConfirmEntry] =
    React.useState<OfflineWritesEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEdit = async (entry?: OfflineWritesEntry) => {
    const targetEntry = entry || editConfirmEntry;
    if (!targetEntry) return;

    if (targetEntry.parentMutationId) {
      try {
        const parentCheck = await checkParentSyncStatus(
          targetEntry.parentMutationId,
        );
        if (!parentCheck.isSynced) {
          toast.error(
            "Parent entries must be successfully synced before editing this entry.",
          );
          return;
        }
      } catch (error) {
        console.error("Error checking parent status:", error);
        toast.error("Error checking parent status. Please try again.");
        return;
      }
    }

    switch (targetEntry.type) {
      case "create_patient":
        await handleCreateandUpdatePatientEdit(targetEntry, facilityId);
        break;

      case "create_encounter":
        await handleCreateEncounterEdit(
          targetEntry,
          setSelectedEncounterEntry,
          setIsEncounterFormOpen,
        );
        break;

      case "update_patient":
        await handleCreateandUpdatePatientEdit(targetEntry, facilityId);
        break;

      case "mark_encounter_as_complete":
        await handleEncounterAction(targetEntry);
        break;

      case "create_resource_request":
        await handleCreateandUpdateResourceRequestEdit(targetEntry, facilityId);
        break;
      case "update_resource_request":
        await handleCreateandUpdateResourceRequestEdit(targetEntry, facilityId);
        break;
      case "assign_user_to_patient":
        await handleAssignUserToPatientEdit(
          targetEntry,
          setSelectedUserAssignmentEntry,
          setIsUserAssignmentFormOpen,
        );
        break;
      case "remove_user_from_patient":
        await handleRemoveUserFromPatientEdit(targetEntry);
        break;
      case "reschedule_appointment":
      case "update_appointment_status":
      case "cancel_appointment":
        await handleAppointmentEdit(targetEntry);
        break;
      case "non_structured_questionnaire":
        await handleNonStructuredQuestionnaireEdit(targetEntry);
        break;
      case "time_of_death":
        await handleTimeOfDeathEdit(targetEntry);
        break;
      case "appointment":
        await handleAppointmentQuestionnaireEdit(targetEntry);
        break;
      case "files":
        await handleFilesQuestionnaireEdit();
        break;
      case "encounter":
        await handleEncounterQuestionnaireEdit(targetEntry);
        break;

      case "allergy_intolerance":
      case "diagnosis":
      case "symptom":
      case "medication_request":
      case "medication_statement":
        await handleStructuredQuestionnaireEdit(targetEntry);
        break;
      case "update_encounter_questionnaire":
      default:
        handleUnsupportedTypeEdit(targetEntry);
        break;
    }
  };

  const handleDeleteConfirm = async (entry: OfflineWritesEntry) => {
    setDeleteConfirmEntry(entry);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirmAction = async () => {
    if (deleteConfirmEntry) {
      const success = await handleDeleteRecord(deleteConfirmEntry);
      if (success) {
        setIsDeleteDialogOpen(false);
        setDeleteConfirmEntry(null);

        triggerRefresh();
      }
    }
  };

  const handleRetry = async (entry: OfflineWritesEntry) => {
    try {
      const parentCheck = await checkParentSyncStatus(entry.parentMutationId);
      if (!parentCheck.isSynced) {
        toast.error(
          "Parent entries must be successfully synced before retrying this entry.",
        );
        return;
      }
      await handleRetryRecord(entry);
      triggerRefresh();
    } catch (error) {
      console.error("Error in retry:", error);
    }
  };

  return (
    <Page title={t("sync_status")}>
      <div className="container mt-2 max-w-7xl">
        <SyncStatusHeader
          facilityId={facilityId}
          refreshTrigger={refreshTrigger}
        />
        <SyncStatusOverview
          facilityId={facilityId}
          refreshTrigger={refreshTrigger}
        />
        <SyncStatusTabs
          facilityId={facilityId}
          onEdit={handleEdit}
          onRetry={handleRetry}
          onDelete={handleDeleteConfirm}
          setIsEditDialogOpen={setIsEditDialogOpen}
          setEditConfirmEntry={setEditConfirmEntry}
          refreshTrigger={refreshTrigger}
        />

        {/* Global CreateEncounterForm for editing offline encounters */}
        {selectedEncounterEntry && isEncounterFormOpen && (
          <CreateEncounterForm
            patientId={(selectedEncounterEntry.payload as any)?.patient || ""}
            facilityId={facilityId || ""}
            patientName="Patient"
            offlineEntryId={selectedEncounterEntry.id}
            trigger={null}
            onSuccess={() => {
              setIsEncounterFormOpen(false);
              setSelectedEncounterEntry(null);
              // Trigger refresh after successful encounter creation/update
              triggerRefresh();
            }}
            onClose={() => {
              setIsEncounterFormOpen(false);
              setSelectedEncounterEntry(null);
            }}
          />
        )}

        {/* Global AddUserSheet for editing offline user assignments */}
        {selectedUserAssignmentEntry && isUserAssignmentFormOpen && (
          <AddUserSheet
            patientId={
              (selectedUserAssignmentEntry.mutationPathParams as any)
                ?.patientId || ""
            }
            users={undefined}
            authUser={authUser}
            offlineEntryId={selectedUserAssignmentEntry.id}
            onClose={() => {
              setIsUserAssignmentFormOpen(false);
              setSelectedUserAssignmentEntry(null);
              triggerRefresh();
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Record</AlertDialogTitle>
              <AlertDialogDescription>
                When the record is deleted, all its child records (whose status
                is not success) will be deleted as well.
                <br />
                <br />
                <strong>Type:</strong> {deleteConfirmEntry?.type}
                <br />
                <strong>ID:</strong> {deleteConfirmEntry?.id}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirmAction}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Confirmation Dialog */}
        <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Offline Data</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-3">
                  <p>
                    The form will contain the data you filled when offline, not
                    the current server data.
                  </p>
                  <p>
                    <strong>Important:</strong> You can modify and save to
                    overwrite the server data with your local changes.
                  </p>
                  <p className="text-sm text-gray-600">
                    To view the current server data, navigate to the original
                    record.
                  </p>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Type:</strong> {editConfirmEntry?.type}
                      <br />
                      <strong>ID:</strong> {editConfirmEntry?.id}
                    </p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditConfirmEntry(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditConfirmEntry(null);
                  handleEdit();
                }}
              >
                Continue to Edit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Page>
  );
};

export default SyncStatusPage;
