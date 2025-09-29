import { navigate } from "raviger";

import { Tabs, TabsContent } from "@/components/ui/tabs";

import { EncounterList } from "@/pages/Encounters/EncounterList";
import LocationList from "@/pages/Facility/locations/LocationList";
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
          navigate(`/facility/${facilityId}/encounters/${value}`);
        }}
      >
        <TabsContent value="patients">
          <EncounterList
            facilityId={facilityId}
            encounterClass={encounterClass}
          />
        </TabsContent>

        <TabsContent value="locations">
          <LocationList facilityId={facilityId} locationId={locationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
