import { useTranslation } from "react-i18next";

import { DiagnosticReportsTab } from "@/pages/Encounters/tabs/diagnostic-reports";
import { MedicationHistory } from "@/pages/Patient/History/MedicationHistory";

import { AllergyHistory } from "./AllergyHistory";
import { DiagnosesHistory } from "./DiagnosesHistory";
import { ResponsesHistory } from "./ResponsesHistory";
import { SymptomsHistory } from "./SymptomsHistory";

/**
 * The clinical-history tab map, shared between the standalone
 * ClinicalHistoryPage (URL-driven tabs) and the questionnaire fill page's
 * embedded "Patient Clinical History" tab (local-state tabs). One source
 * so the two surfaces can never drift.
 */
export function useClinicalHistoryTabs({
  patientId,
  facilityId,
}: {
  patientId: string;
  facilityId?: string;
}) {
  const { t } = useTranslation();

  return {
    responses: {
      label: t("responses"),
      component: <ResponsesHistory patientId={patientId} />,
    },
    diagnostic_reports: {
      label: t("diagnostic_report_other", { count: 2 }),
      component: (
        <DiagnosticReportsTab patientId={patientId} facilityId={facilityId} />
      ),
    },
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
}

export type ClinicalHistoryTabKey = keyof ReturnType<
  typeof useClinicalHistoryTabs
>;
