import { relativeDate, formatDateTime, classNames } from "../../Utils/utils";
import { USER_TYPES_MAP } from "../../Common/constants";

export interface NoteType {
  note: string;
  facility: Facility;
  created_by_object: CreatedByObject;
  user_type: string;
  created_date: string;
}

export interface Facility {
  id: string;
  name: string;
  local_body: number;
  district: number;
  state: number;
  ward_object: WardObject;
  local_body_object: LocalBodyObject;
  district_object: DistrictObject;
  state_object: StateObject;
  facility_type: FacilityType;
  read_cover_image_url: any;
  features: any[];
  patient_count: number;
  bed_count: number;
}

export interface WardObject {
  id: number;
  name: string;
  number: number;
  local_body: number;
}

export interface LocalBodyObject {
  id: number;
  name: string;
  body_type: number;
  localbody_code: string;
  district: number;
}

export interface DistrictObject {
  id: number;
  name: string;
  state: number;
}

export interface StateObject {
  id: number;
  name: string;
}

export interface FacilityType {
  id: number;
  name: string;
}

export interface CreatedByObject {
  id: number;
  first_name: string;
  username: string;
  email: string;
  last_name: string;
  user_type: string;
  last_login: string;
}

const PatientNoteCard = ({ note }: { note: NoteType }) => {
  return (
    <div
      key={note.id}
      className={classNames(
        "mt-4 flex w-full flex-col rounded-lg border border-gray-300 bg-white p-3 text-gray-800",
        note.user_type === "RemoteSpecialist" && "border-primary-400"
      )}
    >
      <div className="flex">
        <span className="text-sm font-semibold text-gray-700">
          {note.created_by_object?.first_name || "Unknown"}{" "}
          {note.created_by_object?.last_name}
        </span>
        <span className="pl-2 text-sm text-gray-700">
          {`(${USER_TYPES_MAP[note.user_type]})`}
        </span>
      </div>
      <span className="whitespace-pre-wrap break-words">{note.note}</span>
      <div className="mt-3 text-end text-xs text-gray-500">
        <div className="tooltip inline">
          <span className="tooltip-text tooltip-left">
            {formatDateTime(note.created_date)}
          </span>
          {relativeDate(note.created_date)}
        </div>
      </div>
    </div>
  );
};

export default PatientNoteCard;
