import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MedicationHistory } from "@/pages/Patient/History/MedicationHistory";

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

  return (
    <section className="p-4">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          navigate(
            `/facility/${facilityId}/patient/${patientId}/history/${value}`,
          );
        }}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="symptoms">{t("past_symptoms")}</TabsTrigger>
          <TabsTrigger value="diagnoses">{t("past_diagnoses")}</TabsTrigger>
          <TabsTrigger value="allergies">{t("allergies")}</TabsTrigger>
          <TabsTrigger value="medications">{t("past_medications")}</TabsTrigger>
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
  );
}

export default ClinicalHistoryPage;
