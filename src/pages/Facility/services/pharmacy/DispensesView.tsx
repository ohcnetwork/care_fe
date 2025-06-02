import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { PatientHeader } from "@/pages/Facility/services/serviceRequests/components/PatientHeader";
import { MedicationDispenseStatus } from "@/types/emr/medicationDispense/medicationDispense";

import DispensedMedicationList from "./DispensedMedicationList";

interface Props {
  facilityId: string;
  patientId: string;
  status?: MedicationDispenseStatus;
}

export default function DispensesView({
  facilityId,
  patientId,
  status = MedicationDispenseStatus.completed,
}: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();

  const { data: patientData } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(routes.patient.getPatient, {
      pathParams: { id: patientId ?? "" },
    }),
    enabled: !!patientId,
  });

  return (
    <Page title={t("pharmacy_medications")} hideTitleOnPage>
      <div>
        <Button
          variant="outline"
          className="text-gray-950 font-semibold border-gray-300 mb-4"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/locations/${locationId}/medication_dispense/`,
            )
          }
        >
          <ArrowLeftIcon className="size-4" />
          Back to Dispense Queue
        </Button>
      </div>
      {patientData && (
        <Card className="mb-4 p-4 rounded-none shadow-none bg-gray-100">
          <PatientHeader patient={patientData} facilityId={facilityId} />
        </Card>
      )}
      <Tabs
        value={status}
        onValueChange={(value) =>
          navigate(
            `/facility/${facilityId}/locations/${locationId}/medication_dispense/patient/${patientId}/${value}`,
          )
        }
      >
        <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent p-0 h-auto rounded-none">
          {Object.values(MedicationDispenseStatus).map((statusValue) => (
            <TabsTrigger
              key={statusValue}
              value={statusValue}
              className="border-0 border-b-2 border-transparent px-4 text-base font-semibold data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-gray-600 hover:text-gray-900 gap-2"
            >
              {t(statusValue)}
            </TabsTrigger>
          ))}
        </TabsList>

        <div>
          {Object.values(MedicationDispenseStatus).map((statusValue) => (
            <TabsContent key={statusValue} value={statusValue} className="p-2">
              <DispensedMedicationList
                facilityId={facilityId}
                patientId={patientId}
                status={statusValue}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </Page>
  );
}
