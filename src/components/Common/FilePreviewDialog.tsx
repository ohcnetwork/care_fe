import { TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Tooltip } from "@radix-ui/react-tooltip";
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
import useKeyboardShortcut from "use-keyboard-shortcut";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import CircularProgress from "@/components/Common/CircularProgress";
import { FileUploadModel } from "@/components/Patient/models";

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
export interface StateInterface {
  open: boolean;
  isImage: boolean;
  name: string;
  extension: string;
  zoom: number;
  isZoomInDisabled: boolean;
  isZoomOutDisabled: boolean;
  rotation: number;
  id?: string;
  associating_id?: string;
}
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
  const [scale, setScale] = useState(1.0);
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
    setScale((prevScale) => Math.min(prevScale + 0.25, 2));
  };
  const handleZoomOut = () => {
    const checkFull = file_state.zoom === 1;
    setFileState({
      ...file_state,
      zoom: !checkFull ? file_state.zoom - 1 : file_state.zoom,
    });
    setScale((prevScale) => Math.max(prevScale - 0.25, 0.5));
  };
  const handleRotate = (angle: number) => {
    setFileState((prev: any) => {
      const newRotation = (prev.rotation + angle + 360) % 360;
      return {
        ...prev,
        rotation: newRotation,
      };
    });
  };

  function getRotationClass(rotation: number) {
    const normalizedRotation = rotation % 360;
    switch (normalizedRotation) {
      case 90:
        return "rotate-90";
      case 180:
        return "rotate-180";
      case 270:
        return "-rotate-90";
      default:
        return "";
    }
  }

  const fileName = file_state?.name
    ? file_state.name + "." + file_state.extension
    : "";

  const fileNameTooltip =
    fileName.length > 30 ? fileName.slice(0, 30) + "..." : fileName;

  const handleNext = (newIndex: number) => {
    if (
      !uploadedFiles?.length ||
      !loadFile ||
      newIndex < 0 ||
      newIndex >= uploadedFiles.length
    ) {
      return;
    }
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
    setScale(1);
    onClose?.();
  };

  useKeyboardShortcut(["ArrowLeft"], () => index > 0 && handleNext(index - 1));

  useKeyboardShortcut(
    ["ArrowRight"],
    () => index < (uploadedFiles?.length || 0) - 1 && handleNext(index + 1),
  );

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="h-full w-full max-w-5xl flex-col gap-4 bg-white rounded-lg p-4 shadow-xl md:p-6">
        <DialogHeader>
          <DialogTitle className="text-sm text-gray-600">
            {t("file_preview")}
          </DialogTitle>
        </DialogHeader>
        {fileUrl ? (
          <>
            <div className="mb-2 flex flex-col items-start justify-between md:flex-row">
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <p className="text-2xl font-bold text-gray-800 truncate">
                        {fileNameTooltip}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm text-white truncate bg-red rounded-md p-2">
                        {fileName}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {uploadedFiles &&
                  uploadedFiles[index] &&
                  uploadedFiles[index].created_date && (
                    <p className="mt-1 text-sm text-gray-600">
                      {t("created_on")}{" "}
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
                  <Button variant="primary">
                    <a
                      href={downloadURL}
                      className="text-white"
                      download={`${file_state.name}.${file_state.extension}`}
                    >
                      <CareIcon icon="l-file-download" className="h-4 w-4" />
                      <span>{t("download")}</span>
                    </a>
                  </Button>
                )}
                <Button variant="outline" type="button" onClick={handleClose}>
                  {t("close")}
                </Button>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center">
              {uploadedFiles && uploadedFiles.length > 1 && (
                <Button
                  variant="primary"
                  className="mr-4"
                  onClick={() => handleNext(index - 1)}
                  disabled={index <= 0}
                  aria-label="Previous file"
                >
                  <CareIcon icon="l-arrow-left" className="h-4 w-4" />
                </Button>
              )}
              <div className="flex h-[50vh] md:h-[75vh] w-full items-center justify-center overflow-scroll rounded-lg border border-secondary-200">
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
                      scale={scale}
                    />
                  </Suspense>
                ) : previewExtensions.includes(file_state.extension) ? (
                  <iframe
                    sandbox=""
                    title={t("source_file")}
                    src={fileUrl}
                    className="h-[50vh] md:h-[75vh] w-full"
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
                <Button
                  variant="primary"
                  className="ml-4"
                  onClick={() => handleNext(index + 1)}
                  disabled={index >= uploadedFiles.length - 1}
                  aria-label={t("next_file")}
                >
                  <CareIcon icon="l-arrow-right" className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center justify-center">
              <div className="mt-2 grid grid-cols-5 max-md:grid-cols-6 gap-4">
                {file_state.isImage && (
                  <>
                    {[
                      [
                        t("zoom_in"),
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
                        t("zoom_out"),
                        "l-search-minus",
                        handleZoomOut,
                        file_state.zoom === 1,
                      ],
                      [
                        t("rotate_left"),
                        "l-corner-up-left",
                        () => handleRotate(-90),
                        false,
                      ],
                      [
                        t("rotate_right"),
                        "l-corner-up-right",
                        () => handleRotate(90),
                        false,
                      ],
                    ].map((button, index) => (
                      <Button
                        variant="ghost"
                        key={index}
                        onClick={button[2] as () => void}
                        className={cn(
                          "z-50 rounded bg-white/60 px-4 py-2 text-black backdrop-blur transition hover:bg-white/70",
                          index > 2 ? "max-md:col-span-3" : "max-md:col-span-2",
                        )}
                        disabled={button[3] as boolean}
                      >
                        {button[1] && (
                          <CareIcon
                            icon={button[1] as IconName}
                            className="mr-2 text-lg"
                          />
                        )}
                        {button[0] as string}
                      </Button>
                    ))}
                  </>
                )}
                {file_state.extension === "pdf" && (
                  <>
                    {[
                      [t("zoom_in"), "l-search-plus", handleZoomIn, scale >= 2],
                      [`${Math.round(scale * 100)}%`, false, () => {}, false],
                      [
                        t("zoom_out"),
                        "l-search-minus",
                        handleZoomOut,
                        scale <= 0.5,
                      ],
                      [
                        t("previous"),
                        "l-arrow-left",
                        () => setPage((prev) => prev - 1),
                        page === 1,
                      ],
                      [`${page}/${numPages}`, false, () => ({}), false],
                      [
                        t("next"),
                        "l-arrow-right",
                        () => setPage((prev) => prev + 1),
                        page === numPages,
                      ],
                    ].map((button, index) => (
                      <Button
                        variant="ghost"
                        key={index}
                        onClick={button[2] as () => void}
                        className={cn(
                          "z-50 rounded bg-white/60 px-4 py-2 text-black backdrop-blur transition hover:bg-white/70",
                          index > 2 ? "max-md:col-span-3" : "max-md:col-span-2",
                        )}
                        disabled={button[3] as boolean}
                      >
                        {button[1] && (
                          <CareIcon
                            icon={button[1] as IconName}
                            className="mr-2 text-lg"
                          />
                        )}
                        {button[0] as string}
                      </Button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-[50vh] md:h-[75vh] items-center justify-center">
            <CircularProgress />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
export default FilePreviewDialog;
