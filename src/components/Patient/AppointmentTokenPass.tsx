import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { formatSlotTimeRange } from "@/pages/Appointments/utils";
import {
  PublicAppointment,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";
import { renderTokenNumber } from "@/types/tokens/token/token";
import { formatPatientAge } from "@/Utils/utils";

import dayjs from "@/Utils/dayjs";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{children}</span>
    </div>
  );
}

export function AppointmentTokenPass({
  appointment,
  className,
}: {
  appointment: PublicAppointment;
  className?: string;
}) {
  const { t } = useTranslation();
  const start = dayjs(appointment.token_slot.start_datetime);

  return (
    <div
      className={cn(
        "flex gap-4 rounded-2xl border border-gray-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <Field label={t("patient_name")}>
          <span className="block truncate">{appointment.patient.name}</span>
          <span className="block text-xs font-normal text-gray-600">
            {formatPatientAge(appointment.patient, true)} ·{" "}
            {t(`GENDER__${appointment.patient.gender}`)}
          </span>
        </Field>

        <Field label={t(appointment.resource_type, { count: 1 })}>
          <span className="block truncate">
            {formatScheduleResourceName(appointment)}
          </span>
        </Field>

        <div className="flex flex-col border-t border-gray-100 pt-2.5">
          <span className="text-sm font-semibold text-gray-900">
            {appointment.token_slot.availability.name}
          </span>
          <span className="text-xs text-gray-600">
            {start.format("ddd, D MMM")} ·{" "}
            {formatSlotTimeRange(appointment.token_slot)}
          </span>
        </div>

        <span className="text-xs text-gray-600">
          {appointment.facility.name}
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {appointment.token ? (
          <div className="flex flex-col items-end">
            <span className="whitespace-nowrap text-xs text-gray-500">
              {t("token_no")}
            </span>
            <span className="text-2xl font-bold leading-tight text-gray-900">
              {renderTokenNumber(appointment.token)}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <span className="whitespace-nowrap text-xs text-gray-500">
              {t("patient_booking__booking_reference")}
            </span>
            <span className="font-mono text-sm font-bold uppercase text-gray-900">
              {appointment.id.slice(0, 8)}
            </span>
          </div>
        )}
        <QRCodeSVG size={84} value={appointment.patient.id} />
      </div>
    </div>
  );
}
