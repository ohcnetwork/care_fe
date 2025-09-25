import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import { cn } from "@/lib/utils";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Separator } from "@/components/ui/separator";

import query from "@/Utils/request/query";
import { formatDateTime, formatName, formatPatientAge } from "@/Utils/utils";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { PatientRead } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { ResponseValue } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";

type PrintAllQuestionnaireResponsesProps = {
  questionnaireId: string;
  patientId: string;
  encounterId?: string;
  facilityId?: string;
};

export function PrintAllQuestionnaireResponses({
  questionnaireId,
  encounterId,
  patientId,
  facilityId,
}: PrintAllQuestionnaireResponsesProps) {
  const { t } = useTranslation();

  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId, facilityId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId! },
      queryParams: { facility: facilityId },
    }),
    enabled: !!encounterId && !!facilityId,
  });

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.getPatient, {
      pathParams: {
        id: patientId,
      },
    }),
    enabled: !(!!encounterId && !!facilityId),
  });

  const { data: questionnaireResponses } = useQuery({
    queryKey: [
      "questionnaire_responses",
      questionnaireId,
      encounterId,
      patientId,
    ],
    queryFn: query(patientApi.getQuestionnaireResponses, {
      queryParams: {
        questionnaire: questionnaireId,
        encounter: encounterId,
        only_unstructured: true,
      },
      pathParams: { patientId },
    }),
  });

  const questionnaire = useMemo(() => {
    return questionnaireResponses?.results?.[0]?.questionnaire;
  }, [questionnaireResponses]);

  return (
    <PrintPreview
      title={t("questionnaire_response_logs")}
      disabled={!questionnaireResponses?.results?.length}
    >
      <div className="md:p-2 max-w-4xl mx-auto">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200">
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain mb-2 sm:mb-0 sm:order-2"
            />
            <div className="text-center sm:text-left sm:order-1">
              <h1 className="text-3xl font-semibold">
                {encounter?.facility?.name ?? patient?.name}
              </h1>
              <h2 className="text-gray-500 uppercase text-sm tracking-wide mt-1 font-semibold">
                {t("questionnaire_response_logs")}
              </h2>
            </div>
          </div>

          <EncounterDetails
            encounter={encounter}
            patient={encounter?.patient ?? patient}
          />

          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200">
            <div className="text-center sm:text-left sm:order-1">
              <h3 className="text-lg font-semibold">{questionnaire?.title}</h3>
              <p className="text-gray-500 text-sm tracking-wide mt-1">
                {questionnaire?.description}
              </p>
            </div>
          </div>

          {questionnaireResponses?.results?.map(
            (item: QuestionnaireResponse) => (
              <div key={item.id} className="w-full">
                <ResponseCard key={item.id} item={item} />
              </div>
            ),
          )}
        </div>
      </div>
    </PrintPreview>
  );
}

const DetailRow = ({
  label,
  value,
  isStrong = false,
}: {
  label: string;
  value?: string | null;
  isStrong?: boolean;
}) => {
  return (
    <div className="flex">
      <span className="text-gray-600 w-32">{label}</span>
      <span className="text-gray-600">: </span>
      <span className={`ml-1 ${isStrong ? "font-semibold" : ""}`}>
        {value || "-"}
      </span>
    </div>
  );
};

interface EncounterDetailsProps {
  encounter?: EncounterRead;
  patient?: PatientRead;
}

export function EncounterDetails({
  encounter,
  patient,
}: EncounterDetailsProps) {
  const { t } = useTranslation();

  if (!patient) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
      <div className="space-y-3">
        <DetailRow label={t("patient")} value={patient.name} isStrong />
        <DetailRow
          label={`${t("age")} / ${t("sex")}`}
          value={
            patient
              ? `${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`
              : undefined
          }
          isStrong
        />
      </div>
      <div className="space-y-3">
        <DetailRow
          label={t("encounter_date")}
          value={
            encounter?.period?.start
              ? format(new Date(encounter.period.start), "dd MMM yyyy, EEEE")
              : t("na")
          }
          isStrong
        />
        <DetailRow
          label={t("mobile_number")}
          value={formatPhoneNumberIntl(patient.phone_number)}
          isStrong
        />
      </div>
    </div>
  );
}

