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
import PrincipalDiagnosisSelect from "./PrincipalDiagnosisSelect";

interface CreateDiagnosesProps {
  className?: string;
  value: CreateDiagnosis[];
  onChange: (diagnoses: CreateDiagnosis[]) => void;
}

export const CreateDiagnosesBuilder = (props: CreateDiagnosesProps) => {
  return (
    <div className={props.className}>
      <div className="flex w-full flex-col items-start rounded-lg border border-gray-400">
        <ul className="flex w-full flex-col gap-2 p-4">
          {props.value.map((diagnosis, index) => (
            <li key={index} id={`diagnosis-entry-${index}`}>
              <ConsultationDiagnosisEntry
                value={diagnosis}
                onChange={(action) => {
                  if (action.type === "remove") {
                    props.onChange([...props.value].splice(index, 1));
                  }

                  if (action.type === "edit") {
                    const diagnoses = [...props.value];
                    diagnoses[index] = action.value as CreateDiagnosis;
                    props.onChange(diagnoses);
                  }
                }}
              />
            </li>
          ))}
        </ul>

        {props.value.length === 0 && <NoDiagnosisAdded />}

        <div className="w-full rounded-b-lg bg-gray-200 px-4 pt-4">
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

      <PrincipalDiagnosisSelect
        className="my-2"
        diagnoses={props.value}
        onChange={async (value) => {
          props.onChange(
            props.value.map((d) => ({
              ...d,
              is_principal:
                d.diagnosis_object?.id === value?.diagnosis_object?.id,
            }))
          );
        }}
      />
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
      <div className="flex w-full flex-col items-start rounded-lg border border-gray-400">
        <ul className="flex w-full flex-col gap-2 p-4">
          {diagnoses.map((diagnosis, index) => (
            <li key={index} id={`diagnosis-entry-${index}`}>
              <ConsultationDiagnosisEntry
                value={diagnosis}
                consultationId={consultation}
                onChange={(action) => {
                  setDiagnoses(
                    diagnoses.map((diagnose, i) =>
                      i === index
                        ? (action.value as ConsultationDiagnosis)
                        : diagnose
                    )
                  );
                }}
              />
            </li>
          ))}
        </ul>

        {diagnoses.length === 0 && <NoDiagnosisAdded />}

        <div className="w-full rounded-b-lg bg-gray-200 px-4 pt-4">
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

      <PrincipalDiagnosisSelect
        className="my-2"
        diagnoses={diagnoses}
        onChange={async (value) => {
          // Unset existing principal diagnoses
          await Promise.all(
            diagnoses
              .filter((d) => d.is_principal)
              .map((d) => {
                return request(DiagnosesRoutes.updateConsultationDiagnosis, {
                  pathParams: { consultation, id: d.id },
                  body: { ...d, is_principal: false },
                });
              })
          );

          if (!value) {
            setDiagnoses((diagnoses) =>
              diagnoses.map((d) => ({ ...d, is_principal: false }))
            );
            return;
          }

          // Set new principal diagnosis
          const { res, data, error } = await request(
            DiagnosesRoutes.updateConsultationDiagnosis,
            {
              pathParams: { consultation, id: value.id },
              body: { ...value, is_principal: true },
            }
          );

          if (res?.ok && data) {
            setDiagnoses((diagnoses) =>
              diagnoses.map((d) =>
                d.id === data.id ? data : { ...d, is_principal: false }
              )
            );
          }

          if (error) {
            Notification.Error({ msg: error });
          }
        }}
      />
    </div>
  );
};

const NoDiagnosisAdded = () => {
  return (
    <div className="flex w-full justify-center gap-2 pb-8 text-center text-gray-500">
      Atleast one diagnosis must be added
    </div>
  );
};
