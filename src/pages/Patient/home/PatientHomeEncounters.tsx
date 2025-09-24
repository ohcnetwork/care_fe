import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { TimelineWrapper } from "@/components/Common/TimelineWrapper";
import { TimelineEncounterCard } from "@/components/Facility/EncounterCard";
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
      },
      silent: true,
    }),
    enabled: !!patientId && canListEncounters,
  });

  if (!canListEncounters) {
    return null;
  }

  if (encounterLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Calendar className="size-4 text-blue-600" />
            </div>
            {t("active_encounters")}
          </CardTitle>
          <CardDescription className="text-sm">
            {t("view_and_manage_patient_encounters")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                {i > 0 && <Skeleton className="w-0.5 h-4 mb-1" />}
                <Skeleton className="w-8 h-8 rounded-full" />
                {i < 2 && <Skeleton className="w-0.5 h-4 mt-1" />}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
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
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="relative">
            <div className="rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-4 mb-4 shadow-md">
              <CareIcon icon="l-folder-open" className="size-8 text-blue-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {t("no_active_encounters_found")}
          </h3>
          <p className="text-gray-600 mb-4 text-sm max-w-md">
            {t("create_a_new_encounter_to_get_started")}
          </p>
        </div>
      )}
    </>
  );
}
