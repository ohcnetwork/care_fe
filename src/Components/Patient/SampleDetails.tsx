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
    <PageTitle title={`Sample Details #${sampleDetails.id}`} />
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
            <span className="font-semibold leading-relaxed">{sampleDetails.facility_object.name} </span>
             ({sampleDetails.facility_object.facility_type?.name || "-"})
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
          <div>
            <span className="font-semibold leading-relaxed">Contact with confirmed carrier: </span>
            {sampleDetails.patient_has_confirmed_contact ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Contact with suspected carrier: </span>
            {sampleDetails.patient_has_suspected_contact ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Has SARI (Severe Acute Respiratory illness)?: </span>
            {sampleDetails.patient_has_sari ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
          {sampleDetails.patient_travel_history && (<div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Countries travelled: </span>
            {sampleDetails.patient_travel_history}
          </div>)}
        </div>
      </CardContent>
    </Card>

    <PageTitle title="Sample History" hideBack={true} />
    {sampleDetails.flow && sampleDetails.flow.map((flow: FlowModel) => renderFlow(flow))}
  </>);
};
