import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
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

import MedicationDispenseList from "./MedicationDispenseList";

export enum PharmacyMedicationTab {
  PENDING = "pending",
  PARTIAL = "partial",
}
interface Props {
  facilityId: string;
  patientId: string;
  tab?: PharmacyMedicationTab;
}

export default function PrescriptionsView({
  facilityId,
  patientId,
  tab,
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
          size="sm"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/locations/${locationId}/medication_requests/`,
            )
          }
        >
          <ArrowLeft />
          {t("back_to_prescription_queue")}
        </Button>
      </div>
      {patientData && (
        <Card className="mb-4 p-4 rounded-none shadow-none bg-gray-100">
          <PatientHeader patient={patientData} facilityId={facilityId} />
        </Card>
      )}
      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate(
            `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${patientId}/${value}`,
          )
        }
      >
        <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
          <TabsTrigger
            value="pending"
            id="user-card-view"
            className="border-b-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
          >
            <span>{t("billing_pending")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="partial"
            id="user-card-view"
            className="border-b-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
          >
            <span>{t("partially_billed")}</span>
          </TabsTrigger>
        </TabsList>

        <div>
          <TabsContent value="pending" className="p-2">
            <MedicationDispenseList
              facilityId={facilityId}
              patientId={patientId}
              partial={false}
            />
          </TabsContent>
          <TabsContent value="partial" className="p-2">
            <MedicationDispenseList
              facilityId={facilityId}
              patientId={patientId}
              partial={true}
            />
          </TabsContent>
        </div>
      </Tabs>
    </Page>
  );
}
