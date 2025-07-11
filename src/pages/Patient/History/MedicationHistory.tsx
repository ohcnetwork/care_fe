import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { AdministrationTab } from "@/components/Medicine/MedicationAdministration/AdministrationTab";
import { EmptyState } from "@/components/Medicine/MedicationRequestTable";
import { MedicationsTable } from "@/components/Medicine/MedicationsTable";
import { MedicationStatementList } from "@/components/Patient/MedicationStatementList";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

export const MedicationHistory = ({ patientId }: { patientId: string }) => {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <img
          src="/images/icons/diagnosis.svg"
          alt="diagnosis"
          className="size-9 bg-cyan-200 border border-cyan-400 rounded-md p-1.5"
        />
        <h4 className="text-xl">{t("past_medications")}</h4>
      </div>
      <Tabs defaultValue="prescriptions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="prescriptions">{t("prescriptions")}</TabsTrigger>
          <TabsTrigger value="statements">
            {t("medication_statements")}
          </TabsTrigger>
          <TabsTrigger value="administration">
            {t("medicine_administration")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="prescriptions">
          <Prescriptions patientId={patientId} />
        </TabsContent>
        <TabsContent value="statements">
          <MedicationStatementList
            patientId={patientId}
            canAccess
            showTimeLine={true}
          />
        </TabsContent>
        <TabsContent value="administration">
          <AdministrationTab
            patientId={patientId}
            canWrite={false}
            canAccess
            showTimeLine={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface GroupedPrescription {
  [year: string]: {
    [date: string]: MedicationRequestRead[];
  };
}

const Prescriptions = ({ patientId }: { patientId: string }) => {
  const { data: medications, isLoading } = useQuery({
    queryKey: ["activeMedicationRequests", patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId: patientId },
      queryParams: { limit: 100, status: "active", ordering: "-created_date" },
    }),
    select: (data: PaginatedResponse<MedicationRequestRead>) => data.results,
  });

  if (isLoading || !medications) {
    return <TableSkeleton count={10} />;
  }

  if (!medications.length) {
    return <EmptyState />;
  }

  const groupedByYear = medications.reduce((acc, medication) => {
    const dateStr = format(medication.created_date, "yyyy-MM-dd");
    const year = format(medication.created_date, "yyyy");
    acc[year] ??= {};
    acc[year][dateStr] ??= [];
    acc[year][dateStr].push(medication);
    return acc;
  }, {} as GroupedPrescription);

  return (
    <div className="space-y-8">
      {Object.entries(groupedByYear).map(([year, groupedByDate]) => {
        return (
          <div key={year}>
            <h2 className="text-sm font-medium text-indigo-700 border-y border-gray-300 py-2 w-fit pr-10">
              {year}
            </h2>
            <div className="border-l border-gray-300 pt-5 ml-4">
              {Object.entries(groupedByDate).map(([date, symptoms]) => {
                return (
                  <div key={date} className="pb-6">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center h-full">
                        <div className="size-3 bg-cyan-300 ring-1 ring-cyan-700 rounded-full flex-shrink-0 -ml-1.5 mt-1"></div>
                      </div>

                      <div className="space-y-3 overflow-auto w-full">
                        <h3 className="text-sm font-medium text-indigo-700">
                          {format(date, "dd MMMM, yyyy")}
                        </h3>
                        <MedicationsTable medications={symptoms} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
