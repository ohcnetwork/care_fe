import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { Link } from "raviger";
import { ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import symptomApi from "@/types/emr/symptom/symptomApi";

import { SymptomTable } from "./SymptomTable";

interface SymptomsListProps {
  patientId: string;
  encounterId?: string;
  className?: string;
  readOnly?: boolean;
}

export function SymptomsList({
  patientId,
  encounterId,
  className,
  readOnly = false,
}: SymptomsListProps) {
  const [showEnteredInError, setShowEnteredInError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
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
        patientId={patientId}
        encounterId={encounterId}
        readOnly={readOnly}
        count={0}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
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
        patientId={patientId}
        encounterId={encounterId}
        readOnly={readOnly}
        count={0}
        isExpanded={false}
        onToggle={() => setIsExpanded(!isExpanded)}
      >
        <></>
      </SymptomListLayout>
    );
  }

  return (
    <SymptomListLayout
      patientId={patientId}
      encounterId={encounterId}
      className={className}
      readOnly={readOnly}
      count={filteredSymptoms.length}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
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
        <>
          <div className="border-b border-dashed border-gray-200 my-2" />
          <div className="flex justify-center ">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowEnteredInError(true)}
              className="text-xs underline text-gray-950"
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
  children,
  className,
  readOnly = false,
  count,
  isExpanded,
  onToggle,
}: {
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  children: ReactNode;
  className?: string;
  readOnly?: boolean;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  return (
    <Card className={cn("border-none rounded-sm", className)}>
      <CardHeader
        className={cn(
          "flex justify-between flex-row px-4 pt-4 pb-2",
          count !== 0 && "cursor-pointer",
        )}
        onClick={onToggle}
      >
        <div className="flex items-center">
          <Button size="icon" variant="link" disabled={count == 0}>
            {count > 0 && isExpanded ? (
              <CareIcon icon="l-angle-down" className="h-6 w-6" />
            ) : (
              <CareIcon icon="l-angle-right" className="h-6 w-6" />
            )}
          </Button>
          <CardTitle>{t("symptoms_count", { count })}</CardTitle>
        </div>
        {!readOnly && (
          <Link
            href={`questionnaire/symptom`}
            className="flex items-center gap-1 text-sm hover:text-gray-500 text-gray-950"
          >
            <CareIcon icon="l-pen" className="w-4 h-4" />
            {t("edit")}
          </Link>
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="px-2 pb-2">{children}</CardContent>
      )}
    </Card>
  );
};
