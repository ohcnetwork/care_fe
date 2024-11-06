import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Cancel, Submit } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";
import FilePreviewDialog from "@/components/Common/FilePreviewDialog";
import { StateInterface } from "@/components/Files/FileUpload";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FileUploadModel } from "@/components/Patient/models";

import {
  FILE_EXTENSIONS,
  PREVIEWABLE_FILE_EXTENSIONS,
} from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDateTime } from "@/Utils/utils";

export interface FileManagerOptions {
  type: string;
  onArchive?: () => void;
  onEdit?: () => void;
}
export interface FileManagerResult {
  viewFile: (file: FileUploadModel, associating_id: string) => void;
  archiveFile: (
    file: FileUploadModel,
    associating_id: string,
    skipPrompt?: { reason: string },
  ) => void;
  editFile: (file: FileUploadModel, associating_id: string) => void;
  Dialogues: React.ReactNode;
  isPreviewable: (file: FileUploadModel) => boolean;
  getFileType: (
    file: FileUploadModel,
  ) => keyof typeof FILE_EXTENSIONS | "UNKNOWN";
  downloadFile: (
    file: FileUploadModel,
    associating_id: string,
  ) => Promise<void>;
  type: string;
}

export default function useFileManager(
  options: FileManagerOptions,
): FileManagerResult {
  const { type: fileType, onArchive, onEdit } = options;

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
  const [editing, setEditing] = useState(false);
  const [editDialogueOpen, setEditDialogueOpen] =
    useState<FileUploadModel | null>(null);
  const [editError, setEditError] = useState("");

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
      isImage: FILE_EXTENSIONS.IMAGE.includes(
        extension as (typeof FILE_EXTENSIONS.IMAGE)[number],
      ),
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

  const validateEditFileName = (name: string) => {
    if (name.trim() === "") {
      setEditError("Please enter a name!");
      return false;
    } else {
      setEditError("");
      return true;
    }
  };

  const partialupdateFileName = async (file: FileUploadModel) => {
    if (!validateEditFileName(file.name || "")) {
      setEditing(false);
      return;
    }

    const { res } = await request(routes.editUpload, {
      body: { name: file.name },
      pathParams: {
        id: file.id || "",
        fileType,
        associatingId: file.associating_id || "",
      },
    });

    if (res?.ok) {
      Notification.Success({ msg: "File name changed successfully" });
      setEditDialogueOpen(null);
      onEdit && onEdit();
    }
    setEditing(false);
  };

  const editFile = (file: FileUploadModel, associating_id: string) => {
    setEditDialogueOpen({ ...file, associating_id });
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
            <div className="text-sm">
              <h1 className="text-xl text-black">Archive File</h1>
              <span className="text-sm text-secondary-600">
                This action is irreversible. Once a file is archived it cannot
                be unarchived.
              </span>
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
              id="archive-file-reason"
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
          <h1 className="text-xl text-black">
            {archiveDialogueOpen?.name} (Archived)
          </h1>
        }
        fixedWidth={false}
        className="md:w-[700px]"
        onClose={() => setArchiveDialogueOpen(null)}
      >
        <div className="mb-8 text-xs text-secondary-700">
          <CareIcon icon="l-archive" className="mr-2" />
          This file has been archived and cannot be unarchived.
        </div>
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
          {[
            {
              label: "File Name",
              content: archiveDialogueOpen?.name,
              icon: "l-file",
            },
            {
              label: "Uploaded By",
              content: archiveDialogueOpen?.uploaded_by?.username,
              icon: "l-user",
            },
            {
              label: "Uploaded On",
              content: formatDateTime(archiveDialogueOpen?.created_date),
              icon: "l-clock",
            },
            {
              label: "Archive Reason",
              content: archiveDialogueOpen?.archive_reason,
              icon: "l-archive",
            },
            {
              label: "Archived By",
              content: archiveDialogueOpen?.archived_by?.username,
              icon: "l-user",
            },
            {
              label: "Archived On",
              content: formatDateTime(archiveDialogueOpen?.archived_datetime),
              icon: "l-clock",
            },
          ].map((item, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex aspect-square h-10 items-center justify-center rounded-full bg-primary-100">
                <CareIcon
                  icon={item.icon as any}
                  className="text-lg text-primary-500"
                />
              </div>
              <div>
                <div className="text-xs uppercase text-secondary-700">
                  {item.label}
                </div>
                <div
                  className="break-words text-base"
                  data-archive-info={item.label}
                >
                  {item.content}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-end">
          <Cancel onClick={(_) => setArchiveDialogueOpen(null)} />
        </div>
      </DialogModal>
      <DialogModal
        show={editDialogueOpen !== null}
        title={
          <div className="flex flex-row">
            <div className="rounded-full bg-primary-100 px-5 py-4">
              <CareIcon
                icon="l-edit-alt"
                className="text-lg text-primary-500"
              />
            </div>
            <div className="m-4">
              <h1 className="text-xl text-black">Rename File</h1>
            </div>
          </div>
        }
        onClose={() => setEditDialogueOpen(null)}
      >
        <form
          onSubmit={(event: any) => {
            event.preventDefault();
            setEditing(true);
            if (editDialogueOpen) partialupdateFileName(editDialogueOpen);
          }}
          className="flex w-full flex-col"
        >
          <div>
            <TextFormField
              name="editFileName"
              id="edit-file-name"
              label="Enter the file name"
              value={editDialogueOpen?.name}
              onChange={(e) => {
                setEditDialogueOpen({ ...editDialogueOpen, name: e.value });
              }}
              error={editError}
            />
          </div>
          <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
            <Cancel onClick={() => setEditDialogueOpen(null)} />
            <Submit
              disabled={
                editing === true ||
                editDialogueOpen?.name === "" ||
                editDialogueOpen?.name?.length === 0
              }
              label="Proceed"
            />
          </div>
        </form>
      </DialogModal>
    </>
  );

  const isPreviewable = (file: FileUploadModel) =>
    !!file.extension &&
    PREVIEWABLE_FILE_EXTENSIONS.includes(
      file.extension.slice(1) as (typeof PREVIEWABLE_FILE_EXTENSIONS)[number],
    );

  const getFileType: (
    f: FileUploadModel,
  ) => keyof typeof FILE_EXTENSIONS | "UNKNOWN" = (file: FileUploadModel) => {
    if (!file.extension) return "UNKNOWN";
    const ftype = (
      Object.keys(FILE_EXTENSIONS) as (keyof typeof FILE_EXTENSIONS)[]
    ).find((type) =>
      FILE_EXTENSIONS[type].includes((file.extension?.slice(1) || "") as never),
    );
    return ftype || "UNKNOWN";
  };

  const downloadFile = async (
    file: FileUploadModel,
    associating_id: string,
  ) => {
    try {
      if (!file.id) return;
      Notification.Success({ msg: "Downloading file..." });
      const { data: fileData } = await request(routes.retrieveUpload, {
        query: { file_type: fileType, associating_id },
        pathParams: { id: file.id },
      });
      const response = await fetch(fileData?.read_signed_url || "");
      if (!response.ok) throw new Error("Network response was not ok.");

      const data = await response.blob();
      const blobUrl = window.URL.createObjectURL(data);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = file.name || "file";
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err) {
      Notification.Error({ msg: "Failed to download file" });
    }
  };

  return {
    viewFile,
    archiveFile,
    editFile,
    Dialogues,
    isPreviewable,
    getFileType,
    downloadFile,
    type: fileType,
  };
}
