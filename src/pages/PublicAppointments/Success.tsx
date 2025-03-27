import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Loading from "@/components/Common/Loading";
import { UserModel } from "@/components/Users/models";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";

export function AppointmentSuccess(props: { appointmentId: string }) {
  const { appointmentId } = props;
  const { t } = useTranslation();

  const patientUserContext = usePatientContext();
  const tokenData = patientUserContext?.tokenData;

  const userData: UserModel = JSON.parse(localStorage.getItem("user") ?? "{}");

  const { data, isLoading, error } = useQuery({
    queryKey: ["appointment", tokenData.phoneNumber],
    queryFn: query(PublicAppointmentApi.getAppointments, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
      },
    }),
    enabled: !!tokenData.token,
  });

  if (error) {
    toast.error(t("appointment_not_found"));
  }

  const appointmentData = data?.results.find(
    (appointment) => appointment.id === appointmentId,
  );

  if (isLoading || !appointmentData) {
    return <Loading />;
  }

  const appointmentTime = appointmentData.token_slot.start_datetime;
  const appointmentDate = format(appointmentTime, "do MMMM");
  const appointmentTimeSlot = format(appointmentTime, "hh:mm a");

  return (
    <div className="mx-auto p-2 max-w-3xl">
      <div className="bg-secondary-100/50 rounded-lg shadow-xs p-12 border border-secondary-400 text-center mb-12">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-100 mb-6">
          <CareIcon icon="l-check" className="size-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          {t("appointment_booking_success")}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-1">
            {t("doctor_nurse")}:
          </h2>
          <p className="text-lg font-medium">{formatName(userData)}</p>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-1">
            {t("patient")}:
          </h2>
          <p className="text-lg font-medium">{appointmentData?.patient.name}</p>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-1">
            {t("date")}:
          </h2>
          <p className="text-lg font-medium">{appointmentDate}</p>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-1">
            {t("time")}:
          </h2>
          <p className="text-lg font-medium">{appointmentTimeSlot}</p>
        </div>
      </div>

      <div className="mt-12 text-left space-y-2">
        <p className="text-gray-900">
          {formatName(userData)} {t("doc_will_visit_patient")}
        </p>
        <p className="text-gray-600">{t("thank_you_for_choosing")}</p>
      </div>
    </div>
  );
}
