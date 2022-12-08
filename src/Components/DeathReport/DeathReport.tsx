import { useState, useCallback } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { getPatient } from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { GENDER_TYPES } from "../../Common/constants";
import {
  TextInputField,
  MultilineInputField,
} from "../Common/HelperInputFields";
import { InputLabel } from "@material-ui/core";
import moment from "moment";
import { formatDate } from "../../Utils/utils";
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function PrintDeathReport(props: { id: string }) {
  const initialState = {
    name: "",
    age: "",
    gender: "",
    address: "",
    phone_number: "",
    is_declared_positive: "",
    date_declared_positive: new Date(),
    test_type: "",
    date_of_test: new Date(),
    date_of_result: new Date(),
    srf_id: "",
    hospital_tested_in: "",
    hospital_died_in: "",
    date_of_admission: new Date(),
    date_of_death: new Date(),
    comorbidities: "",
    history_clinical_course: "",
    brought_dead: "",
    home_or_cfltc: "",
    is_vaccinated: "",
    kottayam_confirmation_sent: "",
    kottayam_sample_date: "",
    cause_of_death: "",
    facility: "",
  };

  const [patientData, setPatientData] = useState(initialState);
  const [patientName, setPatientName] = useState("");
  const [_isLoading, setIsLoading] = useState(true);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const { id } = props;
  const dispatch: any = useDispatch();

  const getPatientGender = (patientData: any) =>
    GENDER_TYPES.find((i) => i.id === patientData.gender)?.text;

  const getPatientAddress = (patientData: any) =>
    `${patientData.address},\n${patientData.ward_object?.name},\n${patientData.local_body_object?.name},\n${patientData.district_object?.name},\n${patientData.state_object?.name}`;

  const getPatientComorbidities = (patientData: any) => {
    if (
      patientData &&
      patientData.medical_history &&
      patientData.medical_history.length
    ) {
      const medHis = patientData.medical_history;
      return medHis.map((item: any) => item.disease).join(", ");
    } else {
      return "None";
    }
  };

  const fetchpatient = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const patientRes = await dispatch(getPatient({ id }));
      if (!status.aborted) {
        if (patientRes && patientRes.data) {
          setPatientName(patientRes.data.name);
          const patientGender = getPatientGender(patientRes.data);
          const patientAddress = getPatientAddress(patientRes.data);
          const patientComorbidities = getPatientComorbidities(patientRes.data);
          const data = {
            ...patientRes.data,
            gender: patientGender,
            address: patientAddress,
            comorbidities: patientComorbidities,
            is_declared_positive: patientRes.data.is_declared_positive
              ? "Yes"
              : "No",
            is_vaccinated: patientData.is_vaccinated ? "Yes" : "No",
            cause_of_death:
              patientRes.data.last_consultation?.discharge_notes || "",
          };
          setPatientData(data);
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

  const previewData = () => (
    <div className="my-4">
      <div className="my-4 flex justify-end ">
        <button
          onClick={(_) => window.print()}
          className="btn btn-primary mr-2"
        >
          <i className="fas fa-print mr-2"></i> Print Death Report
        </button>
        <button
          onClick={(_) => setIsPrintMode(false)}
          className="btn btn-default"
        >
          <i className="fas fa-times mr-2"></i> Close
        </button>
      </div>

      <div id="section-to-print" className="print bg-white">
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
              {patientData.age} {patientData.gender}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Address: </span>
              <div className="ml-2">
                <div className="whitespace-pre-wrap">{patientData.address}</div>
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
              {patientData.is_declared_positive}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of declaring positive:{" "}
              </span>
              {formatDate(patientData.date_declared_positive) || ""}
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
              {formatDate(patientData.date_of_test) || ""}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of confirmation as Covid with SRF ID:{" "}
              </span>
              {formatDate(patientData.date_of_result) || ""} (SRF ID:{" "}
              {patientData.srf_id || "-"})
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Name of the hospital in which the patient was tested for SARS
                COV 2:{" "}
              </span>
              {patientData.hospital_tested_in}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Name of the hospital in which the patient died:{" "}
              </span>
              {patientData.hospital_died_in}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of admission:{" "}
              </span>
              {formatDate(patientData.date_of_admission) || ""}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of death:{" "}
              </span>
              {formatDate(patientData.date_of_death) || ""}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Mention the co-morbidities if present:{" "}
              </span>
              {patientData.comorbidities}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                History and clinical course in the hospital:{" "}
              </span>
              {patientData.history_clinical_course}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Whether brought dead:{" "}
              </span>
              {patientData.brought_dead}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                If yes was the deceased brought from home/CFLTC:{" "}
              </span>
              {patientData.home_or_cfltc}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Whether vaccinated:{" "}
              </span>
              {patientData.is_vaccinated}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Whether NIV/IUBCR Kottayam confirmation sent:{" "}
              </span>
              {patientData.kottayam_confirmation_sent}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of sending the sample for confirmation to NIV/IUCBR
                Kottayam:{" "}
              </span>
              {formatDate(patientData.kottayam_sample_date) || ""}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Cause of death:{" "}
              </span>
              {patientData.cause_of_death}
            </div>
            <div className="mt-5">
              <span className="font-semibold leading-relaxed">
                Signature of the Superintendent:{" "}
              </span>
            </div>
            <div className="mt-5">
              <span className="font-semibold leading-relaxed">
                Signature of the Nodal officer:{" "}
              </span>
            </div>
            <div className="mt-5">
              <span className="font-semibold leading-relaxed">
                Signature of a member of the medical board:{" "}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleChange = (e: any) => {
    const key = e.target.name;
    setPatientData({ ...patientData, [key]: e.target.value });
  };

  return (
    <div>
      {isPrintMode ? (
        previewData()
      ) : (
        <div className="m-5 p-5 bg-gray-100 border rounded-xl shadow">
          <PageTitle
            title={"Covid-19 Death Reporting : Form 1"}
            crumbsReplacements={{
              [props.id]: { name: patientName },
              death_report: { style: "pointer-events-none" },
            }}
            backUrl={`/facility/${patientData.facility}/patient/${id}`}
          />
          <div className="grid grid-rows-11">
            <div className="grid grid-cols-1 mt-4 gap-10">
              <div>
                <InputLabel htmlFor="name">Name</InputLabel>
                <TextInputField
                  name="name"
                  id="name"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.name}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 mt-4 gap-10">
              <div>
                <InputLabel htmlFor="age">Age</InputLabel>
                <TextInputField
                  name="age"
                  id="age"
                  variant="outlined"
                  margin="dense"
                  type="number"
                  value={patientData.age}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
              <div>
                <InputLabel htmlFor="gender">Gender</InputLabel>
                <TextInputField
                  name="gender"
                  id="gender"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.gender}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
            </div>
            <div className="grid grid-cols-1 mt-4">
              <InputLabel htmlFor="address">Address</InputLabel>
              <MultilineInputField
                name="address"
                id="address"
                variant="outlined"
                margin="dense"
                type="text"
                value={patientData.address}
                onChange={(e) => handleChange(e)}
                errors=""
              />
            </div>
            <div className="grid grid-cols-2 mt-4 gap-10">
              <div>
                <InputLabel htmlFor="phone_number">Phone Number</InputLabel>
                <TextInputField
                  name="phone_number"
                  id="phone_number"
                  variant="outlined"
                  margin="dense"
                  type="tel"
                  value={patientData.phone_number}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
              <div>
                <InputLabel htmlFor="is_declared_positive">
                  Whether declared positive
                </InputLabel>
                <TextInputField
                  name="is_declared_positive"
                  id="is_declared_positive"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.is_declared_positive}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 mt-4 gap-10">
              <div>
                <InputLabel htmlFor="date_declared_positive">
                  Date of declaring positive
                </InputLabel>
                <TextInputField
                  name="date_declared_positive"
                  id="date_declared_positive"
                  variant="outlined"
                  margin="dense"
                  type="date"
                  value={moment(patientData.date_declared_positive).format(
                    "YYYY-MM-DD"
                  )}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
              <div>
                <InputLabel htmlFor="test_type">Type of test done</InputLabel>
                <TextInputField
                  name="test_type"
                  id="test_type"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.test_type}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
            </div>
            <div className="grid grid-cols-4 mt-4 gap-10">
              <div className="col-span-2">
                <InputLabel htmlFor="date_of_test">
                  Date of sample collection for Covid testing
                </InputLabel>
                <TextInputField
                  name="date_of_test"
                  id="date_of_test"
                  variant="outlined"
                  margin="dense"
                  type="date"
                  value={moment(patientData.date_of_test).format("YYYY-MM-DD")}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
              <div className="col-span-1">
                <InputLabel htmlFor="date_of_result">
                  Covid confirmation date
                </InputLabel>
                <TextInputField
                  name="date_of_result"
                  id="date_of_result"
                  variant="outlined"
                  margin="dense"
                  type="date"
                  value={moment(patientData.date_of_result).format(
                    "YYYY-MM-DD"
                  )}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
              <div className="col-span-1">
                <InputLabel htmlFor="srf_id">SRF ID</InputLabel>
                <TextInputField
                  name="srf_id"
                  id="srf_id"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.srf_id}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 mt-4 gap-10">
              <div>
                <InputLabel htmlFor="hospital_tested_in">
                  Hospital in which patient tested for SARS COV 2
                </InputLabel>
                <TextInputField
                  name="hospital_tested_in"
                  id="hospital_tested_in"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.hospital_tested_in}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
              <div>
                <InputLabel htmlFor="hospital_died_in">
                  Name of the hospital in which the patient died
                </InputLabel>
                <TextInputField
                  name="hospital_died_in"
                  id="hospital_died_in"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.hospital_died_in}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 mt-4 gap-10">
              <div>
                <InputLabel htmlFor="date_of_admission">
                  Date of admission
                </InputLabel>
                <TextInputField
                  name="date_of_admission"
                  id="date_of_admission"
                  variant="outlined"
                  margin="dense"
                  type="date"
                  value={patientData.date_of_admission}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
              <div>
                <InputLabel htmlFor="date_of_death">Date of death</InputLabel>
                <TextInputField
                  name="date_of_death"
                  id="date_of_death"
                  variant="outlined"
                  margin="dense"
                  type="date"
                  value={patientData.date_of_death}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 mt-4 gap-10">
              <div>
                <InputLabel htmlFor="comorbidities">
                  Mention the co-morbidities if present
                </InputLabel>
                <TextInputField
                  name="comorbidities"
                  id="comorbidities"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.comorbidities}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
              <div>
                <InputLabel htmlFor="history_clinical_course">
                  History and clinical course in the hospital
                </InputLabel>
                <TextInputField
                  name="history_clinical_course"
                  id="history_clinical_course"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.history_clinical_course}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 mt-4 gap-10">
              <div>
                <InputLabel htmlFor="brought_dead">
                  Whether brought dead
                </InputLabel>
                <TextInputField
                  name="brought_dead"
                  id="brought_dead"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.brought_dead}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
              <div>
                <InputLabel htmlFor="home_or_cfltc">
                  If yes was the deceased brought from home/CFLTC
                </InputLabel>
                <TextInputField
                  name="home_or_cfltc"
                  id="home_or_cfltc"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.home_or_cfltc}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 mt-4 gap-10">
              <div>
                <InputLabel htmlFor="is_vaccinated">
                  Whether vaccinated
                </InputLabel>
                <TextInputField
                  name="is_vaccinated"
                  id="is_vaccinated"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.is_vaccinated}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
              <div>
                <InputLabel htmlFor="kottayam_confirmation_sent">
                  Whether NIV/IUBCR Kottayam confirmation sent
                </InputLabel>
                <TextInputField
                  name="kottayam_confirmation_sent"
                  id="kottayam_confirmation_sent"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.kottayam_confirmation_sent}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
            </div>
            <div className="grid grid-cols-2 mt-4 gap-10">
              <div>
                <InputLabel htmlFor="kottayam_sample_date">
                  Sample sent to NIV/IUCBR Kottayam on
                </InputLabel>
                <TextInputField
                  name="kottayam_sample_date"
                  id="kottayam_sample_date"
                  variant="outlined"
                  margin="dense"
                  type="date"
                  value={patientData.kottayam_sample_date}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
              <div>
                <InputLabel htmlFor="cause_of_death">Cause of death</InputLabel>
                <TextInputField
                  name="cause_of_death"
                  id="cause_of_death"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={patientData.cause_of_death}
                  onChange={(e) => handleChange(e)}
                  errors=""
                />
              </div>
            </div>
          </div>
          <div className="mt-6 w-1/2 md:w-1/4">
            <button
              onClick={(_) => setIsPrintMode(true)}
              className="btn btn-primary"
            >
              Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
