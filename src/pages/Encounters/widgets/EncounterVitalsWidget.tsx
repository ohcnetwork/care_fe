import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";
import { VitalsList } from "@/components/Patient/vitals/list";
import { Skeleton } from "@/components/ui/skeleton";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { ObservationPlotConfig } from "@/types/emr/observation/observation";

interface EncounterVitalsWidgetProps {
  title?: string;
  showEmpty?: boolean;
}

export function EncounterVitalsWidget({
  title,
  showEmpty = false,
}: EncounterVitalsWidgetProps) {
  const { t } = useTranslation();
  const { patientId, selectedEncounterId, canReadClinicalData } =
    useEncounter();
  const { data, isLoading, isError, isFetching, refetch } =
    useQuery<ObservationPlotConfig>({
      queryKey: ["plots-config"],
      queryFn: async ({ signal }) => {
        const response = await fetch(careConfig.plotsConfigUrl, { signal });
        if (!response.ok)
          throw new Error("Unable to load vital signs configuration");
        return response.json();
      },
      enabled: canReadClinicalData,
    });

  if (!canReadClinicalData) return null;
  const heading = title ?? t("vitals");
  if (isLoading || isError) {
    return (
      <section aria-label={heading} className="min-w-0">
        <EncounterAccordionLayout title={heading} readOnly presentation="panel">
          {isError ? (
            <ClinicalListError isFetching={isFetching} onRetry={refetch} />
          ) : (
            <Skeleton className="h-24 w-full" />
          )}
        </EncounterAccordionLayout>
      </section>
    );
  }

  return (
    <VitalsList
      patientId={patientId}
      encounterId={selectedEncounterId}
      codeGroups={
        data?.find((plot) => plot.id === "primary-parameters")?.groups ?? []
      }
      title={title}
      showEmpty={showEmpty}
      presentation="panel"
    />
  );
}
