import { useTranslation } from "react-i18next";

import { LocationHistory as LocationHistoryType } from "@/types/emr/encounter";

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
  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <div key={index}>
          <LocationTree
            location={item.location}
            datetime={item.start_datetime}
            isLatest={index === 0}
            showTimeline
          />
        </div>
      ))}
    </div>
  );
}
