import { GENDER_TYPES } from "../../Common/constants";
import {
  formatDate,
  formatDateTime,
  formatPatientAge,
} from "../../Utils/utils";
import useSlug from "../../Common/hooks/useSlug";
import useAppHistory from "../../Common/hooks/useAppHistory";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import CareIcon from "../../CAREUI/icons/CareIcon";

const TreatmentSummary = (props: any) => {
  const { consultationId, patientId } = props;
  const date = new Date();
  const facilityId = useSlug("facility");
  const { goBack } = useAppHistory();
  const url = `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`;

  const { data: patientData } = useQuery(routes.getPatient, {
    pathParams: { id: patientId },
    prefetch: patientId !== undefined,
  });

  const { data: investigations } = useQuery(routes.getInvestigation, {
    pathParams: { consultation_external_id: consultationId },
    prefetch: consultationId !== undefined,
  });

  const { data: consultationData } = useQuery(routes.getConsultation, {
    pathParams: { id: consultationId },
    prefetch: consultationId !== undefined,
  });

  return (
    <div>
      <div className="my-4">
        <div className="my-4 flex flex-wrap justify-center gap-2 sm:justify-end">
          <button
            onClick={(_) => window.print()}
            className="btn btn-primary mr-2"
          >
            <CareIcon icon="l-print" className="mr-2" /> Print Treatment Summary
          </button>
          <button onClick={(_) => goBack(url)} className="btn btn-default">
            <CareIcon icon="l-times" className="mr-2" /> Close
          </button>
        </div>

        <div id="section-to-print" className="mx-5">
          <h2 className="text-center text-lg">
            {consultationData?.facility_name ?? ""}
          </h2>

          <h2 className="text-center text-lg">INTERIM TREATMENT SUMMARY</h2>

          <div className="text-right font-bold">{formatDate(date)}</div>

          <div className="mb-5 mt-2 border border-gray-800">
            <div className="grid border-b-2 border-gray-800 print:grid-cols-3 sm:grid-cols-2 print:md:grid-cols-3">
              <div className="col-span-1 border-b-2 border-gray-800 px-3 py-2 print:border-b-0 print:border-r-2 sm:border-b-0 sm:border-r-2">
                <b>Name :</b> {patientData?.name ?? ""}
              </div>
              <div className="col-span-1 px-3 py-2">
                <b>Address : </b> {patientData?.address ?? ""}
              </div>
            </div>

            <div className="grid border-b-2 border-gray-800 print:grid-cols-3 sm:grid-cols-2 print:md:grid-cols-3">
              <div className="col-span-1 grid print:grid-cols-2 sm:grid-cols-2 ">
                <div className="col-span-1 border-b-2 border-gray-800 px-3 py-2 print:border-b-0 print:border-r-2 sm:border-b-0 sm:border-r-2">
                  <b>Age :</b>{" "}
                  {patientData ? formatPatientAge(patientData, true) : ""}
                </div>
                <div className="col-span-1 border-b-2 border-gray-800 px-3 py-2 print:border-b-0 print:border-r-2 sm:border-b-0 sm:border-r-2">
                  <b>OP :</b> {consultationData?.patient_no ?? ""}
                </div>
              </div>

              <div className="col-span-1 px-3 py-2">
                <b>Date of admission : </b>
                <span>
                  {consultationData?.admitted
                    ? formatDateTime(consultationData.encounter_date)
                    : " --/--/----"}
                </span>
              </div>
            </div>

            <div className="grid border-b-2 border-gray-800 print:grid-cols-3 sm:grid-cols-2 print:md:grid-cols-3">
              <div className="col-span-1 border-b-2 border-gray-800 px-3 py-2 print:border-b-0 print:border-r-2 sm:border-b-0 sm:border-r-2">
                <b>Gender : </b>
                {GENDER_TYPES.find((i) => i.id === patientData?.gender)?.text}
              </div>

              <div className="col-span-1 px-3 py-2">
                <b>Contact person :</b>
                <span>
                  {" "}
                  {patientData?.emergency_phone_number
                    ? patientData.emergency_phone_number
                    : "   -"}
                </span>
              </div>
            </div>

            <div className="border-b-2 border-gray-800 px-5 py-2">
              <b>Comorbidities :</b>
              <div className="mx-0 print:mx-5 sm:mx-5">
                <table className="w-full border-collapse border border-gray-800">
                  <thead>
                    <tr>
                      <th className="border border-gray-800">Disease</th>
                      <th className="border border-gray-800">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientData?.medical_history &&
                    patientData.medical_history.length > 0 ? (
                      patientData.medical_history.map(
                        (obj: any, index: number) => {
                          return (
                            <tr key={index}>
                              <td className="border border-gray-800 text-center">
                                {obj["disease"]}
                              </td>
                              <td className="border border-gray-800 text-center">
                                {obj["details"] ? obj["details"] : "---"}
                              </td>
                            </tr>
                          );
                        }
                      )
                    ) : (
                      <tr>
                        <td className="border border-gray-800 text-center">
                          ---
                        </td>
                        <td className="border border-gray-800 text-center">
                          ---
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-b-2 border-gray-800 px-5 py-2">
              <b>Diagnosis :</b>
              <div className="mx-5">
                <div>
                  <b>History of present illness :</b>
                  {consultationData?.history_of_present_illness
                    ? consultationData.history_of_present_illness
                    : "    ---"}
                </div>

                <div>
                  <b>Examination details and clinical conditions :</b>
                  {consultationData?.examination_details
                    ? consultationData.examination_details
                    : "    ---"}
                </div>

                <div>
                  <b>Physical Examination info :</b>
                  {consultationData?.last_daily_round?.physical_examination_info
                    ? consultationData.last_daily_round
                        ?.physical_examination_info
                    : "    ---"}
                </div>
              </div>
            </div>

            <div className="border-b-2 border-gray-800 px-5 py-2">
              <b>General Instructions :</b>
              {patientData?.last_consultation?.consultation_notes ? (
                <div className="mx-5">
                  {patientData.last_consultation.consultation_notes}
                </div>
              ) : (
                " ---"
              )}
            </div>

            <div className="border-b-2 border-gray-800 px-5 py-2">
              <b>Relevant investigations :</b>

              <div className="mx-0 overflow-x-auto print:mx-5 sm:mx-5">
                <table className="w-full border-collapse border border-gray-800">
                  <thead>
                    <tr>
                      <th className="border border-gray-800 text-center">
                        Date
                      </th>
                      <th className="border border-gray-800 text-center">
                        Name
                      </th>
                      <th className="border border-gray-800 text-center">
                        Result
                      </th>
                      <th className="border border-gray-800 text-center">
                        Ideal value
                      </th>
                      <th className="border border-gray-800 text-center">
                        values range
                      </th>
                      <th className="border border-gray-800 text-center">
                        unit
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {investigations && investigations.results.length > 0 ? (
                      investigations.results.map(
                        (value: any, index: number) => {
                          return (
                            <tr key={index}>
                              <td className="border border-gray-800 text-center">
                                {formatDate(
                                  value["session_object"][
                                    "session_created_date"
                                  ]
                                )}
                              </td>
                              <td className="border border-gray-800 text-center">
                                {value["investigation_object"]["name"]}
                              </td>
                              <td className="border border-gray-800 text-center">
                                {value["notes"] || value["value"]}
                              </td>
                              <td className="border border-gray-800 text-center">
                                {value["investigation_object"]["ideal_value"] ||
                                  "-"}
                              </td>
                              <td className="border border-gray-800 text-center">
                                {value["investigation_object"]["min_value"]} -{" "}
                                {value["investigation_object"]["max_value"]}
                              </td>
                              <td className="border border-gray-800 text-center">
                                {value["investigation_object"]["unit"] || "-"}
                              </td>
                            </tr>
                          );
                        }
                      )
                    ) : (
                      <tr>
                        <td className="border border-gray-800 text-center">
                          ---
                        </td>
                        <td className="border border-gray-800 text-center">
                          ---
                        </td>
                        <td className="border border-gray-800 text-center">
                          ---
                        </td>
                        <td className="border border-gray-800 text-center">
                          ---
                        </td>
                        <td className="border border-gray-800 text-center">
                          ---
                        </td>
                        <td className="border border-gray-800 text-center">
                          ---
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-b-2 border-gray-800 px-5 py-2">
              <b>Treatment :</b>
              {consultationData?.treatment_plan ? (
                <p className="ml-4">{consultationData.treatment_plan}</p>
              ) : (
                <p className="ml-4">---</p>
              )}
              <b className="mb-2">Treatment summary/Treament Plan :</b>

              <div className="mx-0 overflow-x-auto print:mx-5 sm:mx-5">
                <table className="w-full border-collapse border border-gray-800">
                  <thead>
                    <tr>
                      <th className="border border-gray-800">Date</th>
                      <th className="border border-gray-800">Spo2</th>
                      <th className="border border-gray-800">Temperature</th>
                    </tr>
                  </thead>

                  <tbody>
                    {consultationData?.last_daily_round ? (
                      <tr>
                        <td className="border border-gray-800 text-center">
                          {formatDateTime(
                            consultationData.last_daily_round.modified_date
                          )}
                        </td>
                        <td className="border border-gray-800 text-center">
                          {consultationData.last_daily_round.ventilator_spo2 ||
                            "-"}
                        </td>
                        <td className="border border-gray-800 text-center">
                          {consultationData.last_daily_round.temperature || "-"}
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="border border-gray-800 text-center">
                          ---
                        </td>
                        <td className="border border-gray-800 text-center">
                          ---
                        </td>
                        <td className="border border-gray-800 text-center">
                          ---
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentSummary;
