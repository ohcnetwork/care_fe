import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { FacilityModel } from "@/components/Facility/models";
import { ScheduleAPIs } from "@/components/Schedule/api";
import { getFakeTokenNumber } from "@/components/Schedule/helpers";
import { Appointment } from "@/components/Schedule/types";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatPatientAge } from "@/Utils/utils";

interface Props {
  facilityId: string;
  appointmentId: string;
}

export default function AppointmentTokenPage(props: Props) {
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
    <Page title="Token">
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

export function TokenCard({
  appointment,
  facility,
}: {
  appointment: Appointment;
  facility: FacilityModel;
}) {
  const { patient } = appointment;
  const { t } = useTranslation();
  return (
    <Card className="p-6 shadow-none w-[30rem] border border-gray-300 relative">
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none bg-[url('/images/care_logo_gray.svg')] bg-center bg-no-repeat bg-[length:60%_auto]" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              {facility.name}
            </h3>
            <div className="text-sm text-gray-600">
              <span>
                {facility.local_body_object?.name} - {facility.pincode},{" "}
              </span>
              <span>Ph: {facility.phone_number}</span>
            </div>
          </div>

          <div>
            <div className="text-sm whitespace-nowrap text-center bg-gray-100 px-3 pb-2 pt-6 -mt-6 font-medium text-gray-500">
              <p>GENERAL</p>
              <p>OP TOKEN</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between">
          <div>
            <Label>Name</Label>
            <p className="font-semibold">{patient.name}</p>
            <p className="text-sm text-gray-600 font-medium">
              {formatPatientAge(patient as any, true)},{" "}
              {t(`GENDER__${patient.gender}`)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div>
              <Label className="text-black font-semibold">Token No.</Label>
              <p className="text-5xl font-bold leading-none">
                {/* TODO: get token number from backend */}
                {getFakeTokenNumber(appointment)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <div className="space-y-2">
            <div>
              <Label>Doctor:</Label>
              <p className="text-sm font-semibold">
                {appointment.resource.first_name}{" "}
                {appointment.resource.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">
                {format(
                  appointment.token_slot.start_datetime,
                  "dd MMM, yyyy, hh:mm a",
                )}
              </p>
            </div>
          </div>

          <div>
            <QRCodeSVG size={64} value={patient.id} />
          </div>
        </div>
      </div>
    </Card>
  );
}
