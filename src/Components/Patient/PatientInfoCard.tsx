import { Link } from "raviger";
import { getDimensionOrDash } from "../../Common/utils";
import { PatientModel } from "./models";
import { Modal } from "@material-ui/core";
import Beds from "../Facility/Consultations/Beds";
import { useState } from "react";
import { PatientCategoryTailwindClass } from "../../Common/constants";
import { PatientCategory } from "../Facility/models";

const PatientCategoryDisplayText: Record<PatientCategory, string> = {
  "Comfort Care": "COMFORT CARE",
  Stable: "STABLE",
  "Slightly Abnormal": "SLIGHTLY ABNORMAL",
  Critical: "CRITICAL",
  unknown: "UNKNOWN",
};

export default function PatientInfoCard(props: {
  patient: PatientModel;
  ip_no?: string | undefined;
  fetchPatientData?: (state: { aborted: boolean }) => void;
}) {
  const [open, setOpen] = useState(false);

  const patient = props.patient;
  const ip_no = props.ip_no;

  const category: PatientCategory =
    patient?.last_consultation?.category || "unknown";
  const categoryClass = PatientCategoryTailwindClass[category];

  return (
    <section className="flex items-center lg:flex-row flex-col space-y-3 lg:space-y-0 lg:space-x-2 justify-between">
      <Modal
        className="top-0 left-0 flex items-center justify-center"
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="bg-white h-screen w-screen md:h-auto md:w-[800px] md:max-h-[90vh] overflow-auto p-4 mx-auto md:rounded-xl">
          {patient?.facility &&
          patient?.id &&
          patient?.last_consultation?.id ? (
            <Beds
              facilityId={patient?.facility}
              patientId={patient?.id}
              discharged={!patient.is_active}
              consultationId={patient?.last_consultation?.id}
              smallLoader={true}
              setState={setOpen}
              fetchPatientData={props.fetchPatientData}
            />
          ) : (
            <div>Invalid Patient Data</div>
          )}
        </div>
      </Modal>
      <div className="bg-white px-4 py-2 lg:p-6 flex flex-col lg:flex-row lg:w-7/12 w-full">
        {/* Can support for patient picture in the future */}
        <div className="mt-2 flex flex-col items-center">
          <div
            className={`w-24 h-24 min-w-[5rem] bg-gray-200 ${categoryClass}-profile`}
          >
            {patient?.last_consultation &&
            patient?.last_consultation?.current_bed ? (
              <div
                className="flex flex-col items-center justify-center h-full"
                title={`
                ${patient?.last_consultation?.current_bed?.bed_object?.location_object?.name}\n${patient?.last_consultation?.current_bed?.bed_object.name}
              `}
              >
                <p className="overflow-hidden px-2 whitespace-nowrap w-full text-gray-900 text-sm text-center text-ellipsis ">
                  {
                    patient?.last_consultation?.current_bed?.bed_object
                      ?.location_object?.name
                  }
                </p>
                <p className="w-full text-base px-2 text-ellipsis overflow-hidden whitespace-nowrap font-bold text-center">
                  {patient?.last_consultation?.current_bed?.bed_object.name}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <i className="fas fa-user-injured text-3xl text-gray-500"></i>
              </div>
            )}
          </div>
          {category !== "unknown" && (
            <div
              className={`text-xs font-bold rounded-b w-24 text-center pb-1 px-2 ${categoryClass}`}
            >
              {PatientCategoryDisplayText[category]}
            </div>
          )}
          <button
            className="text-sm text-primary-600 hover:bg-gray-300 p-2 rounded m-1"
            onClick={() => setOpen(true)}
          >
            {!patient.is_active
              ? "Bed History"
              : !patient.last_consultation?.current_bed
              ? "Assign Bed"
              : "Switch Bed"}
          </button>
        </div>
        <div className="flex flex-col lg:pl-6 items-center lg:items-start gap-4 lg:gap-0">
          <div className="sm:text-xl md:text-4xl font-semibold mb-1">
            {patient.name}
          </div>
          <div>
            {/* TODO: Re-enable Review Missed | Temporary Hack for Launch */}
            {/* {patient.review_time &&
              !patient.last_consultation?.discharge_date &&
              Number(patient.last_consultation?.review_interval) > 0 && (
                <div
                  className={
                    "mb-2 inline-flex items-center px-3 py-1 rounded-lg text-xs leading-4 font-semibold p-1 w-full justify-center border-gray-500 border " +
                    (moment().isBefore(patient.review_time)
                      ? " bg-gray-100"
                      : " p-1 bg-red-400 text-white")
                  }
                >
                  <i className="mr-2 text-md fas fa-clock"></i>
                  {(moment().isBefore(patient.review_time)
                    ? "Review before: "
                    : "Review Missed: ") +
                    moment(patient.review_time).format("lll")}
                </div>
              )} */}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-1 lg:mb-2">
            <Link
              href={`/facility/${patient.facility_object?.id}`}
              className="font-semibold text-black hover:text-primary-600"
            >
              <i
                className="text-primary-400 fas fa-hospital mr-1"
                aria-hidden="true"
              ></i>
              {patient.facility_object?.name}
            </Link>
            {ip_no && (
              <span className="md:col-span-2 capitalize pl-2">
                <span className="badge badge-pill badge-primary">
                  {`IP: ${ip_no}`}
                </span>
              </span>
            )}
          </div>
          {!patient.is_active && (
            <p className="bg-red-100 text-red-600 inline-block rounded-lg px-2 py-1 my-1 text-sm">
              Discharged from CARE
            </p>
          )}
          <p className="text-sm sm:text-sm text-gray-900">
            <span>{patient.age} years</span>
            <span className="mx-2">•</span>
            <span>{patient.gender}</span>
          </p>
          <div className="text-sm flex flex-col sm:flex-row items-center gap-2 lg:mt-4">
            {[
              ["Blood Group", patient.blood_group, patient.blood_group],
              [
                "Weight",
                getDimensionOrDash(patient.last_consultation?.weight, " kg"),
                true,
              ],
              [
                "Height",
                getDimensionOrDash(patient.last_consultation?.height, "cm"),
                true,
              ],
            ].map((stat, i) => {
              return stat[2] ? (
                <div
                  key={"patient_stat_" + i}
                  className="bg-gray-200 border-gray-500 border py-1 px-2 rounded-lg text-xs"
                >
                  <b>{stat[0]}</b> : {stat[1]}
                </div>
              ) : (
                ""
              );
            })}
          </div>
        </div>
      </div>
      <div className="w-full lg:w-fit flex gap-2 flex-col px-4 py-1 lg:p-6">
        {[
          [
            `/facility/${patient.facility}/patient/${patient.id}/consultation/${patient.last_consultation?.id}/update`,
            "Edit Consultation Details",
            "pencil-alt",
            patient.is_active && patient.last_consultation?.id,
          ],
          [
            `/facility/${patient.facility}/patient/${patient.id}/consultation/${patient.last_consultation?.id}/daily-rounds`,
            "Log Update",
            "plus",
            patient.is_active && patient.last_consultation?.id,
          ],
          [
            `/patient/${patient.id}/investigation_reports`,
            "Investigation Summary",
            "address-card",
            true,
          ],
          [
            `/facility/${patient.facility}/patient/${patient.id}/consultation/${patient.last_consultation?.id}/treatment-summary`,
            "Treatment Summary",
            "prescription-bottle-medical",
            patient.last_consultation?.id,
          ],
        ].map(
          (action, i) =>
            action[3] && (
              <Link
                key={i}
                href={`${action[0]}`}
                className="btn btn-primary hover:text-white flex justify-start"
              >
                <i className={`fas fa-${action[2]} w-4 mr-3`}></i>
                <p className="font-semibold">{action[1]}</p>
              </Link>
            )
        )}
      </div>
    </section>
  );
}
