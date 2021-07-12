import { fireRequestV2 } from "../../Redux/fireRequest";

export const loadDailyRound = (
  consultationId: string,
  id: string,
  successCB: any = () => {},
  errorCB: any = () => {}
) => {
  fireRequestV2("getDailyReport", [], {}, successCB, errorCB, {
    consultationId,
    id,
  });
};

export const updateDailyRound = (
  consultationId: string,
  id: string,
  params: object,
  successCB: any = () => {},
  errorCB: any = () => {}
) => {
  fireRequestV2("updateDailyRound", [], params, successCB, errorCB, {
    consultationId,
    id,
  });
};
