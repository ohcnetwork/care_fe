import { Card, CardContent } from "@material-ui/core";
import moment from "moment";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { Loading } from "../../Components/Common/Loading";
import { getTestSample } from "../../Redux/actions";
import PageTitle from "../Common/PageTitle";
import { FlowModel, SampleTestModel } from "./models";

interface SampleDetailsProps {
  id: number;
}

export const SampleDetails = (props: SampleDetailsProps) => {
  const { id } = props;
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
              <span className="font-semibold leading-relaxed">Notes:</span>{" "}
              {flow.notes}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Created On :</span>{" "}
              {flow.created_date ? moment(flow.created_date).format("lll") : "-"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Modified on:</span>{" "}
              {flow.modified_date ? moment(flow.modified_date).format("lll") : "-"}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };


  if (isLoading) {
    return <Loading />;
  }

  return (<>
    <PageTitle title={`Sample Test Details`} />
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
          {sampleDetails.facility_object && (<div>
            <span className="font-semibold leading-relaxed">Facility: </span>
            {sampleDetails.facility_object.name}
          </div>)}
          <div>
            <span className="font-semibold leading-relaxed">Tested on: </span>
            {sampleDetails.date_of_result ? moment(sampleDetails.date_of_result).format("lll") : "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Result on: </span>
            {sampleDetails.date_of_result ? moment(sampleDetails.date_of_result).format("lll") : "-"}
          </div>
          {sampleDetails.fast_track && (<div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Fast track testing reason: </span>
            {sampleDetails.fast_track}
          </div>)}
          {sampleDetails.doctor_name && (<div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Doctor's Name: </span>
            {sampleDetails.doctor_name}
          </div>)}
          {sampleDetails.diagnosis && (<div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Diagnosis: </span>
            {sampleDetails.diagnosis}
          </div>)}
          {sampleDetails.diff_diagnosis && (<div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Differential diagnosis: </span>
            {sampleDetails.diff_diagnosis}
          </div>)}
          {sampleDetails.etiology_identified && (<div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Etiology identified: </span>
            {sampleDetails.etiology_identified}
          </div>)}
          <div>
            <span className="font-semibold leading-relaxed">Is Atypical presentation </span>
            {sampleDetails.is_atypical_presentation ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Is unusual course </span>
            {sampleDetails.is_unusual_course ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          {sampleDetails.atypical_presentation && (<div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Atypical presentation details: </span>
            {sampleDetails.atypical_presentation}
          </div>)}
          <div>
            <span className="font-semibold leading-relaxed">SARI - Severe Acute Respiratory illness </span>
            {sampleDetails.has_sari ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">ARI - Acute Respiratory illness </span>
            {sampleDetails.has_ari ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Contact with confirmed carrier </span>
            {sampleDetails.patient_has_confirmed_contact ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Contact with suspected carrier </span>
            {sampleDetails.patient_has_suspected_contact ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          {sampleDetails.patient_travel_history && (<div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Countries travelled: </span>
            {sampleDetails.patient_travel_history}
          </div>)}
        </div>
      </CardContent>
    </Card>

    <PageTitle title="Sample Test History" hideBack={true} />
    {sampleDetails.flow && sampleDetails.flow.map((flow: FlowModel) => renderFlow(flow))}
  </>);
};
