import { navigate } from "raviger";
import { DailyRoundsModel } from "../../Patient/models";
import VirtualNursingAssistantLogUpdateCard from "./DailyRounds/VirtualNursingAssistantLogUpdateCard";
import DefaultLogUpdateCard from "./DailyRounds/DefaultLogUpdateCard";
import { useTranslation } from "react-i18next";
import LoadingLogUpdateCard from "./DailyRounds/LoadingCard";
import routes from "../../../Redux/api";
import PaginatedList from "../../../CAREUI/misc/PaginatedList";
import PageTitle from "../../Common/PageTitle";
import DailyRoundsFilter from "./DailyRoundsFilter";
import { ConsultationModel } from "../models";
import { useSlugs } from "../../../Common/hooks/useSlug";
import Timeline, { TimelineNode } from "../../../CAREUI/display/Timeline";

interface Props {
  consultation: ConsultationModel;
}

export default function DailyRoundsList({ consultation }: Props) {
  const [facilityId, patientId, consultationId] = useSlugs(
    "facility",
    "patient",
    "consultation"
  );
  const { t } = useTranslation();

  const consultationUrl = `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`;

  return (
    <PaginatedList
      route={routes.getDailyReports}
      pathParams={{ consultationId }}
    >
      {({ refetch }) => (
        <>
          <div className="flex flex-1 justify-between">
            <PageTitle title="Update Log" hideBack breadcrumbs={false} />
            <DailyRoundsFilter onApply={(query) => refetch({ query })} />
          </div>

          <div className="-mt-2 flex w-full flex-col gap-4">
            <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto overflow-x-hidden px-3">
              <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
                <span className="flex justify-center rounded-lg bg-white p-3 text-gray-700  ">
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
              <Timeline
                className="rounded-lg bg-white p-2 shadow"
                name="log update"
              >
                <PaginatedList.Items<DailyRoundsModel> className="flex grow flex-col gap-3">
                  {(item, items) => {
                    if (item.rounds_type === "AUTOMATED") {
                      return (
                        <TimelineNode
                          event={{
                            type: "created",
                            timestamp: item.taken_at?.toString() ?? "",
                            by: {
                              user_type: "",
                              first_name: "Virtual",
                              last_name: "Assistant",
                              username: "",
                              id: "",
                              email: "",
                              last_login: "",
                            },
                            icon: "l-robot",
                          }}
                          isLast={items.indexOf(item) == items.length - 1}
                        >
                          <VirtualNursingAssistantLogUpdateCard
                            round={item}
                            previousRound={items[items.indexOf(item) + 1]}
                          />
                        </TimelineNode>
                      );
                    }

                    const itemUrl =
                      item.rounds_type === "NORMAL"
                        ? `${consultationUrl}/daily-rounds/${item.id}`
                        : `${consultationUrl}/daily_rounds/${item.id}`;

                    return (
                      <TimelineNode
                        event={{
                          type: "created",
                          timestamp: item.taken_at?.toString() ?? "",
                          by: {
                            user_type: item.created_by?.user_type ?? "",
                            first_name: item.created_by?.first_name ?? "",
                            last_name: item.created_by?.last_name ?? "",
                            username: "",
                            id: "",
                            email: "",
                            last_login: "",
                          },
                          icon: "l-user-nurse",
                        }}
                        isLast={items.indexOf(item) == items.length - 1}
                      >
                        <DefaultLogUpdateCard
                          round={item}
                          consultationData={consultation}
                          onViewDetails={() => navigate(itemUrl)}
                          onUpdateLog={() => navigate(`${itemUrl}/update`)}
                        />
                      </TimelineNode>
                    );
                  }}
                </PaginatedList.Items>
              </Timeline>
              <div className="flex w-full items-center justify-center">
                <PaginatedList.Paginator hideIfSinglePage />
              </div>
            </div>
          </div>
        </>
      )}
    </PaginatedList>
  );
}
