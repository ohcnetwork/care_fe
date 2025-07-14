import { X } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
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
  const [{ sourceUrl }] = useQueryParams();

  const handleClose = () => {
    navigate(sourceUrl || `/facility/${facilityId}/patient/${patientId}`);
  };

  const handleTabChange = (value: string) => {
    const baseUrl = `/facility/${facilityId}/patient/${patientId}/history/${value}`;
    navigate(sourceUrl ? `${baseUrl}?sourceUrl=${sourceUrl}` : baseUrl);
  };

  return (
    <section className="px-2 md:px-4">
      <div className="sm:hidden flex justify-end mb-4">
        <Button variant="outline" onClick={handleClose} size="icon">
          <X className="size-4" />
        </Button>
      </div>
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="overflow-x-auto flex-1">
            <TabsList>
              <TabsTrigger value="symptoms">{t("past_symptoms")}</TabsTrigger>
              <TabsTrigger value="diagnoses">{t("past_diagnoses")}</TabsTrigger>
              <TabsTrigger value="allergies">{t("allergies")}</TabsTrigger>
              <TabsTrigger value="medications">
                {t("past_medications")}
              </TabsTrigger>
            </TabsList>
          </div>
          <Button
            variant="outline"
            onClick={handleClose}
            size="icon"
            className="ml-4 flex-shrink-0 hidden sm:flex"
          >
            <X className="size-4" />
          </Button>
        </div>
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
