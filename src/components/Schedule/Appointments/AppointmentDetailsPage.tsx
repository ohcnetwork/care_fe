import { useQuery } from "@tanstack/react-query";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { TokenCard } from "@/components/Schedule/Appointments/AppointmentTokenPage";
import { ScheduleAPIs } from "@/components/Schedule/api";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

interface Props {
  facilityId: string;
  appointmentId: string;
}

export default function AppointmentDetailsPage(props: Props) {
  const facilityQuery = useQuery({
    queryKey: ["facility", props.facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: {
        id: props.facilityId,
      },
    }),
  });

  const appointmentQuery = useQuery({
    queryKey: ["appointment", props.appointmentId],
    queryFn: query(ScheduleAPIs.appointments.retrieve, {
      pathParams: {
        facility_id: props.facilityId,
        id: props.appointmentId,
      },
    }),
  });

  if (!facilityQuery.data || !appointmentQuery.data) {
    return <Loading />;
  }

  return (
    <Page title="Appointment Details">
      <div className="mt-4 py-4 flex justify-center border-t border-gray-200">
        <div className="flex flex-col gap-4 mt-4">
          <div id="section-to-print">
            <TokenCard
              appointment={appointmentQuery.data}
              facility={facilityQuery.data}
            />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={print}>
              <CareIcon icon="l-print" className="text-lg mr-2" />
              <span>Print Token</span>
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}
