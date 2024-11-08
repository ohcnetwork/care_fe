import React from "react";

import { PaitentNotesReplyModel } from "@/components/Facility/models";

import { USER_TYPES_MAP } from "@/common/constants";

import { formatDateTime, relativeDate } from "@/Utils/utils";

interface Props {
  parentNote: PaitentNotesReplyModel | undefined;
  children: React.ReactNode;
  cancelReply?: () => void;
}

const DoctorNoteReplyPreviewCard = ({
  parentNote,
  children,
  cancelReply,
}: Props) => {
  return (
    <div className="">
      {parentNote ? (
        <div className="mt-4 flex w-full flex-col rounded-lg border border-gray-300 bg-gray-200 p-2 text-gray-800">
          <div className="flex flex-col px-2">
            <div className="flex justify-between">
              <div>
                <div>
                  <span className="text-sm font-semibold text-gray-700">
                    {parentNote.created_by_object?.first_name || "Unknown"}{" "}
                    {parentNote.created_by_object?.last_name}
                  </span>
                  {parentNote.user_type && (
                    <span className="pl-2 text-sm text-gray-700">
                      {`(${USER_TYPES_MAP[parentNote.user_type]})`}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  <div className="tooltip inline">
                    <span className="tooltip-text tooltip-bottom">
                      {formatDateTime(parentNote.created_date)}
                    </span>
                    Created {relativeDate(parentNote.created_date, true)}
                  </div>
                </div>
              </div>
              {cancelReply && (
                <div
                  className="cursor-pointer text-xs text-gray-600"
                  onClick={cancelReply}
                >
                  Cancel
                </div>
              )}
            </div>
            <div className="pb-2 text-sm text-gray-700">{parentNote.note}</div>
          </div>
          <div>{children}</div>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
};

export default DoctorNoteReplyPreviewCard;
