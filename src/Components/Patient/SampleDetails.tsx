import { Card, CardContent, Box, Button } from "@material-ui/core";
import moment from "moment";
import loadable from "@loadable/component";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getTestSample } from "../../Redux/actions";
import { FlowModel, SampleTestModel } from "./models";
import { FileUpload } from "./FileUpload";
import { navigate } from "raviger";
import { GENDER_TYPES, TEST_TYPE_CHOICES } from "../../Common/constants";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

interface SampleDetailsProps {
  id: number;
  patientId?: string;
}

export const SampleDetails = (props: SampleDetailsProps) => {
  const { id, patientId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [sampleDetails, setSampleDetails] = useState<SampleTestModel>({});

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getTestSample(id));
      if (!status.aborted) {
        if (res && res.data) {
          setSampleDetails(res.data);
        }
        setIsLoading(false);
      }
    },
    [dispatch, id]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData, id]
  );

  const showPatientCard = (patientData: any) => {
    const patientGender = GENDER_TYPES.find(
      (i) => i.id === patientData?.gender
    )?.text;
    const testType = TEST_TYPE_CHOICES.find(
      (i) => i.id === patientData?.test_type
    )?.text;

    return (
      <div className="border rounded-lg bg-white shadow h-full text-black mt-2 mr-3 md:mr-8 p-4">
        <div className="mt-2">
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
              moment(patientData?.date_of_test).format("LL")) ||
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
              {patientData?.age}
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
            <span className="font-semibold leading-relaxed">Nationality: </span>
            {patientData?.nationality || "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Blood Group: </span>
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
            {patientData?.contact_with_confirmed_carrier ? (
              <span className="badge badge-pill badge-warning">Yes</span>
            ) : (
              <span className="badge badge-pill badge-secondary">No</span>
            )}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              Contact with suspected carrier:{" "}
            </span>
            {patientData?.contact_with_suspected_carrier ? (
              <span className="badge badge-pill badge-warning">Yes</span>
            ) : (
              <span className="badge badge-pill badge-secondary">No</span>
            )}
          </div>
          {patientData?.estimated_contact_date && (
            <div>
              <span className="font-semibold leading-relaxed">
                Estimated contact date:{" "}
              </span>
              {moment(patientData?.estimated_contact_date).format("LL")}
            </div>
          )}
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Has SARI (Severe Acute Respiratory illness)?:{" "}
            </span>
            {patientData?.has_SARI ? (
              <span className="badge badge-pill badge-warning">Yes</span>
            ) : (
              <span className="badge badge-pill badge-secondary">No</span>
            )}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Domestic/international Travel (within last 28 days):{" "}
            </span>
            {patientData?.past_travel ? (
              <span className="badge badge-pill badge-warning">Yes</span>
            ) : (
              <span className="badge badge-pill badge-secondary">No</span>
            )}
          </div>
          {patientData?.countries_travelled &&
            !!patientData?.countries_travelled.length && (
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  Countries travelled:{" "}
                </span>
                {Array.isArray(patientData?.countries_travelled)
                  ? patientData?.countries_travelled.join(", ")
                  : patientData?.countries_travelled.split(",").join(", ")}
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
              <span className="font-semibold leading-relaxed">Allergies: </span>
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
    );
  };

  const renderFlow = (flow: FlowModel) => {
    return (
      <Card className="mt-4" key={flow.id}>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <span className="font-semibold leading-relaxed">Status: </span>{" "}
              {flow.status}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Label:</span>{" "}
              {flow.notes}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Created On :
              </span>{" "}
              {flow.created_date
                ? moment(flow.created_date).format("lll")
                : "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Modified on:
              </span>{" "}
              {flow.modified_date
                ? moment(flow.modified_date).format("lll")
                : "-"}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2 pb-2">
      <PageTitle title={`Sample Test Details`} />
      {sampleDetails.patient && (
        <div className="flex justify-end">
          <Button
            color="primary"
            variant="contained"
            size="small"
            onClick={() =>
              navigate(
                `/patient/${sampleDetails.patient}/test_sample/${id}/icmr_sample`
              )
            }
          >
            ICMR Specimen Referral Form
          </Button>
        </div>
      )}
      <Card className="mt-4">
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <span className="font-semibold leading-relaxed">Status: </span>
              {sampleDetails.status}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Result: </span>
              {sampleDetails.result}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Patient: </span>
              {sampleDetails.patient_name}
            </div>
            {sampleDetails.facility_object && (
              <div>
                <span className="font-semibold leading-relaxed">
                  Facility:{" "}
                </span>
                {sampleDetails.facility_object.name}
              </div>
            )}
            <div>
              <span className="font-semibold leading-relaxed">Tested on: </span>
              {sampleDetails.date_of_result
                ? moment(sampleDetails.date_of_result).format("lll")
                : "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Result on: </span>
              {sampleDetails.date_of_result
                ? moment(sampleDetails.date_of_result).format("lll")
                : "-"}
            </div>
            {sampleDetails.fast_track && (
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  Fast track testing reason:{" "}
                </span>
                {sampleDetails.fast_track}
              </div>
            )}
            {sampleDetails.doctor_name && (
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  Doctor's Name:{" "}
                </span>
                {sampleDetails.doctor_name}
              </div>
            )}
            {sampleDetails.diagnosis && (
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  Diagnosis:{" "}
                </span>
                {sampleDetails.diagnosis}
              </div>
            )}
            {sampleDetails.diff_diagnosis && (
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  Differential diagnosis:{" "}
                </span>
                {sampleDetails.diff_diagnosis}
              </div>
            )}
            {sampleDetails.etiology_identified && (
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
              {sampleDetails.is_atypical_presentation ? (
                <span className="badge badge-pill badge-warning">Yes</span>
              ) : (
                <span className="badge badge-pill badge-secondary">No</span>
              )}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Is unusual course{" "}
              </span>
              {sampleDetails.is_unusual_course ? (
                <span className="badge badge-pill badge-warning">Yes</span>
              ) : (
                <span className="badge badge-pill badge-secondary">No</span>
              )}
            </div>
            {sampleDetails.atypical_presentation && (
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
              {sampleDetails.has_sari ? (
                <span className="badge badge-pill badge-warning">Yes</span>
              ) : (
                <span className="badge badge-pill badge-secondary">No</span>
              )}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                ARI - Acute Respiratory illness{" "}
              </span>
              {sampleDetails.has_ari ? (
                <span className="badge badge-pill badge-warning">Yes</span>
              ) : (
                <span className="badge badge-pill badge-secondary">No</span>
              )}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Contact with confirmed carrier{" "}
              </span>
              {sampleDetails.patient_has_confirmed_contact ? (
                <span className="badge badge-pill badge-warning">Yes</span>
              ) : (
                <span className="badge badge-pill badge-secondary">No</span>
              )}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Contact with suspected carrier{" "}
              </span>
              {sampleDetails.patient_has_suspected_contact ? (
                <span className="badge badge-pill badge-warning">Yes</span>
              ) : (
                <span className="badge badge-pill badge-secondary">No</span>
              )}
            </div>
            {sampleDetails.patient_travel_history && (
              <div className="md:col-span-2">
                <span className="font-semibold leading-relaxed">
                  Countries travelled:{" "}
                </span>
                {sampleDetails.patient_travel_history}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h4 className="mt-8">Details of patient</h4>
        {showPatientCard(sampleDetails.patient_object)}
      </div>

      <PageTitle title="Sample Test History" hideBack={true} />
      {sampleDetails.flow &&
        sampleDetails.flow.map((flow: FlowModel) => renderFlow(flow))}

      <FileUpload
        sampleId={id}
        patientId=""
        facilityId=""
        consultationId=""
        type="SAMPLE_MANAGEMENT"
        hideBack={true}
        unspecified={true}
        audio={true}
      />
    </div>
  );
};
