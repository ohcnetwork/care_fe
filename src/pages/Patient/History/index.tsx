import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import Page from "@/components/Common/Page";

import { ClinicalHistoryWorkspace } from "@/components/Workspace/ClinicalHistoryWorkspace";

import { navigateBackFrom } from "@/Utils/navigationTrail";
import query from "@/Utils/request/query";
import { navigate } from "@/lib/router/navigate";
import { useQueryParams } from "@/lib/router/queryParams";
import { clinicalHistoryPageSearch } from "@/lib/router/search/patient";
import patientApi from "@/types/emr/patient/patientApi";

import { Separator } from "@/components/ui/separator";

function ClinicalHistoryPage({
  patientId,
  facilityId,
  tab = "symptoms",
  fallBackUrl,
}: {
  fallBackUrl: string;
  facilityId?: string;
  patientId: string;
  tab: string;
}) {
  const { t } = useTranslation();
  const [{ sourceUrl }] = useQueryParams(clinicalHistoryPageSearch);

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId, facilityId],
    queryFn: query(patientApi.get, {
      pathParams: { id: patientId },
      queryParams: { facility: facilityId },
    }),
  });

  const backLabel = sourceUrl ? t("back_to_encounter") : t("back_to_patient");

  // Tab changes add history entries; leave to the page this was opened from.
  const handleClose = () => {
    navigateBackFrom(
      (pathname) => !pathname.includes(`/patient/${patientId}/history/`),
      sourceUrl || fallBackUrl,
    );
  };

  const handleTabChange = (value: string) => {
    navigate({
      href: sourceUrl
        ? `${value}?${new URLSearchParams({ sourceUrl })}`
        : value,
    });
  };

  return (
    <Page
      title={
        patient
          ? t("patient_clinical_history_page_title", { name: patient?.name })
          : t("loading")
      }
      hideTitleOnPage
    >
      <div className="flex justify-between items-center bg-gray-100 -mx-3 -mt-3 md:-mx-8 px-3 md:px-6 pb-3 pt-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={handleClose}
              size="icon"
              aria-label={backLabel}
            >
              <ArrowLeftIcon />
            </Button>
            <span className="text-sm text-gray-700" aria-hidden="true">
              {backLabel}
            </span>
          </div>
          <Separator orientation="vertical" />
          <div className="min-w-0">
            {patient ? (
              <h5 className="text-lg font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                {t("patient_clinical_history_page_title", {
                  name: patient.name,
                })}
              </h5>
            ) : (
              <Skeleton className="w-20 h-4" />
            )}
          </div>
        </div>
        <div className="shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            size="icon"
            aria-label={t("close")}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <section>
        <ClinicalHistoryWorkspace
          patientId={patientId}
          facilityId={facilityId}
          currentTab={tab}
          onTabChange={handleTabChange}
        />
      </section>
    </Page>
  );
}

export default ClinicalHistoryPage;
