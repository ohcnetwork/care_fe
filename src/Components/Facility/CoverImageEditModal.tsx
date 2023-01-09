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
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import Webcam from "react-webcam";
import { FacilityModel } from "./models";
import useWindowDimensions from "../../Common/hooks/useWindowDimensions";
import CareIcon from "../../CAREUI/icons/CareIcon";

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
      window.location.reload();
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
      window.location.reload();
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
                <label className="w-full rounded-lg bg-white py-2 px-4 text-primary-500 font-medium border border-primary-500 hover:text-primary-400 hover:border-primary-400 text-sm flex gap-1 items-center justify-center cursor-pointer transition-all">
                  <CareIcon className="care-l-cloud-upload text-lg" />
                  Upload an image
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
              <ButtonV2
                onClick={() => {
                  setIsCameraOpen(true);
                }}
              >
                {" "}
                Open Camera
              </ButtonV2>
              <Cancel
                onClick={(e) => {
                  e.stopPropagation();
                  closeModal();
                  dragProps.setFileDropError("");
                }}
                disabled={isUploading}
              />
              {facility.read_cover_image_url && (
                <ButtonV2
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isUploading}
                >
                  Delete
                </ButtonV2>
              )}
              <ButtonV2 onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <CareIcon className="care-l-spinner text-lg animate-spin" />
                ) : (
                  <CareIcon className="care-l-save text-lg" />
                )}
                <span>{isUploading ? "Uploading..." : "Save"}</span>
              </ButtonV2>
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
                {!previewImage ? (
                  <ButtonV2 onClick={handleSwitchCamera} className="m-2">
                    Switch
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
                        Capture
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
                        Retake
                      </ButtonV2>
                      <ButtonV2 onClick={handleUpload} className="m-2">
                        {isCaptureImgBeingUploaded ? (
                          <CareIcon className="care-l-spinner text-lg animate-spin" />
                        ) : (
                          <></>
                        )}{" "}
                        Submit
                      </ButtonV2>
                    </div>
                  </>
                )}
              </div>
              <div className="sm:flex-1">
                <ButtonV2
                  variant="secondary"
                  onClick={() => {
                    setPreviewImage(null);
                    setIsCameraOpen(false);
                    webRef.current.stopCamera();
                  }}
                  className="m-2"
                >
                  Close
                </ButtonV2>
              </div>
            </div>
            {/* buttons for laptop screens */}
            <div className={`${isLaptopScreen ? " " : " hidden "}`}>
              <div className="flex m-4 lg:hidden">
                <ButtonV2 onClick={handleSwitchCamera}>
                  <CareIcon className="care-l-camera-change text-lg" /> Switch
                  Camera
                </ButtonV2>
              </div>

              <div className="flex justify-end  p-4 gap-2">
                <div>
                  {!previewImage ? (
                    <>
                      <div>
                        <ButtonV2
                          onClick={() => {
                            captureImage();
                          }}
                        >
                          <CareIcon className="care-l-capture text-lg" />{" "}
                          Capture
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
                          Retake
                        </ButtonV2>
                        <Submit onClick={handleUpload}>
                          {isCaptureImgBeingUploaded ? (
                            <>
                              {" "}
                              <CareIcon className="care-l-spinner text-lg animate-spin" />{" "}
                              Submitting..{" "}
                            </>
                          ) : (
                            <>Submit</>
                          )}{" "}
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
