import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import Loading from "@/components/Common/Loading";

import { usePatientContext } from "@/hooks/usePatientUser";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Patient } from "@/types/emr/newPatient";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import {
  Appointment,
  AppointmentCreateRequest,
  TokenSlot,
} from "@/types/scheduling/schedule";

export default function PatientSelect({
  facilityId,
  staffId,
}: {
  facilityId: string;
  staffId: string;
}) {
  const { t } = useTranslation();
  const selectedSlot = JSON.parse(
    localStorage.getItem("selectedSlot") ?? "",
  ) as TokenSlot;
  const reason = localStorage.getItem("reason");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const patientUserContext = usePatientContext();
  const tokenData = patientUserContext?.tokenData;

  const queryClient = useQueryClient();

  if (!staffId) {
    toast.error(t("staff_not_found"));
    navigate(`/facility/${facilityId}/`);
  } else if (!tokenData) {
    toast.error(t("phone_number_not_found"));
    navigate(`/facility/${facilityId}/appointments/${staffId}/otp/send`);
  } else if (!selectedSlot) {
    toast.error(t("selected_slot_not_found"));
    navigate(
      `/facility/${facilityId}/appointments/${staffId}/book-appointment`,
    );
  }

  const { data: patientData, isLoading } = useQuery({
    queryKey: ["otp-patient"],
    queryFn: query(routes.otp.getPatient, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
        "Content-Type": "application/json",
      },
    }),
    enabled: !!tokenData.token,
  });

  const { mutate: createAppointment } = useMutation({
    mutationFn: (body: AppointmentCreateRequest) =>
      mutate(PublicAppointmentApi.createAppointment, {
        pathParams: { id: selectedSlot?.id },
        body,
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
        },
      })(body),
    onSuccess: (data: Appointment) => {
      toast.success(t("appointment_created_success"));
      queryClient.invalidateQueries({
        queryKey: [
          ["patients", tokenData.phoneNumber],
          ["appointment", tokenData.phoneNumber],
        ],
      });
      navigate(`/facility/${facilityId}/appointments/${data.id}/success`, {
        replace: true,
      });
    },
    onError: (error) => {
      toast.error(error?.message || t("failed_to_create_appointment"));
    },
  });

  const patients = patientData?.results;

  const renderNoPatientFound = () => {
    return (
      <div>
        <span className="text-base font-medium">
          {t("no_patients_found_phone_number")}
        </span>
      </div>
    );
  };

  const getPatienDoBorAge = (patient: Patient) => {
    if (patient.date_of_birth) {
      return dayjs(patient.date_of_birth).format("DD MMM YYYY");
    }
    const yearOfBirth = patient.year_of_birth;
    const age = dayjs().year() - yearOfBirth;
    return `${age} years`;
  };

  const renderPatientList = () => {
    return (
      <div className="overflow-auto max-h-[400px]">
        <table className="w-full">
          <thead className="text-sm bg-secondary-200 font-medium">
            <tr>
              <th className="w-2/6 px-4 py-2 text-left">
                {t("patient_name_uhid")}
              </th>
              <th className="w-1/6 px-4 py-2 text-left">
                {t("primary_ph_no")}
              </th>
              <th className="w-1/6 px-4 py-2 text-left">
                {t("date_of_birth_age")}
              </th>
              <th className="w-1/6 px-4 py-2 text-left">{t("sex")}</th>
            </tr>
          </thead>
          <tbody className="divide-y rounded-lg border border-gray-200 bg-card">
            {patients?.map((patient) => (
              <tr
                key={patient.id}
                onClick={() => setSelectedPatient(patient.id ?? null)}
                className="hover:bg-secondary-100 cursor-pointer"
              >
                {selectedPatient === patient.id ? (
                  <td colSpan={4} className="w-full p-4">
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatient(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          createAppointment({
                            patient: patient.id ?? "",
                            reason_for_visit: reason ?? "",
                          });
                        }}
                      >
                        Confirm
                      </Button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="p-4 align-middle text-left">
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-xs text-gray-500">{patient.id}</div>
                    </td>
                    <td className="p-4 align-middle text-left">
                      {formatPhoneNumberIntl(patient.phone_number)}
                    </td>
                    <td className="p-4 align-middle text-left">
                      {getPatienDoBorAge(patient)}
                    </td>
                    <td className="p-4 align-middle text-left">
                      {t(`GENDER__${patient.gender}`)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex px-2 pb-4 justify-start">
        <Button
          variant="outline"
          className="border border-secondary-400"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/appointments/${staffId}/book-appointment`,
            )
          }
        >
          <span className="text-sm underline">{t("back")}</span>
        </Button>
      </div>
      <div className="flex flex-col justify-center space-y-4 bg-white rounded-lg shadow-md p-8">
        <h3 className="text-lg font-medium">{t("select_register_patient")}</h3>
        {isLoading ? (
          <div className="flex justify-center items-center">
            <Loading />
          </div>
        ) : (patients?.length ?? 0) > 0 ? (
          renderPatientList()
        ) : (
          renderNoPatientFound()
        )}
        <Button
          variant="primary_gradient"
          className="w-1/2 self-center"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/appointments/${staffId}/patient-registration`,
            )
          }
        >
          <span className="bg-linear-to-b from-white/15 to-transparent"></span>
          {t("add_new_patient")}
        </Button>
      </div>
    </div>
  );
}
