import { useTranslation } from "react-i18next";

import Timeline, { TimelineNode } from "@/CAREUI/display/Timeline";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import DefaultLogUpdateCard from "@/components/Facility/Consultations/DailyRounds/DefaultLogUpdateCard";
import LoadingLogUpdateCard from "@/components/Facility/Consultations/DailyRounds/LoadingCard";
import VirtualNursingAssistantLogUpdateCard from "@/components/Facility/Consultations/DailyRounds/VirtualNursingAssistantLogUpdateCard";
import { ConsultationModel } from "@/components/Facility/models";
import { DailyRoundsModel } from "@/components/Patient/models";

import { useSlugs } from "@/hooks/useSlug";

import { UserRole } from "@/common/constants";

import routes from "@/Utils/request/api";
import { QueryParams } from "@/Utils/request/types";

interface Props {
  consultation: ConsultationModel;
  query: QueryParams;
}

export default function DailyRoundsList({ consultation, query }: Props) {
  const [consultationId] = useSlugs("consultation");
  const { t } = useTranslation();

  return (
    <PaginatedList
      route={routes.getDailyReports}
      pathParams={{ consultationId }}
      query={query}
    >
      {() => (
        <>
          <div className="mt-4 flex max-h-screen min-h-full w-full flex-col gap-4">
            <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden px-3">
              <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-secondary-200 bg-white p-5 text-center text-2xl font-bold text-secondary-500">
                <span className="flex justify-center rounded-lg bg-white p-3 text-secondary-700">
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
                        />
                      </TimelineNode>
                    );
                  }}
                </PaginatedList.Items>
              </Timeline>
            </div>
            <div className="flex w-full items-center justify-center">
              <PaginatedList.Paginator hideIfSinglePage />
            </div>
          </div>
        </>
      )}
    </PaginatedList>
  );
}
