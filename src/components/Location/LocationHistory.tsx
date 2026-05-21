import { useTranslation } from "react-i18next";

import { LocationAssociationRead as LocationHistoryType } from "@/types/location/association";

import { LocationTree } from "./LocationTree";

interface LocationHistoryProps {
  history: LocationHistoryType[];
}

export function LocationHistory({ history }: LocationHistoryProps) {
  const { t } = useTranslation();
  if (history.length === 0) {
    return (
      <div className="text-sm text-gray-500 w-full flex justify-center m-3">
        {t("no_location_history_available")}
      </div>
    );
  }

  const sortedHistory = [...history].sort(
    (a, b) =>
      new Date(b.start_datetime).getTime() -
      new Date(a.start_datetime).getTime(),
  );

  const latestIndex = sortedHistory.findIndex(
    (item) => item.status === "active" && item.end_datetime === null,
  );

  return (
    <div className="space-y-4">
      {sortedHistory.map((item, index) => (
        <div key={index}>
          <LocationTree
            location={item.location}
            startTime={item.start_datetime}
            endTime={item.end_datetime}
            isLatest={index === latestIndex}
            showTimeline
          />
        </div>
      ))}
    </div>
  );
}
