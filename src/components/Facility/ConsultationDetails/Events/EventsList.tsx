import { useTranslation } from "react-i18next";

import { TimelineNode } from "@/CAREUI/display/Timeline";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import GenericEvent from "@/components/Facility/ConsultationDetails/Events/GenericEvent";
import { getEventIcon } from "@/components/Facility/ConsultationDetails/Events/iconMap";
import { EventGeneric } from "@/components/Facility/ConsultationDetails/Events/types";
import LoadingLogUpdateCard from "@/components/Facility/Consultations/DailyRounds/LoadingCard";

import { useSlugs } from "@/hooks/useSlug";

import routes from "@/Utils/request/api";
import { QueryParams } from "@/Utils/request/types";

export default function EventsList({ query }: { query: QueryParams }) {
  const [consultationId] = useSlugs("consultation");
  const { t } = useTranslation();

  return (
    <PaginatedList
      route={routes.getEvents}
      pathParams={{ consultationId }}
      query={query}
    >
      {() => (
        <>
          <div className="mt-4 flex w-full flex-col gap-4">
            <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto overflow-x-hidden px-3">
              <PaginatedList.WhenEmpty className="flex w-full justify-center border-b border-secondary-200 bg-white p-5 text-center text-2xl font-bold text-secondary-500">
                <span className="flex justify-center rounded-lg bg-white p-3 text-secondary-700">
                  {t("no_consultation_updates")}
                </span>
              </PaginatedList.WhenEmpty>
              <PaginatedList.WhenLoading>
                <LoadingLogUpdateCard />
              </PaginatedList.WhenLoading>
              <PaginatedList.Items<EventGeneric> className="flex grow flex-col gap-3">
                {(item, items) => (
                  <TimelineNode
                    name={
                      t(item.event_type.name.toLowerCase()).replaceAll(
                        /_/g,
                        " ",
                      ) + " Event"
                    }
                    event={{
                      type: item.change_type.replace(/_/g, " ").toLowerCase(),
                      timestamp: item.created_date?.toString() ?? "",
                      by: item.caused_by,
                      icon: getEventIcon(item.event_type.name),
                    }}
                    isLast={items.indexOf(item) == items.length - 1}
                  >
                    {(() => {
                      const entries = Object.entries(item.value).filter(
                        ([_, value]) => value != null && value !== "",
                      );

                      if (entries.length === 0) {
                        return (
                          <div className="flex w-full flex-col items-center gap-2 md:flex-row">
                            <span className="text-xs uppercase text-secondary-700">
                              {t("no_changes")}
                            </span>
                          </div>
                        );
                      }

                      const values = Object.fromEntries(entries);
                      if (
                        values.ventilator_interface === "INVASIVE" ||
                        values.ventilator_interface === "NON_INVASIVE"
                      ) {
                        values.ventilator_interface += " VENTILATOR";
                      }

                      switch (item.event_type.name) {
                        case "INTERNAL_TRANSFER":
                        case "CLINICAL":
                        case "DIAGNOSIS":
                        case "ENCOUNTER_SUMMARY":
                        case "HEALTH":
                        default:
                          return <GenericEvent values={values} />;
                      }
                    })()}
                  </TimelineNode>
                )}
              </PaginatedList.Items>
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
