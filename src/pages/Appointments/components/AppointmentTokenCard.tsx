import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { formatPatientAge } from "@/Utils/utils";
import { formatAppointmentSlotTime } from "@/pages/Appointments/utils";
import { FacilityRead } from "@/types/facility/facility";
import { Appointment, nameFromAppointment } from "@/types/scheduling/schedule";
import { TokenRead, renderTokenNumber } from "@/types/tokens/token/token";

interface Props {
  id?: string;
  token: TokenRead;
  facility: FacilityRead;
  appointment?: Appointment;
}

const TokenCard = ({ id, token, facility, appointment }: Props) => {
  const { t } = useTranslation();

  // Get patient from token or appointment
  const patient = token.patient || appointment?.patient;

  return (
    <Card
      id={id}
      className="p-6 border border-gray-300 relative transition-all duration-300 ease-in-out print:scale-100 print:rotate-0 print:shadow-none print:hover:scale-100 print:hover:rotate-0 print:hover:shadow-none"
    >
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none bg-[url('/images/care_logo_gray.svg')] bg-center bg-no-repeat bg-[length:40%_auto] lg:bg-[length:60%_auto]" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold tracking-tight break-words">
              {facility.name}
            </h3>
            <div className="text-sm text-gray-600">
              <span>{facility.pincode}</span>
              <div className="whitespace-normal">{`Ph.: ${facility.phone_number}`}</div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="text-sm whitespace-nowrap text-center bg-gray-100 px-3 pb-2 pt-6 -mt-6 font-medium text-gray-500">
              <p>{t("general")}</p>
              <p>{t("op_token")}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Label>{t("name")}</Label>
            <p className="font-semibold break-words">{patient?.name || "--"}</p>
            {patient && (
              <p className="text-sm text-gray-600 font-medium">
                {formatPatientAge(patient, true)},{" "}
                {t(`GENDER__${patient.gender}`)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div>
              <Label className="text-black font-semibold text-sm/none whitespace-nowrap">
                {t("token_no")}
              </Label>
              <p className="text-2xl font-bold leading-none">
                {renderTokenNumber(token)}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-start gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            {appointment && (
              <>
                <div>
                  <Label>{t("practitioner", { count: 1 })}:</Label>
                  <p className="text-sm font-semibold break-words">
                    {nameFromAppointment(appointment)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">
                    {formatAppointmentSlotTime(appointment)}
                  </p>
                </div>
              </>
            )}
          </div>

          <div>
            <QRCodeSVG size={64} value={patient?.id || ""} />
          </div>
        </div>
      </div>
    </Card>
  );
};

export { TokenCard };
