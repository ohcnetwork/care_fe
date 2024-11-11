import imageCompression from "browser-image-compression";
import { t } from "i18next";
import {
  ChangeEvent,
  DetailedHTMLProps,
  InputHTMLAttributes,
  useEffect,
  useState,
} from "react";

import AudioCaptureDialog from "@/components/Files/AudioCaptureDialog";
import CameraCaptureDialog from "@/components/Files/CameraCaptureDialog";
import {
  CreateFileResponse,
  FileCategory,
  FileUploadModel,
} from "@/components/Patient/models";

import { DEFAULT_ALLOWED_EXTENSIONS } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import uploadFile from "@/Utils/request/uploadFile";

export type FileUploadOptions = {
  multiple?: boolean;
  type: string;
  category?: FileCategory;
  onUpload?: (file: FileUploadModel) => void;
  // if allowed, will fallback to the name of the file if a seperate filename is not defined.
  allowNameFallback?: boolean;
} & (
  | {
      allowedExtensions?: string[];
    }
  | {
      allowAllExtensions?: boolean;
    }
);

export interface FileInputProps
  extends Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    "id" | "title" | "type" | "accept" | "onChange"
  > {}

export type FileUploadReturn = {
  progress: null | number;
  error: null | string;
  validateFiles: () => boolean;
  handleCameraCapture: () => void;
  handleAudioCapture: () => void;
  handleFileUpload: (associating_id: string) => Promise<void>;
  Dialogues: JSX.Element;
  Input: (_: FileInputProps) => JSX.Element;
  fileNames: string[];
  files: File[];
  setFileName: (names: string, index?: number) => void;
  setFileNames: (names: string[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  uploading: boolean;
};

// Array of image extensions
const ExtImage: string[] = [
  "jpeg",
  "jpg",
  "png",
  "gif",
  "svg",
  "bmp",
  "webp",
  "jfif",
];

export default function useFileUpload(
  options: FileUploadOptions,
): FileUploadReturn {
  const {
    type,
    onUpload,
    category = "UNSPECIFIED",
    multiple,
    allowNameFallback = true,
  } = options;

  const [uploadFileNames, setUploadFileNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<null | number>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [files, setFiles] = useState<File[]>([]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>): any => {
    if (!e.target.files?.length) {
      return;
    }
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);

    selectedFiles.forEach((file) => {
      const ext: string = file.name.split(".")[1];
      if (ExtImage.includes(ext)) {
        const options = {
          initialQuality: 0.6,
          alwaysKeepResolution: true,
        };
        imageCompression(file, options).then((compressedFile: File) => {
          setFiles((prev) =>
            prev.map((f) => (f.name === file.name ? compressedFile : f)),
          );
        });
      }
    });
  };

  useEffect(() => {
    const blanks = Array(files.length).fill("");
    setUploadFileNames((names) => [...names, ...blanks].slice(0, files.length));
  }, [files]);

  const validateFileUpload = () => {
    if (files.length === 0) {
      setError(t("file_error__choose_file"));
      return false;
    }

    for (const file of files) {
      const filenameLength = file.name.trim().length;
      if (filenameLength === 0) {
        setError(t("file_error__file_name"));
        return false;
      }
      if (file.size > 10e7) {
        setError(t("file_error__file_size"));
        return false;
      }
      const extension = file.name.split(".").pop();
      if (
        "allowedExtensions" in options &&
        !options.allowedExtensions
          ?.map((extension) => extension.replace(".", ""))
          ?.includes(extension || "")
      ) {
        setError(
          t("file_error__file_type", {
            extension,
            allowedExtensions: options.allowedExtensions?.join(", "),
          }),
        );
        return false;
      }
    }
    return true;
  };
  const markUploadComplete = (
    data: CreateFileResponse,
    associatingId: string,
  ) => {
    return request(routes.editUpload, {
      body: { upload_completed: true },
      pathParams: {
        id: data.id,
        fileType: type,
        associatingId,
      },
    });
  };

  const uploadfile = async (data: CreateFileResponse, file: File) => {
    const url = data.signed_url;
    const internal_name = data.internal_name;
    const newFile = new File([file], `${internal_name}`);

    return new Promise<void>((resolve, reject) => {
      uploadFile(
        url,
        newFile,
        "PUT",
        { "Content-Type": file.type },
        (xhr: XMLHttpRequest) => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(null);
            Notification.Success({
              msg: t("file_uploaded"),
            });
            setError(null);
            onUpload && onUpload(data);
            resolve();
          } else {
            Notification.Error({
              msg: t("file_error__dynamic", { statusText: xhr.statusText }),
            });
            setProgress(null);
            reject();
          }
        },
        setProgress as any,
        () => {
          Notification.Error({
            msg: t("file_error__network"),
          });
          setProgress(null);
          reject();
        },
      );
    });
  };

  const handleUpload = async (associating_id: string) => {
    if (!validateFileUpload()) return;

    setProgress(0);

    for (const [index, file] of files.entries()) {
      const filename =
        allowNameFallback && uploadFileNames[index] === "" && file
          ? file.name
          : uploadFileNames[index];
      if (!filename) {
        setError(t("file_error__single_file_name"));
        return;
      }
      setUploading(true);

      const { data } = await request(routes.createUpload, {
        body: {
          original_name: file.name ?? "",
          file_type: type,
          name: filename,
          associating_id,
          file_category: category,
          mime_type: file.type ?? "",
        },
      });

      if (data) {
        await uploadfile(data, file);
        await markUploadComplete(data, associating_id);
      }
    }

    setUploading(false);
    setFiles([]);
    setUploadFileNames([]);
  };

  const Dialogues = (
    <>
      <CameraCaptureDialog
        show={cameraModalOpen}
        onHide={() => setCameraModalOpen(false)}
        onCapture={(file) => {
          setFiles((prev) => [...prev, file]);
        }}
      />
      <AudioCaptureDialog
        show={audioModalOpen}
        onHide={() => setAudioModalOpen(false)}
        onCapture={(file) => {
          setFiles((prev) => [...prev, file]);
        }}
        autoRecord
      />
    </>
  );

  const Input = (props: FileInputProps) => (
    <input
      {...props}
      id="file_upload_patient"
      title={t("change_file")}
      onChange={onFileChange}
      type="file"
      multiple={multiple}
      accept={
        "allowedExtensions" in options
          ? options.allowedExtensions?.map((e) => "." + e).join(",")
          : "allowAllExtensions" in options
            ? "*"
            : DEFAULT_ALLOWED_EXTENSIONS.join(",")
      }
      hidden={props.hidden || true}
    />
  );

  return {
    progress,
    error,
    validateFiles: validateFileUpload,
    handleCameraCapture: () => setCameraModalOpen(true),
    handleAudioCapture: () => setAudioModalOpen(true),
    handleFileUpload: handleUpload,
    Dialogues,
    Input,
    fileNames: uploadFileNames,
    files: files,
    setFileNames: setUploadFileNames,
    setFileName: (name: string, index = 0) => {
      setUploadFileNames((prev) =>
        prev.map((n, i) => (i === index ? name : n)),
      );
    },
    removeFile: (index = 0) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      setUploadFileNames((prev) => prev.filter((_, i) => i !== index));
    },
    clearFiles: () => {
      setFiles([]);
      setUploadFileNames([]);
    },
    uploading,
  };
}
