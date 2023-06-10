import { navigate } from "raviger";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { getDailyReport } from "../../../Redux/actions";
import Pagination from "../../Common/Pagination";
import { DailyRoundsModel } from "../../Patient/models";
import VirtualNursingAssistantLogUpdateCard from "./DailyRounds/VirtualNursingAssistantLogUpdateCard";
import DefaultLogUpdateCard from "./DailyRounds/DefaultLogUpdateCard";
import { useTranslation } from "react-i18next";
import LoadingLogUpdateCard from "./DailyRounds/LoadingCard";
import { getTemperaturePreference } from "../../Common/utils/DevicePreference";
import { fahrenheitToCelsius } from "../../../Utils/utils";

export const DailyRoundsList = (props: any) => {
  const { t } = useTranslation();
  const {
    facilityId,
    patientId,
    consultationId,
    consultationData,
    showAutomatedRounds,
  } = props;
  const dispatch: any = useDispatch();
  const [isDailyRoundLoading, setIsDailyRoundLoading] = useState(false);
  const [dailyRoundsListData, setDailyRoundsListData] = useState<
    Array<DailyRoundsModel>
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 14;

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsDailyRoundLoading(true);
      const res = await dispatch(
        getDailyReport(
          {
            limit,
            offset,
            rounds_type: showAutomatedRounds ? "" : "NORMAL,VENTILATOR,ICU",
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          res.data.results.forEach((round: DailyRoundsModel) => {
            round.temperatureUnit = getTemperaturePreference();
            round.temperature =
              round.temperatureUnit === "F"
                ? round.temperature
                : fahrenheitToCelsius(round.temperature);
            return round;
          });
          setDailyRoundsListData(res.data.results);
          console.log(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsDailyRoundLoading(false);
      }
    },
    [consultationId, dispatch, offset, showAutomatedRounds]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDailyRounds(status);
    },
    [currentPage, showAutomatedRounds]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  let roundsList: any;

  if (isDailyRoundLoading) {
    roundsList = (
      <>
        {Array.from({ length: 3 }).map((_, i) => (
          <LoadingLogUpdateCard key={i} />
        ))}
      </>
    );
  } else if (dailyRoundsListData.length === 0) {
    roundsList = (
      <span className="text-gray-700 bg-white rounded-lg shadow p-3 flex justify-center">
        {t("no_consultation_updates")}
      </span>
    );
  } else if (dailyRoundsListData.length) {
    roundsList = dailyRoundsListData.map((itemData, idx) => {
      if (itemData.rounds_type === "AUTOMATED") {
        return (
          <VirtualNursingAssistantLogUpdateCard
            round={itemData}
            previousRound={dailyRoundsListData[idx + 1]}
          />
        );
      }

      return (
        <DefaultLogUpdateCard
          key={itemData.id}
          round={itemData}
          consultationData={consultationData}
          onViewDetails={() => {
            if (itemData.rounds_type === "NORMAL") {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${itemData.id}`
              );
            } else {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${itemData.id}`
              );
            }
          }}
          onUpdateLog={() => {
            if (itemData.rounds_type === "NORMAL") {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${itemData.id}/update`
              );
            } else {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${itemData.id}/update`
              );
            }
          }}
        />
      );
    });
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden max-h-[85vh] px-3">
        {roundsList}
      </div>
      {!isDailyRoundLoading && totalCount > limit && (
        <div className="flex justify-center">
          <Pagination
            cPage={currentPage}
            defaultPerPage={limit}
            data={{ totalCount }}
            onChange={handlePagination}
          />
        </div>
      )}
    </div>
  );
};
