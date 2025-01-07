import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import PaginatedList from "@/CAREUI/misc/PaginatedList";

import { Button } from "@/components/ui/button";

import CircularProgress from "@/components/Common/CircularProgress";
import { EncounterCard } from "@/components/Facility/EncounterCard";
import { PatientProps } from "@/components/Patient/PatientDetailsTab";

import routes from "@/Utils/request/api";
import { Encounter } from "@/types/emr/encounter";

const EncounterHistory = (props: PatientProps) => {
  const { id, facilityId } = props;

  const { t } = useTranslation();

  return (
    <PaginatedList
      route={routes.encounter.list}
      query={{ patient: id }}
      perPage={5}
    >
      {() => (
        <div className="mt-8">
          <PaginatedList.WhenLoading>
            <CircularProgress />
          </PaginatedList.WhenLoading>
          <PaginatedList.WhenEmpty className="py-2">
            <div className="h-full space-y-2 rounded-lg bg-white px-7 py-12 border border-secondary-300">
              <div className="flex w-full items-center justify-center text-lg text-secondary-600">
                {t("no_consultation_history")}
              </div>
              <div className="flex w-full items-center justify-center pt-4">
                <Button variant="outline_primary" asChild>
                  <Link
                    href={`/facility/${facilityId}/patient/${id}/consultation`}
                  >
                    <span className="flex w-full items-center justify-start gap-2">
                      <CareIcon icon="l-chat-bubble-user" className="text-xl" />
                      {t("add_consultation")}
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          </PaginatedList.WhenEmpty>
          <PaginatedList.Items<Encounter>>
            {(encounter) => <EncounterCard encounter={encounter} />}
          </PaginatedList.Items>
          <div className="flex w-full items-center justify-center">
            <PaginatedList.Paginator hideIfSinglePage />
          </div>
        </div>
      )}
    </PaginatedList>
  );
};

export default EncounterHistory;
