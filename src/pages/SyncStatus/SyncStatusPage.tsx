import React from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useSidebar } from "@/components/ui/sidebar";

import Page from "@/components/Common/Page";

// Hardcoded dummy data
const syncData = {
  lastSync: "2 hours ago",
  statistics: {
    pending: 12,
    failed: 3,
    conflicted: 1,
    blocked: 5,
    successful: 156,
    total: 178,
  },
};

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
  const { open: isSidebarOpen } = useSidebar();

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
          <div
            className={`flex ${isSidebarOpen ? "flex-col" : "flex-row"} items-center gap-1 md:gap-2`}
          >
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
        <span className="text-2xl font-bold">{count}</span>
      </CardHeader>
    </Card>
  );
};

// Header component
const SyncStatusHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sync Status</h1>
        <p className="text-gray-600 mt-1">
          Monitor and manage your offline data synchronization
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CareIcon icon="l-clock" className="w-4 h-4" />
          <span>Last Sync: {syncData.lastSync}</span>
        </div>
        <Button variant="primary" size="md">
          Sync Now
        </Button>
      </div>
    </div>
  );
};

// Overview section component
const SyncStatusOverview: React.FC = () => {
  const { open: isSidebarOpen } = useSidebar();

  return (
    <div
      className={`grid gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-${isSidebarOpen ? "1" : "2"} xl:grid-cols-3`}
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

// Main page component
const SyncStatusPage: React.FC = () => {
  return (
    <Page title="Sync Status" hideTitleOnPage>
      <div className="space-y-6">
        <SyncStatusHeader />
        <SyncStatusOverview />

        {/* Placeholder for tabs section - will be implemented later */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sync Details
          </h3>
          <p className="text-gray-600">
            Tabbed interface for detailed sync management will be implemented
            here.
          </p>
        </div>
      </div>
    </Page>
  );
};

export default SyncStatusPage;
