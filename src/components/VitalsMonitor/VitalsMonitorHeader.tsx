import { Link } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { PatientAssetBed } from "@/components/Assets/AssetTypes";

import { GENDER_TYPES } from "@/common/constants";

import { formatPatientAge } from "@/Utils/utils";

interface VitalsMonitorHeaderProps {
  patientAssetBed?: PatientAssetBed;
}

const VitalsMonitorHeader = ({ patientAssetBed }: VitalsMonitorHeaderProps) => {
  const { patient, bed } = patientAssetBed ?? {};
  return (
    <div className="flex items-center justify-between tracking-wide">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        {patient ? (
          <Link
            href={`/facility/${patient.last_consultation?.facility}/patient/${patient.id}/consultation/${patient.last_consultation?.id}`}
            className="font-bold uppercase text-white"
          >
            {patient?.name}
          </Link>
        ) : (
          <span className="flex items-center gap-1 text-secondary-500">
            <CareIcon icon="l-ban" />
            No Patient
          </span>
        )}
        {patient && (
          <span className="text-xs font-bold text-secondary-400 md:text-sm">
            {`${formatPatientAge(patient)}; `}
            {GENDER_TYPES.find((g) => g.id === patient.gender)?.icon}
          </span>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 text-xs md:flex-row md:items-center md:text-sm">
        {bed && (
          <Link
            className="flex flex-col items-end gap-2 text-secondary-500 md:flex-row md:items-center"
            href={`/facility/${bed.location_object!.facility!.id}/location/${bed!.location_object!.id}/beds`}
          >
            <span className="flex items-center gap-1 hover:text-white">
              <CareIcon icon="l-bed" className="text-sm md:text-base" />
              <span>{bed.name}</span>
            </span>
            <span className="flex items-center gap-1 hover:text-white">
              <CareIcon
                icon="l-location-point"
                className="text-sm md:text-base"
              />
              <span>{bed.location_object?.name}</span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default VitalsMonitorHeader;
