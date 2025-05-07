import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { formatName, formatPatientAge } from "@/Utils/utils";
import { formatAppointmentSlotTime } from "@/pages/Appointments/utils";
import { getFakeTokenNumber } from "@/pages/Scheduling/utils";
import { FacilityData } from "@/types/facility/facility";
import { Appointment } from "@/types/scheduling/schedule";

interface Props {
  id?: string;
  appointment: Appointment;
  facility: FacilityData;
}

const AppointmentTokenCard = ({ id, appointment, facility }: Props) => {
  const { patient } = appointment;
  const { t } = useTranslation();

  return (
    <Card
      id={id}
      className="p-6 lg:w-[25rem] border border-gray-300 relative hover:scale-105 hover:rotate-1 hover:shadow-xl transition-all duration-300 ease-in-out"
    >
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none bg-[url('/images/care_logo_gray.svg')] bg-center bg-no-repeat bg-[length:40%_auto] lg:bg-[length:60%_auto]" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              {facility.name}
            </h3>
            <div className="flex flex-col lg:flex-row text-sm text-gray-600">
              <span>{facility.pincode}, </span>
              <span className="whitespace-nowrap">{`Ph.: ${facility.phone_number}`}</span>
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
            <Label>{t("name")}</Label>
            <p className="font-semibold">{patient.name}</p>
            <p className="text-sm text-gray-600 font-medium whitespace-nowrap">
              {formatPatientAge(patient, true)},{" "}
              {t(`GENDER__${patient.gender}`)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div>
              <Label className="text-black font-semibold text-sm/none whitespace-nowrap">
                {t("token_no")}
              </Label>
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
              <Label>{t("practitioner")}:</Label>
              <p className="text-sm font-semibold">
                {formatName(appointment.user)}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">
                {formatAppointmentSlotTime(appointment)}
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
};

export { AppointmentTokenCard };
