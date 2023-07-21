import React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { classNames } from "../../Utils/utils";
import CircularProgress from "./components/CircularProgress";
import { useTranslation } from "react-i18next";
import { StateInterface } from "../Patient/FileUpload";

export const zoom_values = [
  "h-1/6 w-1/6 my-40",
  "h-2/6 w-2/6 my-32",
  "h-3/6 w-3/6 my-24",
  "h-4/6 w-4/6 my-20",
  "h-5/6 w-5/6 my-16",
  "h-full w-full my-12",
];

type FilePreviewProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  show: boolean;
  onClose: () => void;
  file_state: StateInterface;
  setFileState: React.Dispatch<React.SetStateAction<StateInterface>>;
  downloadURL?: string;
  fileUrl: string;
  className?: string;
  titleAction?: React.ReactNode;
  fixedWidth?: boolean;
};

const FilePreviewDialog = (props: FilePreviewProps) => {
  const {
    title,
    description,
    show,
    onClose,
    file_state,
    setFileState,
    downloadURL,
    fileUrl,
    className,
    fixedWidth = true,
  } = props;
  const { t } = useTranslation();

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

  const handleRotate = (rotation: number) => {
    setFileState((prev) => ({
      ...prev,
      rotation: prev.rotation + rotation,
    }));
  };

  return (
    <div>
      <Transition appear show={show} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={onClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className={classNames(
                    className,
                    fixedWidth && "max-w-md w-full",
                    "transform rounded-2xl p-6 text-left align-middle shadow-xl transition-all"
                  )}
                >
                  <Dialog.Title
                    as="h4"
                    className="text-lg font-medium leading-6 text-gray-900 flex justify-between"
                  >
                    <div>
                      <h4>{title}</h4>
                      <p className="mt-2 text-sm text-gray-600">
                        {description}
                      </p>
                    </div>
                    {props.titleAction}
                  </Dialog.Title>
                  {fileUrl && fileUrl.length > 0 ? (
                    <div className="flex">
                      <div className="flex absolute h-full sm:h-auto sm:inset-x-4 sm:top-4 p-2 sm:p-0 justify-between flex-col sm:flex-row">
                        <div className="flex gap-3">
                          {file_state.isImage && (
                            <>
                              {[
                                [
                                  t("Zoom In"),
                                  "magnifying-glass-plus",
                                  handleZoomIn,
                                  file_state.zoom === zoom_values.length,
                                ],
                                [
                                  t("Zoom Out"),
                                  "magnifying-glass-minus",
                                  handleZoomOut,
                                  file_state.zoom === 1,
                                ],
                                [
                                  t("Rotate Left"),
                                  "rotate-left",
                                  () => handleRotate(-90),
                                  false,
                                ],
                                [
                                  t("Rotate Right"),
                                  "rotate-right",
                                  () => handleRotate(90),
                                  false,
                                ],
                              ].map((button, index) => (
                                <button
                                  key={index}
                                  onClick={button[2] as () => void}
                                  className="bg-white/60 text-black backdrop-blur rounded px-4 py-2 transition hover:bg-white/70 z-50"
                                  disabled={button[3] as boolean}
                                >
                                  <i className={`fas fa-${button[1]} mr-2`} />
                                  {button[0] as string}
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                        <div className="flex gap-3">
                          {downloadURL && downloadURL.length > 0 && (
                            <a
                              href={downloadURL}
                              download={`${file_state.name}.${file_state.extension}`}
                              className="bg-white/60 text-black backdrop-blur rounded px-4 py-2 transition hover:bg-white/70 z-50"
                            >
                              <i className="fas fa-download mr-2" />
                              Download
                            </a>
                          )}
                          <button
                            onClick={onClose}
                            className="bg-white/60 text-black backdrop-blur rounded px-4 py-2 transition hover:bg-white/70 z-50"
                          >
                            <i className="fas fa-times mr-2" />
                            Close
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-[80vh]">
                        {file_state.isImage ? (
                          <img
                            src={fileUrl}
                            alt="file"
                            className={
                              "object-contain mx-auto " +
                              zoom_values[file_state.zoom]
                            }
                            style={{
                              transform: `rotate(${file_state.rotation}deg)`,
                            }}
                          />
                        ) : (
                          <iframe
                            title="Source Files"
                            src={fileUrl}
                            className="border-2 border-black bg-white w-5/6 md:w-4/6 h-5/6 mx-auto md:my-6"
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-screen justify-center items-center">
                      <div className="text-center">
                        <CircularProgress />
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default FilePreviewDialog;
