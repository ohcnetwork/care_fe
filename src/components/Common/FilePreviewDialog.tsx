import {
  Dispatch,
  ReactNode,
  SetStateAction,
  Suspense,
  lazy,
  useEffect,
  useRef,
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface PinchState {
  isPinching: boolean;
  initialDistance: number;
  initialScale: number;
  center: { x: number; y: number };
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

const getDistance = (touch1: Touch, touch2: Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

const getCenter = (touch1: Touch, touch2: Touch) => ({
  x: (touch1.clientX + touch2.clientX) / 2,
  y: (touch1.clientY + touch2.clientY) / 2,
});

const initialDragState: DragState = {
  isDragging: false,
  position: { x: 0, y: 0 },
  dragStart: { x: 0, y: 0 },
};

const initialPinchState: PinchState = {
  isPinching: false,
  initialDistance: 0,
  initialScale: 1,
  center: { x: 0, y: 0 },
};

export default function FilePreviewDialog(props: FilePreviewProps) {
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
  const [scale, setScale] = useState(0.75);
  const [dragState, setDragState] = useState<DragState>(initialDragState);
  const [pinchState, setPinchState] = useState<PinchState>(initialPinchState);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (uploadedFiles && show) {
      setIndex(currentIndex);
    }
  }, [uploadedFiles, show, currentIndex]);

  useEffect(() => {
    setDragState(initialDragState);
    setPinchState(initialPinchState);
  }, [index, show, file_state.zoom]);

  const handleZoomIn = () => {
    const checkFull = file_state.zoom === zoom_values.length;
    setFileState({
      ...file_state,
      zoom: !checkFull ? file_state.zoom + 1 : file_state.zoom,
    });
    setScale((prevScale) => Math.min(prevScale + 0.25, 2));
    setDragState((prev) => ({ ...prev, position: { x: 0, y: 0 } }));
  };
  const handleZoomOut = () => {
    const checkFull = file_state.zoom === 1;
    setFileState({
      ...file_state,
      zoom: !checkFull ? file_state.zoom - 1 : file_state.zoom,
    });
    setScale((prevScale) => Math.max(prevScale - 0.25, 0.5));
    setDragState((prev) => ({ ...prev, position: { x: 0, y: 0 } }));
  };

  const handlePinchZoom = (newScale: number) => {
    if (file_state.isImage) {
      const zoomLevel = Math.max(1, Math.min(8, Math.round(newScale * 4)));
      setFileState({
        ...file_state,
        zoom: zoomLevel,
      });
    } else if (file_state.extension === "pdf") {
      setScale(Math.max(0.5, Math.min(2, newScale)));
    }
  };
  const handleRotate = (angle: number) => {
    setFileState((prev: any) => {
      const newRotation = (prev.rotation + angle + 360) % 360;
      return {
        ...prev,
        rotation: newRotation,
      };
    });
    setDragState((prev) => ({ ...prev, position: { x: 0, y: 0 } }));
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
    setScale(0.75);
    setDragState(initialDragState);
    setPinchState(initialPinchState);
    onClose?.();
  };

  useKeyboardShortcut(["ArrowLeft"], () => index > 0 && handleNext(index - 1));

  useKeyboardShortcut(
    ["ArrowRight"],
    () => index < (uploadedFiles?.length || 0) - 1 && handleNext(index + 1),
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!file_state.isImage || file_state.zoom <= 4) return;

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
    if (!dragState.isDragging || !file_state.isImage) return;

    const container = containerRef.current;
    const image = imageRef.current;

    if (!container || !image) return;

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
    if (e.touches.length === 2) {
      const touch1 = e.touches[0] as unknown as Touch;
      const touch2 = e.touches[1] as unknown as Touch;
      const distance = getDistance(touch1, touch2);
      const center = getCenter(touch1, touch2);

      setPinchState({
        isPinching: true,
        initialDistance: distance,
        initialScale: file_state.isImage ? file_state.zoom / 4 : scale,
        center,
      });

      setDragState((prev) => ({
        ...prev,
        isDragging: false,
      }));
    } else if (e.touches.length === 1 && !pinchState.isPinching) {
      if (!file_state.isImage || file_state.zoom <= 4) return;

      setDragState((prev) => ({
        ...prev,
        isDragging: true,
        dragStart: {
          x: e.touches[0].clientX - prev.position.x,
          y: e.touches[0].clientY - prev.position.y,
        },
      }));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchState.isPinching) {
      // Pinch zoom
      const touch1 = e.touches[0] as unknown as Touch;
      const touch2 = e.touches[1] as unknown as Touch;
      const distance = getDistance(touch1, touch2);

      if (pinchState.initialDistance > 0) {
        const scaleChange = distance / pinchState.initialDistance;
        const newScale = pinchState.initialScale * scaleChange;
        handlePinchZoom(newScale);
      }
    } else if (
      e.touches.length === 1 &&
      dragState.isDragging &&
      !pinchState.isPinching
    ) {
      // Single touch drag
      const container = containerRef.current;
      const image = imageRef.current;

      if (!container || !image) return;

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
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setPinchState(initialPinchState);
    }

    if (e.touches.length === 0) {
      setDragState((prev) => ({
        ...prev,
        isDragging: false,
      }));
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.stopPropagation();

      const zoomIn = e.deltaY < 0;

      if (file_state.isImage) {
        const currentZoomLevel = file_state.zoom;
        let newZoomLevel: number;

        if (zoomIn) {
          newZoomLevel = Math.min(zoom_values.length, currentZoomLevel + 1);
        } else {
          newZoomLevel = Math.max(1, currentZoomLevel - 1);
        }

        if (newZoomLevel !== currentZoomLevel) {
          setFileState({
            ...file_state,
            zoom: newZoomLevel,
          });
          setDragState((prev) => ({ ...prev, position: { x: 0, y: 0 } }));
        }
      } else if (file_state.extension === "pdf") {
        const currentScale = scale;
        let newScale: number;

        if (zoomIn) {
          newScale = Math.min(2, currentScale + 0.1);
        } else {
          newScale = Math.max(0.5, currentScale - 0.1);
        }

        setScale(newScale);
      }
    }
  };

  const getCursorStyle = () => {
    if (!file_state.isImage) return "default";
    if (file_state.zoom <= 4) return "default";
    if (dragState.isDragging) return "grabbing";
    return "grab";
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="h-full w-full max-w-[100vw] md:max-w-[80vw] flex-col gap-4 rounded-lg p-4 shadow-xl md:p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm text-gray-600">
            {t("file_preview")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("file_preview")}
          </DialogDescription>
        </DialogHeader>
        {fileUrl ? (
          <>
            <div className="mb-2 flex flex-col items-start md:justify-between md:flex-row gap-4">
              <div>
                <TooltipComponent content={fileName}>
                  <p className="text-xl font-bold text-gray-800 truncate">
                    {fileNameTooltip}
                  </p>
                </TooltipComponent>
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
              <div>
                {downloadURL && downloadURL.length > 0 && (
                  <Button variant="primary" data-cy="file-preview-download">
                    <a
                      href={downloadURL}
                      className="text-white flex items-center gap-2"
                      download={`${file_state.name}.${file_state.extension}`}
                    >
                      <CareIcon icon="l-file-download" className="size-4" />
                      <span>{t("download")}</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-1 items-center justify-between gap-4">
              {uploadedFiles && uploadedFiles.length > 1 && (
                <Button
                  variant="primary"
                  onClick={() => handleNext(index - 1)}
                  disabled={index <= 0}
                  aria-label="Previous file"
                >
                  <CareIcon icon="l-arrow-left" className="size-4" />
                </Button>
              )}
              <div
                ref={containerRef}
                className={cn(
                  "flex h-[50vh] md:h-[70vh] items-center justify-center overflow-hidden rounded-lg border border-gray-200 touch-none",
                )}
                style={{ cursor: getCursorStyle() }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onWheel={handleWheel}
              >
                {file_state.isImage ? (
                  <div
                    className={cn(
                      "flex items-center justify-center w-full h-full transition-transform duration-100",
                      dragState.isDragging || pinchState.isPinching
                        ? "duration-0"
                        : "",
                    )}
                    style={{
                      transform: `translate(${dragState.position.x}px, ${dragState.position.y}px)`,
                    }}
                  >
                    <img
                      ref={imageRef}
                      src={fileUrl}
                      alt={fileName}
                      className={cn(
                        "max-h-full max-w-full select-none object-contain",
                        zoom_values[file_state.zoom - 1],
                        getRotationClass(file_state.rotation),
                      )}
                      draggable={false}
                      loading="lazy"
                      decoding="async"
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
                    className="h-[50vh] md:h-[70vh] w-full"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center">
                    <CareIcon
                      icon="l-file"
                      className="mb-4 text-5xl text-gray-600"
                    />
                    {t("file_preview_not_supported")}
                  </div>
                )}
              </div>
              {uploadedFiles && uploadedFiles.length > 1 && (
                <Button
                  variant="primary"
                  onClick={() => handleNext(index + 1)}
                  disabled={index >= uploadedFiles.length - 1}
                  aria-label={t("next_file")}
                >
                  <CareIcon icon="l-arrow-right" className="size-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center justify-center">
              <div className="mt-2 grid grid-cols-3 md:grid-cols-6 gap-4">
                {file_state.isImage && (
                  <>
                    {[
                      {
                        label: t("zoom_in"),
                        icon: "l-search-plus",
                        action: handleZoomIn,
                        disabled: file_state.zoom === zoom_values.length,
                      },
                      {
                        label: `${25 * file_state.zoom}%`,
                        icon: null,
                        action: () => {
                          setFileState({ ...file_state, zoom: 4 });
                        },
                        disabled: false,
                      },
                      {
                        label: t("zoom_out"),
                        icon: "l-search-minus",
                        action: handleZoomOut,
                        disabled: file_state.zoom === 1,
                      },
                      {
                        label: t("rotate_left"),
                        icon: "l-corner-up-left",
                        action: () => handleRotate(-90),
                        disabled: false,
                      },
                      {
                        label: t("reset"),
                        icon: "l-minus-circle",
                        action: () =>
                          setFileState((prev) => ({
                            ...prev,
                            rotation: 0,
                            zoom: 4,
                          })),
                        disabled: false,
                      },
                      {
                        label: t("rotate_right"),
                        icon: "l-corner-up-right",
                        action: () => handleRotate(90),
                        disabled: false,
                      },
                    ].map((button, index) => (
                      <Button
                        variant="ghost"
                        key={index}
                        onClick={button.action}
                        className="z-50 rounded bg-white/60 text-black backdrop-blur-sm transition hover:bg-white/70"
                        disabled={button.disabled}
                      >
                        <div>
                          {button.icon && (
                            <CareIcon
                              icon={button.icon as IconName}
                              className="text-lg"
                            />
                          )}
                          <div>{button.label}</div>
                        </div>
                      </Button>
                    ))}
                  </>
                )}
                {file_state.extension === "pdf" && (
                  <>
                    {[
                      {
                        label: t("zoom_in"),
                        icon: "l-search-plus",
                        action: handleZoomIn,
                        disabled: scale >= 2,
                      },
                      {
                        label: `${Math.round(scale * 100)}%`,
                        icon: null,
                        action: () => {},
                        disabled: false,
                      },
                      {
                        label: t("zoom_out"),
                        icon: "l-search-minus",
                        action: handleZoomOut,
                        disabled: scale <= 0.5,
                      },
                      {
                        label: t("previous"),
                        icon: "l-arrow-left",
                        action: () => setPage((prev) => prev - 1),
                        disabled: page === 1,
                      },
                      {
                        label: `${page}/${numPages}`,
                        icon: null,
                        action: () => {},
                        disabled: false,
                      },
                      {
                        label: t("next"),
                        icon: "l-arrow-right",
                        action: () => setPage((prev) => prev + 1),
                        disabled: page === numPages,
                      },
                    ].map((button, index) => (
                      <Button
                        variant="ghost"
                        key={index}
                        onClick={button.action}
                        className="z-50 rounded bg-white/60 px-4 py-2 text-black backdrop-blur-sm transition hover:bg-white/70"
                        disabled={button.disabled}
                      >
                        {button.icon && (
                          <CareIcon
                            icon={button.icon as IconName}
                            className="mr-2 text-lg"
                          />
                        )}
                        {button.label}
                      </Button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-[50vh] md:h-[70vh] items-center justify-center">
            <CircularProgress />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
