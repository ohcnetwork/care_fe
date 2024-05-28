import { useState } from "react";
import FilePreviewDialog from "../Components/Common/FilePreviewDialog";
import { FileUploadModel } from "../Components/Patient/models";
import { ExtImage, StateInterface } from "../Components/Patient/FileUpload";
import request from "./request/request";
import routes from "../Redux/api";
import DialogModal from "../Components/Common/Dialog";
import CareIcon from "../CAREUI/icons/CareIcon";
import TextAreaFormField from "../Components/Form/FormFields/TextAreaFormField";
import { Cancel, Submit } from "../Components/Common/components/ButtonV2";
import { formatDateTime } from "./utils";
import * as Notification from "./Notifications.js";

export interface FileManagerOptions {
  type: string;
  onArchive?: () => void;
}

export interface FileManagerResult {
  viewFile: (file: FileUploadModel, associating_id: string) => void;
  archiveFile: (
    file: FileUploadModel,
    associating_id: string,
    skipPrompt?: { reason: string },
  ) => void;
  Dialogues: React.ReactNode;
}

export default function useFileManager(
  options: FileManagerOptions,
): FileManagerResult {
  const { type: fileType, onArchive } = options;

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
  const [downloadURL, setDownloadURL] = useState<string>("");
  const [archiveDialogueOpen, setArchiveDialogueOpen] = useState<
    (FileUploadModel & { associating_id: string }) | null
  >(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveReasonError, setArchiveReasonError] = useState("");
  const [archiving, setArchiving] = useState(false);

  const getExtension = (url: string) => {
    const div1 = url.split("?")[0].split(".");
    const ext: string = div1[div1.length - 1].toLowerCase();
    return ext;
  };

  const viewFile = async (file: FileUploadModel, associating_id: string) => {
    setFileUrl("");
    setFileState({ ...file_state, open: true });
    const { data } = await request(routes.retrieveUpload, {
      query: {
        file_type: fileType,
        associating_id,
      },
      pathParams: { id: file.id || "" },
    });

    if (!data) return;

    const signedUrl = data.read_signed_url as string;
    const extension = getExtension(signedUrl);

    const downloadFileUrl = (url: string) => {
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          setDownloadURL(URL.createObjectURL(blob));
        });
    };

    setFileState({
      ...file_state,
      open: true,
      name: data.name as string,
      extension,
      isImage: ExtImage.includes(extension),
    });
    downloadFileUrl(signedUrl);
    setFileUrl(signedUrl);
  };

  const validateArchiveReason = (name: any) => {
    if (name.trim() === "") {
      setArchiveReasonError("Please enter a valid reason!");
      return false;
    } else {
      setArchiveReasonError("");
      return true;
    }
  };

  const handleFileArchive = async (archiveFile: typeof archiveDialogueOpen) => {
    if (!validateArchiveReason(archiveReason)) {
      setArchiving(false);
      return;
    }

    const { res } = await request(routes.editUpload, {
      body: { is_archived: true, archive_reason: archiveReason },
      pathParams: {
        id: archiveFile?.id || "",
        fileType,
        associatingId: archiveFile?.associating_id || "",
      },
    });

    if (res?.ok) {
      Notification.Success({ msg: "File archived successfully" });
    }

    setArchiveDialogueOpen(null);
    setArchiving(false);
    setArchiveReason("");
    onArchive && onArchive();
    return res;
  };

  const archiveFile = (
    file: FileUploadModel,
    associating_id: string,
    skipPrompt?: { reason: string },
  ) => {
    if (skipPrompt) {
      setArchiving(true);
      setArchiveReason(skipPrompt.reason);
      handleFileArchive({
        ...file,
        associating_id,
      });
      return;
    }
    setArchiveDialogueOpen({ ...file, associating_id });
  };

  const handleFilePreviewClose = () => {
    setDownloadURL("");
    setFileState({
      ...file_state,
      open: false,
      zoom: 4,
      isZoomInDisabled: false,
      isZoomOutDisabled: false,
    });
  };

  const Dialogues = (
    <>
      <FilePreviewDialog
        show={file_state.open}
        fileUrl={fileUrl}
        file_state={file_state}
        setFileState={setFileState}
        downloadURL={downloadURL}
        onClose={handleFilePreviewClose}
        fixedWidth={false}
        className="h-[80vh] w-full md:h-screen"
      />
      <DialogModal
        show={
          archiveDialogueOpen !== null &&
          archiveDialogueOpen.archived_datetime === null
        }
        title={
          <div className="flex flex-row">
            <div className="my-1 mr-3 rounded-full bg-red-100 px-5 py-4 text-center">
              <CareIcon
                icon="l-exclamation-triangle"
                className="text-lg text-danger-500"
              />
            </div>
            <div className="text-grey-200 text-sm">
              <h1 className="text-xl text-black">Archive File</h1>
              This action is irreversible. Once a file is archived it cannot be
              unarchived.
            </div>
          </div>
        }
        onClose={() => setArchiveDialogueOpen(null)}
      >
        <form
          onSubmit={(event: any) => {
            event.preventDefault();
            handleFileArchive(archiveDialogueOpen);
          }}
          className="mx-2 my-4 flex w-full flex-col"
        >
          <div>
            <TextAreaFormField
              name="editFileName"
              label={
                <span>
                  State the reason for archiving{" "}
                  <b>{archiveDialogueOpen?.name}</b> file?
                </span>
              }
              rows={6}
              required
              placeholder="Type the reason..."
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.value)}
              error={archiveReasonError}
            />
          </div>
          <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
            <Cancel onClick={() => setArchiveDialogueOpen(null)} />
            <Submit disabled={archiving} label="Proceed" />
          </div>
        </form>
      </DialogModal>
      <DialogModal
        show={
          archiveDialogueOpen !== null &&
          archiveDialogueOpen.archived_datetime !== null
        }
        title={
          <div className="flex flex-row">
            <div className="my-1 mr-3 rounded-full bg-primary-100 px-5 py-4 text-center">
              <CareIcon
                icon="l-question-circle"
                className="text-lg text-primary-500"
              />
            </div>
            <div className="text-grey-200 text-sm">
              <h1 className="text-xl text-black">File Details</h1>
              This file is archived. Once a file is archived it cannot be
              unarchived.
            </div>
          </div>
        }
        onClose={() => setArchiveDialogueOpen(null)}
      >
        <div className="flex flex-col">
          <div>
            <div className="text-md m-2 text-center">
              <b id="archive-file-name">{archiveDialogueOpen?.name}</b> file is
              archived.
            </div>
            <div className="text-md text-center" id="archive-file-reason">
              <b>Reason:</b> {archiveDialogueOpen?.archive_reason}
            </div>
            <div className="text-md text-center">
              <b>Archived by:</b> {archiveDialogueOpen?.archived_by?.username}
            </div>
            <div className="text-md text-center">
              <b>Time of Archive: </b>
              {formatDateTime(archiveDialogueOpen?.archived_datetime)}
            </div>
          </div>
          <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
            <Cancel onClick={(_) => setArchiveDialogueOpen(null)} />
          </div>
        </div>
      </DialogModal>
    </>
  );

  return {
    viewFile,
    archiveFile,
    Dialogues,
  };
}
