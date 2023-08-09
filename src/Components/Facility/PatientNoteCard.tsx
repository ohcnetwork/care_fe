import { relativeDate, formatDateTime } from "../../Utils/utils";

const PatientNoteCard = ({ note }: { note: any }) => {
  return (
    <div
      key={note.id}
      className="mt-4 flex w-full flex-col rounded-lg border border-gray-300 bg-white p-3 text-gray-800"
    >
      <div className="flex justify-between">
        <span className="text-sm font-semibold text-gray-700">
          {note.created_by_object?.first_name || "Unknown"}{" "}
          {note.created_by_object?.last_name}
        </span>
        <span className="text-sm text-gray-700">
          {note.created_by_object.user_type === "Doctor"
            ? note.created_by_local_user
              ? ""
              : "Remote Specialist"
            : note.created_by_object.user_type}
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
