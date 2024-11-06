import { ICD11DiagnosisModel } from "@/components/Diagnosis/types";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

export const getDiagnosisById = async (id: ICD11DiagnosisModel["id"]) => {
  return (await request(routes.getICD11Diagnosis, { pathParams: { id } })).data;
};

export const getDiagnosesByIds = async (ids: ICD11DiagnosisModel["id"][]) => {
  return Promise.all([...new Set(ids)].map(getDiagnosisById));
};
