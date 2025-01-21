import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { PencilIcon } from "lucide-react";
import { Link } from "raviger";
import { ReactNode } from "react";

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

  if (!symptoms?.results?.length) {
    return (
      <SymptomListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      >
        <p className="text-muted-foreground">No symptoms recorded</p>
      </SymptomListLayout>
    );
  }

  return (
    <SymptomListLayout
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
    >
      <SymptomTable symptoms={symptoms.results} />
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
      <CardContent>{children}</CardContent>
    </Card>
  );
};
