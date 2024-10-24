import React from "react";
import { PaitentNotesReplyModel } from "./models";
import { USER_TYPES_MAP } from "@/common/constants";
import { formatDateTime, relativeDate } from "../../Utils/utils";
import MarkdownPreview from "../Common/MarkdownPreview";
import CareIcon from "../../CAREUI/icons/CareIcon";

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
  if (!parentNote) {
    return children;
  }
  return (
    <div className="mt-3 flex flex-col rounded-lg border border-gray-300 bg-gray-200/50 pt-2 text-gray-800">
      <div className="flex flex-col">
        <div className="flex justify-between pl-3">
          <div className="flex gap-2">
            <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
              {parentNote.created_by_object?.first_name[0]}
            </div>
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
          </div>
          {cancelReply && (
            <div
              className="mr-2 cursor-pointer p-1 text-2xl"
              onClick={cancelReply}
            >
              <CareIcon
                icon="l-times"
                className="m-1 rounded-full bg-gray-400 p-1 text-white hover:bg-gray-500"
              />
            </div>
          )}
        </div>
        <div className="max-h-14 overflow-hidden pb-2 pl-14 text-sm text-gray-700">
          <MarkdownPreview markdown={parentNote.note} />
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default DoctorNoteReplyPreviewCard;
