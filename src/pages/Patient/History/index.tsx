import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AllergyList } from "@/components/Patient/allergy/list";
import { DiagnosisList } from "@/components/Patient/diagnosis/list";
import { SymptomsList } from "@/components/Patient/symptoms/list";

export function ClinicalHistoryPage({
  facilityId,
  patientId,
}: {
  facilityId: string;
  patientId: string;
}) {
  console.log("facilityId", facilityId);
  return (
    <section className="p-4">
      <Tabs defaultValue="symptoms" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
          <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
          <TabsTrigger value="allergies">Allergies</TabsTrigger>
          <TabsTrigger value="medication-requests">
            Medication Requests
          </TabsTrigger>
        </TabsList>
        <TabsContent value="symptoms">
          <SymptomsList patientId={patientId} />
        </TabsContent>
        <TabsContent value="diagnoses">
          <DiagnosisList patientId={patientId} />
        </TabsContent>
        <TabsContent value="allergies">
          <AllergyList patientId={patientId} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

export default ClinicalHistoryPage;
