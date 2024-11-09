import dayjs from "dayjs";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Page from "@/components/Common/Page";
import Form from "@/components/Form/Form";
import DateFormField from "@/components/Form/FormFields/DateFormField";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";

import { GENDER_TYPES } from "@/common/constants";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import {
  formatDateTime,
  formatPatientAge,
  humanizeStrings,
} from "@/Utils/utils";

type DeathReport = {
  name?: string;
  age?: string | number;
  gender?: string;
  address?: string;
  phone_number?: string;
  is_declared_positive?: string;
  date_declared_positive: Date | string;
  test_type?: string;
  date_of_test?: Date | string;
  date_of_result?: Date | string;
  srf_id?: string;
  hospital_tested_in?: string;
  hospital_died_in?: string;
  date_of_admission?: Date | string;
  date_of_death?: Date | string;
  comorbidities?: string;
  history_clinical_course?: string;
  brought_dead?: string;
  home_or_cfltc?: string;
  is_vaccinated?: string;
  kottayam_confirmation_sent?: string;
  kottayam_sample_date?: Date | string;
  cause_of_death?: string;
  facility?: string;
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
  const [isPrintMode, setIsPrintMode] = useState(false);
  const { id } = props;
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
      return humanizeStrings(
        patientData.medical_history.map((item: any) => item.disease),
      );
    } else {
      return "None";
    }
  };

  const { loading: _isLoading } = useQuery(routes.getPatient, {
    pathParams: { id },
    onResponse(res) {
      if (res.res?.ok && res) {
        setPatientName(res.data?.name ?? "");
        const patientGender = getPatientGender(res.data);
        const patientAddress = getPatientAddress(res.data);
        const patientComorbidities = getPatientComorbidities(res.data);
        const data = {
          ...res.data,
          age: formatPatientAge(res.data!, true),
          gender: patientGender,
          address: patientAddress,
          comorbidities: patientComorbidities,
          is_declared_positive: res.data?.is_declared_positive ? "Yes" : "No",
          is_vaccinated: res.data?.is_vaccinated ? "Yes" : "No",
          cause_of_death: res.data?.last_consultation?.discharge_notes || "",
          hospital_died_in: res.data?.last_consultation?.facility_name,
          date_declared_positive: res.data?.date_declared_positive
            ? dayjs(res.data?.date_declared_positive).toDate()
            : "",
          date_of_admission: res.data?.last_consultation?.encounter_date
            ? dayjs(res.data?.last_consultation?.encounter_date).toDate()
            : "",
          date_of_test: res.data?.date_of_test
            ? dayjs(res.data?.date_of_test).toDate()
            : "",
          date_of_result: res.data?.date_of_result
            ? dayjs(res.data?.date_of_result).toDate()
            : "",
          date_of_death: res.data?.last_consultation?.death_datetime
            ? dayjs(res.data?.last_consultation?.death_datetime).toDate()
            : "",
        };
        setPatientData(data);
      }
    },
  });

  const previewData = () => (
    <div className="my-4">
      <div className="my-4 flex justify-end">
        <button
          id="print-deathreport"
          onClick={(_) => window.print()}
          className="btn btn-primary mr-2"
        >
          <CareIcon icon="l-print" className="mr-2 text-lg" /> Print Death
          Report
        </button>
        <button
          onClick={(_) => setIsPrintMode(false)}
          className="btn btn-default"
        >
          <CareIcon icon="l-times" className="mr-2 text-lg" /> Close
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
          title={t("covid_19_death_reporting_form_1")}
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
                        type="text"
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
                        label={t("is_declared_positive")}
                      />
                    </div>
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <DateFormField
                        {...field("date_declared_positive")}
                        label={t("date_declared_positive")}
                        className="w-full"
                        disableFuture
                      />
                    </div>
                    <div>
                      <TextFormField
                        {...field("test_type")}
                        type="text"
                        label={t("test_type")}
                      />
                    </div>
                  </div>
                  <div className="md:mt-4 md:grid md:grid-cols-2 md:gap-10">
                    <div>
                      <DateFormField
                        {...field("date_of_test")}
                        label={t("date_of_test")}
                      />
                    </div>
                    <div>
                      <DateFormField
                        {...field("date_of_result")}
                        label={t("date_of_result")}
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
                        label={t("is_vaccinated")}
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
                        disableFuture
                      />
                    </div>
                    <div>
                      <DateFormField
                        {...field("date_of_death")}
                        label="Date of death"
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
