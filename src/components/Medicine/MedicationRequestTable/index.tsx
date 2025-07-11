import { usePathParams } from "raviger";
import { useTranslation } from "react-i18next";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AdministrationTab } from "@/components/Medicine/MedicationAdministration/AdministrationTab";
import { MedicationPrescriptionTab } from "@/components/Patient/MedicationPrescriptionTab";
import { MedicationStatementList } from "@/components/Patient/MedicationStatementList";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { inactiveEncounterStatus } from "@/types/emr/encounter/encounter";

export default function MedicationRequestTable() {
  const { t } = useTranslation();

  const {
    patientId,
    selectedEncounterId: encounterId,
    selectedEncounter: encounter,
    patientPermissions: { canViewClinicalData },
    selectedEncounterPermissions: { canViewEncounter, canWriteEncounter },
    currentEncounterId,
  } = useEncounter();
  const canAccess = canViewClinicalData || canViewEncounter;
  const subpathMatch = usePathParams("/facility/:facilityId/*");
  const facilityIdExists = !!subpathMatch?.facilityId;
  const canWrite =
    !!encounter &&
    encounterId === currentEncounterId &&
    facilityIdExists &&
    canWriteEncounter &&
    !inactiveEncounterStatus.includes(encounter.status);

  return (
    <div className="space-y-2">
      <div className="rounded-lg">
        <Tabs defaultValue="prescriptions">
          <ScrollArea className="w-full">
            <TabsList className="w-fit">
              <TabsTrigger
                value="prescriptions"
                className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
              >
                {t("prescriptions")}
              </TabsTrigger>
              <TabsTrigger
                value="ongoing"
                className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
              >
                {t("medication_statements")}
              </TabsTrigger>
              <TabsTrigger
                value="administration"
                className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
              >
                {t("medicine_administration")}
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="prescriptions">
            <MedicationPrescriptionTab
              patientId={patientId}
              encounterId={encounterId}
              canAccess={canAccess}
              canWrite={canWrite}
              facilityIdExists={facilityIdExists}
            />
          </TabsContent>

          <TabsContent value="ongoing">
            <MedicationStatementList
              patientId={patientId}
              canAccess={canAccess}
              encounterId={encounterId}
            />
          </TabsContent>

          <TabsContent value="administration">
            <AdministrationTab
              patientId={patientId}
              encounterId={encounterId}
              canWrite={canWrite}
              canAccess={canAccess}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
