import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import {
  type EncounterEditRequest,
  type EncounterStatus,
} from "@/types/emr/encounter";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface EncounterQuestionProps {
  question: Question;
  encounterId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  clearError: () => void;
  organizations?: string[];
  patientId?: string;
  facilityId: string;
}

export function EncounterQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  organizations = [],
  encounterId,
  patientId = "",
  facilityId,
}: EncounterQuestionProps) {
  const { data: encounterData, isLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(routes.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
    enabled: !!encounterId,
  });

  const { t } = useTranslation();

  const [encounter, setEncounter] = useState<EncounterEditRequest>({
    status: "unknown" as EncounterStatus,
    encounter_class: "amb",
    period: {
      start: new Date().toISOString(),
      end: undefined,
    },
    priority: "routine",
    external_identifier: "",
    hospitalization: {
      re_admission: false,
      admit_source: "other",
      discharge_disposition: "home",
      diet_preference: "none",
    },
    facility: "",
    patient: "",
    organizations: [],
    discharge_summary_advice: "",
  });

  useEffect(() => {
    if (encounterData) {
      handleUpdateEncounter(encounterData as unknown as EncounterEditRequest);
    }
  }, [encounterData]);

  useEffect(() => {
    const formStateValue = (questionnaireResponse.values[0]?.value as any)?.[0];
    if (formStateValue) {
      setEncounter(() => ({
        ...formStateValue,
      }));
    }
  }, [questionnaireResponse]);

  const handleUpdateEncounter = (
    updates: Partial<Omit<EncounterEditRequest, "organizations" | "patient">>,
  ) => {
    clearError();
    const newEncounter = { ...encounter, ...updates };

    const encounterRequest: EncounterEditRequest = {
      ...newEncounter,
      organizations,
      patient: patientId,
    };

    const responseValue: ResponseValue = {
      type: "encounter",
      value: [encounterRequest],
    };

    updateQuestionnaireResponseCB(
      [responseValue],
      questionnaireResponse.question_id,
    );
  };

  if (isLoading) {
    return <div>{t("loading_encounter")}</div>;
  }

  // ✅ Console log to verify state in DevTools
  console.log(
    "Current discharge summary advice:",
    encounter.discharge_summary_advice,
  );

  return (
    <div className="space-y-6">
      {/* ✅ Discharge Summary Advice Section */}
      <div className="space-y-2">
        <Label>{t("discharge_summary_advice")}</Label>
        <Textarea
          value={encounter.discharge_summary_advice || ""}
          onChange={(e) => {
            handleUpdateEncounter({
              discharge_summary_advice: e.target.value || null,
            });
          }}
          disabled={disabled}
          placeholder={t("enter_discharge_summary_advice")}
        />
      </div>
    </div>
  );
}
