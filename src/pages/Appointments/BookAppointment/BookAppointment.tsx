import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import Loading from "@/components/Common/Loading";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import patientApi from "@/types/emr/patient/patientApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { BookAppointmentDetails } from "./BookAppointmentDetails";
import { BookingsList } from "./BookingsList";

interface Props {
  patientId: string;
  facilityId?: string;
}

export default function BookAppointment({ patientId, facilityId }: Props) {
  const { t } = useTranslation();

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: patientId },
    }),
  });

  if (!patient) {
    return <Loading />;
  }

  return (
    <Page title={t("book_appointment")} hideTitleOnPage>
      <div className="flex flex-col gap-4">
        <PatientHeader
          patient={patient}
          facilityId={facilityId}
          isPatientPage
          className="bg-white shadow-sm border-none rounded-sm"
        />
        <Tabs defaultValue="appointment">
          <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
            <TabsTrigger
              value="appointment"
              className="border-b-3 px-1.5 sm:px-2.5 py-2 text-gray-600 font-semibold hover:text-gray-900 data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
            >
              {t("book_appointment")}
            </TabsTrigger>
            <TabsTrigger
              value="encounter"
              className="border-b-3 px-1.5 sm:px-2.5 py-2 text-gray-600 font-semibold hover:text-gray-900 data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
            >
              {t("bookings")}
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="appointment"
            className="flex lg:flex-row gap-4 mt-2"
          >
            <BookAppointmentDetails patientId={patientId} />
          </TabsContent>
          <TabsContent value="encounter">
            <BookingsList patientId={patientId} facilityId={facilityId ?? ""} />
          </TabsContent>
        </Tabs>
      </div>
    </Page>
  );
}
