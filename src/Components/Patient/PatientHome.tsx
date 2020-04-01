import React, { useState, useCallback } from "react";
import {
  Grid,
  Typography,
  Button,
  Divider,
  Box,
  CardContent
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useDispatch } from "react-redux";
import { navigate } from "hookrouter";
import { Loading } from "../Common/Loading";
import {
  getPatient,
  getConsultationList,
  getSampleTestList,
  patchSample
} from "../../Redux/actions";
import { GENDER_TYPES } from "../../Common/constants";
import { useAbortableEffect, statusType } from "../../Common/utils";
import { ConsultationCard } from "../Facility/ConsultationCard";
import { SampleTestCard } from "./SampleTestCard";
import { PatientModel, SampleTestModel } from "./models";
import { ConsultationModal } from "../Facility/models";
import * as Notification from "../../Utils/Notifications";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    padding: "8px"
  },
  margin: {
    margin: theme.spacing(1)
  },
  displayFlex: {
    display: "flex"
  },
  content: {
    marginTop: "10px",
    maxWidth: "560px",
    background: "white",
    padding: "20px 20px 5px"
  },
  title: {
    padding: "5px",
    marginBottom: "10px"
  },
  details: {
    padding: "5px",
    marginBottom: "10px"
  }
}));

export const PatientHome = (props: any) => {
  const { facilityId, id } = props;
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const [patientData, setPatientData] = useState<PatientModel>({});
  const [consultationListData, setConsultationListData] = useState<
    Array<ConsultationModal>
  >([]);
  const [sampleListData, setSampleListData] = useState<Array<SampleTestModel>>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(
    async (status: statusType) => {
      const [patientRes, consultationRes, sampleRes] = await Promise.all([
        dispatch(getPatient({ id })),
        dispatch(getConsultationList({ patient: id })),
        dispatch(getSampleTestList({ patientId: id }))
      ]);
      if (!status.aborted) {
        if (patientRes && patientRes.data) {
          setPatientData(patientRes.data);
        }
        if (
          consultationRes &&
          consultationRes.data &&
          consultationRes.data.results
        ) {
          setConsultationListData(consultationRes.data.results);
        }
        if (sampleRes && sampleRes.data && sampleRes.data.results) {
          setSampleListData(sampleRes.data.results);
        }
        setIsLoading(false);
      }
    },
    [dispatch, id]
  );

  useAbortableEffect(
    (status: statusType) => {
      setIsLoading(true);
      fetchData(status);
    },
    [dispatch, fetchData]
  );

  if (isLoading) {
    return <Loading />;
  }

  const patientGender = GENDER_TYPES.find(i => i.id === patientData.gender)
    ?.text;

  let patientMedHis: any[] = [];
  if (
    patientData &&
    patientData.medical_history &&
    patientData.medical_history.length
  ) {
    const medHis = patientData.medical_history;
    patientMedHis = medHis.map((item: any, idx: number) => (
      <tr key={`med_his_${idx}`}>
        <td>{item.disease}</td>
        <td>{item.details}</td>
      </tr>
    ));
  }

  return (
    <div className="px-2">
      <div className="font-semibold text-3xl p-4 mt-4 border-b-4 border-orange-500">
        Patient #{id}
      </div>

      <div className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black mt-4 p-4 ">
        <div className="max-w-md">
          <div>
            <span className="font-semibold">Name: </span>
            {patientData.name}
          </div>
          <div>
            <span className="font-semibold">Age: </span>
            {patientData.age}
          </div>
          <div>
            <span className="font-semibold">Gender: </span>
            {patientGender}
          </div>
          <div>
            <span className="font-semibold">Phone: </span>
            {patientData.phone_number}
          </div>
          <div>
            <span className="font-semibold">Had contact: </span>
            {patientData.contact_with_carrier ? "Yes" : "No"}
          </div>
        </div>

        <div>
          <div className="mt-2">
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="small"
              onClick={() =>
                navigate(`/facility/${facilityId}/patient/${id}/update`)
              }
            >
              Update Patient Info
            </Button>
          </div>
          <div className="mt-2">
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="small"
              onClick={() =>
                navigate(`/facility/${facilityId}/patient/${id}/consultation`)
              }
            >
              Add Consultation
            </Button>
          </div>
          <div className="mt-2">
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="small"
              onClick={() =>
                navigate(`/facility/${facilityId}/patient/${id}/sample-test`)
              }
            >
              Request Sample Test
            </Button>
          </div>
        </div>
      </div>

      <Grid item xs={12}>
        <div className="font-semibold text-3xl p-4 mt-4 border-b-4 border-orange-500 mb-4">
          Medical History
        </div>
        <div className={classes.details}>
          {patientMedHis.length > 0 ? (
            <table className="w3-table w3-table-all">
              <thead>
                <tr>
                  <th className="w3-center">Disease</th>
                  <th className="w3-center">Details</th>
                </tr>
              </thead>
              <tbody>{patientMedHis}</tbody>
            </table>
          ) : (
            <span className="w3-center">
              <h6 className="w3-text-grey">No Medical History so far</h6>
            </span>
          )}
        </div>
      </Grid>

      <div>
        <div className="font-semibold text-3xl p-4 mt-4 border-b-4 border-orange-500 mb-4">
          Consultation History
        </div>

        {consultationListData.map((itemData, idx) => (
          <ConsultationCard itemData={itemData} key={idx} />
        ))}
      </div>

      <div>
        <div className="font-semibold text-3xl p-4 mt-4 border-b-4 border-orange-500 mb-4">
          Sample Test History
        </div>

        {sampleListData.map((itemData, idx) => (
          <SampleTestCard itemData={itemData} key={idx} />
        ))}
      </div>
    </div>
  );
};
