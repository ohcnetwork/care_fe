import { classNames, formatDate } from "../../Utils/utils";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useCallback, useState } from "react";

import ButtonV2 from "../Common/components/ButtonV2";
import Page from "../Common/components/Page";
import { SampleReportModel } from "./models";
import loadable from "@loadable/component";
import { sampleReport } from "../../Redux/actions";
import { useDispatch } from "react-redux";

const Loading = loadable(() => import("../Common/Loading"));

interface ISamplePreviewProps {
  id: string;
  sampleId: string;
}

interface ISampleReportSectionProps {
  title: string;
  fields: {
    title: string;
    value: string | undefined | null;
  }[];
}

function SampleReportSection({ title, fields }: ISampleReportSectionProps) {
  return (
    <>
      <div className="flex justify-center font-medium bg-gray-700 text-white py-2 border border-b-0 border-gray-800">
        <h6 className="text-lg">{title}</h6>
      </div>
      <div className="grid grid-cols-2 border-b border-gray-800">
        {fields.map((field, i) => (
          <div
            className={classNames(
              "flex border-b border-gray-800",
              i % 2 === 0 && "border-x"
            )}
          >
            <div className="w-[65%] border-r border-gray-800 py-2">
              <p className="text-right font-semibold pr-2 pl-1 mr-2.5">
                {field.title}
              </p>
            </div>
            <div className="w-[35%] py-2">
              <p className="text-left pl-2 pr-1 whitespace-pre-wrap break-words">
                {field.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function SampleReport(props: ISamplePreviewProps) {
  const dispatch: any = useDispatch();
  const { id, sampleId } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [sampleData, setSampleData] = useState<SampleReportModel>({});

  let report: JSX.Element = <></>;
  let reportData: JSX.Element = <></>;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res: any = await dispatch(sampleReport(id, sampleId));

      if (!status.aborted) {
        if (res && res.data) {
          setSampleData(res.data);
        }
      }
      setIsLoading(false);
    },
    [dispatch, id]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  if (sampleData) {
    reportData = (
      <>
        <div className="m-2 pt-2 flex justify-end print:hidden">
          <ButtonV2 variant="primary" onClick={window.print}>
            Print Report
          </ButtonV2>
        </div>
        <div className="block h-screen" id="section-to-print">
          <div className="flex flex-col">
            <div className="flex justify-between items-center border border-gray-800">
              <div className="flex justify-start p-2"></div>
              <div className="flex justify-end">
                <div className="p-2">
                  <img
                    src="https://cdn.coronasafe.network/ohc_logo_green.png"
                    className="max-w-[400px] h-[50px] object-contain"
                    alt="Open HealthCare Network"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-start border border-t-0 border-gray-800">
              <div className="w-full p-5 py-2 text-black">
                <p className="font-bold text-lg">
                  ICMR Specimen Referral Data for COVID-19 (SARS-CoV2)
                </p>
              </div>
            </div>
            <div className="py-2 flex justify-center border border-t-0 border-gray-800">
              <h6 className="font-semibold text-lg text-danger-500">
                FOR INTERNAL USE ONLY
              </h6>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-center font-medium bg-black text-white py-2 border border-b-0 border-gray-800">
                <h6 className="text-lg">Sample Id : {sampleId}</h6>
              </div>
              <div className="flex justify-center font-medium bg-black text-white py-2 border border-b-0 border-gray-800">
                <h6 className="text-lg">Patient Id : {id}</h6>
              </div>
              <div
                className="border-4 border-black"
                style={{ border: "solid 5px black" }}
              >
                <div className="flex justify-center font-medium bg-gray-900 text-white py-2 border border-b-0 border-gray-800">
                  <h6 className="text-lg">SECTION A - MANDATORY FIELDS</h6>
                </div>
                <SampleReportSection
                  title="A.1 PERSON DETAILS"
                  fields={[
                    {
                      title: "Patient Name",
                      value: sampleData?.personal_details?.name,
                    },
                    {
                      title: "Age",
                      value: `${sampleData?.personal_details?.age_years} years ${sampleData?.personal_details?.age_months} Months`,
                    },
                    {
                      title: "Present Patient Village or Town",
                      value: sampleData?.personal_details?.local_body_name,
                    },
                    {
                      title: "Gender",
                      value: sampleData?.personal_details?.gender,
                    },
                    {
                      title: "Mobile Number (Self)",
                      value: sampleData?.personal_details?.phone_number,
                    },
                    {
                      title: "District of Present Residence",
                      value: sampleData?.personal_details?.district_name,
                    },
                    {
                      title: "State Of Present Residence",
                      value: sampleData?.personal_details?.state_name,
                    },
                    { title: "Nationality", value: "Indian" },
                  ]}
                />

                <SampleReportSection
                  title="A.2 SPECIMEN INFORMATION FROM REFERRING AGENCY"
                  fields={[
                    {
                      title: "Collection Date",
                      value: sampleData?.specimen_details?.created_date
                        ? formatDate(sampleData?.specimen_details?.created_date)
                        : "NA",
                    },
                    {
                      title: "Label",
                      value: sampleData?.specimen_details?.icmr_label,
                    },
                    {
                      title: "Sample Repeated",
                      value:
                        sampleData?.specimen_details?.is_repeated_sample !==
                        null
                          ? sampleData?.specimen_details?.is_repeated_sample
                            ? "Yes"
                            : "No"
                          : "NA",
                    },
                    {
                      title: "Sample Collection Facility Name",
                      value: sampleData?.medical_conditions?.hospital_name,
                    },
                    {
                      title: "Collection Facility Pin code",
                      value: sampleData?.medical_conditions?.hospital_pincode,
                    },
                  ]}
                />

                <SampleReportSection
                  title="A.3 Patient Category"
                  fields={[
                    {
                      title:
                        sampleData?.specimen_details?.icmr_category || "Cat 0",
                      value: (() => {
                        switch (sampleData?.specimen_details?.icmr_category) {
                          case "Cat 0":
                            return "Repeat Sample of Positive Case / Follow Up case";
                          case "Cat 1":
                            return "Symptomatic International Traveller in last 14 days";
                          case "Cat 2":
                            return "Symptomatic contact of lab confirmed Case";
                          case "Cat 3":
                            return "Symptomatic Healthcare Worker";
                          case "Cat 4":
                            return "Hospitalized SARI (Severe Acute Respiratory illness Patient)";
                          case "Cat 5a":
                            return "Asymptomatic Direct and High Risk contact of confirmed case - family Member";
                          case "Cat 5b":
                            return "Asymptomatic Healthcare worker in contact with confimred case without adequete protection";
                        }
                      })(),
                    },
                  ]}
                />

                <div className="flex justify-center font-medium bg-gray-900 text-white py-2 border border-b-0 border-gray-800">
                  <h6 className="text-lg">
                    SECTION B - OTHER FIELDS TO BE UPDATED
                  </h6>
                </div>

                <SampleReportSection
                  title="B.1 PERSON DETAILS"
                  fields={[
                    {
                      title: "Present Patient Address",
                      value: sampleData?.personal_details?.address,
                    },
                    {
                      title: "Pin code",
                      value: sampleData?.personal_details?.pincode,
                    },
                    {
                      title: "Email Id",
                      value: sampleData?.personal_details?.email,
                    },
                    {
                      title: "Date Of Birth",
                      value: sampleData?.personal_details?.date_of_birth,
                    },
                    { title: "Patient Aadhar Number", value: "............." },
                    {
                      title: "Patient Passport Number",
                      value: sampleData?.personal_details?.passport_no,
                    },
                  ]}
                />

                <SampleReportSection
                  title="B.2 EXPOSURE HISTORY ( 2 WEEKS BEFORE THE ONSET OF SYMPTOMS )"
                  fields={[
                    {
                      title: "Travel to foreign country in last 14 days",
                      value:
                        sampleData?.exposure_history
                          ?.has_travel_to_foreign_last_14_days !== null
                          ? sampleData?.exposure_history
                              ?.has_travel_to_foreign_last_14_days
                            ? "Yes"
                            : "No"
                          : "NA",
                    },
                    {
                      title: "Places of travel",
                      value:
                        sampleData?.exposure_history?.places_of_travel?.join(
                          ", "
                        ),
                    },
                    {
                      title: "Travel Start Date",
                      value: sampleData?.exposure_history?.travel_start_date,
                    },
                    {
                      title: "Travel End Date",
                      value: sampleData?.exposure_history?.travel_end_date,
                    },
                    {
                      title: "In Contact with lab confimed Covid 19 Patient",
                      value:
                        sampleData?.exposure_history
                          ?.contact_with_confirmed_case !== null
                          ? sampleData.exposure_history
                              ?.contact_with_confirmed_case
                            ? "Yes"
                            : "No"
                          : "NA",
                    },
                    {
                      title: "Name of Confirmed Contacted Covid Patient",
                      value: sampleData?.exposure_history?.contact_case_name,
                    },
                    {
                      title: "Quarantine Status",
                      value:
                        sampleData?.exposure_history?.was_quarantined !== null
                          ? sampleData?.exposure_history?.was_quarantined
                            ? "Yes"
                            : "No"
                          : "NA",
                    },
                    {
                      title: "Quarantine Location",
                      value: sampleData?.exposure_history?.quarantined_type,
                    },
                    {
                      title:
                        "Health care worker working in a hospital involved in managing patients",
                      value:
                        sampleData?.exposure_history?.healthcare_worker !== null
                          ? sampleData?.exposure_history?.healthcare_worker
                            ? "Yes"
                            : "No"
                          : "NA",
                    },
                  ]}
                />

                <SampleReportSection
                  title="B.3 CLINICAL SYMPTOMS AND SIGNS"
                  fields={[
                    {
                      title: "Date of Onset of Symptoms",
                      value:
                        sampleData?.medical_conditions
                          ?.date_of_onset_of_symptoms,
                    },
                    {
                      title: "Symptoms",
                      value:
                        sampleData?.medical_conditions?.symptoms?.join(", "),
                    },
                    { title: "First Symptom", value: "............." },
                    {
                      title: "Person has Severe Acute Respiratory illness",
                      value:
                        sampleData?.medical_conditions?.has_sari !== null
                          ? sampleData?.medical_conditions?.has_sari
                            ? "Yes"
                            : "No"
                          : "NA",
                    },
                    {
                      title: "Person Has Acute Respiratory Illness",
                      value:
                        sampleData?.medical_conditions?.has_ari !== null
                          ? sampleData?.medical_conditions?.has_ari
                            ? "Yes"
                            : "No"
                          : "NA",
                    },
                  ]}
                />

                <SampleReportSection
                  title="B.4 UNDERLYING MEDICAL CONDITIONS"
                  fields={[
                    {
                      title: "Medical Conditions",
                      value:
                        sampleData?.medical_conditions?.medical_conditions_list?.join(
                          ", "
                        ),
                    },
                  ]}
                />

                <SampleReportSection
                  title="B.5 HOSPITALIZATION , TREATMENT AND INVESTIGATION"
                  fields={[
                    {
                      title: "Hospitalization Date",
                      value:
                        sampleData?.medical_conditions?.hospitalization_date,
                    },
                    {
                      title: "Diagnosis",
                      value: sampleData?.medical_conditions?.diagnosis,
                    },
                    {
                      title: "Differential diagnosis",
                      value: sampleData?.medical_conditions?.diff_diagnosis,
                    },
                    {
                      title: "Etiology Identified",
                      value:
                        sampleData?.medical_conditions?.etiology_identified,
                    },
                    {
                      title: "Asypical Presentation",
                      value:
                        sampleData?.medical_conditions
                          ?.is_atypical_presentation !== null
                          ? sampleData?.medical_conditions
                              ?.is_atypical_presentation
                            ? "Yes"
                            : "No"
                          : "NA",
                    },
                    {
                      title: "Unusual or Unexpected Course",
                      value:
                        sampleData?.medical_conditions?.is_unusual_course !==
                        null
                          ? sampleData?.medical_conditions?.is_unusual_course
                            ? "Yes"
                            : "No"
                          : "NA",
                    },
                    {
                      title: "Hospital Name / Address",
                      value: sampleData?.medical_conditions?.hospital_name,
                    },
                    {
                      title: "Hospital Phone Number",
                      value:
                        sampleData?.medical_conditions?.hospital_phone_number,
                    },
                    {
                      title: "Name of Doctor",
                      value: sampleData?.medical_conditions?.doctor_name,
                    },
                    {
                      title: "Signature & Date",
                      value: "",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  if (isLoading) {
    report = (
      <div className="flex justify-center print:hidden h-screen">
        <Loading />
      </div>
    );
  } else if (sampleData && reportData) {
    report = reportData;
  } else if (!sampleData) {
    report = (
      <div className="flex justify-center print:hidden h-screen">
        <h5 className="text-lg font-semibold self-center">No Data Found</h5>
      </div>
    );
  }
  return (
    <div className="w-full">
      <Page title="Sample Report" backUrl={`/sample/${sampleId}`}>
        {report}
      </Page>
    </div>
  );
}
