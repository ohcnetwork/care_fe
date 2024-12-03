import dayjs from "dayjs";
import { t } from "i18next";
import { useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import { FilePreviewCard } from "@/components/Common/FilePreviewCard";
import NotePreview from "@/components/Common/NotePreview";
import Spinner from "@/components/Common/Spinner";
import {
  PatientNotesEditModel,
  PatientNotesModel,
} from "@/components/Facility/models";
import { FileUploadModel } from "@/components/Patient/models";

import useAuthUser from "@/hooks/useAuthUser";
import useFileManager from "@/hooks/useFileManager";
import useSlug from "@/hooks/useSlug";

import { USER_TYPES_MAP } from "@/common/constants";

import { Error, Success } from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import {
  classNames,
  formatDateTime,
  formatDisplayName,
  formatName,
  relativeDate,
} from "@/Utils/utils";

import { Avatar } from "../Common/Avatar";

const PatientNoteCard = ({
  note,
  setReload,
  disableEdit,
  allowReply = true,
  allowThreadView = false,
  setReplyTo,
  mode = "default-view",
  setThreadViewNote,
}: {
  note: PatientNotesModel;
  setReload: any;
  disableEdit?: boolean;
  allowReply?: boolean;
  allowThreadView?: boolean;
  setReplyTo?: (reply_to: PatientNotesModel | undefined) => void;
  mode?: "thread-view" | "default-view";
  setThreadViewNote?: (noteId: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteField, setNoteField] = useState(note.note);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [editHistory, setEditHistory] = useState<PatientNotesEditModel[]>([]);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const authUser = useAuthUser();
  const patientId = useSlug("patient");

  const fetchEditHistory = async () => {
    const { res, data } = await request(routes.getPatientNoteEditHistory, {
      pathParams: { patientId, noteId: note.id },
    });
    if (res?.status === 200) {
      setEditHistory(data?.results ?? []);
    }
  };

  const onUpdateNote = async () => {
    if (noteField === note.note) {
      setIsEditing(false);
      return;
    }
    const payload = {
      note: noteField,
    };
    if (!/\S+/.test(noteField)) {
      Error({
        msg: "Note Should Contain At Least 1 Character",
      });
      return;
    }

    const { res } = await request(routes.updatePatientNote, {
      pathParams: { patientId, noteId: note.id },
      body: payload,
    });
    if (res?.status === 200) {
      Success({ msg: "Note updated successfully" });
      setIsEditing(false);
      setReload(true);
    }
  };

  const fileManager = useFileManager({
    type: "PATIENT_NOTES",
    uploadedFiles: note?.files,
  });

  const handleAudioPlay = (file: FileUploadModel) => {
    if (isPlaying === file.id) {
      audioRef.current?.pause();
      setIsPlaying(null);
    } else {
      if (audioRef.current) {
        fileManager.getSignedUrl(file).then((url) => {
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play();
            setIsPlaying(file.id!);
          }
        });
      }
    }
  };

  const isAudioFile = (file: FileUploadModel) => {
    return fileManager.getFileType(file) === "AUDIO";
  };

  return (
    <>
      <audio ref={audioRef} onEnded={() => setIsPlaying(null)} />
      <div
        className={classNames(
          "group flex flex-col rounded-lg border border-gray-300 bg-white px-3 py-1 text-gray-800",
          note.user_type === "RemoteSpecialist" && "border-primary-400",
        )}
      >
        <div className="relative flex items-center gap-2">
          <Avatar
            name={formatDisplayName(note.created_by_object)}
            imageUrl={note.created_by_object.read_profile_picture_url}
            className="h-8 w-8 rounded-full text-black/50"
          />
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-secondary-700">
                  {formatName(note.created_by_object)}
                </span>
                {note.user_type && (
                  <span className="ml-2 text-sm text-secondary-700">
                    {`(${USER_TYPES_MAP[note.user_type]})`}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {!disableEdit &&
                  note.created_by_object.id === authUser.id &&
                  !isEditing && (
                    <ButtonV2
                      ghost
                      onClick={() => {
                        setIsEditing(true);
                      }}
                      className="bg-gray-100 p-2"
                    >
                      <CareIcon icon="l-pen" className="h-4 w-4" />
                    </ButtonV2>
                  )}
                {allowReply && (
                  <ButtonV2
                    ghost
                    onClick={() => {
                      setReplyTo && setReplyTo(note);
                    }}
                    className="bg-gray-100 p-2"
                  >
                    <CareIcon icon="l-corner-up-left-alt" className="h-4 w-4" />
                  </ButtonV2>
                )}
              </div>
            </div>
            {note.last_edited_date &&
            !dayjs(note.last_edited_date).isSame(
              note.created_date,
              "second",
            ) ? (
              <div className="flex">
                <div
                  className="cursor-pointer text-xs text-secondary-600"
                  onClick={() => {
                    fetchEditHistory();
                    setShowEditHistory(true);
                  }}
                >
                  <div className="tooltip inline">
                    <span className="tooltip-text tooltip-bottom">
                      {formatDateTime(note.last_edited_date)}
                    </span>
                    Edited {relativeDate(note.last_edited_date, true)}
                  </div>
                  <CareIcon
                    icon="l-history"
                    className="ml-1 h-4 w-4 pt-[3px] text-primary-600"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-600">
                <div className="tooltip inline">
                  <span className="tooltip-text tooltip-bottom">
                    {formatDateTime(note.created_date)}
                  </span>
                  Created {relativeDate(note.created_date, true)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-2">
          {isEditing ? (
            <div className="flex flex-col">
              <textarea
                rows={2}
                className="h-20 w-full resize-none rounded-lg border border-secondary-300 p-2"
                value={noteField}
                onChange={(e) => setNoteField(e.target.value)}
              ></textarea>
              <div className="mt-2 flex justify-end gap-2">
                <ButtonV2
                  className="py-1"
                  variant="secondary"
                  border
                  onClick={() => {
                    setIsEditing(false);
                    setNoteField(note.note);
                  }}
                  id="cancel-update-note-button"
                >
                  <CareIcon icon="l-times-circle" className="h-5 w-5" />
                  Cancel
                </ButtonV2>
                <ButtonV2
                  className="py-1"
                  onClick={onUpdateNote}
                  id="update-note-button"
                >
                  <CareIcon icon="l-check" className="h-5 w-5 text-white" />
                  Update Note
                </ButtonV2>
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                if (allowThreadView && setThreadViewNote)
                  setThreadViewNote(note.id);
              }}
              className={`pl-11 text-sm text-gray-700 ${allowThreadView ? "cursor-pointer" : ""}`}
            >
              <NotePreview
                initialNote={noteField}
                mentioned_users={note.mentioned_users}
              />
              <div className="flex flex-wrap gap-2">
                {note?.files?.map((file: FileUploadModel) => (
                  <FilePreviewCard
                    key={file.id}
                    file={file}
                    readonly
                    isPlaying={isPlaying === file.id}
                    onPlay={
                      isAudioFile(file)
                        ? () => handleAudioPlay(file)
                        : undefined
                    }
                    onClick={() => fileManager.viewFile(file, note.id)}
                  />
                ))}
              </div>
              {mode == "thread-view" && note.replies.length > 0 && (
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <CareIcon icon="l-corner-down-right" className="h-3 w-3" />
                  {note.child_notes.length}{" "}
                  {note.child_notes.length === 1 ? "Reply" : "Replies"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {fileManager.Dialogues}
      {showEditHistory && (
        <DialogModal
          show={showEditHistory}
          onClose={() => setShowEditHistory(false)}
          title={t("edit_history")}
        >
          <div>
            <div className="mb-4">
              <p className="text-md mt-1 text-secondary-500">
                Edit History for note
                <strong> {note.id}</strong>
              </p>
            </div>
            <div className="h-96 overflow-y-scroll">
              {editHistory.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <Spinner />
                </div>
              )}
              {editHistory?.map((edit, index) => {
                const isLast = index === editHistory.length - 1;
                return (
                  <div
                    key={index}
                    className="my-2 flex flex-col justify-between rounded-lg border border-secondary-300 p-4 py-2 transition-colors duration-200 hover:bg-secondary-100"
                  >
                    <div className="flex">
                      <div className="grow">
                        <p className="text-sm font-medium text-secondary-500">
                          {isLast ? "Created" : "Edited"} On
                        </p>
                        <p className="text-sm text-secondary-900">
                          {formatDateTime(edit.edited_date)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 grow">
                      <p className="text-sm font-medium text-secondary-500">
                        Note
                      </p>
                      <div className="text-sm text-secondary-900">
                        <NotePreview initialNote={edit.note} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <ButtonV2
                id="view-history-back-button"
                variant="secondary"
                onClick={() => {
                  setShowEditHistory(false);
                }}
              >
                {t("close")}
              </ButtonV2>
            </div>
          </div>
        </DialogModal>
      )}
    </>
  );
};

export default PatientNoteCard;
