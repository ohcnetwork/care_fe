import { Modal } from "@material-ui/core";
import axios from "axios";
import {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { deleteFacilityCoverImage } from "../../Redux/actions";
import { Success } from "../../Utils/Notifications";
import useDragAndDrop from "../../Utils/useDragAndDrop";
import { sleep } from "../../Utils/utils";
import ButtonV2 from "../Common/components/ButtonV2";
import Webcam from "react-webcam";
import { FacilityModel } from "./models";
import useWindowDimensions from "../../Common/hooks/useWindowDimensions";

interface Props {
  open: boolean;
  onClose: (() => void) | undefined;
  onSave?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  facility: FacilityModel;
}

const CoverImageEditModal = ({
  open,
  onClose,
  onSave,
  onDelete,
  facility,
}: Props) => {
  const dispatch = useDispatch<any>();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>();
  const [preview, setPreview] = useState<string>();
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const webRef = useRef<any>(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isCaptureImgBeingUploaded, setIsCaptureImgBeingUploaded] =
    useState(false);
  const FACING_MODE_USER = "user";
  const FACING_MODE_ENVIRONMENT = { exact: "environment" };
  const [facingMode, setFacingMode] = useState<any>(FACING_MODE_USER);
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };
  const { width } = useWindowDimensions();
  const LaptopScreenBreakpoint = 640;
  const isLaptopScreen = width >= LaptopScreenBreakpoint ? true : false;

  const handleSwitchCamera = useCallback(() => {
    setFacingMode((prevState: any) =>
      prevState === FACING_MODE_USER
        ? FACING_MODE_ENVIRONMENT
        : FACING_MODE_USER
    );
  }, []);

  const captureImage = () => {
    setPreviewImage(webRef.current.getScreenshot());
    fetch(webRef.current.getScreenshot())
      .then((res) => res.blob())
      .then((blob) => {
        const myFile = new File([blob], "image.png", {
          type: blob.type,
        });
        setSelectedFile(myFile);
      });
  };
  const closeModal = () => {
    setPreview(undefined);
    setSelectedFile(undefined);
    onClose && onClose();
  };

  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile]);

  const onSelectFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(undefined);
      return;
    }
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    setIsCaptureImgBeingUploaded(true);
    if (!selectedFile) {
      setIsCaptureImgBeingUploaded(false);
      closeModal();
      return;
    }

    const formData = new FormData();
    formData.append("cover_image", selectedFile);

    setIsUploading(true);
    const response = await axios.post(
      `/api/v1/facility/${facility.id}/cover_image/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer " + localStorage.getItem("care_access_token"),
        },
      }
    );

    if (response.status === 200) {
      setIsCaptureImgBeingUploaded(false);
      Success({ msg: "Cover image updated." });
    }
    await sleep(1000);
    setIsUploading(false);
    setIsCaptureImgBeingUploaded(false);
    onSave && onSave();
    closeModal();
  };

  const handleDelete = async () => {
    const res = await dispatch(deleteFacilityCoverImage(facility.id as any));
    if (res.statusCode === 204) {
      Success({ msg: "Cover image deleted" });
    }

    onDelete && onDelete();
    closeModal();
  };

  const hasImage = !!(preview || facility.read_cover_image_url);
  const imgSrc =
    preview || `${facility.read_cover_image_url}?requested_on=${Date.now()}`;

  const dragProps = useDragAndDrop();
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragProps.setDragOver(false);
    const dropedFile = e?.dataTransfer?.files[0];
    if (dropedFile.type.split("/")[0] !== "image")
      return dragProps.setFileDropError("Please drop an image file to upload!");
    setSelectedFile(dropedFile);
  };

  return (
    <Modal open={open} onClose={closeModal}>
      <div className="h-full w-full absolute flex items-center justify-center bg-modal overflow-y-auto">
        {!isCameraOpen ? (
          <form className="m-4 bg-white rounded-xl w-11/12 max-w-3xl min-h-[24rem] max-h-screen overflow-auto flex flex-col shadow">
            <div className="px-6 py-6 flex flex-col bg-gray-300">
              <span className="text-xl font-medium">Edit Cover Photo</span>
              <span className="mt-1 text-gray-700">{facility.name}</span>
            </div>
            {hasImage ? (
              <div className="flex-1 flex m-8 rounded-lg items-center justify-center">
                <img
                  src={imgSrc}
                  alt={facility.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                onDragOver={dragProps.onDragOver}
                onDragLeave={dragProps.onDragLeave}
                onDrop={onDrop}
                className={`px-3 py-6 flex-1 flex flex-col m-8 rounded-lg items-center justify-center border-[3px] border-dashed ${
                  dragProps.dragOver && "border-primary-500"
                } ${
                  dragProps.fileDropError !== ""
                    ? "border-red-500"
                    : "border-gray-500"
                }`}
              >
                <svg
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                  className={`w-12 h-12 stroke-[2px] ${
                    dragProps.dragOver && "text-primary-500"
                  } ${
                    dragProps.fileDropError !== ""
                      ? "text-red-500"
                      : "text-gray-600"
                  }`}
                >
                  <path d="M28 8H12a4 4 0 0 0-4 4v20m32-12v8m0 0v8a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-4m32-4-3.172-3.172a4 4 0 0 0-5.656 0L28 28M8 32l9.172-9.172a4 4 0 0 1 5.656 0L28 28m0 0 4 4m4-24h8m-4-4v8m-12 4h.02" />
                </svg>
                <p
                  className={`text-sm ${
                    dragProps.dragOver && "text-primary-500"
                  } ${
                    dragProps.fileDropError !== ""
                      ? "text-red-500"
                      : "text-gray-700"
                  } text-center`}
                >
                  {dragProps.fileDropError !== ""
                    ? dragProps.fileDropError
                    : "Drag & drop image to upload"}
                </p>
                <p className="mt-4 text-gray-700 font-medium text-center">
                  No cover photo uploaded for this facility. <br />
                  Recommended aspect ratio for facility cover photo is 1:1.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row p-4 gap-2">
              <div>
                <label className="rounded-lg bg-white py-2 px-4 text-primary-500 font-medium border border-primary-500 hover:text-primary-400 hover:border-primary-400 text-sm flex gap-1 items-center justify-center cursor-pointer transition-all">
                  <i className="fas fa-cloud-upload-alt mr-2"></i>Upload an
                  image
                  <input
                    title="changeFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onSelectFile}
                  />
                </label>
              </div>
              <div className="sm:flex-1" />
              <button
                type="button"
                className="rounded-lg bg-primary-500 py-2 px-4 text-white font-medium hover:bg-primary-400 text-sm flex gap-3 items-center justify-center transition-all"
                onClick={() => {
                  setIsCameraOpen(true);
                }}
              >
                {" "}
                Open Camera
              </button>
              <button
                type="button"
                className="rounded-lg bg-gray-100 hover:bg-gray-300 py-2 px-4 text-slate-600 hover:text-slate-800 font-medium text-sm flex gap-1 items-center justify-center  transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  closeModal();
                  dragProps.setFileDropError("");
                }}
                disabled={isUploading}
              >
                Cancel
              </button>
              {facility.read_cover_image_url && (
                <button
                  type="button"
                  className="rounded-lg bg-danger-500 py-2 px-4 text-white font-medium text-sm flex gap-1 items-center justify-center transition-all"
                  onClick={handleDelete}
                  disabled={isUploading}
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                className="rounded-lg bg-primary-500 py-2 px-4 text-white font-medium hover:bg-primary-400 text-sm flex gap-3 items-center justify-center transition-all"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <i className="fa-solid fa-spinner animate-spin" />
                ) : (
                  <i className="fa-solid fa-floppy-disk" />
                )}
                <span>{isUploading ? "Uploading..." : "Save"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="m-4 bg-white rounded-xl w-11/12 max-w-3xl min-h-[24rem] max-h-screen overflow-auto flex flex-col shadow">
            <div className="px-6 py-6 flex flex-col bg-gray-300">
              <span className="text-xl font-medium">Capture Cover Photo</span>
              <span className="mt-1 text-gray-700">{facility.name}</span>
            </div>
            <div className="flex-1 flex m-8 rounded-lg items-center justify-center">
              {!previewImage ? (
                <>
                  <Webcam
                    audio={false}
                    height={720}
                    screenshotFormat="image/jpeg"
                    width={1280}
                    ref={webRef}
                    videoConstraints={{ ...videoConstraints, facingMode }}
                  />
                </>
              ) : (
                <>
                  <img src={previewImage} />
                </>
              )}
            </div>
            {/* buttons for mobile screens */}
            <div className="flex justify-evenly m-4 sm:hidden ">
              <div>
                <ButtonV2 variant="primary" onClick={handleSwitchCamera}>
                  <i className="fa-solid fa-camera-rotate" />
                </ButtonV2>
              </div>
              <div>
                {!previewImage ? (
                  <>
                    <div>
                      <ButtonV2
                        variant="primary"
                        onClick={() => {
                          captureImage();
                        }}
                      >
                        <i className="fa-solid fa-camera" />
                      </ButtonV2>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex space-x-2">
                      <ButtonV2
                        variant="primary"
                        onClick={() => {
                          setPreviewImage(null);
                        }}
                      >
                        <i className="fa-solid fa-rotate-right"></i>
                      </ButtonV2>
                      <ButtonV2 variant="primary" onClick={handleUpload}>
                        {isCaptureImgBeingUploaded ? (
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              stroke-width="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          <></>
                        )}{" "}
                        <i className="fa-solid fa-check-double"></i>
                      </ButtonV2>
                    </div>
                  </>
                )}
              </div>
              <div className="sm:flex-1">
                <ButtonV2
                  variant="danger"
                  onClick={() => {
                    setPreviewImage(null);
                    setIsCameraOpen(false);
                    webRef.current.stopCamera();
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </ButtonV2>
              </div>
            </div>
            {/* buttons for laptop screens */}
            <div className={`${isLaptopScreen ? " " : " hidden "}`}>
              <div className="flex m-4">
                <ButtonV2 variant="primary" onClick={handleSwitchCamera}>
                  <i className="fa-solid fa-camera-rotate" /> Switch Camera
                </ButtonV2>
              </div>

              <div className="flex  p-4 gap-2">
                <div>
                  {!previewImage ? (
                    <>
                      <div>
                        <ButtonV2
                          variant="primary"
                          onClick={() => {
                            captureImage();
                          }}
                        >
                          <i className="fa-solid fa-camera" /> Capture
                        </ButtonV2>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex space-x-2">
                        <ButtonV2
                          variant="primary"
                          onClick={() => {
                            setPreviewImage(null);
                          }}
                        >
                          Retake
                        </ButtonV2>
                        <ButtonV2 variant="primary" onClick={handleUpload}>
                          {isCaptureImgBeingUploaded ? (
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          ) : (
                            <></>
                          )}{" "}
                          Submit
                        </ButtonV2>
                      </div>
                    </>
                  )}
                </div>
                <div className="sm:flex-1" />
                <ButtonV2
                  variant="danger"
                  onClick={() => {
                    setPreviewImage(null);
                    setIsCameraOpen(false);
                    webRef.current.stopCamera();
                  }}
                >
                  Close Camera
                </ButtonV2>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CoverImageEditModal;
