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
      pathParams={{
        consultationId,
      }}
      query={{
        rounds_type: showAutomatedRounds ? "" : "NORMAL,VENTILATOR,ICU",
      }}
    >
      {(_) => (
        <div className="-mt-2 flex w-full flex-col gap-4">
          <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto overflow-x-hidden px-3">
            <PaginatedList.WhenEmpty className="flex w-full justify-center rounded-md border-b border-gray-200 bg-white px-5 py-1 text-center text-2xl font-bold text-gray-500">
              <span className="flex justify-center rounded-lg bg-white p-3 text-gray-700">
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
            <PaginatedList.Items<DailyRoundsModel> className="flex grow flex-col gap-3">
              {(item, items) => {
                if (item.rounds_type === "AUTOMATED") {
                  return (
                    <VirtualNursingAssistantLogUpdateCard
                      round={item}
                      previousRound={items[items.indexOf(item) + 1]}
                    />
                  );
                }
                return (
                  <DefaultLogUpdateCard
                    round={item}
                    consultationData={consultationData}
                    onViewDetails={() => {
                      if (item.rounds_type === "NORMAL") {
                        navigate(
                          `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${item.id}`
                        );
                      } else {
                        navigate(
                          `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${item.id}`
                        );
                      }
                    }}
                    onUpdateLog={() => {
                      if (item.rounds_type === "NORMAL") {
                        navigate(
                          `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${item.id}/update`
                        );
                      } else {
                        navigate(
                          `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${item.id}/update`
                        );
                      }
                    }}
                  />
                );
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
