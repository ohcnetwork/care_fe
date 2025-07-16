import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import { MedicationHistory } from "@/pages/Patient/History/MedicationHistory";
import patientApi from "@/types/emr/patient/patientApi";

import { AllergyHistory } from "./AllergyHistory";
import { DiagnosesHistory } from "./DiagnosesHistory";
import { SymptomsHistory } from "./SymptomsHistory";

export function ClinicalHistoryPage({
  patientId,
  tab = "symptoms",
  facilityId,
}: {
  facilityId: string;
  patientId: string;
  tab: string;
}) {
  const { t } = useTranslation();
  const [{ sourceUrl }] = useQueryParams();

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: patientId },
    }),
  });

  const handleClose = () => {
    navigate(sourceUrl || `/facility/${facilityId}/patient/${patientId}`);
  };

  const handleTabChange = (value: string) => {
    navigate(`/facility/${facilityId}/patient/${patientId}/history/${value}`, {
      query: { sourceUrl },
    });
  };

  return (
    <Page
      title={
        patient
          ? t("patient_clinical_history_page_title", { name: patient?.name })
          : t("loading")
      }
      hideTitleOnPage
    >
      <div className="flex justify-between items-center bg-gray-100 -mx-3 -mt-8 md:-mt-8 md:-mx-9 px-3 md:px-6 pb-3 pt-2 md:rounded-t-lg">
        <div>
          {patient ? (
            <h5 className="text-lg font-semibold">
              {t("patient_clinical_history_page_title", { name: patient.name })}
            </h5>
          ) : (
            <Skeleton className="w-20 h-4" />
          )}
        </div>
        <div>
          <Button variant="outline" onClick={handleClose} size="icon">
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <section>
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto mb-4">
            <TabsTrigger
              className="border-b-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              value="symptoms"
            >
              {t("past_symptoms")}
            </TabsTrigger>
            <TabsTrigger
              className="border-b-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              value="diagnoses"
            >
              {t("past_diagnoses")}
            </TabsTrigger>
            <TabsTrigger
              className="border-b-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              value="allergies"
            >
              {t("allergies")}
            </TabsTrigger>
            <TabsTrigger
              className="border-b-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
              value="medications"
            >
              {t("past_medications")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="symptoms">
            <SymptomsHistory patientId={patientId} />
          </TabsContent>
          <TabsContent value="diagnoses">
            <DiagnosesHistory patientId={patientId} />
          </TabsContent>
          <TabsContent value="allergies">
            <AllergyHistory patientId={patientId} />
          </TabsContent>
          <TabsContent value="medications">
            <MedicationHistory patientId={patientId} />
          </TabsContent>
        </Tabs>
      </section>
    </Page>
  );
}

export default ClinicalHistoryPage;
