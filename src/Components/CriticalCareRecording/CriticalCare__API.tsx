import { fireRequestV2 } from "../../Redux/fireRequest";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";

export const loadDailyRound = (
  consultationId: string,
  id: string,
  successCB: any = () => null,
  errorCB: any = () => null
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
  successCB: any = () => null,
  errorCB: any = () => null
) => {
  fireRequestV2("updateDailyRound", [], params, successCB, errorCB, {
    consultationId,
    id,
  });
};

export const getAsset = (consultationId: string) => {
  return request(routes.listConsultationBeds, {
    query: { consultation: consultationId },
  }).then((result) => {
    console.log(
      "result: ",
      result.data?.results[0].assets_objects?.filter(
        (asset) => asset.asset_class == "VENTILATOR"
      )
    );
    const data = result.data?.results[0].assets_objects?.filter(
      (asset) => asset.asset_class == "VENTILATOR"
    );
    console.log(data?.length);
    return data?.length;
  });
  // return len
};
