import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { getPatient } from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { GENDER_TYPES } from "../../Common/constants";
import TextFormField from "../Form/FormFields/TextFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import DateFormField from "../Form/FormFields/DateFormField";
import PhoneNumberFormField from "../Form/FormFields/PhoneNumberFormField";
import { formatDateTime } from "../../Utils/utils";
import Page from "../Common/components/Page";
import Form from "../Form/Form";
import { useTranslation } from "react-i18next";
import { navigate } from "raviger";
import dayjs from "dayjs";

type DeathReport = {
  name: string;
  age: string;
  gender: string;
  address: string;
  phone_number: string;
  is_declared_positive: string;
  date_declared_positive: Date | "";
  test_type: string;
  date_of_test: Date | "";
  date_of_result: Date | "";
  srf_id: string;
  hospital_tested_in: string;
  hospital_died_in: string;
  date_of_admission: Date | "";
  date_of_death: Date | "";
  comorbidities: string;
  history_clinical_course: string;
  brought_dead: string;
  home_or_cfltc: string;
  is_vaccinated: string;
  kottayam_confirmation_sent: string;
  kottayam_sample_date: Date | "";
  cause_of_death: string;
  facility: string;
};

export default function PrintDeathReport(props: { id: string }) {
  const initialState = {
    name: "",
    age: "",
    gender: "",
    address: "",
    phone_number: "",
    is_declared_positive: "",
    date_declared_positive: "" as const,
    test_type: "",
    date_of_test: "" as const,
    date_of_result: "" as const,
    srf_id: "",
    hospital_tested_in: "",
    hospital_died_in: "",
    date_of_admission: "" as const,
    date_of_death: "" as const,
    comorbidities: "",
    history_clinical_course: "",
    brought_dead: "",
    home_or_cfltc: "",
    is_vaccinated: "",
    kottayam_confirmation_sent: "",
    kottayam_sample_date: "" as const,
    cause_of_death: "",
    facility: "",
  };

  const [patientData, setPatientData] = useState<DeathReport>(initialState);
  const [patientName, setPatientName] = useState("");
  const [_isLoading, setIsLoading] = useState(true);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const { id } = props;
  const dispatch: any = useDispatch();
  const { t } = useTranslation();

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
            hospital_died_in: patientRes.data.last_consultation.facility_name,
            date_declared_positive: patientRes.data.date_declared_positive
              ? dayjs(patientRes.data.date_declared_positive).toDate()
              : "",
            date_of_admission: patientRes.data.last_consultation.admission_date
              ? dayjs(patientRes.data.last_consultation.admission_date).toDate()
              : "",
            date_of_test: patientRes.data.date_of_test
              ? dayjs(patientRes.data.date_of_test).toDate()
              : "",
            date_of_result: patientRes.data.date_of_result
              ? dayjs(patientRes.data.date_of_result).toDate()
              : "",
            date_of_death: patientRes.data.last_consultation.death_datetime
              ? dayjs(patientRes.data.last_consultation.death_datetime).toDate()
              : "",
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
        <div className="p-4 md:mx-20">
          <div className="my-6 text-center text-xl font-bold">
            Covid-19 Death Reporting: Form 1
          </div>
          <div className="grid grid-cols-1 gap-2">
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
              {patientData.date_declared_positive
                ? formatDateTime(patientData.date_declared_positive)
                : ""}
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
              {patientData.date_of_test
                ? formatDateTime(patientData.date_of_test)
                : ""}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of confirmation as Covid with SRF ID:{" "}
              </span>
              {patientData.date_of_result
                ? formatDateTime(patientData.date_of_result)
                : ""}{" "}
              ({"SRF ID: "}
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
              {patientData.date_of_admission
                ? formatDateTime(patientData.date_of_admission)
                : ""}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Date of death:{" "}
              </span>
              {patientData.date_of_death
                ? formatDateTime(patientData.date_of_death)
                : ""}
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
              {patientData.kottayam_sample_date
                ? formatDateTime(patientData.kottayam_sample_date)
                : ""}
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

  return (
    <div>
      {isPrintMode ? (
        previewData()
      ) : (
        <Page
          title={"Covid-19 Death Reporting : Form 1"}
          crumbsReplacements={{
            [props.id]: { name: patientName },
            death_report: { style: "pointer-events-none" },
          }}
          backUrl={`/facility/${patientData.facility}/patient/${id}`}
          className="w-full"
        >
          <Form<DeathReport>
            disabled={isPrintMode}
            defaults={patientData}
            asyncGetDefaults={async () => patientData}
            submitLabel="Preview"
            onSubmit={async (formData) => {
              setIsPrintMode(true);
              setPatientData({ ...patientData, ...formData });
            }}
            onCancel={() =>
              navigate(`/facility/${patientData.facility}/patient/${id}`)
            }
            className="px-4 py-5 md:px-6"
            noPadding
          >
            {(field) => (
              <div>
                <div className="grid-rows-13 grid">
                  <div className="md:mt-4 md:grid md:grid-cols-1 md:gap-10">
                    <div>
                      <TextFormField
                        {...field("name")}
                        type="text"
                        label={t("name")}
                      />
                    </div>
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <TextFormField
                        {...field("age")}
                        type="number"
                        label={t("age")}
                      />
                    </div>
                    <div>
                      <TextFormField
                        {...field("gender")}
                        type="text"
                        label={t("gender")}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:mt-4">
                    <TextAreaFormField
                      {...field("address")}
                      label={t("address")}
                      rows={5}
                    />
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <PhoneNumberFormField
                        {...field("phone_number")}
                        label={t("phone_number")}
                        types={["mobile", "landline"]}
                      />
                    </div>
                    <div>
                      <TextFormField
                        {...field("is_declared_positive")}
                        type="text"
                        label="Whether declared positive"
                      />
                    </div>
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <DateFormField
                        {...field("date_declared_positive")}
                        label="Date of declaring positive"
                        position="LEFT"
                        className="w-full"
                        disableFuture
                      />
                    </div>
                    <div>
                      <TextFormField
                        {...field("test_type")}
                        type="text"
                        label="Type of test done"
                      />
                    </div>
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <DateFormField
                        {...field("date_of_test")}
                        label="Date of sample collection for Covid testing"
                        position="LEFT"
                      />
                    </div>
                    <div>
                      <DateFormField
                        {...field("date_of_result")}
                        label="Covid confirmation date"
                        position="LEFT"
                        disableFuture
                      />
                    </div>
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <TextFormField
                        {...field("srf_id")}
                        type="text"
                        label={t("srf_id")}
                      />
                    </div>
                    <div>
                      <TextFormField
                        {...field("is_vaccinated")}
                        type="text"
                        label="Whether vaccinated"
                      />
                    </div>
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <TextFormField
                        {...field("hospital_tested_in")}
                        type="text"
                        label="Hospital in which patient tested for SARS COV 2"
                      />
                    </div>
                    <div>
                      <TextFormField
                        {...field("hospital_died_in")}
                        type="text"
                        label="Name of the hospital in which the patient died"
                      />
                    </div>
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <DateFormField
                        {...field("date_of_admission")}
                        label="Date of admission"
                        position="LEFT"
                        disableFuture
                      />
                    </div>
                    <div>
                      <DateFormField
                        {...field("date_of_death")}
                        label="Date of death"
                        position="LEFT"
                        disableFuture
                      />
                    </div>
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <TextFormField
                        {...field("comorbidities")}
                        type="text"
                        label="Mention the co-morbidities if present"
                      />
                    </div>
                    <div>
                      <TextFormField
                        {...field("history_clinical_course")}
                        type="text"
                        label="History and clinical course in the hospital"
                      />
                    </div>
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <TextFormField
                        {...field("brought_dead")}
                        type="text"
                        label="Whether brought dead"
                      />
                    </div>
                    <div>
                      <TextFormField
                        {...field("home_or_cfltc")}
                        type="text"
                        label="If yes was the deceased brought from home/CFLTC"
                      />
                    </div>
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <TextFormField
                        {...field("kottayam_confirmation_sent")}
                        type="text"
                        label="Whether NIV/IUBCR Kottayam confirmation sent"
                      />
                    </div>
                    <div>
                      <DateFormField
                        {...field("kottayam_sample_date")}
                        label="Sample sent to NIV/IUCBR Kottayam on"
                        position="LEFT"
                      />
                    </div>
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <TextFormField
                        {...field("cause_of_death")}
                        type="text"
                        label="Cause of death"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Form>
        </Page>
      )}
    </div>
  );
}
