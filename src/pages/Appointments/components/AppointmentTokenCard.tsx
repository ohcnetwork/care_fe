import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { formatPatientAge } from "@/Utils/utils";
import { resourceTypeToResourcePathSlug } from "@/components/Schedule/useScheduleResource";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useBreakpoints from "@/hooks/useBreakpoints";
import { formatAppointmentSlotTime } from "@/pages/Appointments/utils";
import { FacilityRead } from "@/types/facility/facility";
import {
  Appointment,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";
import { TokenRead, renderTokenNumber } from "@/types/tokens/token/token";
import { PrinterIcon } from "lucide-react";
import { Link } from "raviger";

interface Props {
  id?: string;
  token: TokenRead;
  facility: FacilityRead;
  appointment?: Appointment;
}

const TokenCard = ({ id, token, facility, appointment }: Props) => {
  const { t } = useTranslation();
  const isLargeScreen = useBreakpoints({ lg: true, default: false });

  // Get patient from token or appointment
  const patient = token.patient || appointment?.patient;

  return (
    <Card
      id={id}
      className="p-2 border border-gray-200 relative transition-all duration-300 ease-in-out print:scale-100 print:rotate-0 print:shadow-none print:hover:scale-100 print:hover:rotate-0 print:hover:shadow-none bg-gray-100"
    >
      <div className="flex flex-col px-1">
        <p className="font-semibold">{renderTokenNumber(token)}</p>
        {appointment && (
          <p className="text-gray-700">
            {formatScheduleResourceName(appointment)}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 bg-white rounded-md p-4 shadow-md mt-2 ">
        <div className="flex flex-row justify-between">
          <div className=" flex flex-col items-start justify-between">
            <div>
              <Label className="text-gray-600 text-sm">
                {t("patient_name")}:
              </Label>
              <p className="font-semibold break-words text-sm">
                {patient?.name || "--"}
              </p>
              {patient && (
                <p className="text-sm text-gray-600 font-medium">
                  {formatPatientAge(patient, true)},{" "}
                  {t(`GENDER__${patient.gender}`)}
                </p>
              )}
            </div>

            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="space-y-2 flex-1 min-w-0">
                  {appointment && (
                    <>
                      <div>
                        <Label className="text-gray-600 text-sm">
                          {t(
                            `schedulable_resource__${appointment.resource_type}`,
                          )}
                          :
                        </Label>
                        <p className="font-semibold break-words text-sm">
                          {formatScheduleResourceName(appointment)}
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          {formatAppointmentSlotTime(appointment)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold tracking-tight break-words">
                    {facility.name}
                  </h3>
                  <div className="text-sm text-gray-600">
                    <span>{facility.pincode}</span>
                    <div className="whitespace-normal">{`Ph.: ${facility.phone_number}`}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-shrink-0">
                <div className="text-sm whitespace-nowrap text-center bg-gray-100 px-3 pb-2 pt-2 -mt-4 font-medium text-gray-700 rounded-md rounded-t-none border border-gray-200">
                  <p>{t("general_op")}</p>
                </div>
              </div>
            </div>
            <div className="items-end">
              <Label className="text-gray-600 text-sm whitespace-nowrap justify-end mt-4">
                {t("token_no")}
              </Label>
              <p className="text-2xl font-bold justify-end flex">
                {renderTokenNumber(token)}
              </p>
            </div>
            <div className="mt-4">
              <QRCodeSVG
                size={isLargeScreen ? 96 : 60}
                value={patient?.id || ""}
              />
            </div>
          </div>
        </div>
        {appointment && (
          <div>
            <Separator />
            <div className="pt-3 mx-4 flex gap-2 justify-between">
              <Button
                variant="link"
                className="underline font-semibold text-base capitalize text-gray-950"
              >
                <Link
                  href={`/facility/${facility.id}/${resourceTypeToResourcePathSlug[appointment.resource_type]}/${appointment.resource.id}/queues/${appointment.token?.queue.id}`}
                >
                  {t("queue_board")}
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => print()}
                className="text-base text-gray-950 font-semibold"
              >
                <PrinterIcon className="size-4 mr-2" />
                {t("print_token")}
                <ShortcutBadge actionId="print-button" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export { TokenCard };
