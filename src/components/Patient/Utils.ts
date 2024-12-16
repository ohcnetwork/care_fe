import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PatientModel } from "@/components/Patient/models";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

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
  consultationId?: string;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteField,
      thread,
      replyTo,
    }: {
      noteField: string;
      thread: 10 | 20;
      replyTo?: { id: string };
    }) => {
      const { res, data } = await request(routes.addPatientNote, {
        pathParams: { patientId: options.patientId },
        body: {
          note: noteField,
          thread,
          consultation: options.consultationId,
          reply_to: replyTo?.id,
        },
      });
      if (res?.status === 201 && data) return data;
      throw new Error();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      return data;
    },
  });
};
