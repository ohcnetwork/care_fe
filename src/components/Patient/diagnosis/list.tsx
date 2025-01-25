import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { PencilIcon } from "lucide-react";
import { Link } from "raviger";
import { ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";

import { DiagnosisTable } from "./DiagnosisTable";

interface DiagnosisListProps {
  patientId: string;
  encounterId?: string;
  facilityId?: string;
}

export function DiagnosisList({
  patientId,
  encounterId,
  facilityId,
}: DiagnosisListProps) {
  const [showEnteredInError, setShowEnteredInError] = useState(false);

  const { data: diagnoses, isLoading } = useQuery({
    queryKey: ["diagnosis", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
  });

  if (isLoading) {
    return (
      <DiagnosisListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      >
        <Skeleton className="h-[100px] w-full" />
      </DiagnosisListLayout>
    );
  }

  const filteredDiagnoses = diagnoses?.results?.filter(
    (diagnosis) =>
      showEnteredInError ||
      diagnosis.verification_status !== "entered_in_error",
  );

  const hasEnteredInErrorRecords = diagnoses?.results?.some(
    (diagnosis) => diagnosis.verification_status === "entered_in_error",
  );

  if (!filteredDiagnoses?.length) {
    return (
      <DiagnosisListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      >
        <p className="text-muted-foreground">{t("no_diagnoses_recorded")}</p>
      </DiagnosisListLayout>
    );
  }

  return (
    <DiagnosisListLayout
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
    >
      <DiagnosisTable
        diagnoses={[
          ...filteredDiagnoses.filter(
            (diagnosis) => diagnosis.verification_status !== "entered_in_error",
          ),
          ...(showEnteredInError
            ? filteredDiagnoses.filter(
                (diagnosis) =>
                  diagnosis.verification_status === "entered_in_error",
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
    </DiagnosisListLayout>
  );
}

const DiagnosisListLayout = ({
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
        <CardTitle>{t("diagnoses")}</CardTitle>
        {facilityId && encounterId && (
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/diagnosis`}
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
