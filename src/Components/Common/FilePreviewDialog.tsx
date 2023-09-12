import { Dialog, Transition } from "@headlessui/react";
import { classNames } from "../../Utils/utils";
import CircularProgress from "./components/CircularProgress";
import { useTranslation } from "react-i18next";
import { StateInterface } from "../Patient/FileUpload";
import { Dispatch, Fragment, ReactNode, SetStateAction } from "react";
import ButtonV2 from "./components/ButtonV2";

export const zoom_values = [
  "h-1/6 w-1/6 my-40",
  "h-2/6 w-2/6 my-32",
  "h-3/6 w-3/6 my-24",
  "h-4/6 w-4/6 my-20",
  "h-5/6 w-5/6 my-16",
  "h-full w-full my-12",
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
    setFileState((prev: any) => ({
      ...prev,
      rotation: prev.rotation + rotation,
    }));
  };

  return (
    <div className="no-scrollbar overflow-x-scroll ">
      <Transition appear show={show} as={Fragment}>
        <Dialog as="div" className="relative z-10 " onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="translate-y-[100%] duration-400"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="translate-y-[100%] duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className=" fixed inset-0 mt-6 rounded-t-3xl border-t-2 border-gray-400/50 bg-white shadow-[0_3px_10px_rgb(0,0,0,0.2)] transition-all" />
          </Transition.Child>
          <div className="fixed inset-0 mt-10 overflow-y-auto  ">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="translate-y-[100%] duration-400"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="translate-y-[100%] duration-300"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className={classNames(
                    className,
                    fixedWidth && "w-full max-w-md",
                    "transform rounded-2xl p-6 text-left align-middle transition-all"
                  )}
                >
                  <Dialog.Title
                    as="h4"
                    className="flex justify-between text-lg font-medium leading-6 text-gray-900"
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
                      <div className="absolute flex h-full flex-col justify-between p-2 sm:inset-x-4 sm:top-4 sm:h-auto sm:flex-row sm:p-0">
                        <div className="flex justify-end gap-3">
                          {downloadURL && downloadURL.length > 0 && (
                            <a
                              href={downloadURL}
                              download={`${file_state.name}.${file_state.extension}`}
                              className="z-50 rounded bg-white/60 px-4 py-2 text-black backdrop-blur transition hover:bg-white/70"
                            >
                              <i className="fas fa-download mr-2" />
                              Download
                            </a>
                          )}
                          <button
                            onClick={onClose}
                            className="h-8 w-8 rounded-full bg-red-100 transition hover:bg-red-200"
                          >
                            <i className="fas fa-times z-50 rounded-full text-red-500" />
                          </button>
                        </div>
                      </div>
                      <div className="h-[80vh] w-full">
                        {file_state.isImage ? (
                          <img
                            src={fileUrl}
                            alt="file"
                            className={
                              "mx-auto object-contain " +
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
                            className="mx-auto h-5/6 w-5/6 border-2 border-black bg-white md:my-6 md:w-4/6"
                          />
                        )}
                        <div className="relative bottom-5 flex items-center justify-center gap-3">
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
                                <ButtonV2
                                  key={index}
                                  onClick={button[2] as () => void}
                                  disabled={button[3] as boolean}
                                  variant="primary"
                                >
                                  <i className={`fas fa-${button[1]} mr-2`} />
                                  {button[0] as string}
                                </ButtonV2>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-screen items-center justify-center">
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
