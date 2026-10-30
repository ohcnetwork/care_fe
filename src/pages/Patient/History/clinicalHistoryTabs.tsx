import { useTranslation } from "react-i18next";

import { DiagnosticReportsTab } from "@/pages/Encounters/tabs/diagnostic-reports";
import { MedicationHistory } from "@/pages/Patient/History/MedicationHistory";

import { AllergyHistory } from "./AllergyHistory";
import { DiagnosesHistory } from "./DiagnosesHistory";
import { ImmunizationHistory } from "./ImmunizationHistory";
import { ResponsesHistory } from "./ResponsesHistory";
import { SymptomsHistory } from "./SymptomsHistory";

export interface ClinicalHistoryAccess {
  responses: boolean;
  clinicalData: boolean;
}

/**
 * The clinical-history tab map, shared between the standalone
 * ClinicalHistoryPage (URL-driven tabs) and the questionnaire fill page's
 * embedded "Patient Clinical History" tab (local-state tabs). One source
 * so the two surfaces can never drift.
 */
export function useClinicalHistoryTabs({
  patientId,
  facilityId,
  embedded = false,
  access,
}: {
  patientId: string;
  facilityId?: string;
  embedded?: boolean;
  access?: ClinicalHistoryAccess;
}) {
  const { t } = useTranslation();

  return {
    responses: {
      visible: !access || access.responses,
      label: t("responses"),
      component: <ResponsesHistory patientId={patientId} embedded={embedded} />,
    },
    diagnostic_reports: {
      visible: !access || access.clinicalData,
      label: t("diagnostic_report_other", { count: 2 }),
      component: (
        <DiagnosticReportsTab
          patientId={patientId}
          facilityId={facilityId}
          embedded={embedded}
        />
      ),
    },
    symptoms: {
      visible: !access || access.clinicalData,
      label: t("past_symptoms"),
      component: <SymptomsHistory patientId={patientId} />,
    },
    diagnoses: {
      visible: !access || access.clinicalData,
      label: t("past_diagnoses"),
      component: <DiagnosesHistory patientId={patientId} />,
    },
    allergies: {
      visible: !access || access.clinicalData,
      label: t("allergies"),
      component: <AllergyHistory patientId={patientId} />,
    },
    medications: {
      visible: !access || access.clinicalData,
      label: t("past_medications"),
      component: <MedicationHistory patientId={patientId} />,
    },
    immunizations: {
      visible: !access || access.clinicalData,
      label: t("immunizations"),
      component: <ImmunizationHistory patientId={patientId} />,
    },
  } as const;
}

export type ClinicalHistoryTabKey = keyof ReturnType<
  typeof useClinicalHistoryTabs
>;
