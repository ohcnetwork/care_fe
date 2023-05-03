import { GENDER_TYPES } from "../../Common/constants";
import { Link } from "raviger";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { PatientModel } from "../Patient/models";
import PatientVitalsCard from "../Patient/PatientVitalsCard";
import { AssetLocationObject } from "../Assets/AssetTypes";

interface MonitorCardProps {
  facilityId: string;
  patient: PatientModel;
  socketUrl: string;
  location: AssetLocationObject;
}

export const MonitorCard = ({
  facilityId,
  patient,
  socketUrl,
  location,
}: MonitorCardProps) => {
  return (
    <div key={patient.id} className="group p-2 rounded-lg bg-black">
      <div className="flex flex-wrap gap-4 text-white w-full tracking-wider p-2">
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
        <span className="flex-1 flex items-center justify-end gap-2 text-end">
          <CareIcon className="care-l-bed text-lg" />
          {patient.last_consultation?.current_bed?.bed_object?.name}
        </span>
        <span className="flex-2 flex items-center justify-end gap-2 text-end">
          <CareIcon className="care-l-location-point text-lg" />
          {location.name}
        </span>
      </div>
      <PatientVitalsCard socketUrl={socketUrl} shrinked />
    </div>
  );
};
