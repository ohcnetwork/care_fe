import { camelCase, capitalize, startCase } from "lodash-es";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import Card from "@/CAREUI/display/Card";

import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader } from "@/components/ui/card";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { FileUpload } from "@/components/Files/FileUpload";
import { FlowModel } from "@/components/Patient/models";

import { GENDER_TYPES, TEST_TYPE_CHOICES } from "@/common/constants";

import { DetailRoute } from "@/Routers/types";
import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { formatDateTime, formatPatientAge } from "@/Utils/utils";

export const SampleDetails = ({ id }: DetailRoute) => {
  const { t } = useTranslation();
  const { loading: isLoading, data: sampleDetails } = useQuery(
    routes.getTestSample,
    {
      pathParams: {
        id,
      },
      onResponse: ({ res, data }) => {
        if (!(res?.ok && data)) {
          navigate("/not-found");
        }
      },
    },
  );

  const yesOrNoBadge = (param: any) =>
    param ? (
      <span className="badge badge-pill badge-warning">{t("yes")}</span>
    ) : (
      <span className="badge badge-pill badge-secondary">{t("no")}</span>
    );

  const showPatientCard = (patientData: any) => {
    const patientGender = GENDER_TYPES.find(
      (i) => i.id === patientData?.gender,
    )?.text;
    const testType = TEST_TYPE_CHOICES.find(
      (i) => i.id === patientData?.test_type,
    )?.text;

    return (
      <div className="mr-3 mt-2 h-full rounded-lg border bg-white p-4 text-black shadow md:mr-8">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="mt-2 flex flex-col gap-2">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("name")}:{" "}
              </span>
              {patientData?.name}
            </div>
            {patientData?.is_medical_worker && (
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("medical_worker")}:{" "}
                </span>
                <span className="badge badge-pill badge-primary">
                  {t("yes")}
                </span>
              </div>
            )}
            <div>
              <span className="font-semibold leading-relaxed">
                {t("disease_status")}:{" "}
              </span>
              <span className="badge badge-pill badge-warning">
                {patientData?.disease_status}
              </span>
            </div>

            <div>
              <span className="font-semibold leading-relaxed">
                {t("srf_id")}:{" "}
              </span>
              {(patientData?.srf_id && patientData?.srf_id) || "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {t("test_type")}:{" "}
              </span>
              {(patientData?.test_type && testType) || "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {t("date_of_test")}:{" "}
              </span>
              {(patientData?.date_of_test &&
                formatDateTime(patientData?.date_of_test)) ||
                "-"}
            </div>

            <div>
              <span className="font-semibold leading-relaxed">
                {t("facility")}:{" "}
              </span>
              {patientData?.facility_object?.name || "-"}
            </div>
            {patientData?.date_of_birth ? (
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("date_of_birth")}:{" "}
                </span>
                {patientData?.date_of_birth}
              </div>
            ) : (
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("age")}:{" "}
                </span>
                {formatPatientAge(patientData)}
              </div>
            )}
            <div>
              <span className="font-semibold leading-relaxed">
                {t("gender")}:{" "}
              </span>
              {patientGender}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {t("phone")}:{" "}
              </span>
              <a href={`tel:${patientData?.phone_number}`}>
                {patientData?.phone_number || "-"}
              </a>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {t("nationality")}:{" "}
              </span>
              {patientData?.nationality || "-"}
            </div>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <div>
              <span className="font-semibold leading-relaxed">
                {t("blood_group")}:{" "}
              </span>
              {patientData?.blood_group || "-"}
            </div>
            {patientData?.nationality !== "India" && (
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("passport_number")}:{" "}
                </span>
                {patientData?.passport_no || "-"}
              </div>
            )}
            {patientData?.nationality === "India" && (
              <>
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("state")}:{" "}
                  </span>
                  {patientData?.state_object?.name}
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("district")}:{" "}
                  </span>
                  {patientData?.district_object?.name || "-"}
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    {t("local_body")}:{" "}
                  </span>
                  {patientData?.local_body_object?.name || "-"}
                </div>
              </>
            )}
            <div>
              <span className="font-semibold leading-relaxed">
                {t("address")}:{" "}
              </span>
              {patientData?.address || "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {t("contact_with_confirmed_carrier")}:{" "}
              </span>
              {yesOrNoBadge(patientData?.contact_with_confirmed_carrier)}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                {t("contact_with_suspected_carrier")}:{" "}
              </span>
              {yesOrNoBadge(patientData?.contact_with_suspected_carrier)}
            </div>
            {patientData?.estimated_contact_date && (
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("estimated_contact_date")}:{" "}
                </span>
                {formatDateTime(patientData?.estimated_contact_date)}
              </div>
            )}
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">
                {t("has_sari")}:{" "}
              </span>
              {yesOrNoBadge(patientData?.has_SARI)}
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">
                {t("domestic_international_travel")}:{" "}
              </span>
              {yesOrNoBadge(patientData?.past_travel)}
            </div>
            {patientData?.countries_travelled &&
              !!patientData?.countries_travelled.length && (
                <div className="md:col-span-2">
                  <span className="font-semibold leading-relaxed">
                    {t("countries_travelled")}:{" "}
                  </span>
                  {patientData?.countries_travelled.join(", ")}
                </div>
              )}
            {patientData?.ongoing_medication && (
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  {t("ongoing_medications")}{" "}
                </span>
                {patientData?.ongoing_medication}
              </div>
            )}
            {patientData?.allergies && (
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  {t("allergies")}:{" "}
                </span>
                {patientData?.allergies}
              </div>
            )}
            {!!patientData?.number_of_aged_dependents && (
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("number_of_aged_dependents")}:{" "}
                </span>
                {patientData?.number_of_aged_dependents}
              </div>
            )}
            {!!patientData?.number_of_chronic_diseased_dependents && (
              <div>
                <span className="font-semibold leading-relaxed">
                  {t("number_of_chronic_diseased_dependents")}:{" "}
                </span>
                {patientData?.number_of_chronic_diseased_dependents}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFlow = (flow: FlowModel) => {
    return (
      <Card key={flow.id}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="font-semibold leading-relaxed">
              {t("status")}:{" "}
            </span>{" "}
            {startCase(camelCase(flow.status))}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">{t("label")}:</span>{" "}
            {capitalize(flow.notes)}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              {t("created_on")}:
            </span>{" "}
            {flow.created_date ? formatDateTime(flow.created_date) : "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              {t("modified_on")}:
            </span>{" "}
            {flow.modified_date ? formatDateTime(flow.modified_date) : "-"}
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading || !sampleDetails) {
    return <Loading />;
  }

  return (
    <Page
      title={t("sample_test_details")}
      backUrl="/sample"
      options={
        sampleDetails?.patient && (
          <div className="my-2 flex justify-center md:justify-end">
            <ButtonV2
              href={`/patient/${sampleDetails.patient}/test_sample/${id}/icmr_sample`}
            >
              {t("icmr_specimen_referral_form")}
            </ButtonV2>
          </div>
        )
      }
    >
      <Card className="my-2">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1 flex gap-2 items-center">
              <div className="text-sm text-muted-foreground">Status:</div>
              <Badge variant="outline" className="font-semibold">
                {sampleDetails?.status}
              </Badge>
            </div>
            <div className="space-y-1 sm:text-right flex gap-2 items-center ">
              <div className="text-sm text-muted-foreground">Result:</div>
              <Badge variant="secondary" className="font-semibold">
                {sampleDetails?.result}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Patient:</div>
              <div className="font-medium">{sampleDetails?.patient_name}</div>
            </div>
            {sampleDetails?.facility_object && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Facility:</div>
                <div className="font-medium">
                  {sampleDetails?.facility_object.name}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Tested on:</div>
              <div className="font-medium">
                {sampleDetails?.date_of_result
                  ? formatDateTime(sampleDetails.date_of_result)
                  : "-"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Result on:</div>
              <div className="font-medium">
                {sampleDetails?.date_of_result
                  ? formatDateTime(sampleDetails.date_of_result)
                  : "-"}
              </div>
            </div>
          </div>

          {sampleDetails?.doctor_name && (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Doctor&apos;s Name:
              </div>
              <div className="font-medium">
                {startCase(camelCase(sampleDetails.doctor_name))}
              </div>
            </div>
          )}
          <div className="border-t border-gray-300 my-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleDetails?.fast_track && (
              <div className="flex justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg">
                <div className="font-medium text-sm">
                  Fast track testing reason:{" "}
                </div>
                <Badge variant={"secondary"}>{sampleDetails.fast_track}</Badge>
              </div>
            )}
            {sampleDetails?.diagnosis && (
              <div className="flex justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg">
                <div className="font-medium text-sm">Diagnosis: </div>
                <Badge variant={"secondary"}> {sampleDetails.diagnosis}</Badge>
              </div>
            )}
            {sampleDetails?.diff_diagnosis && (
              <div className="flex justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg">
                <div className="font-medium text-sm">
                  Differential diagnosis:{" "}
                </div>
                <Badge variant={"secondary"}>
                  {" "}
                  {sampleDetails?.diff_diagnosis}
                </Badge>
              </div>
            )}
            {sampleDetails?.etiology_identified && (
              <div className="flex justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg">
                <div className="font-medium text-sm">Etiology identified: </div>
                <Badge variant={"secondary"}>
                  {" "}
                  {sampleDetails.etiology_identified}
                </Badge>
              </div>
            )}
            <div className="flex justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg">
              <div className="font-medium text-sm">
                Is Atypical presentation{" "}
              </div>
              <Badge variant={"secondary"}>
                {" "}
                {yesOrNoBadge(sampleDetails?.is_atypical_presentation)}
              </Badge>
            </div>
            <div className="flex justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg">
              <div className="font-medium text-sm">Is unusual course </div>
              <Badge variant={"secondary"}>
                {" "}
                {yesOrNoBadge(sampleDetails?.is_unusual_course)}
              </Badge>
            </div>
            {sampleDetails?.atypical_presentation && (
              <div className="flex justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg">
                <div className="font-medium text-sm">
                  Atypical presentation details:{" "}
                </div>
                <Badge variant={"secondary"}>
                  {" "}
                  {sampleDetails.atypical_presentation}
                </Badge>
              </div>
            )}
            <div className="flex justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg">
              <div className="font-medium text-sm">
                SARI - Severe Acute Respiratory illness{" "}
              </div>
              <Badge variant={"secondary"}>
                {" "}
                {yesOrNoBadge(sampleDetails?.has_sari)}
              </Badge>
            </div>
            <div className="flex justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg">
              <div className="font-medium text-sm">
                ARI - Acute Respiratory illness{" "}
              </div>
              <Badge variant={"secondary"}>
                {" "}
                {yesOrNoBadge(sampleDetails?.has_ari)}
              </Badge>
            </div>
            <div className="flex justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg">
              <div className="font-medium text-sm">
                Contact with confirmed carrier{" "}
              </div>
              <Badge variant={"secondary"}>
                {" "}
                {yesOrNoBadge(sampleDetails?.patient_has_confirmed_contact)}
              </Badge>
            </div>
            <div className="flex justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg">
              <div className="font-medium text-sm">
                Contact with suspected carrier{" "}
              </div>
              <Badge variant={"secondary"}>
                {" "}
                {yesOrNoBadge(sampleDetails?.patient_has_suspected_contact)}
              </Badge>
            </div>
            {sampleDetails?.patient_travel_history &&
              sampleDetails.patient_travel_history.length !== 0 && (
                <div className="flex justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg">
                  <div className="font-medium text-sm">
                    Countries travelled:{" "}
                  </div>
                  <Badge variant={"secondary"}>
                    {" "}
                    {sampleDetails.patient_travel_history}
                  </Badge>
                </div>
              )}
          </div>
          <div className="border-t border-gray-300 my-4"></div>
          {sampleDetails?.sample_type && (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Sample Type:</div>
              <div className="font-medium">
                {" "}
                {startCase(camelCase(sampleDetails.sample_type))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h4 className="mt-8">{t("details_of_patient")}</h4>
        {showPatientCard(sampleDetails?.patient_object)}
      </div>

      <div className="mb-4">
        <h4 className="mt-8">{t("sample_test_history")}</h4>
        {sampleDetails?.flow &&
          sampleDetails.flow.map((flow: FlowModel) => (
            <div key={flow.id} className="mb-2">
              {renderFlow(flow)}
            </div>
          ))}
      </div>

      <FileUpload
        sampleId={id}
        patientId=""
        consultationId=""
        type="SAMPLE_MANAGEMENT"
        allowAudio={true}
      />
    </Page>
  );
};
