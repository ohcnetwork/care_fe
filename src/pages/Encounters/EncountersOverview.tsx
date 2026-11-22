import { Tabs, TabsContent } from "@/components/ui/tabs";

import { navigate } from "@/lib/router/navigate";
import { EncounterList } from "@/pages/Encounters/EncounterList";
import BedBoardPage from "@/pages/Facility/locations/bed-board/BedBoardPage";
import { EncounterClass } from "@/types/emr/encounter/encounter";

interface EncountersOverviewProps {
  facilityId: string;
  tab?: string;
  locationId?: string;
  encounterClass?: EncounterClass;
}

export default function EncountersOverview({
  facilityId,
  tab = "patients",
  locationId,
  encounterClass,
}: EncountersOverviewProps) {
  return (
    <div className="h-full">
      <Tabs
        value={tab}
        className="h-full"
        onValueChange={(value) => {
          navigate({
            to: "/facility/$facilityId/encounters/$tab",
            params: { facilityId, tab: value },
          });
        }}
      >
        <TabsContent value="patients">
          <EncounterList
            key={`${facilityId}:${encounterClass ?? "all"}`}
            facilityId={facilityId}
            encounterClass={encounterClass}
          />
        </TabsContent>

        <TabsContent value="locations">
          <BedBoardPage facilityId={facilityId} locationId={locationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
