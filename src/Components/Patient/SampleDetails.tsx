import { Card, CardContent, Grid, Typography } from "@material-ui/core";
import moment from "moment";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { Loading } from "../../Components/Common/Loading";
import { getTestSample } from "../../Redux/actions";
import { SampleTestModel } from "./models";
import PageTitle from "../Common/PageTitle";

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
          console.log(res.data);
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
            <span className="font-semibold leading-relaxed">Result:</span>
            {sampleDetails.result}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Tested on :</span>{" "}
            {moment(sampleDetails.date_of_result).format("lll")}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Result on:</span>{" "}
            {moment(sampleDetails.date_of_result).format("lll")}
          </div>
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
  </>);
};
