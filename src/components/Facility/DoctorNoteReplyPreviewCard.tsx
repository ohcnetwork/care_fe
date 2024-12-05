import React from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { Avatar } from "@/components/Common/Avatar";
import NotePreview from "@/components/Common/NotePreview";
import { PatientNotesReplyModel } from "@/components/Facility/models";

import { USER_TYPES_MAP } from "@/common/constants";

import { formatDateTime, formatDisplayName, relativeDate } from "@/Utils/utils";

interface Props {
  parentNote: PatientNotesReplyModel | undefined;
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
    <div className="mt-3 flex flex-col rounded-lg border border-secondary-300 bg-secondary-200/50 pt-2 text-secondary-800">
      <div className="flex flex-col">
        <div className="flex justify-between pl-3">
          <div className="flex gap-2">
            <Avatar
              name={formatDisplayName(parentNote.created_by_object)}
              imageUrl={parentNote.created_by_object.read_profile_picture_url}
              className="h-8 w-8 rounded-full text-black/50"
            />
            <div>
              <div>
                <span className="text-sm font-semibold text-secondary-700">
                  {parentNote.created_by_object?.first_name || "Unknown"}{" "}
                  {parentNote.created_by_object?.last_name}
                </span>
                {parentNote.user_type && (
                  <span className="pl-2 text-sm text-secondary-700">
                    {`(${USER_TYPES_MAP[parentNote.user_type]})`}
                  </span>
                )}
              </div>
              <div className="text-xs text-secondary-600">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelReply}
              className="mr-2 h-8 w-8 hover:bg-transparent"
              aria-label="Cancel reply"
              title="Cancel reply"
            >
              <CareIcon
                icon="l-times"
                className="h-5 w-5 rounded-full p-1 bg-secondary-400 text-white transition-colors duration-200 hover:bg-secondary-500"
              />
            </Button>
          )}
        </div>
        <div className="max-h-14 overflow-hidden pb-2 pl-14 text-sm text-secondary-700">
          <NotePreview initialNote={parentNote.note} />
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default DoctorNoteReplyPreviewCard;
