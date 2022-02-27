import { PatientModel } from "../../Patient/models";
import { RightArrowIcon } from "../Icons/ArrowIcon";

export interface ITeleICUPatientVitalsCardProps {
  patient: PatientModel;
}

export default function TeleICUPatientVitalsCard({
  patient,
}: ITeleICUPatientVitalsCardProps) {
  return (
    <div className="lg:w-6/12 w-full p-5 py-3">
      <h4 className="flex items-center mb-2">
        <span className="font-semibold text-xl">Vitals</span>
        <span className="ml-2">
          <RightArrowIcon className="text-gray-900" />
        </span>
      </h4>
      <div className="grid grid-cols-2 gap-2 my-2">
        <div className="bg-white rounded-md p-3 text-center">
          <h2 className="text-2xl md:text-4xl font-bold">
            {patient.last_consultation?.last_daily_round?.temperature
              ? `${patient.last_consultation?.last_daily_round?.temperature} F`
              : "N/A"}
          </h2>
          <span className="font-medium text-primary-900 md:text-lg text-sm">
            Temperature
          </span>
        </div>
        <div className="bg-white rounded-md p-3 text-center">
          <h2 className="text-2xl md:text-4xl font-bold">
            {patient.last_consultation?.last_daily_round?.bp?.mean
              ? `${patient.last_consultation?.last_daily_round?.bp.systolic} / ${patient.last_consultation?.last_daily_round?.bp.diastolic}`
              : "N/A"}
          </h2>
          <span className="font-medium text-primary-900 md:text-lg text-sm">
            Blood Pressure
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 my-2">
        <div className="bg-white rounded-md p-3 text-center">
          <h2 className="text-2xl md:text-4xl font-bold">
            {patient.last_consultation?.last_daily_round?.resp ?? "N/A"}
          </h2>
          <span className="font-medium text-primary-900 md:text-lg text-sm">
            R. Rate
          </span>
        </div>
        <div className="bg-white rounded-md p-3 text-center">
          <h2 className="text-2xl md:text-4xl font-bold">
            {patient.last_consultation?.last_daily_round?.spo2 ?? "N/A"}
          </h2>
          <span className="font-medium text-primary-900 md:text-lg text-sm">
            SpO<sub>2</sub>
          </span>
        </div>
        <div className="bg-white rounded-md p-3 text-center">
          <h2 className="text-2xl md:text-4xl font-bold">
            {patient.last_consultation?.last_daily_round?.pulse ?? "N/A"}
          </h2>
          <span className="font-medium text-primary-900 md:text-lg text-sm">
            Heart Rate
          </span>
        </div>
      </div>
    </div>
  );
}
