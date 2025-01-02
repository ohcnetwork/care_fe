import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Loading from "@/components/Common/Loading";
import { UserModel } from "@/components/Users/models";

import { CarePatientTokenKey } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { TokenData } from "@/types/auth/otpToken";

export function AppointmentSuccess(props: { appointmentId: string }) {
  const { appointmentId } = props;
  const { t } = useTranslation();
  const tokenData: TokenData = JSON.parse(
    localStorage.getItem(CarePatientTokenKey) || "{}",
  );
  const userData: UserModel = JSON.parse(localStorage.getItem("user") ?? "{}");

  const { data, isLoading, error } = useQuery({
    queryKey: ["appointment", tokenData.phoneNumber],
    queryFn: query(routes.otp.getAppointments, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
      },
    }),
    enabled: !!tokenData.token,
  });

  if (error) {
    Notification.Error({ msg: t("appointment_not_found") });
  }

  const appointmentData = data?.results.find(
    (appointment) => appointment.id === appointmentId,
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="mx-auto p-2 max-w-3xl">
      <div className="bg-secondary-100/50 rounded-lg shadow-sm p-12 border border-secondary-400 text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
          <CareIcon icon="l-check" className="w-8 h-8 text-green-600" />
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
          <p className="text-lg font-medium">
            {appointmentData?.token_slot.start_datetime
              ? format(
                  new Date(appointmentData?.token_slot.start_datetime),
                  "do MMMM",
                )
              : ""}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-1">
            {t("time")}:
          </h2>
          <p className="text-lg font-medium">
            {appointmentData?.token_slot.start_datetime
              ? format(
                  new Date(appointmentData?.token_slot.start_datetime),
                  "hh:mm a",
                )
              : ""}
          </p>
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
