import { relativeDate, formatDate } from "../../Utils/utils";

const PatientNoteCard = ({
  note,
  facilityId,
}: {
  note: any;
  facilityId: any;
}) => {
  return (
    <div
      key={note.id}
      className="flex p-3 bg-white rounded-lg text-gray-800 mt-4 flex-col w-full border border-gray-300"
    >
      <div className="flex justify-between">
        <span className="text-gray-700 text-sm font-semibold">
          {note.created_by_object?.first_name || "Unknown"}{" "}
          {note.created_by_object?.last_name}
        </span>
        <span className="text-gray-700 text-sm">
          {note.created_by_object.user_type === "Doctor"
            ? note.created_by_object.home_facility !== facilityId
              ? "Remote Specialist"
              : ""
            : note.created_by_object.user_type}
        </span>
      </div>
      <span className="whitespace-pre-wrap break-words">{note.note}</span>
      <div className="mt-3 text-xs text-gray-500 text-end">
        <div className="tooltip inline">
          <span className="tooltip-text tooltip-left">
            {formatDate(note.created_date)}
          </span>
          {relativeDate(note.created_date)}
        </div>
      </div>
    </div>
  );
};

export default PatientNoteCard;
