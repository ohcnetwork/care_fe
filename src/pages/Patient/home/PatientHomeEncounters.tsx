import { useQuery } from "@tanstack/react-query";
import { CaptionsOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { TimelineWrapper } from "@/components/Common/TimelineWrapper";
import { TimelineEncounterCard } from "@/components/Facility/EncounterCard";
import { EmptyState } from "@/components/ui/empty-state";
import encounterApi from "@/types/emr/encounter/encounterApi";
import query from "@/Utils/request/query";

interface PatientHomeEncountersProps {
  patientId: string;
  facilityId: string;
  facilityPermissions: string[];
  canListEncounters: boolean;
}

export default function PatientHomeEncounters({
  patientId,
  facilityId,
  facilityPermissions,
  canListEncounters,
}: PatientHomeEncountersProps) {
  const { t } = useTranslation();

  const { data: encounters, isLoading: encounterLoading } = useQuery({
    queryKey: ["encounters", patientId],
    queryFn: query(encounterApi.list, {
      queryParams: {
        patient: patientId,
        status: "planned,in_progress,on_hold",
      },
      silent: true,
    }),
    enabled: !!patientId && canListEncounters,
  });

  if (!canListEncounters) {
    return null;
  }

  if (encounterLoading) {
    return <CardGridSkeleton count={2} />;
  }

  return (
    <>
      {encounters?.results && encounters.results.length > 0 ? (
        <TimelineWrapper>
          {encounters.results.map((encounter, index) => (
            <TimelineEncounterCard
              encounter={encounter}
              key={encounter.id}
              permissions={facilityPermissions}
              facilityId={
                encounter.facility.id === facilityId ? facilityId : undefined
              }
              isLast={index === encounters.results.length - 1}
              isFirst={index === 0}
            />
          ))}
        </TimelineWrapper>
      ) : (
        <EmptyState
          title={t("no_active_encounters_found")}
          description={t("create_a_new_encounter_to_get_started")}
          icon={<CaptionsOff className="size-5 text-primary m-1" />}
        />
      )}
    </>
  );
}
