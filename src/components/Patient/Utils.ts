import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PatientNotesModel } from "@/components/Facility/models";
import { PatientModel } from "@/components/Patient/models";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";

export function isPatientMandatoryDataFilled(patient: PatientModel) {
  return (
    patient.phone_number &&
    patient.emergency_phone_number &&
    patient.name &&
    patient.gender &&
    (patient.date_of_birth || patient.year_of_birth) &&
    patient.address &&
    patient.permanent_address &&
    patient.pincode &&
    patient.state &&
    patient.district &&
    patient.local_body &&
    ("medical_history" in patient ? patient.medical_history : true) &&
    patient.blood_group
  );
}

export const useAddPatientNote = (options: {
  patientId: string;
  thread: PatientNotesModel["thread"];
  consultationId?: string;
}) => {
  const queryClient = useQueryClient();
  const { patientId, thread, consultationId } = options;

  return useMutation({
    mutationFn: mutate(routes.addPatientNote, {
      pathParams: { patientId },
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["notes", patientId, thread, consultationId],
      });
      return data;
    },
  });
};
