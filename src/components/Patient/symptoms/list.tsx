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
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
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
  const { t } = useTranslation();

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
        patientId={patientId}
        encounterId={encounterId}
        readOnly={readOnly}
        count={0}
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
}: {
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  children: ReactNode;
  className?: string;
  readOnly?: boolean;
  count: number;
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(count > 0 ? "symptoms" : undefined);

  useEffect(() => {
    setValue(count > 0 ? "symptoms" : undefined);
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
      <AccordionItem value="symptoms" className="border-none">
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
                {t("symptoms_count", { count })}
              </span>
            </div>
            {!readOnly && (
              <Link
                href={`questionnaire/symptom`}
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
