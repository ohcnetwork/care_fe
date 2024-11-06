import { FlowModel } from "./models";
import { GENDER_TYPES, TEST_TYPE_CHOICES } from "@/common/constants";

import ButtonV2 from "@/components/Common/components/ButtonV2";
import Card from "../../CAREUI/display/Card";
import { FileUpload } from "../Files/FileUpload";
import Page from "@/components/Common/components/Page";
import { startCase, camelCase, capitalize } from "lodash-es";
import { formatDateTime, formatPatientAge } from "../../Utils/utils";

import { navigate } from "raviger";
import { DetailRoute } from "../../Routers/types";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";

import Loading from "@/components/Common/Loading";
export const SampleDetails = ({ id }: DetailRoute) => {
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
      <span className="badge badge-pill badge-warning">Yes</span>
    ) : (
      <span className="badge badge-pill badge-secondary">No</span>
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
              <span className="font-semibold leading-relaxed">Name: </span>
              {patientData?.name}
            </div>
            {patientData?.is_medical_worker && (
              <div>
                <span className="font-semibold leading-relaxed">
                  Medical Worker:{" "}
                </span>
                <span className="badge badge-pill badge-primary">Yes</span>
              </div>
            )}
            <div>
              <span className="font-semibold leading-relaxed">
                Disease Status:{" "}
              </span>
              <span className="badge badge-pill badge-warning">
                {patientData?.disease_status}
              </span>
            </div>

            <div>
              <span className="font-semibold leading-relaxed">SRF ID: </span>
              {(patientData?.srf_id && patientData?.srf_id) || "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Test Type: </span>
              {(patientData?.test_type && testType) || "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of Test:{" "}
              </span>
              {(patientData?.date_of_test &&
                formatDateTime(patientData?.date_of_test)) ||
                "-"}
            </div>

            <div>
              <span className="font-semibold leading-relaxed">Facility: </span>
              {patientData?.facility_object?.name || "-"}
            </div>
            {patientData?.date_of_birth ? (
              <div>
                <span className="font-semibold leading-relaxed">
                  Date of birth:{" "}
                </span>
                {patientData?.date_of_birth}
              </div>
            ) : (
              <div>
                <span className="font-semibold leading-relaxed">Age: </span>
                {formatPatientAge(patientData)}
              </div>
            )}
            <div>
              <span className="font-semibold leading-relaxed">Gender: </span>
              {patientGender}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Phone: </span>
              <a href={`tel:${patientData?.phone_number}`}>
                {patientData?.phone_number || "-"}
              </a>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Nationality:{" "}
              </span>
              {patientData?.nationality || "-"}
            </div>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <div>
              <span className="font-semibold leading-relaxed">
                Blood Group:{" "}
              </span>
              {patientData?.blood_group || "-"}
            </div>
            {patientData?.nationality !== "India" && (
              <div>
                <span className="font-semibold leading-relaxed">
                  Passport Number:{" "}
                </span>
                {patientData?.passport_no || "-"}
              </div>
            )}
            {patientData?.nationality === "India" && (
              <>
                <div>
                  <span className="font-semibold leading-relaxed">State: </span>
                  {patientData?.state_object?.name}
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    District:{" "}
                  </span>
                  {patientData?.district_object?.name || "-"}
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    Local Body:{" "}
                  </span>
                  {patientData?.local_body_object?.name || "-"}
                </div>
              </>
            )}
            <div>
              <span className="font-semibold leading-relaxed">Address: </span>
              {patientData?.address || "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Contact with confirmed carrier:{" "}
              </span>
              {yesOrNoBadge(patientData?.contact_with_confirmed_carrier)}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Contact with suspected carrier:{" "}
              </span>
              {yesOrNoBadge(patientData?.contact_with_suspected_carrier)}
            </div>
            {patientData?.estimated_contact_date && (
              <div>
                <span className="font-semibold leading-relaxed">
                  Estimated contact date:{" "}
                </span>
                {formatDateTime(patientData?.estimated_contact_date)}
              </div>
            )}
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">
                Has SARI (Severe Acute Respiratory illness)?:{" "}
              </span>
              {yesOrNoBadge(patientData?.has_SARI)}
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">
                Domestic/international Travel (within last 28 days):{" "}
              </span>
              {yesOrNoBadge(patientData?.past_travel)}
            </div>
            {patientData?.countries_travelled &&
              !!patientData?.countries_travelled.length && (
                <div className="md:col-span-2">
                  <span className="font-semibold leading-relaxed">
                    Countries travelled:{" "}
                  </span>
                  {patientData?.countries_travelled.join(", ")}
                </div>
              )}
            {patientData?.ongoing_medication && (
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  Ongoing Medications{" "}
                </span>
                {patientData?.ongoing_medication}
              </div>
            )}
            {patientData?.allergies && (
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  Allergies:{" "}
                </span>
                {patientData?.allergies}
              </div>
            )}
            {!!patientData?.number_of_aged_dependents && (
              <div>
                <span className="font-semibold leading-relaxed">
                  Number Of Aged Dependents (Above 60):{" "}
                </span>
                {patientData?.number_of_aged_dependents}
              </div>
            )}
            {!!patientData?.number_of_chronic_diseased_dependents && (
              <div>
                <span className="font-semibold leading-relaxed">
                  Number Of Chronic Diseased Dependents:{" "}
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
            <span className="font-semibold leading-relaxed">Status: </span>{" "}
            {startCase(camelCase(flow.status))}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Label:</span>{" "}
            {capitalize(flow.notes)}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Created On :</span>{" "}
            {flow.created_date ? formatDateTime(flow.created_date) : "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Modified on:</span>{" "}
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
      title="Sample Test Details"
      backUrl="/sample"
      options={
        sampleDetails?.patient && (
          <div className="my-2 flex justify-center md:justify-end">
            <ButtonV2
              href={`/patient/${sampleDetails.patient}/test_sample/${id}/icmr_sample`}
            >
              ICMR Specimen Referral Form
            </ButtonV2>
          </div>
        )
      }
    >
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="font-semibold capitalize leading-relaxed">
              Status:{" "}
            </span>
            {sampleDetails?.status}
          </div>
          <div>
            <span className="font-semibold capitalize leading-relaxed">
              Result:{" "}
            </span>
            {sampleDetails?.result}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Patient: </span>
            {sampleDetails?.patient_name}
          </div>
          {sampleDetails?.facility_object && (
            <div>
              <span className="font-semibold leading-relaxed">Facility: </span>
              {sampleDetails?.facility_object.name}
            </div>
          )}
          <div>
            <span className="font-semibold leading-relaxed">Tested on: </span>
            {sampleDetails?.date_of_result
              ? formatDateTime(sampleDetails.date_of_result)
              : "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Result on: </span>
            {sampleDetails?.date_of_result
              ? formatDateTime(sampleDetails.date_of_result)
              : "-"}
          </div>
          {sampleDetails?.fast_track && (
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">
                Fast track testing reason:{" "}
              </span>
              {sampleDetails.fast_track}
            </div>
          )}
          {sampleDetails?.doctor_name && (
            <div className="capitalize md:col-span-2">
              <span className="font-semibold leading-relaxed">
                Doctor&apos;s Name:{" "}
              </span>
              {startCase(camelCase(sampleDetails.doctor_name))}
            </div>
          )}
          {sampleDetails?.diagnosis && (
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">Diagnosis: </span>
              {sampleDetails.diagnosis}
            </div>
          )}
          {sampleDetails?.diff_diagnosis && (
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">
                Differential diagnosis:{" "}
              </span>
              {sampleDetails?.diff_diagnosis}
            </div>
          )}
          {sampleDetails?.etiology_identified && (
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">
                Etiology identified:{" "}
              </span>
              {sampleDetails.etiology_identified}
            </div>
          )}
          <div>
            <span className="font-semibold leading-relaxed">
              Is Atypical presentation{" "}
            </span>
            {yesOrNoBadge(sampleDetails?.is_atypical_presentation)}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              Is unusual course{" "}
            </span>
            {yesOrNoBadge(sampleDetails?.is_unusual_course)}
          </div>
          {sampleDetails?.atypical_presentation && (
            <div className="md:col-span-2">
              <span className="font-semibold leading-relaxed">
                Atypical presentation details:{" "}
              </span>
              {sampleDetails.atypical_presentation}
            </div>
          )}
          <div>
            <span className="font-semibold leading-relaxed">
              SARI - Severe Acute Respiratory illness{" "}
            </span>
            {yesOrNoBadge(sampleDetails?.has_sari)}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              ARI - Acute Respiratory illness{" "}
            </span>
            {yesOrNoBadge(sampleDetails?.has_ari)}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              Contact with confirmed carrier{" "}
            </span>
            {yesOrNoBadge(sampleDetails?.patient_has_confirmed_contact)}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              Contact with suspected carrier{" "}
            </span>
            {yesOrNoBadge(sampleDetails?.patient_has_suspected_contact)}
          </div>
          {sampleDetails?.patient_travel_history &&
            sampleDetails.patient_travel_history.length !== 0 && (
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  Countries travelled:{" "}
                </span>
                {sampleDetails.patient_travel_history}
              </div>
            )}
          {sampleDetails?.sample_type && (
            <div className="md:col-span-2">
              <span className="font-semibold capitalize leading-relaxed">
                Sample Type:{" "}
              </span>
              {startCase(camelCase(sampleDetails.sample_type))}
            </div>
          )}
        </div>
      </Card>

      <div>
        <h4 className="mt-8">Details of patient</h4>
        {showPatientCard(sampleDetails?.patient_object)}
      </div>

      <div className="mb-4">
        <h4 className="mt-8">Sample Test History</h4>
        {sampleDetails?.flow &&
          sampleDetails.flow.map((flow: FlowModel) => renderFlow(flow))}
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
