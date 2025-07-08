import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { AdministrationTab } from "@/components/Medicine/MedicationAdministration/AdministrationTab";
import { MedicationsTable } from "@/components/Medicine/MedicationsTable";
import { MedicationStatementList } from "@/components/Patient/MedicationStatementList";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { MedicationRequestRead } from "@/types/emr/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

export const MedicationHistory = ({ patientId }: { patientId: string }) => {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="prescriptions" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="prescriptions">{t("prescriptions")}</TabsTrigger>
        <TabsTrigger value="statements">{t("ongoing_medicines")}</TabsTrigger>
        <TabsTrigger value="administration">
          {t("medicine_administration")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="prescriptions">
        <Prescriptions patientId={patientId} />
      </TabsContent>
      <TabsContent value="statements">
        <MedicationStatementList patientId={patientId} canAccess />
      </TabsContent>
      <TabsContent value="administration">
        <AdministrationTab patientId={patientId} canWrite={false} canAccess />
      </TabsContent>
    </Tabs>
  );
};

const Prescriptions = ({ patientId }: { patientId: string }) => {
  const { data: medications, isLoading } = useQuery({
    queryKey: ["activeMedicationRequests", patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId: patientId },
      queryParams: { limit: 100, status: "active" },
    }),
    select: (data: PaginatedResponse<MedicationRequestRead>) => data.results,
  });

  if (isLoading || !medications) {
    return <TableSkeleton count={10} />;
  }

  return <MedicationsTable medications={medications} />;
};
