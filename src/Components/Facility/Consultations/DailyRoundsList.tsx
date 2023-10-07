import { navigate } from "raviger";
import { useEffect, useState } from "react";
import Pagination from "../../Common/Pagination";
import { DailyRoundsModel } from "../../Patient/models";
import VirtualNursingAssistantLogUpdateCard from "./DailyRounds/VirtualNursingAssistantLogUpdateCard";
import DefaultLogUpdateCard from "./DailyRounds/DefaultLogUpdateCard";
import { useTranslation } from "react-i18next";
import LoadingLogUpdateCard from "./DailyRounds/LoadingCard";
import routes from "../../../Redux/api";
import useQuery from "../../../Utils/request/useQuery";

export const DailyRoundsList = (props: any) => {
  const { t } = useTranslation();
  const {
    facilityId,
    patientId,
    consultationId,
    consultationData,
    showAutomatedRounds,
  } = props;
  const [isDailyRoundLoading, setIsDailyRoundLoading] = useState(false);
  const [dailyRoundsListData, setDailyRoundsListData] = useState<
    Array<DailyRoundsModel>
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 14;

  const { res, data, refetch } = useQuery(routes.getDailyReports, {
    body: {
      limit,
      offset,
      rounds_type: showAutomatedRounds ? "" : "NORMAL,VENTILATOR,ICU",
    },
    pathParams: { consultationId },
  });

  useEffect(() => {
    setIsDailyRoundLoading(true);
    if (res?.ok && data) {
      setDailyRoundsListData(data.results);
      setTotalCount(data.count);
    }
    setIsDailyRoundLoading(false);
  }, [res, data]);

  useEffect(() => {
    refetch();
  }, [currentPage, showAutomatedRounds, refetch]);

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
      <span className="flex justify-center rounded-lg bg-white p-3 text-gray-700 shadow">
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
    <div className="flex w-full flex-col gap-4">
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto overflow-x-hidden px-3">
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
