import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import { ICD11DiagnosisModel } from "./types";

// TODO: cache ICD11 responses and hit the cache if present instead of making an API call.

export const getDiagnosisById = async (id: ICD11DiagnosisModel["id"]) => {
  return (await request(routes.getICD11Diagnosis, { pathParams: { id } })).data;
};

export const getDiagnosesByIds = async (ids: ICD11DiagnosisModel["id"][]) => {
  return Promise.all([...new Set(ids)].map(getDiagnosisById));
};
