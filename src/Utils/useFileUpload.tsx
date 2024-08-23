import {
  ChangeEvent,
  DetailedHTMLProps,
  InputHTMLAttributes,
  useState,
} from "react";
import {
  CreateFileResponse,
  FileCategory,
  FileUploadModel,
} from "../Components/Patient/models";
import request from "./request/request";
import routes from "../Redux/api";
import uploadFile from "./request/uploadFile";
import * as Notification from "./Notifications.js";
import imageCompression from "browser-image-compression";
import { DEFAULT_ALLOWED_EXTENSIONS } from "../Common/constants";
import CameraCaptureDialog from "../Components/Files/CameraCaptureDialog";
import AudioCaptureDialog from "../Components/Files/AudioCaptureDialog";
import { t } from "i18next";

export type FileUploadOptions = {
  type: string;
  category?: FileCategory;
  onUpload?: (file: FileUploadModel) => void;
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
  handleCameraCapture: () => void;
  handleAudioCapture: () => void;
  handleFileUpload: (associating_id: string) => Promise<void>;
  Dialogues: JSX.Element;
  Input: (_: FileInputProps) => JSX.Element;
  fileName: string;
  file: File | null;
  setFileName: (name: string) => void;
  clearFile: () => void;
};

// Array of image extensions
export const ExtImage: string[] = [
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
  const { type, onUpload, category = "UNSPECIFIED" } = options;

  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<null | number>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);

  const [file, setFile] = useState<File | null>(null);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>): any => {
    if (!e.target.files?.length) {
      return;
    }
    const f = e.target.files[0];
    const fileName = f.name;
    setFile(e.target.files[0]);
    setUploadFileName(
      uploadFileName ||
        fileName.substring(0, fileName.lastIndexOf(".")) ||
        fileName,
    );

    const ext: string = fileName.split(".")[1];

    if (ExtImage.includes(ext)) {
      const options = {
        initialQuality: 0.6,
        alwaysKeepResolution: true,
      };
      imageCompression(f, options).then((compressedFile: File) => {
        setFile(compressedFile);
      });
      return;
    }
    setFile(f);
  };

  const validateFileUpload = () => {
    const filenameLength = uploadFileName.trim().length;
    const f = file;
    if (f === undefined || f === null) {
      setError(t("file_error__choose_file"));
      return false;
    }
    if (filenameLength === 0) {
      setError(t("file_error__file_name"));
      return false;
    }
    if (f.size > 10e7) {
      setError(t("file_error__file_size"));
      return false;
    }
    const extension = f.name.split(".").pop();
    if (
      "allowedExtensions" in options &&
      !options.allowedExtensions?.includes(extension || "")
    ) {
      setError(
        t("file_error__file_type", {
          extension,
          allowedExtensions: options.allowedExtensions?.join(", "),
        }),
      );
      return false;
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

  const uploadfile = async (data: CreateFileResponse) => {
    const url = data.signed_url;
    const internal_name = data.internal_name;
    const f = file;
    if (!f) return;
    const newFile = new File([f], `${internal_name}`);
    return new Promise<void>((resolve, reject) => {
      uploadFile(
        url,
        newFile,
        "PUT",
        { "Content-Type": file?.type },
        (xhr: XMLHttpRequest) => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(null);
            setFile(null);
            setUploadFileName("");
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
    const f = file;

    const filename = uploadFileName === "" && f ? f.name : uploadFileName;
    const name = f?.name;
    setProgress(0);

    const { data } = await request(routes.createUpload, {
      body: {
        original_name: name ?? "",
        file_type: type,
        name: filename,
        associating_id,
        file_category: category,
        mime_type: f?.type ?? "",
      },
    });

    if (data) {
      await uploadfile(data);
      await markUploadComplete(data, associating_id);
    }
  };

  const Dialogues = (
    <>
      <CameraCaptureDialog
        show={cameraModalOpen}
        onHide={() => setCameraModalOpen(false)}
        onCapture={(f) => {
          setFile(f);
          setUploadFileName(uploadFileName || "");
        }}
      />
      <AudioCaptureDialog
        show={audioModalOpen}
        onHide={() => setAudioModalOpen(false)}
        onCapture={(f) => {
          setFile(f);
          setUploadFileName(uploadFileName || "");
        }}
        autoRecord
      />
    </>
  );

  const Input = (props: FileInputProps) => (
    <input
      {...props}
      id="file_upload_patient"
      title="changeFile"
      onChange={onFileChange}
      type="file"
      accept={
        "allowedExtensions" in options
          ? options.allowedExtensions?.join(",")
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
    handleCameraCapture: () => setCameraModalOpen(true),
    handleAudioCapture: () => setAudioModalOpen(true),
    handleFileUpload: handleUpload,
    Dialogues,
    Input,
    fileName: uploadFileName,
    file: file,
    setFileName: setUploadFileName,
    clearFile: () => {
      setFile(null);
      setError(null);
      setUploadFileName("");
    },
  };
}