function formatValue(value: ResponseValue["value"], type: string): string {
  if (!value) return "";

  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  ) {
    return JSON.stringify(value);
  }

  switch (type) {
    case "dateTime":
      return formatDateTime(value as string, "hh:mm A; DD/MM/YYYY");
    case "date":
      return formatDateTime(value as string, "DD/MM/YYYY");
    case "decimal":
    case "integer":
    default:
      return value.toString();
  }
}

interface QuestionResponseProps {
  question: Question;
  response?: {
    values: ResponseValue[];
    note?: string;
    question_id: string;
  };
}

function QuestionResponseValue({ question, response }: QuestionResponseProps) {
  if (!response) return null;

  return (
    <div>
      <div className="font-medium text-base">{question.text}</div>
      <div className="space-y-1">
        {response.values.map((valueObj, index) => {
          const value = valueObj.value;
          const coding = valueObj.coding;
          const unit = valueObj.unit;

          if (!value && !coding) return null;

          const precedentUnit = unit ? unit : question.unit;

          return (
            <div
              key={index}
              className="text-sm whitespace-pre-wrap flex items-center gap-2 text-secondary-800"
            >
              {formatValue(value, question.type)}
              {precedentUnit && (
                <span className="ml-1 text-xs">{precedentUnit.code}</span>
              )}
              {coding && (
                <span className="ml-1 text-xs">
                  {coding.display} ({coding.code})
                </span>
              )}
              {index === response.values.length - 1 && response.note && (
                <span className="text-gray-500">({response.note})</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionGroup({
  group,
  responses,
  level = 0,
}: {
  group: Question;
  responses: {
    values: ResponseValue[];
    note?: string;
    question_id: string;
  }[];
  level?: number;
}) {
  const hasResponses = responses.some((r) =>
    group.questions?.some((q) => q.id === r.question_id),
  );

  if (!hasResponses) return null;

  return (
    <div className={cn("space-y-2", group.styling_metadata?.classes)}>
      {!!level && group.text && (
        <div className="flex flex-col space-y-1">
          <h4 className="text-sm font-medium text-secondary-700">
            {group.text}
            {group.code && (
              <span className="ml-1 text-xs text-gray-500">
                ({group.code.display})
              </span>
            )}
          </h4>
          {level === 0 && <Separator className="my-2" />}
        </div>
      )}
      <div
        className={cn("grid gap-2", group.styling_metadata?.containerClasses)}
      >
        {group.questions?.map((question) => {
          if (question.type === "group") {
            return (
              <QuestionGroup
                key={question.id}
                group={question}
                responses={responses}
                level={level + 1}
              />
            );
          }

          if (question.type === "structured") return null;

          const response = responses.find((r) => r.question_id === question.id);
          if (!response) return null;

          return (
            <QuestionResponseValue
              key={question.id}
              question={question}
              response={response}
            />
          );
        })}
      </div>
    </div>
  );
}

interface ResponseCardProps {
  item?: QuestionnaireResponse;
}

export function ResponseCard({ item }: ResponseCardProps) {
  const { t } = useTranslation();

  if (!item) return null;

  const isStructured = !item.questionnaire;
  const structuredType = Object.keys(item.structured_responses || {})[0];

  if (isStructured && structuredType) return null;

  return (
    <div className="flex flex-col py-3 transition-colors">
      <div className="text-sm m-1">
        <p>
          {t("created_by")}: {formatName(item.created_by)}
        </p>
        <p>{formatDateTime(item.created_date)}</p>
      </div>

      <div className="ml-4">
        {item.questionnaire && (
          <div className="mt-4 space-y-4">
            {item.questionnaire?.questions.map((question: Question) => {
              if (question.type === "structured") return null;

              if (question.type === "group") {
                return (
                  <QuestionGroup
                    key={question.id}
                    group={question}
                    responses={item.responses}
                  />
                );
              }

              const response = item.responses.find(
                (r) => r.question_id === question.id,
              );
              if (!response) return null;

              return (
                <QuestionResponseValue
                  key={question.id}
                  question={question}
                  response={response}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
