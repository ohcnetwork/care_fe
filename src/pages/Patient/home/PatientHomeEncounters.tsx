import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { EncounterCard } from "@/components/Facility/EncounterCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import query from "@/Utils/request/query";
import encounterApi from "@/types/emr/encounter/encounterApi";

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
    queryKey: ["encounters", "live", patientId],
    queryFn: query(encounterApi.list, {
      queryParams: {
        patient: patientId,
        live: false,
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{t("active_encounters")}</CardTitle>
          <CardDescription>
            {t("view_and_manage_patient_encounters")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-2">
          <div className="animate-pulse space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{t("active_encounters")}</CardTitle>
        <CardDescription>
          {t("view_and_manage_patient_encounters")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-2">
        {encounters?.results && encounters.results.length > 0 ? (
          <>
            {encounters.results.map((encounter) => (
              <EncounterCard
                encounter={encounter}
                key={encounter.id}
                permissions={facilityPermissions}
                facilityId={
                  encounter.facility.id === facilityId ? facilityId : undefined
                }
              />
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 md:p-8 text-center border rounded-lg border-dashed">
            <div className="rounded-full bg-primary/10 p-2 md:p-3 mb-3 md:mb-4">
              <CareIcon
                icon="l-folder-open"
                className="size-5 md:size-6 text-primary"
              />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-1">
              {t("no_active_encounters_found")}
            </h3>
            <p className="text-xs md:text-sm text-gray-500">
              {t("create_a_new_encounter_to_get_started")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
