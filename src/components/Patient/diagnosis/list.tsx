import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import { ACTIVE_DIAGNOSIS_CLINICAL_STATUS } from "@/types/emr/diagnosis/diagnosis";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";

import { DiagnosisTable } from "./DiagnosisTable";

interface DiagnosisListProps {
  patientId: string;
  encounterId?: string;
  className?: string;
  readOnly?: boolean;
}

export function DiagnosisList({
  patientId,
  encounterId,
  className = "",
  readOnly = false,
}: DiagnosisListProps) {
  const { data: diagnoses, isLoading: isDiagnosesLoading } = useQuery({
    queryKey: ["encounter_diagnosis", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId },
      queryParams: {
        category: "encounter_diagnosis,chronic_condition",
        clinical_status: ACTIVE_DIAGNOSIS_CLINICAL_STATUS.join(","),
        exclude_verification_status: "entered_in_error",
        ...(encounterId ? { encounter: encounterId } : {}),
      },
    }),
  });

  if (!diagnoses?.results.length) {
    return (
      <DiagnosisListLayout className={className} readOnly={readOnly} count={0}>
        <></>
      </DiagnosisListLayout>
    );
  }

  return (
    <DiagnosisListLayout
      className={className}
      readOnly={readOnly}
      count={diagnoses?.results?.length ?? 0}
    >
      <div className="space-y-2">
        {isDiagnosesLoading && (
          <CardContent className="px-2 pb-2">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </CardContent>
        )}
        {diagnoses?.results?.length ? (
          <DiagnosisTable diagnoses={diagnoses.results} />
        ) : null}
      </div>
    </DiagnosisListLayout>
  );
}

const DiagnosisListLayout = ({
  children,
  className,
  readOnly = false,
  count,
}: {
  children: ReactNode;
  className?: string;
  readOnly?: boolean;
  count: number;
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(count > 0 ? "diagnoses" : undefined);

  useEffect(() => {
    setValue(count > 0 ? "diagnoses" : undefined);
  }, [count]);

  return (
    <Accordion
      type="single"
      collapsible
      className={cn(
        "w-full bg-white rounded-md shadow-sm border border-gray-100",
        className,
      )}
      value={value}
      onValueChange={(value) => setValue(value)}
    >
      <AccordionItem value="diagnoses" className="border-none">
        <AccordionTrigger
          className={cn(
            "px-4 py-2 rounded-sm hover:no-underline [&>svg]:mt-1",
            count > 0 && "data-[state=open]:bg-gray-50 hover:bg-gray-50",
            count === 0 &&
              "[&>svg]:opacity-50 pointer-events-none [&>div>div]:opacity-50",
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium">
                {t("diagnoses_count", { count })}
              </span>
            </div>

            {!readOnly && (
              <Link
                href={`questionnaire/diagnosis`}
                className="flex items-center gap-1 text-sm hover:text-gray-500 text-gray-950 no-underline pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <CareIcon icon="l-pen" className="size-4" />
                {t("edit")}
              </Link>
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-2 pb-2">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
