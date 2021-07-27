import { navigate } from "raviger";
import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getConsultation } from "../../Redux/actions";
import loadable from "@loadable/component";
import { ConsultationModel } from "./models";
import { PATIENT_CATEGORY, SYMPTOM_CHOICES } from "../../Common/constants";
import { FileUpload } from "../Patient/FileUpload";
import TreatmentSummary from "./TreatmentSummary";
import { PrimaryParametersPlot } from "./Consultations/PrimaryParametersPlot";
import { ABGPlots } from "./Consultations/ABGPlots";
import { DailyRoundsList } from "./Consultations/DailyRoundsList";
import { make as Link } from "../Common/components/Link.gen";
import { NursingPlot } from "./Consultations/NursingPlot";
import { NeurologicalTable } from "./Consultations/NeurologicalTables";
import { VentilatorPlot } from "./Consultations/VentilatorPlot";
import { IOBalancePlots } from "./Consultations/IOBalancePlots";
import { PressureSoreDiagrams } from "./Consultations/PressureSoreDiagrams";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));
const symptomChoices = [...SYMPTOM_CHOICES];
const patientCategoryChoices = [...PATIENT_CATEGORY];

export const ConsultationDetails = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const tab = props.tab.toUpperCase();
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [consultationData, setConsultationData] = useState<ConsultationModel>(
    {}
  );

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getConsultation(consultationId));
      if (!status.aborted) {
        if (res && res.data) {
          const data: ConsultationModel = {
            ...res.data,
            symptoms_text: "",
            category:
              patientCategoryChoices.find((i) => i.id === res.data.category)
                ?.text || res.data.category,
          };
          if (res.data.symptoms && res.data.symptoms.length) {
            const symptoms = res.data.symptoms
              .filter((symptom: number) => symptom !== 9)
              .map((symptom: number) => {
                const option = symptomChoices.find((i) => i.id === symptom);
                return option ? option.text.toLowerCase() : symptom;
              });
            data.symptoms_text = symptoms.join(", ");
            data.discharge_advice =
              Object.keys(res.data.discharge_advice).length === 0
                ? []
                : res.data.discharge_advice;
          }
          setConsultationData(data);
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch]
  );

  useAbortableEffect((status: statusType) => {
    fetchData(status);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  const tabButtonClasses = (selected: boolean) =>
    `capitalize cursor-pointer border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-300 font-bold ${
      selected === true ? "border-primary-500 text-primary-600 border-b-2" : ""
    }`;

  return (
    <div>
      {isPrintMode ? (
        <TreatmentSummary
          setIsPrintMode={setIsPrintMode}
          consultationData={consultationData}
          dailyRoundsListData={[]}
          patientId={patientId}
        />
      ) : (
        <div className="px-2 pb-2">
          <Link
            className="btn btn-default bg-white mt-2"
            href={`/facility/${facilityId}/patient/${patientId}`}
          >
            <i className="fas fa-chevron-left  rounded-md p-2 hover:bg-gray-200 mr-1"></i>
            {"Go back to Patient Page"}
          </Link>
          <div className="flex md:flex-row flex-col w-full mt-2">
            <div className="border rounded-lg bg-white shadow h-full text-black p-4 w-full">
              <div className="flex md:flex-row flex-col justify-between">
                <div>
                  <div className="flex md:flex-row flex-col md:items-center">
                    <div className="font-semibold text-3xl capitalize">
                      {consultationData.suggestion_text?.toLocaleLowerCase()}
                    </div>
                    <div className="text-sm md:mt-2 md:pl-2">
                      {` @${consultationData.facility_name}`}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {consultationData.category && (
                      <span className="badge badge-pill badge-warning">
                        {consultationData.category}
                      </span>
                    )}{" "}
                    {consultationData.ip_no && (
                      <div className="md:col-span-2 capitalize pl-2">
                        <span className="badge badge-pill badge-primary">
                          {`IP: ${consultationData.ip_no}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 border p-2 bg-gray-100">
                    <span className="font-semibold leading-relaxed text-gray-800 text-xs">
                      Symptoms from{" "}
                      {moment(consultationData.symptoms_onset_date).format(
                        "lll"
                      )}
                    </span>
                    <div className="capitalize">
                      {consultationData.symptoms_text || "-"}
                    </div>
                  </div>
                </div>
                {consultationData.admitted_to && (
                  <div className="border rounded-lg bg-gray-100 p-2 md:mt-0 mt-2">
                    <div className="border-b-2 py-1">
                      Patient
                      {consultationData.discharge_date
                        ? " Discharged from"
                        : " Admitted to"}
                      <span className="badge badge-pill badge-warning font-bold ml-2">
                        {consultationData.admitted_to}
                      </span>
                    </div>
                    {(consultationData.admission_date ||
                      consultationData.discharge_date) && (
                      <div className="text-3xl font-bold">
                        {moment(
                          consultationData.discharge_date
                            ? consultationData.discharge_date
                            : consultationData.admission_date
                        ).fromNow()}
                      </div>
                    )}
                    <div className="text-xs -mt-2">
                      {consultationData.admission_date &&
                        moment(consultationData.admission_date).format("lll")}
                      {consultationData.discharge_date &&
                        ` - ${moment(consultationData.discharge_date).format(
                          "lll"
                        )}`}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2">
                {consultationData.other_symptoms && (
                  <div className="capitalize">
                    <span className="font-semibold leading-relaxed">
                      Other Symptoms:{" "}
                    </span>
                    {consultationData.other_symptoms}
                  </div>
                )}

                {consultationData.diagnosis && (
                  <div className="text-sm w-full">
                    <span className="font-semibold leading-relaxed">
                      Diagnosis:{" "}
                    </span>
                    {consultationData.diagnosis}
                  </div>
                )}
                {consultationData.verified_by && (
                  <div className="text-sm mt-2">
                    <span className="font-semibold leading-relaxed">
                      Verified By:{" "}
                    </span>
                    <span className="badge badge-pill badge-primary">
                      {consultationData.verified_by}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col mt-2">
                <div className="text-sm text-gray-700">
                  Created on{" "}
                  {moment(consultationData.created_date).format("lll")}
                  {consultationData.created_by && (
                    <span>
                      {`by ${consultationData.created_by?.first_name} ${consultationData.created_by?.last_name} @${consultationData.created_by?.username} (${consultationData.created_by?.user_type})`}
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-700">
                  Last Modified on{" "}
                  {moment(consultationData.modified_date).format("lll")}{" "}
                  {consultationData.last_edited_by && (
                    <span>
                      by{" "}
                      {`${consultationData.last_edited_by?.first_name} ${consultationData.last_edited_by?.last_name} @${consultationData.last_edited_by?.username} (${consultationData.last_edited_by?.user_type})`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="md:px-2 px-0 md:py-0 py-2">
              <div className="border rounded-lg bg-white shadow h-full p-4 w-full">
                <div>
                  <button
                    className="btn btn-primary w-full"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/update`
                      )
                    }
                  >
                    Update Details
                  </button>
                </div>
                <div className="mt-2">
                  <button
                    className="btn btn-primary w-full"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${patientId}/shift/new`
                      )
                    }
                  >
                    SHIFT PATIENT
                  </button>
                </div>
                <div className="mt-2">
                  <button
                    className="btn btn-primary w-full"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/investigation/`
                      )
                    }
                  >
                    Create Investigation
                  </button>
                </div>
                <div className="mt-2">
                  <button
                    className="btn btn-primary w-full"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/investigationSessions`
                      )
                    }
                  >
                    View Investigations
                  </button>
                </div>

                {!consultationData.discharge_date && (
                  <div className="mt-2">
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => setIsPrintMode(true)}
                    >
                      Treatment Summary
                    </button>
                  </div>
                )}
                <div className="mt-2">
                  <button
                    className="btn btn-primary w-full"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds`
                      )
                    }
                  >
                    Log Update
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b-2 border-gray-200 mt-4">
            <div className="sm:flex sm:items-baseline">
              <div className="mt-4 sm:mt-0">
                <nav className="pl-2 flex space-x-8 overflow-y-auto pb-2">
                  {[
                    "INFO",
                    "SUMMARY",
                    "UPDATES",
                    "MEDICINES",
                    "FILES",
                    "ABG",
                    "NURSING",
                    "NEUROLOGICAL_MONITORING",
                    "VENTILATOR",
                    "IO_BALANCE",
                    "PRESSURE_SORE",
                  ].map((p: string) => (
                    <Link
                      key={p}
                      className={tabButtonClasses(tab === p)}
                      href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/${p.toLocaleLowerCase()}`}
                    >
                      {p.toLocaleLowerCase()}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
          {tab === "INFO" && (
            <div>
              {consultationData.examination_details && (
                <div className="bg-white overflow-hidden shadow rounded-lg mt-4">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                      Examination details and Clinical conditions:{" "}
                    </h3>
                    <div className="mt-2">
                      {consultationData.examination_details || "-"}
                    </div>
                  </div>
                </div>
              )}
              {consultationData.prescribed_medication && (
                <div className="bg-white overflow-hidden shadow rounded-lg mt-4">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                      Treatment Summary
                    </h3>
                    <div className="mt-2">
                      {consultationData.prescribed_medication || "-"}
                    </div>
                  </div>
                </div>
              )}

              {consultationData.consultation_notes && (
                <div className="bg-white overflow-hidden shadow rounded-lg mt-4">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                      Advice
                    </h3>
                    <div className="mt-2">
                      {consultationData.consultation_notes || "-"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "SUMMARY" && (
            <div className="mt-4">
              <PageTitle title="Primary Parameters Plot" hideBack={true} />
              <PrimaryParametersPlot
                facilityId={facilityId}
                patientId={patientId}
                consultationId={consultationId}
              ></PrimaryParametersPlot>
            </div>
          )}
          {tab === "UPDATES" && (
            <DailyRoundsList
              facilityId={facilityId}
              patientId={patientId}
              consultationId={consultationId}
              consultationData={consultationData}
            />
          )}
          {tab === "MEDICINES" && (
            <div>
              {consultationData.existing_medication && (
                <div className="bg-white overflow-hidden shadow rounded-lg mt-4">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                      Existing Medication:{" "}
                    </h3>
                    <div className="mt-2">
                      {consultationData.existing_medication || "-"}
                    </div>
                  </div>
                </div>
              )}
              {consultationData.discharge_advice && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold leading-relaxed text-gray-900">
                    Prescription
                  </h3>
                  <div className="flex flex-col">
                    <div className="-my-2 py-2 overflow-x-auto sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                      <div className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200">
                        <table className="min-w-full">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                Medicine
                              </th>
                              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                Dosage
                              </th>
                              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                Days
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {consultationData.discharge_advice.map(
                              (med: any, index: number) => (
                                <tr className="bg-white" key={index}>
                                  <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">
                                    {med.medicine}
                                  </td>
                                  <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                    {med.dosage}
                                  </td>
                                  <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                    {med.dosage}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "FILES" && (
            <div>
              <FileUpload
                facilityId={facilityId}
                patientId={patientId}
                consultationId={consultationId}
                type="CONSULTATION"
                hideBack={true}
                audio={true}
                unspecified={true}
              />
            </div>
          )}

          {tab === "ABG" && (
            <div>
              <PageTitle title="ABG Analysis Plot" hideBack={true} />
              <ABGPlots
                facilityId={facilityId}
                patientId={patientId}
                consultationId={consultationId}
              ></ABGPlots>
            </div>
          )}
          {tab === "NURSING" && (
            <div>
              <PageTitle title="Nursing Analysis" hideBack={true} />
              <NursingPlot
                facilityId={facilityId}
                patientId={patientId}
                consultationId={consultationId}
              ></NursingPlot>
            </div>
          )}
          {tab === "NEUROLOGICAL_MONITORING" && (
            <div>
              <PageTitle title="Neurological Monitoring" hideBack={true} />
              <NeurologicalTable
                facilityId={facilityId}
                patientId={patientId}
                consultationId={consultationId}
              ></NeurologicalTable>
            </div>
          )}
          {tab === "VENTILATOR" && (
            <div>
              <PageTitle title="Ventilator Parameters" hideBack={true} />
              <VentilatorPlot
                facilityId={facilityId}
                patientId={patientId}
                consultationId={consultationId}
              ></VentilatorPlot>
            </div>
          )}
          {tab === "IO_BALANCE" && (
            <div>
              <PageTitle title="IO Balance Plots" hideBack={true} />
              <IOBalancePlots consultationId={consultationId}></IOBalancePlots>
            </div>
          )}
          {tab === "PRESSURE_SORE" && (
            <div className="mt-4">
              <PageTitle title="Pressure Sore" hideBack={true} />
              <PressureSoreDiagrams
                consultationId={consultationId}
              ></PressureSoreDiagrams>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
