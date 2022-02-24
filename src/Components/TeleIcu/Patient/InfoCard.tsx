import { Link } from "raviger";
import { GENDER } from "../../../Common/constants";
import { PatientModel } from "../../Patient/models";
import { RightArrowIcon } from "../Icons/ArrowIcon";

export interface ITeleICUPatientInfoCardProps {
  patient: PatientModel;
}

export default function TeleICUPatientInfoCard({
  patient,
}: ITeleICUPatientInfoCardProps) {
  return (
    <section className="flex items-stretch my-2 lg:flex-row flex-col space-y-3 lg:space-y-0 lg:space-x-2">
      <div className="bg-white shadow-sm p-5 rounded-md flex items-center lg:w-7/12 w-full">
        <img
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full self-start object-cover"
          src="/images/empty_avatar.jpg"
          alt="Avatar"
        />
        <div className="pl-4 font-medium">
          <p className="text-lg ml-1">{patient.name}</p>
          <p className="text-sm my-1 ml-1 text-gray-600">
            <span>{patient.age} years</span>
            <span className="mx-2">•</span>
            <span>{patient.gender && GENDER[patient.gender]}</span>
          </p>
          <div className="text-sm flex flex-wrap">
            {patient.blood_group && (
              <div className="m-1">
                <span className="font-light text-gray-600 text-sm mr-1">
                  Blood Group
                </span>
                <span className="sm:text-base text-sm mr-2">
                  {patient.blood_group}
                </span>
              </div>
            )}
            {patient.last_consultation?.weight ? (
              <div className="m-1">
                <span className="font-light text-gray-600 text-sm mr-1">
                  Weight
                </span>
                <span className="sm:text-base text-sm mr-2">
                  {patient.last_consultation?.weight}kg
                </span>
              </div>
            ) : (
              <></>
            )}
            {patient.last_consultation?.height ? (
              <div className="m-1">
                <span className="font-light text-gray-600 text-sm mr-1">
                  Height
                </span>
                <span className="sm:text-base text-sm mr-2">
                  {patient.last_consultation?.height}cm
                </span>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 flex-1 gap-y-2">
        {patient.last_consultation?.id && (
          <Link
            href={`/facility/${patient.facility}/patient/${patient.id}/consultation/${patient.last_consultation?.id}`}
            className="rounded-md border-2 border-gray-300  bg-white shadow-sm flex justify-between items-center p-2 px-4 sm:px-2 hover:bg-gray-200 cursor-pointer active:translate-y-1 transform"
          >
            <p className="text-sm sm:text-base pr-1">Consultation Details</p>
            <span>
              <RightArrowIcon className="text-green-500" />
            </span>
          </Link>
        )}
        <Link
          href={`/patient/${patient.id}/investigation_reports`}
          className="rounded-md border-2 border-gray-300  bg-white shadow-sm flex justify-between items-center p-2 px-4 sm:px-2 hover:bg-gray-200 cursor-pointer active:translate-y-1 transform"
        >
          <p className="text-sm sm:text-base pr-1">Investigation Summary</p>
          <span>
            <RightArrowIcon className="text-green-500" />
          </span>
        </Link>
        {patient.last_consultation?.id && (
          <Link
            href={`/facility/${patient.facility}/patient/${patient.id}/consultation/${patient.last_consultation?.id}/files`}
            className="rounded-md border-2 border-gray-300  bg-white shadow-sm flex justify-between items-center p-2 px-4 sm:px-2 hover:bg-gray-200 cursor-pointer active:translate-y-1 transform"
          >
            <p className="text-sm sm:text-base pr-1">Scans &amp; Reports</p>
            <span>
              <RightArrowIcon className="text-green-500" />
            </span>
          </Link>
        )}
        {patient.last_consultation?.id && (
          <Link
            href={`/facility/${patient.facility}/patient/${patient.id}/consultation/${patient.last_consultation?.id}/feed`}
            className="rounded-md border-2 border-gray-300  bg-white shadow-sm flex justify-between items-center p-2 px-4 sm:px-2 hover:bg-gray-200 cursor-pointer active:translate-y-1 transform"
          >
            <p className="text-sm sm:text-base pr-1">5 Para Monitor</p>
            <span>
              <RightArrowIcon className="text-green-500" />
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
