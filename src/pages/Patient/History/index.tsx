import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AllergyHistory } from "./AllergyHistory";
import { DiagnosesHistory } from "./DiagnosesHistory";
import { SymptomsHistory } from "./SymptomsHistory";

export function ClinicalHistoryPage({
  facilityId,
  patientId,
}: {
  facilityId: string;
  patientId: string;
}) {
  const { t } = useTranslation();
  console.log("facilityId", facilityId);
  return (
    <section className="p-4">
      <Tabs defaultValue="symptoms" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="symptoms">{t("symptom")}</TabsTrigger>
          <TabsTrigger value="diagnoses">{t("diagnoses")}</TabsTrigger>
          <TabsTrigger value="allergies">{t("allergies")}</TabsTrigger>
          <TabsTrigger value="medication-requests">
            {t("medication_requests")}
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
        {/* <TabsContent value="medication-requests">
          <MedicationRequestsHistory patientId={patientId} />
        </TabsContent> */}
      </Tabs>
    </section>
  );
}

export default ClinicalHistoryPage;
