import React from "react";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import useAuthUser from "@/hooks/useAuthUser";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { getPendingAndRetryableWrites } from "@/OfflineSupport/writeQueue";
import { useSync } from "@/context/SyncContext";

// Custom hook to fetch actual sync data
function useSyncData(facilityId?: string) {
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

        // Get all writes for the current user and facility
        let query = db.OfflineWrites.where("userId").equals(userId);

        // Filter by facility ID if available
        if (facilityId) {
          query = query.and((w) => w.facilityId === facilityId);
        }

        const allWrites = await query.toArray();

        // Calculate statistics
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

        // Get last sync time
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
  }, [isSyncing, user.external_id, facilityId]); // Re-fetch when sync status, user, or facility changes

  return { syncData };
}

// Status card component
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

// Header component
const SyncStatusHeader: React.FC<{ facilityId?: string }> = ({
  facilityId,
}) => {
  const { syncData } = useSyncData(facilityId);
  const { startSync, isSyncing } = useSync();
  const user = useAuthUser();
  const { open: isSidebarOpen } = useSidebar();

  const handleSyncNow = async () => {
    try {
      // Check if there are any pending writes before starting sync
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
        <h1 className="text-2xl font-bold text-gray-900">Sync Status</h1>
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
const SyncStatusOverview: React.FC<{ facilityId?: string }> = ({
  facilityId,
}) => {
  const { open: isSidebarOpen } = useSidebar();
  const { syncData } = useSyncData(facilityId);

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

// Tabbed sync details component
const SyncStatusTabs: React.FC<{ facilityId?: string }> = ({ facilityId }) => {
  const [activeTab, setActiveTab] = React.useState("pending");
  const { syncData } = useSyncData(facilityId);

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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sync Details
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
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

      {/* Tab content will be implemented next */}
      <div className="mt-6">
        <div className="text-center py-8 text-gray-500">
          <CareIcon
            icon="l-clock"
            className="w-8 h-8 mx-auto mb-2 text-gray-400"
          />
          <p>Table content for {activeTab} items will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

// Main page component
const SyncStatusPage: React.FC<{ facilityId?: string }> = ({ facilityId }) => {
  return (
    <Page title="Sync Status" hideTitleOnPage>
      <div className="space-y-6">
        <SyncStatusHeader facilityId={facilityId} />
        <SyncStatusOverview facilityId={facilityId} />
        <SyncStatusTabs facilityId={facilityId} />
      </div>
    </Page>
  );
};

export default SyncStatusPage;
