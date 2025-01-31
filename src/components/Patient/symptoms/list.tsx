import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { PencilIcon } from "lucide-react";
import { Link } from "raviger";
import { ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import symptomApi from "@/types/emr/symptom/symptomApi";

import { SymptomTable } from "./SymptomTable";

interface SymptomsListProps {
  patientId: string;
  encounterId?: string;
  facilityId?: string;
}

export function SymptomsList({
  patientId,
  encounterId,
  facilityId,
}: SymptomsListProps) {
  const [showEnteredInError, setShowEnteredInError] = useState(false);

  const { data: symptoms, isLoading } = useQuery({
    queryKey: ["symptoms", patientId, encounterId],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
  });

  if (isLoading) {
    return (
      <SymptomListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      >
        <Skeleton className="h-[100px] w-full" />
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
      >
        <CardContent className="px-2 pb-3 pt-2">
          <p className="text-muted-foreground">{t("no_symptoms_recorded")}</p>
        </CardContent>
      </SymptomListLayout>
    );
  }

  return (
    <SymptomListLayout
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
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
      />

      {hasEnteredInErrorRecords && !showEnteredInError && (
        <div className="flex justify-start">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowEnteredInError(true)}
            className="text-xs underline text-gray-500"
          >
            {t("view_all")}
          </Button>
        </div>
      )}
    </SymptomListLayout>
  );
}

const SymptomListLayout = ({
  facilityId,
  patientId,
  encounterId,
  children,
}: {
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  children: ReactNode;
}) => {
  return (
    <Card>
      <CardHeader className="px-4 py-0 pt-4 flex justify-between flex-row">
        <CardTitle>{t("symptoms")}</CardTitle>
        {facilityId && (
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/symptom`}
            className="flex items-center gap-1 text-sm hover:text-gray-500"
          >
            <PencilIcon size={12} />
            {t("edit")}
          </Link>
        )}
      </CardHeader>
      <CardContent className="px-2 pb-2">{children}</CardContent>
    </Card>
  );
};
