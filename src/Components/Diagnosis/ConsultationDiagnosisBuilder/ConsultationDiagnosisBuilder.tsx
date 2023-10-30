import { useState } from "react";
import useSlug from "../../../Common/hooks/useSlug";
import {
  ConsultationDiagnosis,
  CreateDiagnosis,
  ICD11DiagnosisModel,
} from "../types";
import AddICD11Diagnosis from "./AddICD11Diagnosis";
import ConsultationDiagnosisEntry from "./ConsultationDiagnosisEntry";
import request from "../../../Utils/request/request";
import DiagnosesRoutes from "../routes";
import * as Notification from "../../../Utils/Notifications";

interface CreateDiagnosesProps {
  className?: string;
  value: CreateDiagnosis[];
  onChange: (diagnoses: CreateDiagnosis[]) => void;
}

export const CreateDiagnosesBuilder = (props: CreateDiagnosesProps) => {
  return (
    <div className={props.className}>
      <div className="flex w-full flex-col items-start gap-2">
        {props.value.map((diagnosis, index) => (
          <ConsultationDiagnosisEntry
            key={index}
            value={diagnosis}
            onChange={(action) => {
              if (action.type === "remove") {
                const diagnoses = [...props.value];
                diagnoses.splice(index, 1);
                props.onChange(diagnoses);
              }

              if (action.type === "edit") {
                const diagnoses = action.value.is_principal
                  ? props.value.map((d) => {
                      d.is_principal = false;
                      return d;
                    })
                  : [...props.value];
                diagnoses[index] = action.value as CreateDiagnosis;
                props.onChange(diagnoses);
              }
            }}
          />
        ))}

        {props.value.length === 0 && (
          <div className="text-gray-400">No diagnoses added</div>
        )}

        <AddICD11Diagnosis
          disallowed={props.value.map(
            (obj) => obj.diagnosis_object as ICD11DiagnosisModel
          )}
          onAdd={async (diagnosis) => {
            props.onChange([...props.value, diagnosis]);
            return true;
          }}
        />
      </div>
    </div>
  );
};

interface EditDiagnosesProps {
  className?: string;
  value: ConsultationDiagnosis[];
}

export const EditDiagnosesBuilder = (props: EditDiagnosesProps) => {
  const consultation = useSlug("consultation");
  const [diagnoses, setDiagnoses] = useState(props.value);

  return (
    <div className={props.className}>
      <div className="flex w-full flex-col items-start gap-2">
        {diagnoses.map((diagnosis, index) => (
          <ConsultationDiagnosisEntry
            key={index}
            value={diagnosis}
            consultationId={consultation}
          />
        ))}

        {diagnoses.length === 0 && (
          <div className="text-gray-400">No diagnoses added</div>
        )}

        <AddICD11Diagnosis
          disallowed={diagnoses.map(
            (obj) => obj.diagnosis_object as ICD11DiagnosisModel
          )}
          onAdd={async (diagnosis) => {
            const { res, data, error } = await request(
              DiagnosesRoutes.createConsultationDiagnosis,
              {
                pathParams: { consultation },
                body: diagnosis,
              }
            );

            if (res?.ok && data) {
              setDiagnoses([...diagnoses, data]);
              return true;
            }

            if (error) {
              Notification.Error({ msg: error });
            }

            return false;
          }}
        />
      </div>
    </div>
  );
};
