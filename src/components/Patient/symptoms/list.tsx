import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { Link } from "raviger";
import { ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import useAuthUser from "@/hooks/useAuthUser";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import { Encounter, inactiveEncounterStatus } from "@/types/emr/encounter";
import symptomApi from "@/types/emr/symptom/symptomApi";

import { SymptomTable } from "./SymptomTable";

interface SymptomsListProps {
  patientId: string;
  encounterId?: string;
  facilityId?: string;
  encounterStatus?: Encounter["status"];
  className?: string;
  isPrintPreview?: boolean;
}

export function SymptomsList({
  patientId,
  encounterId,
  facilityId,
  encounterStatus,
  className,
  isPrintPreview = false,
}: SymptomsListProps) {
  const [showEnteredInError, setShowEnteredInError] = useState(isPrintPreview);

  const authUser = useAuthUser();
  const { hasPermission } = usePermissions();
  const {
    canViewClinicalData,
    canViewEncounter,
    canSubmitEncounterQuestionnaire,
    canSubmitPatientQuestionnaireResponses,
  } = getPermissions(hasPermission, authUser.permissions);
  const canAccess = encounterId ? canViewEncounter : canViewClinicalData;
  const canEdit = encounterId
    ? canSubmitEncounterQuestionnaire &&
      !inactiveEncounterStatus.includes(encounterStatus ?? "")
    : canSubmitPatientQuestionnaireResponses;
  const { data: symptoms, isLoading } = useQuery({
    queryKey: ["symptoms", patientId, encounterId],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
    enabled: canAccess,
  });

  if (isLoading) {
    return (
      <SymptomListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      >
        <CardContent className="px-2 pb-2">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </SymptomListLayout>
    );
  }

  const filteredSymptoms = symptoms?.results?.filter(
    (symptom) =>
      showEnteredInError || symptom.verification_status !== "entered_in_error",
  );

  const hasEnteredInErrorRecords = symptoms?.results?.some(
    (symptom) => symptom.verification_status === "entered_in_error",
  );

  if (!filteredSymptoms?.length) {
    return (
      <SymptomListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
        canEdit={canEdit}
      >
        <CardContent className="px-2 pb-3 pt-2">
          <p className="text-gray-500">{t("no_symptoms_recorded")}</p>
        </CardContent>
      </SymptomListLayout>
    );
  }

  return (
    <SymptomListLayout
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
      canEdit={canEdit}
      className={className}
      isPrintPreview={isPrintPreview}
    >
      <SymptomTable
        symptoms={[
          ...filteredSymptoms.filter(
            (symptom) => symptom.verification_status !== "entered_in_error",
          ),
          ...(showEnteredInError
            ? filteredSymptoms.filter(
                (symptom) => symptom.verification_status === "entered_in_error",
              )
            : []),
        ]}
        isPrintPreview={isPrintPreview}
      />

      {hasEnteredInErrorRecords && !showEnteredInError && (
        <>
          <div className="border-b border-dashed border-gray-200 my-2" />
          <div className="flex justify-center ">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowEnteredInError(true)}
              className="text-xs underline text-gray-500 text-gray-950"
            >
              {t("view_all")}
            </Button>
          </div>
        </>
      )}
    </SymptomListLayout>
  );
}

const SymptomListLayout = ({
  facilityId,
  patientId,
  encounterId,
  children,
  canEdit = false,
  className,
  isPrintPreview = false,
}: {
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  children: ReactNode;
  canEdit?: boolean;
  className?: string;
  isPrintPreview?: boolean;
}) => {
  return (
    <Card className={cn("border-none rounded-sm", className)}>
      <CardHeader
        className={cn(
          "flex justify-between flex-row",
          !isPrintPreview && "px-4 pt-4 pb-2",
          isPrintPreview && "px-0 py-2",
        )}
      >
        <CardTitle>{t("symptoms")}</CardTitle>
        {facilityId && encounterId && canEdit && (
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/symptom`}
            className="flex items-center gap-1 text-sm hover:text-gray-500 text-gray-950 underline"
          >
            <CareIcon icon="l-edit" className="w-4 h-4" />
            {t("edit")}
          </Link>
        )}
      </CardHeader>
      <CardContent
        className={cn(
          isPrintPreview && "px-0 py-0",
          !isPrintPreview && "px-2 pb-2",
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
};
