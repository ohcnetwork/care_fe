import { LocationHistory as LocationHistoryType } from "@/types/emr/encounter";

import { LocationTree } from "./LocationTree";

interface LocationHistoryProps {
  history: LocationHistoryType[];
}

export function LocationHistory({ history }: LocationHistoryProps) {
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
