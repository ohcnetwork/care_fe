import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import { Card } from "@/components/ui/card";

import routes from "@/Utils/request/api";
import { formatDateTime } from "@/Utils/utils";
import { Encounter } from "@/types/emr/encounter";
import { Observation } from "@/types/emr/observation";

interface Props {
  encounter: Encounter;
}

export default function ObservationsList(props: Props) {
  const { t } = useTranslation();
  const patientId = props.encounter.patient.id;
  const encounterId = props.encounter.id;

  return (
    <PaginatedList
      route={routes.listObservations}
      pathParams={{ patientId }}
      query={{ encounter: encounterId, ignore_group: true }}
    >
      {() => (
        <div className="mt-4 flex w-full flex-col gap-4">
          <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto overflow-x-hidden px-3">
            <PaginatedList.WhenEmpty>
              <Card className="p-6">
                <div className="text-lg font-medium text-muted-foreground">
                  {t("no_observations")}
                </div>
              </Card>
            </PaginatedList.WhenEmpty>

            <PaginatedList.Items<Observation> className="grid gap-4">
              {(item) => (
                <Card
                  key={item.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <div className="text-xs flex items-center gap-1 text-muted-foreground">
                      <CareIcon icon="l-calender" />
                      <span>{formatDateTime(item.effective_datetime)}</span>
                    </div>
                    <div className="font-medium">
                      {item.main_code.display || item.main_code.code}
                    </div>
                    {item.value.value_quantity && (
                      <div className="mt-1 font-medium">
                        {item.value.value_quantity.value}{" "}
                        {item.value.value_quantity.code.display}
                      </div>
                    )}
                    {item.value.value && (
                      <div className="mt-1 font-medium">{item.value.value}</div>
                    )}
                    {item.note && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {item.note}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </PaginatedList.Items>

            <div className="flex w-full items-center justify-center">
              <PaginatedList.Paginator hideIfSinglePage />
            </div>
          </div>
        </div>
      )}
    </PaginatedList>
  );
}
