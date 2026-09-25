import { useQuery } from "@tanstack/react-query";

import { FIXED_QUESTIONNAIRES } from "@/components/Questionnaire/data/StructuredFormData";
import {
  formSubmissionKeys,
  questionnaireKeys,
} from "@/components/QuestionnaireV2/queryKeys";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";
import formSubmissionApi from "@/types/questionnaire/formSubmissionApi";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import query from "@/Utils/request/query";

import { isPatientBound, type FillSubject } from "./subject";

interface FillPageQueriesOptions {
  subject: FillSubject;
  questionnaireId?: string;
  continueDraftId?: string;
}

/** Route data only. The loaded session keeps its own creation-time form seeds. */
export function useFillPageQueries({
  subject,
  questionnaireId,
  continueDraftId,
}: FillPageQueriesOptions) {
  const patientBound = isPatientBound(subject) ? subject : undefined;
  const fixedQuestionnaire = questionnaireId
    ? FIXED_QUESTIONNAIRES[questionnaireId]
    : undefined;

  const questionnaireQuery = useQuery({
    queryKey: questionnaireKeys.detail(questionnaireId ?? ""),
    queryFn: query(questionnaireApi.get, {
      pathParams: { id: questionnaireId ?? "" },
    }),
    enabled: !!questionnaireId && !fixedQuestionnaire,
  });

  const encounterId =
    subject.type === "encounter" ? subject.encounterId : undefined;
  const encounterQuery = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId ?? "" },
      queryParams: {
        facility: subject.type === "encounter" ? subject.facilityId : "",
      },
    }),
    enabled: !!encounterId,
  });

  // Patient-subject fills have no encounter to borrow the patient from;
  // resource subjects have no patient at all.
  const patientQuery = useQuery({
    queryKey: ["patient", patientBound?.patientId],
    queryFn: query(patientApi.get, {
      pathParams: { id: patientBound?.patientId ?? "" },
    }),
    enabled: subject.type === "patient",
  });

  const serverDraftQuery = useQuery({
    queryKey: formSubmissionKeys.detail(continueDraftId),
    queryFn: query(formSubmissionApi.get, {
      pathParams: { external_id: continueDraftId ?? "" },
    }),
    enabled: !!continueDraftId,
  });

  const questionnaire = fixedQuestionnaire ?? questionnaireQuery.data;
  const encounter = encounterQuery.data;
  const patient = encounter?.patient ?? patientQuery.data;
  const failedQueries = [
    !fixedQuestionnaire && questionnaireId ? questionnaireQuery : undefined,
    encounterId ? encounterQuery : undefined,
    subject.type === "patient" ? patientQuery : undefined,
    continueDraftId ? serverDraftQuery : undefined,
  ].filter((result) => result?.isError);

  // A refetch error retains same-key cached data. Keep the session mounted
  // and its answer stores intact, but require successful context refresh
  // before either server save. An ordinary background fetch stays editable.
  const retryContext = () => {
    for (const result of failedQueries) void result?.refetch();
  };

  return {
    questionnaire,
    encounter,
    encounterId,
    patient,
    serverDraft: serverDraftQuery.data,
    // Initial loading/failure may replace the page; a refresh may not.
    isQuestionnaireLoading: questionnaireQuery.isLoading,
    isQuestionnaireError:
      questionnaireQuery.isError && !questionnaireQuery.data,
    isEncounterLoading: encounterQuery.isLoading,
    isEncounterError: encounterQuery.isError && !encounterQuery.data,
    isPatientError: patientQuery.isError && !patientQuery.data,
    isServerDraftLoading: serverDraftQuery.isLoading,
    isServerDraftError: serverDraftQuery.isError && !serverDraftQuery.data,
    contextRefreshFailed: failedQueries.length > 0,
    isRetryingContext: failedQueries.some((result) => result?.isFetching),
    retryContext,
  };
}
