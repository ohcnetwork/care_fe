import {
  Dispatch,
  ReactNode,
  SetStateAction,
  Suspense,
  lazy,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import ButtonV2, { Cancel } from "@/components/Common/ButtonV2";
import CircularProgress from "@/components/Common/CircularProgress";
import DialogModal from "@/components/Common/Dialog";
import { StateInterface } from "@/components/Files/FileUpload";

import { FileUploadModel } from "../Patient/models";

const PDFViewer = lazy(() => import("@/components/Common/PDFViewer"));

export const zoom_values = [
  "scale-25",
  "scale-50",
  "scale-75",
  "scale-100",
  "scale-125",
  "scale-150",
  "scale-175",
  "scale-200",
];

type FilePreviewProps = {
  title?: ReactNode;
  description?: ReactNode;
  show: boolean;
  onClose: () => void;
  file_state: StateInterface;
  setFileState: Dispatch<SetStateAction<StateInterface>>;
  downloadURL?: string;
  fileUrl: string;
  className?: string;
  titleAction?: ReactNode;
  fixedWidth?: boolean;
  uploadedFiles?: FileUploadModel[];
  loadFile?: (file: FileUploadModel, associating_id: string) => void;
  currentIndex: number;
};

const previewExtensions = [
  ".html",
  ".htm",
  ".pdf",
  ".mp4",
  ".webm",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
];

const FilePreviewDialog = (props: FilePreviewProps) => {
  const {
    show,
    onClose,
    file_state,
    setFileState,
    downloadURL,
    fileUrl,
    uploadedFiles,
    loadFile,
    currentIndex,
  } = props;
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [index, setIndex] = useState<number>(currentIndex);

  useEffect(() => {
    if (uploadedFiles && show) {
      setIndex(currentIndex);
    }
  }, [uploadedFiles, show, currentIndex]);

  const handleZoomIn = () => {
    const checkFull = file_state.zoom === zoom_values.length;
    setFileState({
      ...file_state,
      zoom: !checkFull ? file_state.zoom + 1 : file_state.zoom,
    });
  };

  const handleZoomOut = () => {
    const checkFull = file_state.zoom === 1;
    setFileState({
      ...file_state,
      zoom: !checkFull ? file_state.zoom - 1 : file_state.zoom,
    });
  };

  const handleNext = (newIndex: number) => {
    if (
      !uploadedFiles?.length ||
      !loadFile ||
      newIndex < 0 ||
      newIndex >= uploadedFiles.length
    )
      return;

    const nextFile = uploadedFiles[newIndex];
    if (!nextFile?.id) return;

    const associating_id = nextFile.associating_id || "";
    loadFile(nextFile, associating_id);
    setIndex(newIndex);
  };

  const handleClose = () => {
    setPage(1);
    setNumPages(1);
    setIndex(-1);
    onClose?.();
  };

  const handleRotate = (rotation: number) => {
    setFileState((prev: any) => ({
      ...prev,
      rotation: prev.rotation + rotation,
    }));
  };

  function getRotationClass(rotation: number) {
    let normalizedRotation = ((rotation % 360) + 360) % 360; // Normalize rotation to be within [0, 360)
    if (normalizedRotation > 180) {
      normalizedRotation -= 360; // Adjust to be within [-180, 180)
    }
    return normalizedRotation === -90 // Special case for -90 rotation since tailwind doesn't support 270deg
      ? "-rotate-90"
      : `rotate-${normalizedRotation}`;
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!show) return;
      if (e.key === "ArrowLeft" && index > 0) {
        handleNext(index - 1);
      }
      if (e.key === "ArrowRight" && index < (uploadedFiles?.length || 0) - 1) {
        handleNext(index + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, index, uploadedFiles]);

  return (
    <DialogModal
      fixedWidth={false}
      className="z-10 h-full w-full max-w-5xl flex-col gap-4 rounded-lg bg-white p-4 shadow-xl md:p-6"
      onClose={() => {
        handleClose();
      }}
      title={<span className="text-sm text-gray-600">{t("file_preview")}</span>}
      show={show}
    >
      {fileUrl ? (
        <>
          <div className="mb-2 flex flex-col items-start justify-between md:flex-row">
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {file_state.name}.{file_state.extension}
              </p>
              {uploadedFiles &&
                uploadedFiles[index] &&
                uploadedFiles[index].created_date && (
                  <p className="mt-1 text-sm text-gray-600">
                    Created on{" "}
                    {new Date(
                      uploadedFiles[index].created_date!,
                    ).toLocaleString("en-US", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </p>
                )}
            </div>
            <div className="flex gap-4 mt-2 md:mt-0">
              {downloadURL && downloadURL.length > 0 && (
                <ButtonV2>
                  <a
                    href={downloadURL}
                    className="text-white"
                    download={`${file_state.name}.${file_state.extension}`}
                  >
                    <CareIcon icon="l-file-download" className="h-4 w-4" />
                    <span>Download</span>
                  </a>
                </ButtonV2>
              )}
              <Cancel onClick={onClose} label="Close" />
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            {uploadedFiles && uploadedFiles.length > 1 && (
              <ButtonV2
                className="cursor-pointer bg-primary-500 rounded-md mr-4"
                onClick={() => handleNext(index - 1)}
                disabled={index <= 0}
                aria-label="Previous file"
                onKeyDown={(e) =>
                  e.key === "ArrowLeft" && handleNext(index - 1)
                }
              >
                <CareIcon icon="l-arrow-left" className="h-4 w-4" />
              </ButtonV2>
            )}
            <div className="flex h-[75vh] w-full items-center justify-center overflow-scroll rounded-lg border border-secondary-200">
              {file_state.isImage ? (
                <img
                  src={fileUrl}
                  alt="file"
                  className={`h-full w-full object-contain ${
                    zoom_values[file_state.zoom - 1]
                  } ${getRotationClass(file_state.rotation)}`}
                />
              ) : file_state.extension === "pdf" ? (
                <Suspense fallback={<CircularProgress />}>
                  <PDFViewer
                    url={fileUrl}
                    onDocumentLoadSuccess={(numPages: number) => {
                      setPage(1);
                      setNumPages(numPages);
                    }}
                    pageNumber={page}
                  />
                </Suspense>
              ) : previewExtensions.includes(file_state.extension) ? (
                <iframe
                  sandbox=""
                  // eslint-disable-next-line i18next/no-literal-string
                  title="Source Files"
                  src={fileUrl}
                  className="h-[75vh] w-full"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center">
                  <CareIcon
                    icon="l-file"
                    className="mb-4 text-5xl text-secondary-600"
                  />
                  {t("file_preview_not_supported")}
                </div>
              )}
            </div>

            {uploadedFiles && uploadedFiles.length > 1 && (
              <ButtonV2
                className="cursor-pointer bg-primary-500 rounded-md ml-4"
                onClick={() => handleNext(index + 1)}
                disabled={index >= uploadedFiles.length - 1}
                aria-label="Next file"
                onKeyDown={(e) =>
                  e.key === "ArrowRight" && handleNext(index + 1)
                }
              >
                <CareIcon icon="l-arrow-right" className="h-4 w-4" />
              </ButtonV2>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="mt-2 flex w-full flex-col justify-center gap-3 md:flex-row">
              {file_state.isImage && (
                <>
                  {[
                    [
                      t("Zoom In"),
                      "l-search-plus",
                      handleZoomIn,
                      file_state.zoom === zoom_values.length,
                    ],
                    [
                      `${25 * file_state.zoom}%`,
                      false,
                      () => {
                        setFileState({ ...file_state, zoom: 4 });
                      },
                      false,
                    ],
                    [
                      t("Zoom Out"),
                      "l-search-minus",
                      handleZoomOut,
                      file_state.zoom === 1,
                    ],
                    [
                      t("Rotate Left"),
                      "l-corner-up-left",
                      () => handleRotate(-90),
                      false,
                    ],
                    [
                      t("Rotate Right"),
                      "l-corner-up-right",
                      () => handleRotate(90),
                      false,
                    ],
                  ].map((button, index) => (
                    <ButtonV2
                      border
                      ghost
                      key={index}
                      onClick={button[2] as () => void}
                      className="z-50 rounded bg-white/60 px-4 py-2 text-black backdrop-blur transition hover:bg-white/70"
                      disabled={button[3] as boolean}
                    >
                      {button[1] && (
                        <CareIcon
                          icon={button[1] as IconName}
                          className="mr-2 text-lg"
                        />
                      )}
                      {button[0] as string}
                    </ButtonV2>
                  ))}
                </>
              )}
              {file_state.extension === "pdf" && (
                <>
                  {[
                    [
                      "Previous",
                      "l-arrow-left",
                      () => setPage((prev) => prev - 1),
                      page === 1,
                    ],
                    [`${page}/${numPages}`, false, () => ({}), false],
                    [
                      "Next",
                      "l-arrow-right",
                      () => setPage((prev) => prev + 1),
                      page === numPages,
                    ],
                  ].map((button, index) => (
                    <ButtonV2
                      border
                      ghost
                      key={index}
                      onClick={button[2] as () => void}
                      className="z-50 rounded bg-white/60 px-4 py-2 text-black backdrop-blur transition hover:bg-white/70"
                      disabled={button[3] as boolean}
                    >
                      {button[1] && (
                        <CareIcon
                          icon={button[1] as IconName}
                          className="mr-2 text-lg"
                        />
                      )}
                      {button[0] as string}
                    </ButtonV2>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-[75vh] items-center justify-center">
          <CircularProgress />
        </div>
      )}
    </DialogModal>
  );
};

export default FilePreviewDialog;
