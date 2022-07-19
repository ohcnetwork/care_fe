import { Link } from "raviger";
import { getDimensionOrDash } from "../../../Common/utils";
import { PatientModel } from "../../Patient/models";
import { Modal } from "@material-ui/core";
import Beds from "../../Facility/Consultations/Beds";
import { useState } from "react";

export default function TeleICUPatientInfoCard(props: {
  patient: PatientModel;
  ip_no?: string | undefined;
}) {
  const [open, setOpen] = useState(false);

  const patient = props.patient;
  const ip_no = props.ip_no;

  console.log(patient);
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
            />
          ) : (
            <div>Invalid Patient Data</div>
          )}
        </div>
      </Modal>
      <div className="bg-white p-6 flex lg:w-7/12 w-full">
        {/* Can support for patient picture in the future */}
        <div className="text-center mt-2">
          <div className="w-24 h-24 rounded-2xl bg-primary-100 text-5xl flex justify-center items-center">
            {!patient.last_consultation?.current_bed ? (
              <i className="fas fa-user-injured text-primary-600"></i>
            ) : (
              <span className="text-base text-primary-600 font-semibold whitespace-normal leading-tight">
                {patient.last_consultation?.current_bed?.bed_object?.name}
              </span>
            )}
          </div>
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
        <div className="pl-6">
          <p className="sm:text-xl md:text-4xl font-bold mb-1">
            {patient.name}
          </p>
          <div className="flex align-center mb-2">
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
            <div className="bg-red-100 text-red-600 inline-block mb-3 rounded-lg px-2 py-1 text-sm">
              Discharged from CARE
            </div>
          )}
          <p className="text-sm sm:text-sm text-gray-900">
            <span>{patient.age} years</span>
            <span className="mx-2">•</span>
            <span>{patient.gender}</span>
          </p>
          <div className="text-sm flex flex-wrap gap-2 mt-4">
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
      <div className="flex gap-2 flex-col bg-gray-100 p-6">
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
                className="btn btn-primary justify-start hover:text-white"
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
