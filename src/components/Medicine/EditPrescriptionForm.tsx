import { useState } from "react";

import { MedicationRequest } from "@/types/emr/medicationRequest";

import { MedicationRequestItem } from "../Questionnaire/QuestionTypes/MedicationRequestQuestion";

interface Props {
  initial: MedicationRequest;
  onDone: (created: boolean) => void;
}

export default function EditPrescriptionForm(props: Props) {
  const [medicationRequest, setMedicationRequest] = useState<MedicationRequest>(
    props.initial,
  );

  return (
    <MedicationRequestItem
      medication={medicationRequest}
      onUpdate={(medicationRequest) =>
        setMedicationRequest((prev) => ({
          ...prev,
          ...medicationRequest,
        }))
      }
    />
  );
}
