import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AdministrationTab } from "@/components/Medicine/MedicationAdministration/AdministrationTab";
import { DispenseHistory } from "@/components/Medicine/MedicationRequestTable/DispenseHistory";
import PrescriptionList from "@/components/Medicine/PrescriptionList";
import PrescriptionView from "@/components/Medicine/PrescriptionView";
import { MedicationStatementList } from "@/components/Patient/MedicationStatementList";

import query from "@/Utils/request/query";
import { Button } from "@/components/ui/button";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import { PlusIcon, ReceiptTextIcon } from "lucide-react";
import { Link } from "raviger";

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

  useQuery({
    queryKey: ["medication_requests_active", patientId, encounterId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId: patientId },
      queryParams: {
        encounter: encounterId,
        limit: 100,
        status: ["active", "on_hold", "draft", "unknown"].join(","),
        facility: facilityId,
      },
    }),
    enabled: !!patientId && canAccess,
  });

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
              <TabsTrigger
                value="dispense_history"
                className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
              >
                {t("dispense_history")}
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="prescriptions">
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-[300px_1fr] gap-4">
                <div>
                  <PrescriptionList
                    patientId={patientId}
                    encounterId={encounterId}
                    facilityId={facilityId}
                    selectedPrescriptionId={selectedPrescriptionId}
                    onSelectPrescription={(prescription) => {
                      setSelectedPrescriptionId(prescription?.id);
                    }}
                  />
                </div>
                {selectedPrescriptionId && (
                  <div>
                    <PrescriptionView
                      patientId={patientId}
                      prescriptionId={selectedPrescriptionId}
                      canWrite={canWrite}
                      facilityId={facilityId}
                      encounterId={encounterId}
                    />
                  </div>
                )}
              </div>
              {!selectedPrescriptionId && (
                <div className="flex w-full items-center justify-center">
                  <div className="flexitems-center justify-center gap-2 pt-16 text-center">
                    <div className="rounded-full bg-secondary/10 flex flex-col items-center justify-center gap-2">
                      <ReceiptTextIcon className="text-gray-500" />
                      <h3 className="font-medium">
                        {t("no_prescriptions_found")}
                      </h3>
                      {canWrite && (
                        <Button
                          asChild
                          variant="outline"
                          className="text-gray-950 hover:text-gray-700 h-9 mt-2"
                          data-cy="edit-prescription"
                        >
                          <Link href={`questionnaire/medication_request`}>
                            <PlusIcon className="mr-2 size-4" />
                            {t("create_prescription")}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
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

          <TabsContent value="dispense_history">
            <DispenseHistory
              patientId={patientId}
              encounterId={encounterId}
              canAccess={canAccess}
              facilityId={facilityId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
