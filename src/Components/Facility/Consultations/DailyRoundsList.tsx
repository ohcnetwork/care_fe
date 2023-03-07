import { navigate } from "raviger";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { getDailyReport } from "../../../Redux/actions";
import loadable from "@loadable/component";
import Pagination from "../../Common/Pagination";
import { DailyRoundsModel } from "../../Patient/models";
import VirtualNursingAssistantLogUpdateCard from "./DailyRounds/VirtualNursingAssistantLogUpdateCard";
import DefaultLogUpdateCard from "./DailyRounds/DefaultLogUpdateCard";
import { useTranslation } from "react-i18next";

const PageTitle = loadable(() => import("../../Common/PageTitle"));

export const DailyRoundsList = (props: any) => {
  const { t } = useTranslation();
  const { facilityId, patientId, consultationId, consultationData } = props;
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
          { limit, offset, rounds_type: "NORMAL,VENTILATOR,ICU" },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          setDailyRoundsListData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsDailyRoundLoading(false);
      }
    },
    [consultationId, dispatch, offset]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDailyRounds(status);
    },
    [currentPage]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  let roundsList: any;

  if (isDailyRoundLoading) {
    roundsList = (
      <div className="m-1">
        <div className="border border-gray-300 bg-white shadow rounded-md p-4 max-w-sm w-full mx-auto">
          <div className="animate-pulse flex space-x-4 ">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-400 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-400 rounded"></div>
                <div className="h-4 bg-gray-400 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (dailyRoundsListData.length === 0) {
    roundsList = (
      <span className="text-gray-700">{t("no_consultation_updates")}</span>
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
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${itemData.id}/update`
              );
            } else {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${itemData.id}/update`
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
    <div>
      <div>
        <div className="md:hidden">
          <PageTitle
            title={t("consultation_updates")}
            hideBack={true}
            breadcrumbs={false}
          />
        </div>
        <div className={!isDailyRoundLoading ? "flex flex-wrap" : ""}>
          <div className="overflow-y-auto overflow-x-visible h-[85vh] space-y-4 p-2">
            {roundsList}
          </div>
          {!isDailyRoundLoading && totalCount > limit && (
            <div className="mt-4 flex justify-center">
              <Pagination
                cPage={currentPage}
                defaultPerPage={limit}
                data={{ totalCount }}
                onChange={handlePagination}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
