import { GENDER_TYPES } from "../../Common/constants";
import { Link } from "raviger";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { PatientModel } from "../Patient/models";
import LegacyPatientVitalsCard from "../Patient/LegacyPatientVitalsCard";
import { AssetLocationObject } from "../Assets/AssetTypes";

interface MonitorCardProps {
  facilityId: string;
  patient: PatientModel;
  socketUrl: string;
  location: AssetLocationObject;
}

export const LegacyMonitorCard = ({
  facilityId,
  patient,
  socketUrl,
  location,
}: MonitorCardProps) => {
  return (
    <div key={patient.id} className="group rounded-lg bg-black p-2">
      <div className="flex w-full flex-wrap gap-4 p-2 tracking-wider text-white">
        <Link
          href={`/facility/${facilityId}/patient/${patient.id}/consultation/${patient.last_consultation?.id}`}
          className="font-bold uppercase text-white"
        >
          {patient.name}
        </Link>
        <span>
          {patient.age}y |{" "}
          {GENDER_TYPES.find((g) => g.id === patient.gender)?.icon}
        </span>
        <span className="flex flex-1 items-center justify-end gap-2 text-end">
          <CareIcon className="care-l-bed text-lg" />
          {patient.last_consultation?.current_bed?.bed_object?.name}
        </span>
        <span className="flex-2 flex items-center justify-end gap-2 text-end">
          <CareIcon className="care-l-location-point text-lg" />
          {location.name}
        </span>
      </div>
      <LegacyPatientVitalsCard socketUrl={socketUrl} shrinked />
    </div>
  );
};
