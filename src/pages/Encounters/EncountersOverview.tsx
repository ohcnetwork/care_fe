import { navigate } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { EncounterList } from "@/pages/Encounters/EncounterList";
import LocationList from "@/pages/Facility/locations/LocationList";

interface EncountersOverviewProps {
  facilityId: string;
  tab?: string;
}

export default function EncountersOverview({
  facilityId,
  tab = "patients",
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

        <TabsContent value="patients" className="mt-4 h-[calc(100%-3rem)]">
          <EncounterList facilityId={facilityId} />
        </TabsContent>

        <TabsContent value="locations" className="mt-4 h-[calc(100%-3rem)]">
          <LocationList facilityId={facilityId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
