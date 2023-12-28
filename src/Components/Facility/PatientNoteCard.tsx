import { relativeDate, formatDateTime, classNames } from "../../Utils/utils";
import { USER_TYPES_MAP } from "../../Common/constants";
import { PatientNotesModel } from "./models";

const PatientNoteCard = ({ note }: { note: PatientNotesModel }) => {
  return (
    <div
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
        {note.user_type && (
          <span className="pl-2 text-sm text-gray-700">
            {`(${USER_TYPES_MAP[note.user_type]})`}
          </span>
        )}
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
