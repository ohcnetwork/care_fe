import { navigate } from "raviger";
import { DailyRoundsModel } from "../../Patient/models";
import VirtualNursingAssistantLogUpdateCard from "./DailyRounds/VirtualNursingAssistantLogUpdateCard";
import DefaultLogUpdateCard from "./DailyRounds/DefaultLogUpdateCard";
import { useTranslation } from "react-i18next";
import LoadingLogUpdateCard from "./DailyRounds/LoadingCard";
import routes from "../../../Redux/api";
import PaginatedList from "../../../CAREUI/misc/PaginatedList";
import DailyRoundsFilter from "./DailyRoundsFilter";
import { ConsultationModel } from "../models";
import { useSlugs } from "../../../Common/hooks/useSlug";

import Timeline, { TimelineNode } from "../../../CAREUI/display/Timeline";
import { useState } from "react";
import { QueryParams } from "../../../Utils/request/types";
import { UserRole } from "../../../Common/constants";

interface Props {
  consultation: ConsultationModel;
}

export default function DailyRoundsList({ consultation }: Props) {
  const [consultationId] = useSlugs("consultation");
  const { t } = useTranslation();
  const [query, setQuery] = useState<QueryParams>();

  const consultationUrl = `/facility/${consultation.facility}/patient/${consultation.patient}/consultation/${consultation.id}`;

  return (
    <PaginatedList
      route={routes.getDailyReports}
      pathParams={{ consultationId }}
      query={query}
    >
      {() => (
        <>
          <div className="m-1 flex flex-1 justify-end">
            <DailyRoundsFilter
              onApply={(query) => {
                setQuery(query);
              }}
            />
          </div>

          <div className="flex w-full flex-col gap-4">
            <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto overflow-x-hidden px-3">
              <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-gray-200 bg-white p-5 text-center text-2xl font-bold text-gray-500">
                <span className="flex justify-center rounded-lg bg-white p-3 text-gray-700  ">
                  {t("no_consultation_updates")}
                </span>
              </PaginatedList.WhenEmpty>
              <PaginatedList.WhenLoading>
                <LoadingLogUpdateCard />
              </PaginatedList.WhenLoading>
              <Timeline name="log update">
                <PaginatedList.Items<DailyRoundsModel> className="flex grow flex-col gap-3 rounded-lg bg-white p-2 shadow">
                  {(item, items) => {
                    if (item.rounds_type === "AUTOMATED") {
                      return (
                        <TimelineNode
                          event={{
                            type: "created",
                            timestamp: item.taken_at?.toString() ?? "",
                            by: {
                              user_type:
                                "Virtual Nursing Assistant" as UserRole,
                              first_name: "Virtual",
                              last_name: "Assistant",
                              username: "",
                              id: -1,
                              email: "",
                              last_login: new Date().toISOString(),
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

                    const itemUrl = ["NORMAL", "TELEMEDICINE"].includes(
                      item.rounds_type as string
                    )
                      ? `${consultationUrl}/daily-rounds/${item.id}`
                      : `${consultationUrl}/daily_rounds/${item.id}`;

                    return (
                      <TimelineNode
                        event={{
                          type: "created",
                          timestamp: item.taken_at?.toString() ?? "",
                          by: item.created_by,
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
