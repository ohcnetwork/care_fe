import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ArrowLeft } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Loading from "@/components/Common/Loading";

import { usePatientContext } from "@/hooks/usePatientUser";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PatientRead } from "@/types/emr/patient/patient";
import publicPatientApi from "@/types/emr/patient/publicPatientApi";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import { Appointment } from "@/types/scheduling/schedule";

interface PatientCardProps {
  patient: PatientRead;
  selectedPatient: string | null;
  setSelectedPatient: (patientId: string) => void;
  getPatienDobOrAge: (patient: PatientRead) => string;
}

function PatientCard({
  patient,
  selectedPatient,
  setSelectedPatient,
  getPatienDobOrAge,
}: PatientCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      key={patient.id}
      onClick={() => setSelectedPatient(patient.id)}
      className={cn(
        "cursor-pointer transition-all duration-200 rounded-xl shadow-md border",
        selectedPatient === patient.id
          ? "border-primary shadow-lg"
          : "hover:border-gray-300",
      )}
    >
      <CardHeader>
        <CardTitle className="capitalize text-lg font-semibold">
          {patient.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-700 font-medium">
            {t("date_of_birth_age")}:
          </span>
          <span className="text-sm font-semibold">
            {getPatienDobOrAge(patient)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-700 font-medium">{t("sex")}:</span>
          <span className="text-sm font-semibold">
            {t(`GENDER__${patient.gender}`)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PatientList({
  patients,
  selectedPatient,
  setSelectedPatient,
  getPatienDobOrAge,
}: {
  patients: PatientRead[];
  selectedPatient: string | null;
  setSelectedPatient: (patientId: string | null) => void;
  getPatienDobOrAge: (patient: PatientRead) => string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-0 sm:p-4">
      {patients?.map((patient) => (
        <PatientCard
          key={patient.id}
          patient={patient}
          selectedPatient={selectedPatient}
          setSelectedPatient={setSelectedPatient}
          getPatienDobOrAge={getPatienDobOrAge}
        />
      ))}
    </div>
  );
}

export default function PatientSelect({
  facilityId,
  staffId,
}: {
  facilityId: string;
  staffId: string;
}) {
  const { t } = useTranslation();
  const [{ slotId, reason }] = useQueryParams();
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
  } else if (!slotId) {
    toast.error(t("selected_slot_not_found"));
    navigate(
      `/facility/${facilityId}/appointments/${staffId}/book-appointment`,
    );
  }

  const { data: patientData, isLoading } = useQuery({
    queryKey: ["otp-patient"],
    queryFn: query(publicPatientApi.listPatient, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
        "Content-Type": "application/json",
      },
    }),
    enabled: !!tokenData.token,
  });

  const { mutate: createAppointment } = useMutation({
    mutationFn: mutate(PublicAppointmentApi.createAppointment, {
      pathParams: { id: slotId ?? "" },
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
      },
    }),
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

  const getPatienDobOrAge = (patient: PatientRead) => {
    if (patient.date_of_birth) {
      return dayjs(patient.date_of_birth).format("DD MMM YYYY");
    }
    const yearOfBirth = patient.year_of_birth;
    const age = dayjs().year() - yearOfBirth;
    return `${age} years`;
  };

  const handleConfirm = () => {
    if (!selectedPatient) return;
    const selectedPatientData = patients?.find((p) => p.id === selectedPatient);
    if (!selectedPatientData) return;

    createAppointment({
      patient: selectedPatientData.id,
      note: reason,
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-32">
      <div className="flex pb-4 justify-start">
        <Button
          variant="outline"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/appointments/${staffId}/book-appointment`,
            )
          }
        >
          <ArrowLeft className="size-4" />
          <span className="text-sm underline">{t("back")}</span>
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center my-6">
        <h3>{t("select_register_patient")}</h3>
        <Button
          variant="primary_gradient"
          className="w-full sm:w-auto"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/appointments/${staffId}/patient-registration`,
              {
                query: {
                  slotId,
                  reason,
                },
              },
            )
          }
        >
          <span className="bg-linear-to-b from-white/15 to-transparent"></span>
          {t("add_new_patient")}
        </Button>
      </div>
      <div className="flex flex-col justify-center space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center">
            <Loading />
          </div>
        ) : (patients?.length ?? 0) > 0 ? (
          <PatientList
            patients={patients ?? []}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
            getPatienDobOrAge={getPatienDobOrAge}
          />
        ) : (
          renderNoPatientFound()
        )}
      </div>

      {/* Sticky bottom bar */}
      {selectedPatient && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="container mx-auto max-w-4xl flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedPatient(null)}>
              {t("cancel")}
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              {t("confirm")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
