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

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TooltipComponent } from "@/components/ui/tooltip";

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

interface DragState {
  isDragging: boolean;
  position: { x: number; y: number };
  dragStart: { x: number; y: number };
}

const calculateClampedPosition = (
  e: { clientX: number; clientY: number },
  dragStart: { x: number; y: number },
  containerRect: DOMRect,
  imageRect: DOMRect,
) => {
  const maxX = Math.max(0, (imageRect.width - containerRect.width) / 2);
  const maxY = Math.max(0, (imageRect.height - containerRect.height) / 2);
  const newX = e.clientX - dragStart.x;
  const newY = e.clientY - dragStart.y;
  return {
    x: Math.max(-maxX, Math.min(maxX, newX)),
    y: Math.max(-maxY, Math.min(maxY, newY)),
  };
};

const initialDragState: DragState = {
  isDragging: false,
  position: { x: 0, y: 0 },
  dragStart: { x: 0, y: 0 },
};

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
  const [dragState, setDragState] = useState<DragState>(initialDragState);

  useEffect(() => {
    if (uploadedFiles && show) {
      setIndex(currentIndex);
    }
  }, [uploadedFiles, show, currentIndex]);

  useEffect(() => {
    setDragState(initialDragState);
  }, [index, show]);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!file_state.isImage) return;
    setDragState((prev) => ({
      ...prev,
      isDragging: true,
      dragStart: {
        x: e.clientX - prev.position.x,
        y: e.clientY - prev.position.y,
      },
    }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging) return;
    const container = e.currentTarget as HTMLDivElement;
    const image = container.querySelector("img");
    if (!image) return;

    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    const { x, y } = calculateClampedPosition(
      e,
      dragState.dragStart,
      containerRect,
      imageRect,
    );

    setDragState((prev) => ({
      ...prev,
      position: { x, y },
    }));
  };

  const handleMouseUp = () => {
    setDragState((prev) => ({
      ...prev,
      isDragging: false,
    }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!file_state.isImage) return;
    setDragState((prev) => ({
      ...prev,
      isDragging: true,
      dragStart: {
        x: e.touches[0].clientX - prev.position.x,
        y: e.touches[0].clientY - prev.position.y,
      },
    }));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.isDragging) return;
    e.preventDefault();
    const container = e.currentTarget as HTMLDivElement;
    const image = container.querySelector("img");
    if (!image) return;

    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    const { x, y } = calculateClampedPosition(
      {
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
      },
      dragState.dragStart,
      containerRect,
      imageRect,
    );

    setDragState((prev) => ({
      ...prev,
      position: { x, y },
    }));
  };

  const handleTouchEnd = () => {
    setDragState((prev) => ({
      ...prev,
      isDragging: false,
    }));
  };
  console.log("pdf url", fileUrl);

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="fixed inset-0 z-50 grid bg-[#f5f6fa] animate-in data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 p-0 shadow-none duration-200 w-screen h-screen max-w-none max-h-none rounded-none border-none">
        {fileUrl ? (
          <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 py-3">
              <div className="flex-1 min-w-0 mr-2">
                <TooltipComponent content={fileName}>
                  <p className="text-lg sm:text-xl font-medium text-gray-800 truncate">
                    {fileNameTooltip}
                  </p>
                </TooltipComponent>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                {downloadURL && downloadURL.length > 0 && (
                  <Button
                    variant="primary"
                    data-cy="file-preview-download"
                    className="whitespace-nowrap"
                  >
                    <a
                      href={downloadURL}
                      className="text-white flex items-center"
                      download={`${file_state.name}.${file_state.extension}`}
                    >
                      <CareIcon
                        icon="l-file-download"
                        className="size-4 mr-1 sm:mr-2"
                      />
                      <span className="hidden sm:inline">{t("download")}</span>
                      <span className="sm:hidden">Download</span>
                    </a>
                  </Button>
                )}
                {/* <Button
                variant="ghost"
                onClick={handleClose}
                className="p-1 sm:p-2 flex-shrink-0"
                aria-label={t("close")}
              >
                <CareIcon icon="l-times" className="size-4 sm:size-5 text-gray-700" />
              </Button> */}
              </div>
            </div>

            {/* Created date subheader */}
            <div className="text-sm text-gray-500 px-6 py-1 bg-white border-b border-gray-200">
              {uploadedFiles &&
                uploadedFiles[index] &&
                uploadedFiles[index].created_date && (
                  <p className="text-sm text-gray-600">
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

            {/* Controls and content container */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Zoom controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleZoomOut}
                      disabled={
                        file_state.isImage
                          ? file_state.zoom === 1
                          : scale <= 0.5
                      }
                      className="p-1.5 h-9 w-9 border border-gray-300"
                    >
                      <CareIcon icon="l-search-minus" className="size-5" />
                    </Button>
                    <div className="border border-gray-300 px-2.5 py-1.5 rounded-md min-w-[70px] h-9 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {file_state.isImage
                          ? `${25 * file_state.zoom}%`
                          : `${Math.round(scale * 100)}%`}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleZoomIn}
                      disabled={
                        file_state.isImage
                          ? file_state.zoom === zoom_values.length
                          : scale >= 2
                      }
                      className="p-1.5 h-9 w-9 border border-gray-300"
                    >
                      <CareIcon icon="l-search-plus" className="size-4" />
                    </Button>
                  </div>

                  {/* Fit width button */}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      file_state.isImage
                        ? setFileState({ ...file_state, zoom: 4 })
                        : setScale(1);
                    }}
                    className="text-sm"
                  >
                    <CareIcon icon="l-arrows-h" className="size-4 mr-1" />
                    {t("fit_width")}
                  </Button>
                </div>

                {/* Right side controls */}
                <div className="flex items-center space-x-2">
                  {file_state.isImage && (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => handleRotate(-90)}
                        className="p-1 h-8"
                      >
                        <CareIcon icon="l-corner-up-left" className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleRotate(90)}
                        className="p-1 h-8"
                      >
                        <CareIcon icon="l-corner-up-right" className="size-4" />
                      </Button>
                    </>
                  )}
                  {/* {file_state.extension === "pdf" && (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="p-1 ant-btn css-1x0dypw ant-btn-default ant-btn-color-default ant-btn-variant-outlined !rounded-button whitespace-nowrap-8"
                      >
                        <CareIcon icon="l-arrow-left" className="size-4 anticon anticon-left" />
                      </Button>
                      <span className="text-sm mx-2 font-medium">
                        {page}/{numPages}
                      </span>
                      <Button
                        variant="ghost"
                        onClick={() => setPage((prev) => Math.min(numPages, prev + 1))}
                        disabled={page === numPages}
                        className="p-ant-btn css-1x0dypw ant-btn-default ant-btn-color-default ant-btn-variant-outlined !rounded-button whitespace-nowrap h-8"
                      >
                        <CareIcon icon="l-arrow-right" className="size-4" />
                      </Button>
                    </>
                  )} */}

                  {file_state.extension === "pdf" && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 border border-gray-300"
                        aria-label="Previous Page"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                        <span className="ml-1">Previous Page</span>
                      </Button>

                      <div className="flex items-center text-sm font-medium text-gray-700">
                        <span>
                          Page {page} of {numPages}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() =>
                          setPage((prev) => Math.min(numPages, prev + 1))
                        }
                        disabled={page === numPages}
                        className="h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 border border-gray-300"
                        aria-label="Next Page"
                      >
                        <span className="mr-1">Next Page</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </Button>
                    </div>
                  )}

                  {/* <Button
                    variant="ghost"
                    onClick={() => { }}
                    className="p-1 h-8"
                  >
                    <CareIcon icon="l-expand-arrows-alt" className="size-4" />
                  </Button> */}
                </div>
              </div>

              {/* Main content area */}
              <div className="flex-1 flex items-center justify-center bg-gray-200 p-6 overflow-auto">
                <div className="flex items-center">
                  {uploadedFiles && uploadedFiles.length > 1 && (
                    <Button
                      variant="ghost"
                      className="mr-4 bg-white/70 hover:bg-white/90 rounded-full h-10 w-10 p-0 shadow-md"
                      onClick={() => handleNext(index - 1)}
                      disabled={index <= 0}
                      aria-label={t("previous_file")}
                    >
                      <CareIcon icon="l-arrow-left" className="size-4" />
                    </Button>
                  )}

                  <div
                    className={cn(
                      "flex h-[65vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg border border-secondary-200 bg-white touch-none",
                      dragState.isDragging ? "cursor-grabbing" : "cursor-grab",
                    )}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {file_state.isImage ? (
                      <div
                        className={cn(
                          "flex items-center justify-center w-full h-full transition-transform duration-100",
                          dragState.isDragging ? "duration-0" : "",
                        )}
                        style={{
                          transform: `translate(${dragState.position.x}px, ${dragState.position.y}px)`,
                        }}
                      >
                        <img
                          src={fileUrl}
                          alt="file"
                          className={cn(
                            "max-h-full max-w-full select-none object-contain",
                            zoom_values[file_state.zoom - 1],
                            getRotationClass(file_state.rotation),
                          )}
                          draggable={false}
                        />
                      </div>
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
                      variant="ghost"
                      className="ml-4 bg-white/70 hover:bg-white/90 rounded-full h-10 w-10 p-0 shadow-md"
                      onClick={() => handleNext(index + 1)}
                      disabled={index >= uploadedFiles.length - 1}
                      aria-label={t("next_file")}
                    >
                      <CareIcon icon="l-arrow-right" className="size-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Footer - Currently empty as in your design */}
              <div className="bg-white border-t border-gray-200 h-10"></div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <CircularProgress />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewDialog;
