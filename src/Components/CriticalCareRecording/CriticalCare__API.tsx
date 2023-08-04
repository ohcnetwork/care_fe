import { legacyFireRequest } from "../../Redux/fireRequest";

export const loadDailyRound = (
  consultationId: string,
  id: string,
  successCB: any = () => null,
  errorCB: any = () => null
) => {
  legacyFireRequest("getDailyReport", [], {}, successCB, errorCB, {
    consultationId,
    id,
  });
};

export const updateDailyRound = (
  consultationId: string,
  id: string,
  params: object,
  successCB: any = () => null,
  errorCB: any = () => null
) => {
  legacyFireRequest("updateDailyRound", [], params, successCB, errorCB, {
    consultationId,
    id,
  });
};
