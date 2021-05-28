import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { getPatient } from "../../Redux/actions";
import { PatientModel } from "../Patient/models";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { GENDER_TYPES } from "../../Common/constants";
import moment from "moment";

export default function PrintDeathReport(props: { id: string }) {
  const [patientData, setPatientData] = useState<PatientModel>({});
  const [isLoading, setIsLoading] = useState(true);
  const { id } = props;
  const dispatch: any = useDispatch();
  const patientGender = GENDER_TYPES.find(
    (i) => i.id === patientData.gender
  )?.text;

  const fetchpatient = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const patientRes = await dispatch(getPatient({ id }));
      if (!status.aborted) {
        if (patientRes && patientRes.data) {
          setPatientData(patientRes.data);
        }
        setIsLoading(false);
      }
    },
    [dispatch, id]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchpatient(status);
    },
    [dispatch, fetchpatient]
  );

  let patientComorbidities: any;
  if (
    patientData &&
    patientData.medical_history &&
    patientData.medical_history.length
  ) {
    const medHis = patientData.medical_history;
    patientComorbidities = medHis.map((item: any) => item.disease).join(", ");
  } else {
    patientComorbidities = "None";
  }

  return (
    <div className="my-4">
      <div className="my-4 flex justify-end ">
        <button
          onClick={(_) => window.print()}
          className="bg-white btn btn-primary mr-2"
        >
          <i className="fas fa-print mr-2"></i> Print Death Report
        </button>
      </div>

      <div id="section-to-print" className="print bg-white ">
        <div></div>
        <div className="mx-20 p-4">
          <div className="font-bold text-xl text-center mt-6 mb-6">
            Covid-19 Death Reporting: Form 1
          </div>
          <div className="grid gap-2 grid-cols-1">
            <div>
              <span className="font-semibold leading-relaxed">Name: </span>
              {patientData.name}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Age & Gender:{" "}
              </span>
              {patientData.age} {patientGender}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Address: </span>
              <div className="ml-2">
                <div className="whitespace-pre-wrap">{patientData.address}</div>
                {patientData.nationality === "India" && (
                  <>
                    <div>{patientData.ward_object?.name}</div>
                    <div>{patientData.local_body_object?.name}</div>
                    <div>{patientData.district_object?.name}</div>
                    <div>{patientData.state_object?.name}</div>
                  </>
                )}
              </div>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Contact Number:{" "}
              </span>
              {patientData.phone_number}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Whether declared positive:{" "}
              </span>
              {patientData.is_declared_positive ? "Yes" : "No"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of declaring positive:{" "}
              </span>
              {moment(patientData.date_declared_positive).format("LLL") || ""}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Type of test done:{" "}
              </span>
              {patientData.test_type}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of sample collection for Covid testing:{" "}
              </span>
              {moment(patientData.date_of_test).format("LLL") || ""}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of confirmation as Covid with SRF ID:{" "}
              </span>
              {moment(patientData.date_of_result).format("LLL") || ""} (SRF ID:{" "}
              {patientData.srf_id || "-"})
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Name of the hospital in which the patient was tested for SARS
                COV 2:{" "}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Name of the hospital in which the patient died:{" "}
              </span>
              {patientData.facility_object?.name}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of admission:{" "}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of death:{" "}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Mention the co-morbidities if present:{" "}
              </span>
              {patientComorbidities}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                History and clinical course in the hospital:{" "}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Whether brought dead:{" "}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                If yes was the deceased brought from home/CFLTC:{" "}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Whether vaccinated:{" "}
              </span>
              {patientData.is_vaccinated ? "Yes" : "No"}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Whether NIV/IUBCR Kottayam confirmation sent:{" "}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of sending the sample for confirmation to NIV/IUCBR
                Kottayam:{" "}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Cause of death:{" "}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Signature of the Superintendent:{" "}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Signature of the Nodal officer:{" "}
              </span>
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Signature of a member of the medical board:{" "}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
