import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { QuestionnaireForm } from "@/components/Questionnaire/QuestionnaireForm";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { conditionalObject } from "@/Utils/utils";

interface Props {
  facilityId: string;
  patientId: string;
  consultationId?: string;
  questionnaireSlug?: string;
  subjectType?: string;
}

export default function EncounterQuestionnaire({
  facilityId,
  patientId,
  consultationId,
  questionnaireSlug,
  subjectType,
}: Props) {
  const {
    data: consultation,
    loading,
    error,
  } = useQuery(routes.getConsultation, {
    pathParams: { id: consultationId || "" },
    prefetch: consultationId ? true : false,
  });

  const { data: patient } = useQuery(routes.getPatient, {
    pathParams: { id: patientId },
  });

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load consultation details. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Page
      title="Questionnaire"
      crumbsReplacements={{
        [facilityId]: { name: patient?.facility_object?.name },
        [patientId]: { name: patient?.name },
        ...conditionalObject(consultationId, {
          consultation: {
            name: "Consultation",
            uri: `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`,
          },
          [consultationId as string]: {
            name: consultation?.encounter_date
              ? `Admitted on ${consultation.encounter_date}`
              : consultation?.suggestion_text,
          },
        }),
      }}
      backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`}
    >
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <QuestionnaireForm
              patientId={patientId}
              subjectType={subjectType}
              encounterId={consultationId}
              questionnaireSlug={questionnaireSlug}
            />
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
