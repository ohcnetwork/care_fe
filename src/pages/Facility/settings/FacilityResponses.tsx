import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PageHeadTitle from "@/components/Common/PageHeadTitle";
import { ResourceFormPicker } from "@/components/Questionnaire/ResourceFormPicker";
import { ResourceResponses } from "@/components/Questionnaire/ResourceResponses/ResourceResponses";

import query from "@/Utils/request/query";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import facilityApi from "@/types/facility/facilityApi";

interface FacilityResponsesProps {
  facilityId: string;
}

export function FacilityResponses({ facilityId }: FacilityResponsesProps) {
  const { t } = useTranslation();
  useShortcutSubContext(undefined);
  const facilityQuery = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId },
    }),
  });

  return (
    <div className="min-w-0 space-y-6 text-neutral-950">
      <PageHeadTitle title={t("responses")} />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl leading-9 font-bold tracking-tight">
          {t("responses")}
        </h1>
        <ResourceFormPicker
          facilityId={facilityId}
          subjectType="facility"
          subjectId={facilityId}
          disabled={!facilityQuery.data || facilityQuery.isError}
        />
      </header>
      <ResourceResponses
        facilityId={facilityId}
        subjectType="facility"
        subjectId={facilityId}
        contextHref={`/facility/${facilityId}/settings/general`}
      />
    </div>
  );
}
