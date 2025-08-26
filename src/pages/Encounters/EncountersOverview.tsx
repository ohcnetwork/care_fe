import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const { t } = useTranslation();

  return (
    <div className="h-full">
      <Tabs
        value={tab}
        className="h-full"
        onValueChange={(value) => {
          navigate(`/facility/${facilityId}/encounters/${value}`);
        }}
      >
        <div className=" w-fit px-4 py-2 rounded-lg">
          <TabsList className="bg-transparent p-0 h-8">
            <TabsTrigger
              value="patients"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              {t("patients")}
            </TabsTrigger>
            <TabsTrigger
              value="locations"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              {t("locations")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="patients" className="mt-4">
          <EncounterList
            facilityId={facilityId}
            encounterClass={encounterClass}
          />
        </TabsContent>

        <TabsContent value="locations" className="mt-4">
          <LocationList facilityId={facilityId} locationId={locationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
