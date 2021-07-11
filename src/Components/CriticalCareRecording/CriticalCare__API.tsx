import { fireRequestV2 } from "../../Redux/fireRequest";

export const loadDailyRound = (
  consultationId: string,
  id: string,
  successCB: any = () => {},
  errorCB: any = () => {}
) => {
  let successCallback = (data: any) => {
    console.log("success", data);
    successCB(data);
  };
  let errorCallback = (data: any) => {
    console.log("error", data);
    errorCB(data);
  };
  fireRequestV2("getDailyReport", [], {}, successCallback, errorCallback, {
    consultationId,
    id,
  });
};
