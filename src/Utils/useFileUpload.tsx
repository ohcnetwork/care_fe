import { ChangeEvent, useCallback, useRef, useState } from "react";
import {
  CreateFileResponse,
  FileCategory,
  FileUploadModel,
} from "../Components/Patient/models";
import DialogModal from "../Components/Common/Dialog";
import CareIcon, { IconName } from "../CAREUI/icons/CareIcon";
import Webcam from "react-webcam";
import ButtonV2, { Submit } from "../Components/Common/components/ButtonV2";
import { t } from "i18next";
import useWindowDimensions from "../Common/hooks/useWindowDimensions";
import { classNames } from "./utils";
import request from "./request/request";
import routes from "../Redux/api";
import uploadFile from "./request/uploadFile";
import * as Notification from "./Notifications.js";
import imageCompression from "browser-image-compression";
import { DEFAULT_ALLOWED_EXTENSIONS } from "../Common/constants";

export type FileUploadOptions = {
  multiple?: boolean;
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

export type FileUploadButtonProps = {
  icon?: IconName;
  content?: string;
  className?: string;
  children?: React.ReactNode;
};

export type FileUploadReturn = {
  progress: null | number;
  error: null | string;
  handleCameraCapture: () => void;
  handleAudioCapture: () => void;
  handleFileUpload: (associating_id: string) => Promise<void>;
  Dialogues: JSX.Element;
  UploadButton: (_: FileUploadButtonProps) => JSX.Element;
  fileNames: string[];
  files: File[];
  setFileName: (names: string, index?: number) => void;
  setFileNames: (names: string[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
};

const videoConstraints = {
  width: { ideal: 4096 },
  height: { ideal: 2160 },
  facingMode: "user",
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
  const { type, onUpload, category = "UNSPECIFIED", multiple } = options;

  const [uploadFileNames, setUploadFileNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<null | number>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraFacingFront, setCameraFacingFront] = useState(true);
  const webRef = useRef<any>(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleSwitchCamera = useCallback(() => {
    setCameraFacingFront((prevState) => !prevState);
  }, []);

  const { width } = useWindowDimensions();
  const LaptopScreenBreakpoint = 640;
  const isLaptopScreen = width >= LaptopScreenBreakpoint ? true : false;

  const captureImage = () => {
    setPreviewImage(webRef.current.getScreenshot());
    const canvas = webRef.current.getCanvas();
    canvas?.toBlob((blob: Blob) => {
      const extension = blob.type.split("/").pop();
      const myFile = new File([blob], `capture.${extension}`, {
        type: blob.type,
      });
      setUploadFileNames((prev) => [...prev, `capture.${extension}`]);
      setFiles((prev) => [...prev, myFile]);
    });
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>): any => {
    if (!e.target.files?.length) {
      return;
    }
    const selectedFiles = Array.from(e.target.files);
    const fileNames = selectedFiles.map((file) => file.name);
    setFiles((prev) => [...prev, ...selectedFiles]);
    setUploadFileNames((prev) => [...prev, ...fileNames]);

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

  const validateFileUpload = () => {
    if (files.length === 0) {
      setError("Please choose files to upload");
      return false;
    }
    for (const file of files) {
      const filenameLength = file.name.trim().length;
      if (filenameLength === 0) {
        setError("Please give a name for all files!");
        return false;
      }
      if (file.size > 10e7) {
        setError("Maximum size of files is 100 MB");
        return false;
      }
      const extension = file.name.split(".").pop();
      if (
        "allowedExtensions" in options &&
        !options.allowedExtensions?.includes(extension || "")
      ) {
        setError(
          `Invalid file type ".${extension}" Allowed types: ${options.allowedExtensions?.join(", ")}`,
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
    console.log("filetype: ", newFile.type);
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
              msg: "File Uploaded Successfully",
            });
            setError(null);
            onUpload && onUpload(data);
            resolve();
          } else {
            Notification.Error({
              msg: "Error Uploading File: " + xhr.statusText,
            });
            setProgress(null);
            reject();
          }
        },
        setProgress as any,
        () => {
          Notification.Error({
            msg: "Error Uploading File: Network Error",
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
        uploadFileNames[index] === "" && file
          ? file.name
          : uploadFileNames[index];

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

    setFiles([]);
    setUploadFileNames([]);
  };

  const cameraFacingMode = cameraFacingFront
    ? "user"
    : { exact: "environment" };

  const Dialogues = (
    <DialogModal
      show={cameraModalOpen}
      title={
        <div className="flex flex-row">
          <div className="rounded-full bg-primary-100 px-5 py-4">
            <CareIcon
              icon="l-camera-change"
              className="text-lg text-primary-500"
            />
          </div>
          <div className="m-4">
            <h1 className="text-xl text-black"> Camera</h1>
          </div>
        </div>
      }
      className="max-w-2xl"
      onClose={() => setCameraModalOpen(false)}
    >
      <div>
        {!previewImage ? (
          <div className="m-3">
            <Webcam
              forceScreenshotSourceSize
              screenshotQuality={1}
              audio={false}
              screenshotFormat="image/jpeg"
              ref={webRef}
              videoConstraints={{
                ...videoConstraints,
                facingMode: cameraFacingMode,
              }}
            />
          </div>
        ) : (
          <div className="m-3">
            <img src={previewImage} />
          </div>
        )}
      </div>

      {/* buttons for mobile screens */}
      <div className="m-4 flex justify-evenly sm:hidden">
        <div>
          {!previewImage ? (
            <ButtonV2 onClick={handleSwitchCamera} className="m-2">
              {t("switch")}
            </ButtonV2>
          ) : (
            <></>
          )}
        </div>
        <div>
          {!previewImage ? (
            <>
              <div>
                <ButtonV2
                  onClick={() => {
                    captureImage();
                  }}
                  className="m-2"
                >
                  {t("capture")}
                </ButtonV2>
              </div>
            </>
          ) : (
            <>
              <div className="flex space-x-2">
                <ButtonV2
                  onClick={() => {
                    setPreviewImage(null);
                  }}
                  className="m-2"
                >
                  {t("retake")}
                </ButtonV2>
                <Submit
                  onClick={() => {
                    setPreviewImage(null);
                    setCameraModalOpen(false);
                  }}
                  className="m-2"
                >
                  {t("submit")}
                </Submit>
              </div>
            </>
          )}
        </div>
        <div className="sm:flex-1">
          <ButtonV2
            variant="secondary"
            onClick={() => {
              setPreviewImage(null);
              setCameraModalOpen(false);
            }}
            className="m-2"
          >
            {t("close")}
          </ButtonV2>
        </div>
      </div>
      {/* buttons for laptop screens */}
      <div className={`${isLaptopScreen ? " " : "hidden"}`}>
        <div className="m-4 flex lg:hidden">
          <ButtonV2 onClick={handleSwitchCamera}>
            <CareIcon icon="l-camera-change" className="text-lg" />
            {`${t("switch")} ${t("camera")}`}
          </ButtonV2>
        </div>

        <div className="flex justify-end gap-2 p-4">
          <div>
            {!previewImage ? (
              <>
                <div>
                  <ButtonV2
                    onClick={() => {
                      captureImage();
                    }}
                  >
                    <CareIcon icon="l-capture" className="text-lg" />
                    {t("capture")}
                  </ButtonV2>
                </div>
              </>
            ) : (
              <>
                <div className="flex space-x-2">
                  <ButtonV2
                    onClick={() => {
                      setPreviewImage(null);
                    }}
                  >
                    {t("retake")}
                  </ButtonV2>
                  <Submit
                    onClick={() => {
                      setCameraModalOpen(false);
                      setPreviewImage(null);
                    }}
                  >
                    {t("submit")}
                  </Submit>
                </div>
              </>
            )}
          </div>
          <div className="sm:flex-1" />
          <ButtonV2
            variant="secondary"
            onClick={() => {
              setPreviewImage(null);
              setCameraModalOpen(false);
            }}
          >
            {`${t("close")} ${t("camera")}`}
          </ButtonV2>
        </div>
      </div>
    </DialogModal>
  );

  const UploadButton = (props: FileUploadButtonProps) => (
    <label
      className={classNames(
        "button-size-default button-shape-square button-primary-default inline-flex h-min w-full cursor-pointer items-center justify-center gap-2 whitespace-pre font-medium outline-offset-1 transition-all duration-200 ease-in-out",
        props.className,
      )}
    >
      {props.children ? (
        props.children
      ) : (
        <>
          <CareIcon
            icon={props.icon || "l-file-upload-alt"}
            className="text-lg"
          />
          {props.content || t("choose_file")}
        </>
      )}
      <input
        id="file_upload_patient"
        title="changeFile"
        onChange={onFileChange}
        type="file"
        multiple={multiple}
        accept={
          "allowedExtensions" in options
            ? options.allowedExtensions?.join(",")
            : "allowAllExtensions" in options
              ? "*"
              : DEFAULT_ALLOWED_EXTENSIONS.join(",")
        }
        hidden
      />
    </label>
  );

  return {
    progress,
    error,
    handleCameraCapture: () => {
      setCameraModalOpen(true);
    },
    handleAudioCapture: () => {
      console.log("Audio capture not implemented");
    },
    handleFileUpload: handleUpload,
    Dialogues,
    UploadButton,
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
  };
}
