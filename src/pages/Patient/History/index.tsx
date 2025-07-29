import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { NavTabs } from "@/components/ui/nav-tabs";
import { Skeleton } from "@/components/ui/skeleton";

import Page from "@/components/Common/Page";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { MedicationHistory } from "@/pages/Patient/History/MedicationHistory";
import patientApi from "@/types/emr/patient/patientApi";

import { AllergyHistory } from "./AllergyHistory";
import { DiagnosesHistory } from "./DiagnosesHistory";
import { SymptomsHistory } from "./SymptomsHistory";

export function ClinicalHistoryPage({
  patientId,
  tab = "symptoms",
  facilityId,
}: {
  facilityId: string;
  patientId: string;
  tab: string;
}) {
  const { t } = useTranslation();
  const [{ sourceUrl }] = useQueryParams();

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: patientId },
    }),
  });

  const handleClose = () => {
    navigate(sourceUrl || `/facility/${facilityId}/patient/${patientId}`);
  };

  const handleTabChange = (value: string) => {
    navigate(`/facility/${facilityId}/patient/${patientId}/history/${value}`, {
      query: { sourceUrl },
    });
  };

  const showMoreAfterIndex = useBreakpoints({
    default: 1,
    xs: 2,
    sm: 6,
    xl: 9,
    "2xl": 12,
  });

  const tabs = {
    symptoms: {
      label: t("past_symptoms"),
      component: <SymptomsHistory patientId={patientId} />,
    },
    diagnoses: {
      label: t("past_diagnoses"),
      component: <DiagnosesHistory patientId={patientId} />,
    },
    allergies: {
      label: t("allergies"),
      component: <AllergyHistory patientId={patientId} />,
    },
    medications: {
      label: t("past_medications"),
      component: <MedicationHistory patientId={patientId} />,
    },
  } as const;

  return (
    <Page
      title={
        patient
          ? t("patient_clinical_history_page_title", { name: patient?.name })
          : t("loading")
      }
      hideTitleOnPage
    >
      <div className="flex justify-between items-center bg-gray-100 -mx-3 -mt-8 md:-mt-8 md:-mx-9 px-3 md:px-6 pb-3 pt-2 md:rounded-t-lg">
        <div>
          {patient ? (
            <h5 className="text-lg font-semibold">
              {t("patient_clinical_history_page_title", { name: patient.name })}
            </h5>
          ) : (
            <Skeleton className="w-20 h-4" />
          )}
        </div>
        <div>
          <Button variant="outline" onClick={handleClose} size="icon">
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <section>
        <NavTabs
          className="w-full mt-4"
          tabContentClassName="mt-8"
          tabs={tabs}
          currentTab={tab}
          onTabChange={handleTabChange}
          setPageTitle={false}
          showMoreAfterIndex={showMoreAfterIndex}
        />
      </section>
    </Page>
  );
}

export default ClinicalHistoryPage;
