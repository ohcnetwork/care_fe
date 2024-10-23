import {
  relativeDate,
  formatDateTime,
  classNames,
  formatName,
} from "../../Utils/utils";
import { USER_TYPES_MAP } from "@/common/constants";
import { PatientNotesEditModel, PatientNotesModel } from "./models";
import ButtonV2 from "@/components/Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { useState } from "react";
import { Error, Success } from "../../Utils/Notifications";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import DialogModal from "@/components/Common/Dialog";
import { t } from "i18next";
import dayjs from "dayjs";
import Spinner from "../Common/Spinner";
import useAuthUser from "@/common/hooks/useAuthUser";
import useSlug from "@/common/hooks/useSlug";
import MarkdownPreview from "../Common/RichTextEditor/MarkdownPreview";
import { ExtImage } from "../../Utils/useFileUpload";
import { StateInterface } from "../Files/FileUpload";
import FilePreviewDialog from "../Common/FilePreviewDialog";
import { FileUploadModel } from "../Patient/models";

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
  const authUser = useAuthUser();
  const patientId = useSlug("patient");

  const file_type = "NOTES";
  const [file_state, setFileState] = useState<StateInterface>({
    open: false,
    isImage: false,
    name: "",
    extension: "",
    zoom: 4,
    isZoomInDisabled: false,
    isZoomOutDisabled: false,
    rotation: 0,
  });
  const [fileUrl, setFileUrl] = useState<string>("");
  const [downloadURL, setDownloadURL] = useState("");

  const getExtension = (url: string) => {
    const extension = url.split("?")[0].split(".").pop();
    return extension ?? "";
  };
  const downloadFileUrl = (url: string) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        setDownloadURL(URL.createObjectURL(blob));
      });
  };

  const loadFile = async (id: string, noteId: string) => {
    setFileUrl("");
    setFileState({ ...file_state, open: true });
    const { data } = await request(routes.retrieveUpload, {
      query: {
        file_type: file_type,
        associating_id: noteId,
      },
      pathParams: { id },
    });

    if (!data) return;

    const signedUrl = data.read_signed_url as string;
    const extension = getExtension(signedUrl);

    setFileState({
      ...file_state,
      open: true,
      name: data.name?.split(".")[0] ?? "file",
      extension,
      isImage: ExtImage.includes(extension),
    });
    downloadFileUrl(signedUrl);
    setFileUrl(signedUrl);
  };

  const handleClose = () => {
    setDownloadURL("");
    setFileState({
      ...file_state,
      open: false,
      zoom: 4,
      isZoomInDisabled: false,
      isZoomOutDisabled: false,
    });
  };

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

  return (
    <>
      {" "}
      <div
        className={classNames(
          "group flex flex-col rounded-lg border border-gray-300 bg-white px-3 py-1 text-gray-800 max-sm:ml-2",
          note.user_type === "RemoteSpecialist" && "border-primary-400",
        )}
      >
        <FilePreviewDialog
          show={file_state.open}
          fileUrl={fileUrl}
          file_state={file_state}
          setFileState={setFileState}
          downloadURL={downloadURL}
          onClose={handleClose}
          fixedWidth={false}
          className="h-[80vh] w-full md:h-screen"
        />
        <div className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
            {note.created_by_object?.first_name[0]}
          </div>
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

        {
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
                className={`pl-11 text-sm text-gray-700 ${allowThreadView && "cursor-pointer"}`}
              >
                <MarkdownPreview
                  markdown={noteField}
                  mentioned_users={note.mentioned_users}
                />
                <div className="flex gap-2">
                  {note?.files?.map((file: FileUploadModel) => (
                    <div
                      key={file.id}
                      className="relative mt-1 h-20 w-20 cursor-pointer rounded-md bg-gray-100 shadow-sm hover:bg-gray-200"
                    >
                      <div
                        className="flex h-full w-full flex-col items-center justify-center p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (file.id) loadFile(file.id, note.id);
                        }}
                      >
                        <CareIcon
                          icon="l-file"
                          className="shrink-0 text-2xl text-gray-600"
                        />
                        <span className="mt-1 max-h-[2.5em] w-full overflow-hidden text-ellipsis break-words text-center text-xs text-gray-600">
                          {file.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {mode == "thread-view" && note.replies.length > 0 && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <CareIcon icon="l-corner-down-right" className="h-3 w-3" />
                    {note.replies.length}{" "}
                    {note.replies.length === 1 ? "Reply" : "Replies"}
                  </div>
                )}
              </div>
            )}
          </div>
        }
      </div>
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
                        <MarkdownPreview markdown={edit.note} />
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
