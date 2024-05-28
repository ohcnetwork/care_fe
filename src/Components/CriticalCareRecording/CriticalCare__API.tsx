import { fireRequestV2 } from "../../Redux/fireRequest";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";

export const loadDailyRound = (
  consultationId: string,
  id: string,
  successCB: any = () => null,
  errorCB: any = () => null,
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
  errorCB: any = () => null,
) => {
  fireRequestV2("updateDailyRound", [], params, successCB, errorCB, {
    consultationId,
    id,
  });
};

export const getAsset = (
  consultationId: string,
  setAsset: React.Dispatch<React.SetStateAction<number>>,
) => {
  request(routes.listConsultationBeds, {
    query: { consultation: consultationId, limit: 1 },
  }).then(({ data }) => {
    // here its fetching the ventilator type assets
    const assets = data?.results[0].assets_objects?.filter(
      (asset) => asset.asset_class == "VENTILATOR",
    );
    setAsset(assets?.length || 0);
  });
};
