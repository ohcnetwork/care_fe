import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DispenseOrderListSelector from "@/components/Medicine/DispenseOrderListSelector";
import { AdministrationTab } from "@/components/Medicine/MedicationAdministration/AdministrationTab";
import { DispenseHistory } from "@/components/Medicine/MedicationRequestTable/DispenseHistory";
import PrescriptionListSelector from "@/components/Medicine/PrescriptionListSelector";
import PrescriptionView from "@/components/Medicine/PrescriptionView";
import { MedicationStatementList } from "@/components/Patient/MedicationStatementList";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

interface EmptyStateProps {
  searching?: boolean;
  searchQuery?: string;
  message?: string;
  description?: string;
}

export const EmptyState = ({
  searching,
  searchQuery,
  message,
  description,
}: EmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-secondary/10 p-3">
        <CareIcon icon="l-tablets" className="text-3xl text-gray-500" />
      </div>
      <div className="max-w-[200px] space-y-1">
        <h3 className="font-medium">
          {message ||
            (searching ? t("no_matches_found") : t("no_prescriptions"))}
        </h3>
        <p className="text-sm text-gray-500">
          {description ||
            (searching
              ? t("no_medications_match_query", { searchQuery })
              : t("no_medications_prescribed"))}
        </p>
      </div>
    </div>
  );
};

export default function MedicationRequestTable() {
  const { t } = useTranslation();

  const {
    patientId,
    selectedEncounterId: encounterId,
    canWriteClinicalData: canWrite,
    canReadClinicalData: canAccess,
    facilityId,
  } = useEncounter();
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<
    string | undefined
  >();
  const [selectedDispenseOrderId, setSelectedDispenseOrderId] = useState<
    string | undefined
  >();

  useEffect(() => {
    setSelectedPrescriptionId(undefined);
  }, [encounterId]);

  return (
    <div className="space-y-2 h-full">
      <Tabs defaultValue="prescriptions" className="h-full">
        <ScrollArea className="w-full">
          <TabsList>
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
            <TabsTrigger
              value="dispense_history"
              className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
            >
              {t("dispense_history")}
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent
          value="prescriptions"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex flex-1 flex-col lg:flex-row w-full gap-1 h-full">
            <PrescriptionListSelector
              patientId={patientId}
              encounterId={encounterId}
              facilityId={facilityId}
              selectedPrescriptionId={selectedPrescriptionId}
              onSelectPrescription={(prescription) => {
                setSelectedPrescriptionId(prescription?.id);
              }}
            />

            <div className="flex-1 w-full h-full overflow-auto">
              <PrescriptionView
                patientId={patientId}
                prescriptionId={selectedPrescriptionId}
                canWrite={canWrite}
                facilityId={facilityId}
                encounterId={encounterId}
              />
            </div>
          </div>
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

        <TabsContent
          value="dispense_history"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex flex-1 flex-col lg:flex-row w-full gap-1 h-full">
            <DispenseOrderListSelector
              patientId={patientId}
              facilityId={facilityId}
              selectedDispenseOrderId={selectedDispenseOrderId}
              onSelectDispenseOrder={(dispenseOrder) => {
                setSelectedDispenseOrderId(dispenseOrder?.id);
              }}
            />

            <div className="flex-1 w-full h-full overflow-auto">
              <DispenseHistory
                patientId={patientId}
                encounterId={encounterId}
                canAccess={canAccess}
                facilityId={facilityId}
                dispenseOrderId={selectedDispenseOrderId}
                canWrite={canWrite}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
