import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PatientModel } from "@/components/Patient/models";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";

import { PatientNotesModel } from "../Facility/models";

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
      thread: PatientNotesModel["thread"];
      replyTo?: { id: string };
    }) => {
      const performMutation = mutate(routes.addPatientNote, {
        pathParams: { patientId: options.patientId },
      });

      return performMutation({
        note: noteField,
        thread,
        consultation: options.consultationId,
        reply_to: replyTo?.id,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      Notification.Success({ msg: "Note added successfully" });
      return data;
    },
  });
};
