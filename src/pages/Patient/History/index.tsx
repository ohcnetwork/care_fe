import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MedicationHistory } from "@/pages/Patient/History/MedicationHistory";

import { AllergyHistory } from "./AllergyHistory";
import { DiagnosesHistory } from "./DiagnosesHistory";
import { SymptomsHistory } from "./SymptomsHistory";

export function ClinicalHistoryPage({
  patientId,
}: {
  facilityId: string;
  patientId: string;
}) {
  const { t } = useTranslation();

  return (
    <section className="p-4">
      <Tabs defaultValue="symptoms" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="symptoms">{t("past_symptoms")}</TabsTrigger>
          <TabsTrigger value="diagnoses">{t("past_diagnoses")}</TabsTrigger>
          <TabsTrigger value="allergies">{t("allergies")}</TabsTrigger>
          <TabsTrigger value="medication-requests">
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
        <TabsContent value="medication-requests">
          <MedicationHistory patientId={patientId} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

export default ClinicalHistoryPage;
