import { FilterTabs } from "@/components/ui/filter-tabs";
import { EncounterList } from "@/pages/Encounters/EncounterList";
import LocationList from "@/pages/Facility/locations/LocationList";
import { EncounterClass } from "@/types/emr/encounter/encounter";
import { navigate } from "raviger";

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
      <FilterTabs
        value={tab}
        onValueChange={(value) =>
          navigate(`/facility/${facilityId}/encounters/${value}`)
        }
        options={[
          { value: "patients", label: "patients" },
          { value: "locations", label: "locations" },
        ]}
        variant="background"
        className="mb-4"
        showAllOption={false}
        maxVisibleTabs={2}
      />

      {tab === "patients" && (
        <EncounterList
          facilityId={facilityId}
          encounterClass={encounterClass}
        />
      )}

      {tab === "locations" && (
        <LocationList facilityId={facilityId} locationId={locationId} />
      )}
    </div>
  );
}
