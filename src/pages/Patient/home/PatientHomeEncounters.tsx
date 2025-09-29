import { useQuery } from "@tanstack/react-query";
import { CaptionsOff } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { TimelineWrapper } from "@/components/Common/TimelineWrapper";
import { TimelineEncounterCard } from "@/components/Facility/EncounterCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("active");

  const { data: encounters, isLoading: encounterLoading } = useQuery({
    queryKey: ["encounters", patientId, activeTab],
    queryFn: query(encounterApi.list, {
      queryParams: {
        patient: patientId,
        status:
          activeTab === "active"
            ? "planned,in_progress,on_hold"
            : "discharged,completed,cancelled,discontinued,entered_in_error",
      },
      silent: true,
    }),
    enabled: !!patientId && canListEncounters,
  });

  if (!canListEncounters) {
    return null;
  }

  const renderEncounters = () => {
    if (encounterLoading) {
      return <CardGridSkeleton count={2} />;
    }

    if (encounters?.results && encounters.results.length > 0) {
      return (
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
      );
    }

    return (
      <EmptyState
        title={t(
          activeTab === "active"
            ? "no_active_encounters_found"
            : "no_completed_encounters_found",
        )}
        description={t(
          activeTab === "active"
            ? "create_a_new_encounter_to_get_started"
            : "no_completed_encounters_description",
        )}
        icon={<CaptionsOff className="size-5 text-primary m-1" />}
      />
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="flex">
        <TabsTrigger value="active">{t("active")}</TabsTrigger>
        <TabsTrigger value="completed">{t("completed")}</TabsTrigger>
      </TabsList>

      <TabsContent value="active">{renderEncounters()}</TabsContent>
      <TabsContent value="completed">{renderEncounters()}</TabsContent>
    </Tabs>
  );
}
