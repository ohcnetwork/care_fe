import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-0 sm:p-4">
        {patients?.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
            getPatienDoBorAge={getPatienDoBorAge}
            createAppointment={createAppointment}
            reason={reason ?? ""}
          />
        ))}
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
      <div className="flex flex-col justify-center space-y-4">
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

function PatientCard({
  patient,
  selectedPatient,
  setSelectedPatient,
  getPatienDoBorAge,
  createAppointment,
  reason,
}: {
  patient: Patient;
  selectedPatient: string | null;
  setSelectedPatient: (patientId: string | null) => void;
  getPatienDoBorAge: (patient: Patient) => string;
  createAppointment: (body: AppointmentCreateRequest) => void;
  reason: string;
}) {
  const { t } = useTranslation();

  return (
    <Card
      key={patient.id}
      onClick={() => setSelectedPatient(patient.id)}
      className={`cursor-pointer transition-all duration-200 rounded-xl shadow-md border ${
        selectedPatient === patient.id
          ? "border-primary shadow-lg"
          : "hover:border-gray-300"
      }`}
    >
      <CardHeader>
        <CardTitle className="capitalize text-lg font-semibold">
          {patient.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground font-medium">
            {t("date_of_birth_age")}:
          </span>
          <span className="text-sm font-semibold">
            {getPatienDoBorAge(patient)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground font-medium">
            {t("sex")}:
          </span>
          <span className="text-sm font-semibold">
            {t(`GENDER__${patient.gender}`)}
          </span>
        </div>

        {selectedPatient === patient.id && (
          <div className="mt-4 flex flex-row gap-3">
            <Button
              variant="destructive"
              className="w-1/2 md:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPatient(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              className="w-1/2 md:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                createAppointment({
                  patient: patient.id ?? "",
                  reason_for_visit: reason ?? "",
                });
              }}
            >
              {t("confirm")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
