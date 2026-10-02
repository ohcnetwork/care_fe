import { useQuery } from "@tanstack/react-query";
import { ListPlus, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import query from "@/Utils/request/query";
import immunizationApi from "@/types/emr/immunization/immunizationApi";
import immunizationRecommendationApi from "@/types/emr/immunizationRecommendation/immunizationRecommendationApi";
import { PatientRead } from "@/types/emr/patient/patient";
import { LocationRead } from "@/types/location/location";

import { ApplyImmunizationPolicyDialog } from "./ApplyImmunizationPolicyDialog";
import { ImmunizationRecordList } from "./ImmunizationRecordList";
import {
  ImmunizationRecordSheet,
  ImmunizationRecordTarget,
} from "./ImmunizationRecordSheet";
import { ImmunizationScheduleList } from "./ImmunizationScheduleList";
import { forecastDisplayStatus } from "./immunizationUtils";

/** Writes need an active encounter in a facility; reads only need a patient. */
interface ImmunizationWriteContext {
  patient: PatientRead;
  facilityId: string;
  encounterId: string;
  defaultLocation?: LocationRead | null;
  canWriteRecords: boolean;
  canWriteRecommendations: boolean;
}

interface PatientImmunizationsProps {
  patientId: string;
  write?: ImmunizationWriteContext;
  /** The encounter workspace already titles its tabs. */
  showTitle?: boolean;
}

export function PatientImmunizations({
  patientId,
  write,
  showTitle = false,
}: PatientImmunizationsProps) {
  const { t } = useTranslation();
  // The target outlives the open state so the sheet does not change while closing.
  const [recordTarget, setRecordTarget] = useState<ImmunizationRecordTarget>(
    {},
  );
  const [recordOpen, setRecordOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const openRecord = (target: ImmunizationRecordTarget) => {
    setRecordTarget(target);
    setRecordOpen(true);
  };

  const recommendations = useQuery({
    queryKey: ["immunization-recommendations", patientId],
    queryFn: query.paginated(immunizationRecommendationApi.list, {
      pathParams: { patientId },
    }),
  });
  const records = useQuery({
    queryKey: ["immunization-records", patientId],
    queryFn: query.paginated(immunizationApi.list, {
      pathParams: { patientId },
    }),
  });

  const recommendationList = recommendations.data?.results ?? [];
  const statuses = recommendationList
    .filter((item) => !item.is_group)
    .map((item) => forecastDisplayStatus(item));
  const overdue = statuses.filter((status) => status === "overdue").length;
  const due = statuses.filter((status) => status === "due").length;
  const canRecord = !!write?.canWriteRecords;
  const canPlan = !!write?.canWriteRecommendations;

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {showTitle && (
            <h2 className="text-lg font-semibold text-gray-950">
              {t("immunizations")}
            </h2>
          )}
          {(overdue > 0 || due > 0) && (
            <div className="flex flex-wrap gap-2">
              {overdue > 0 && (
                <Badge variant="destructive" size="xs">
                  {t("immunization_overdue_count", { count: overdue })}
                </Badge>
              )}
              {due > 0 && (
                <Badge variant="blue" size="xs">
                  {t("immunization_due_count", { count: due })}
                </Badge>
              )}
            </div>
          )}
        </div>
        {(canRecord || canPlan) && (
          <div className="flex flex-wrap gap-2">
            {canPlan && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setApplyOpen(true)}
              >
                <ListPlus className="size-4" aria-hidden="true" />
                {t("immunization_apply_policy")}
              </Button>
            )}
            {canRecord && (
              <Button type="button" onClick={() => openRecord({})}>
                <Plus className="size-4" aria-hidden="true" />
                {t("immunization_record")}
              </Button>
            )}
          </div>
        )}
      </header>

      <section className="space-y-3" aria-labelledby="immunization-schedule">
        <h3
          id="immunization-schedule"
          className="text-sm font-semibold uppercase tracking-wide text-gray-500"
        >
          {t("immunization_schedule")}
        </h3>
        <ImmunizationScheduleList
          patientId={patientId}
          recommendations={recommendationList}
          isLoading={recommendations.isLoading}
          canUpdateStatus={canPlan}
          canRecord={canRecord}
          onRecord={(recommendation) => openRecord({ recommendation })}
        />
      </section>

      <section className="space-y-3" aria-labelledby="immunization-records">
        <h3
          id="immunization-records"
          className="text-sm font-semibold uppercase tracking-wide text-gray-500"
        >
          {t("immunization_records")}
        </h3>
        <ImmunizationRecordList
          records={records.data?.results ?? []}
          isLoading={records.isLoading}
          canEdit={canRecord}
          onEdit={(record) => openRecord({ record })}
        />
      </section>

      {write && (
        <>
          <ImmunizationRecordSheet
            open={recordOpen}
            onOpenChange={setRecordOpen}
            target={recordTarget}
            patientId={patientId}
            encounterId={write.encounterId}
            facilityId={write.facilityId}
            defaultLocation={write.defaultLocation}
            recommendations={recommendationList}
          />
          <ApplyImmunizationPolicyDialog
            open={applyOpen}
            onOpenChange={setApplyOpen}
            patient={write.patient}
            facilityId={write.facilityId}
            encounterId={write.encounterId}
            existingRecommendations={statuses.length}
          />
        </>
      )}
    </div>
  );
}
