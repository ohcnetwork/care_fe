import { useEffect, useState } from "react";
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
  const [syncData, setSyncData] = useState({
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

  useEffect(() => {
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
  const { startSync, isSyncing, syncedCount, totalCount } = useSync();
  const user = useAuthUser();
  const { open: isSidebarOpen } = useSidebar();
  const { t } = useTranslation();
  const [showCompletionState, setShowCompletionState] = useState(false);

  // Show completion state briefly when sync finishes
  useEffect(() => {
    if (isSyncing && syncedCount === totalCount && totalCount > 0) {
      setShowCompletionState(true);
    }

    if (isSyncing && syncedCount === 0) {
      setShowCompletionState(false);
    }
  }, [isSyncing, syncedCount, totalCount]);

  useEffect(() => {
    if (!isSyncing && showCompletionState) {
      const timer = setTimeout(() => {
        setShowCompletionState(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSyncing, showCompletionState]);

  const handleSyncNow = async () => {
    try {
      const pendingWrites = await getPendingAndRetryableWrites(
        user.external_id,
        facilityId,
      );

      if (pendingWrites.length === 0) {
        toast.info(t("no_offline_records_to_sync"));
        return;
      }

      await startSync(user.external_id, facilityId);
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error(t("failed_to_start_sync"), {
        description: t("failed_to_start_sync_description"),
      });
    }
  };

  return (
    <>
      <div
        className={`flex flex-col  justify-between ${isSidebarOpen ? "md:flex-col" : "md:flex-row"} lg:flex-row gap-4 mb-6`}
      >
        <div>
          <p className="text-gray-600 mt-1">{t("monitor_offline_sync")}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CareIcon icon="l-clock" className="w-4 h-4" />
            <span>{t("last_sync", { time: syncData.lastSync })}</span>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleSyncNow}
            disabled={isSyncing}
          >
            {isSyncing ? t("syncing") : t("sync_now")}
          </Button>
        </div>
      </div>

      {/* Sync Progress Bar */}
      {(isSyncing || showCompletionState) && totalCount > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${showCompletionState ? "bg-green-100" : "bg-blue-100"}`}
              >
                <CareIcon
                  icon={showCompletionState ? "l-check-circle" : "l-sync"}
                  className={`w-5 h-5 ${showCompletionState ? "text-green-600" : "text-blue-600"} ${!showCompletionState ? "animate-spin" : ""}`}
                />
              </div>
              <div>
                <span
                  className={`font-semibold text-lg ${showCompletionState ? "text-green-900" : "text-blue-900"}`}
                >
                  {showCompletionState
                    ? t("sync_completed_successfully")
                    : t("syncing_offline_records")}
                </span>
                <div className="text-sm text-gray-600 mt-1">
                  {showCompletionState
                    ? t("all_records_synchronized")
                    : t("please_wait_processing_offline_data")}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-2xl font-bold ${showCompletionState ? "text-green-700" : "text-blue-700"}`}
              >
                {syncedCount}
              </span>
              <span className="text-sm text-gray-500"> / {totalCount}</span>
              <div className="text-xs text-gray-500 mt-1">{t("records")}</div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 ease-out ${
                showCompletionState
                  ? "bg-gradient-to-r from-green-500 to-green-600"
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              }`}
              style={{ width: `${(syncedCount / totalCount) * 100}%` }}
            />
          </div>

          <div className="mt-2 text-center">
            <span
              className={`text-sm font-medium ${showCompletionState ? "text-green-700" : "text-blue-700"}`}
            >
              {Math.round((syncedCount / totalCount) * 100)}% {t("complete")}
            </span>
          </div>
        </div>
      )}
    </>
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
  const { t } = useTranslation();
  const [pendingWrites, setPendingWrites] = useState<OfflineWritesEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthUser();
  const { isSyncing } = useSync();
  useEffect(() => {
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
        <p>{t("loading_pending_writes")}</p>
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
        <p>{t("no_pending_writes_found")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-gray-200">
            <TableHead>{t("table_header_type")}</TableHead>
            <TableHead>{t("table_header_created")}</TableHead>
            <TableHead>{t("table_header_actions")}</TableHead>
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
  const { t } = useTranslation();
  const [failedWrites, setFailedWrites] = useState<OfflineWritesEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthUser();
  const { isSyncing } = useSync();
  useEffect(() => {
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
        <p>{t("loading_failed_writes")}</p>
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
        <p>{t("no_failed_writes_found")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-gray-200">
            <TableHead>{t("table_header_type")}</TableHead>
            <TableHead>{t("table_header_failed_at")}</TableHead>
            <TableHead>{t("table_header_error")}</TableHead>
            <TableHead>{t("table_header_actions")}</TableHead>
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
  const { t } = useTranslation();
  const [conflictedWrites, setConflictedWrites] = useState<
    OfflineWritesEntry[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthUser();
  const { isSyncing } = useSync();
  useEffect(() => {
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
        <div className="text-gray-500">{t("no_conflicted_writes_found")}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>{t("table_header_resource")}</TableHead>
            <TableHead>{t("table_header_last_attempt")}</TableHead>
            <TableHead>{t("table_header_conflict_details")}</TableHead>
            <TableHead>{t("table_header_actions")}</TableHead>
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
  const { t } = useTranslation();
  const [blockedWrites, setBlockedWrites] = useState<OfflineWritesEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthUser();
  const { isSyncing } = useSync();
  useEffect(() => {
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
        <div className="text-gray-500">{t("no_blocked_writes_found")}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>{t("table_header_resource")}</TableHead>
            <TableHead>{t("table_header_last_attempt")}</TableHead>
            <TableHead>{t("table_header_blocked_by")}</TableHead>
            <TableHead>{t("table_header_actions")}</TableHead>
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
  const [activeTab, setActiveTab] = useState("pending");
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

  const [selectedEncounterEntry, setSelectedEncounterEntry] =
    useState<OfflineWritesEntry | null>(null);
  const [isEncounterFormOpen, setIsEncounterFormOpen] = useState(false);

  const [deleteConfirmEntry, setDeleteConfirmEntry] =
    useState<OfflineWritesEntry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editConfirmEntry, setEditConfirmEntry] =
    useState<OfflineWritesEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // handle edit are specially for editing offlien record once we are back to online and we want to edit those record
  // handle edit will not work when we are offline and try to edit record  through sync status page
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
        toast.error(t("error_checking_parent_status"));
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
        await handleAssignUserToPatientEdit(targetEntry, t);
        break;
      case "remove_user_from_patient":
        await handleRemoveUserFromPatientEdit(targetEntry);
        break;
      case "reschedule_appointment":
      case "update_appointment_status":
      case "cancel_appointment":
        await handleAppointmentEdit(targetEntry, t);
        break;
      case "non_structured_questionnaire":
        await handleNonStructuredQuestionnaireEdit(targetEntry, t);
        break;
      case "time_of_death":
        await handleTimeOfDeathEdit(targetEntry, t);
        break;
      case "appointment":
        await handleAppointmentQuestionnaireEdit(t);
        break;
      case "files":
        await handleFilesQuestionnaireEdit(t);
        break;
      case "encounter":
        await handleEncounterQuestionnaireEdit(targetEntry, t);
        break;

      case "allergy_intolerance":
      case "diagnosis":
      case "symptom":
      case "medication_request":
      case "medication_statement":
        await handleStructuredQuestionnaireEdit(targetEntry, t);
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
      const success = await handleDeleteRecord(deleteConfirmEntry, t);
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
        toast.error(t("parent_entries_must_be_synced"));
        return;
      }
      await handleRetryRecord(entry, t);
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("delete_record")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("delete_record_description")}
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
              <AlertDialogTitle>{t("edit_offline_data")}</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-3">
                  <p>{t("edit_offline_data_description")}</p>
                  <p>
                    <strong>{t("important")}:</strong>{" "}
                    {t("edit_offline_data_important")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("edit_offline_data_view_server")}
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
