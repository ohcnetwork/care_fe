import { navigate } from "raviger";
import { DailyRoundsModel } from "../../Patient/models";
import VirtualNursingAssistantLogUpdateCard from "./DailyRounds/VirtualNursingAssistantLogUpdateCard";
import DefaultLogUpdateCard from "./DailyRounds/DefaultLogUpdateCard";
import { useTranslation } from "react-i18next";
import LoadingLogUpdateCard from "./DailyRounds/LoadingCard";
import routes from "../../../Redux/api";
import PaginatedList from "../../../CAREUI/misc/PaginatedList";

export const DailyRoundsList = (props: any) => {
  const { t } = useTranslation();
  const {
    facilityId,
    patientId,
    consultationId,
    consultationData,
    showAutomatedRounds,
  } = props;

  return (
    <PaginatedList
      route={routes.getDailyReports}
      query={{
        rounds_type: showAutomatedRounds ? "" : "NORMAL,VENTILATOR,ICU",
      }}
    >
      {(_) => (
        <div className="flex w-full flex-col gap-4">
          <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto overflow-x-hidden px-3">
            <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
              <span className="flex justify-center rounded-lg bg-white p-3 text-gray-700 shadow">
                {t("no_consultation_updates")}
              </span>
            </PaginatedList.WhenEmpty>
            <PaginatedList.WhenLoading>
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <LoadingLogUpdateCard key={i} />
                ))}
              </>
            </PaginatedList.WhenLoading>
            <PaginatedList.Items<
              DailyRoundsModel[]
            > className="my-8 flex grow flex-col gap-3 lg:mx-8">
              {(items) => {
                return items.map((itemData, idx) => {
                  if (itemData.rounds_type === "AUTOMATED") {
                    return (
                      <VirtualNursingAssistantLogUpdateCard
                        round={itemData}
                        previousRound={items[idx + 1]}
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
              }}
            </PaginatedList.Items>
            <div className="flex w-full items-center justify-center">
              <PaginatedList.Paginator hideIfSinglePage />
            </div>
          </div>
        </div>
      )}
    </PaginatedList>
  );
};
