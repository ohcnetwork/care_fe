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
import * as Notification from "../../Utils/Notifications.js";
import { useTranslation } from "react-i18next";
import { LocalStorageKeys } from "../../Common/constants";
import DialogModal from "../Common/Dialog";
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
  const { t } = useTranslation();
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
    try {
      const response = await axios.post(
        `/api/v1/facility/${facility.id}/cover_image/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization:
              "Bearer " + localStorage.getItem(LocalStorageKeys.accessToken),
          },
        }
      );
      if (response.status === 200) {
        Success({ msg: "Cover image updated." });
        window.location.reload();
      } else {
        Notification.Error({
          msg: "Something went wrong!",
        });
        setIsUploading(false);
      }
    } catch (e) {
      Notification.Error({
        msg: "Network Failure. Please check your internet connectivity.",
      });
      setIsUploading(false);
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
  const commonHint = (
    <>
      {t("max_size_for_image_uploaded_should_be")} 1mb.
      <br />
      {t("allowed_formats_are")} jpg,png,jpeg.
      {t("recommended_aspect_ratio_for")} facility cover photo is 1:1
    </>
  );

  return (
    <DialogModal
      show={open}
      onClose={closeModal}
      title={t("edit_cover_photo")}
      description={facility.name}
      className="md:max-w-4xl"
    >
      <div className="flex h-full w-full items-center justify-center overflow-y-auto">
        {!isCameraOpen ? (
          <form className="flex max-h-screen min-h-[24rem] w-full flex-col overflow-auto">
            {hasImage ? (
              <>
                <div className="flex flex-1 items-center justify-center rounded-lg">
                  <img
                    src={imgSrc}
                    alt={facility.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-center font-medium text-gray-700">
                  {commonHint}
                </p>
              </>
            ) : (
              <div
                onDragOver={dragProps.onDragOver}
                onDragLeave={dragProps.onDragLeave}
                onDrop={onDrop}
                className={`mt-8 flex flex-1 flex-col items-center justify-center rounded-lg border-[3px] border-dashed px-3 py-6 ${
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
                  className={`h-12 w-12 stroke-[2px] ${
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
                    : `${t("drag_drop_image_to_upload")}`}
                </p>
                <p className="mt-4 text-center font-medium text-gray-700">
                  {t("no_cover_photo_uploaded_for_this_facility")}. {commonHint}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4 sm:flex-row">
              <div>
                <label className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-primary-500 bg-white px-4 py-2 text-sm font-medium text-primary-500 transition-all hover:border-primary-400 hover:text-primary-400">
                  <CareIcon className="care-l-cloud-upload text-lg" />
                  {t("upload_an_image")}
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
                {`${t("open")} ${t("camera")}`}
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
                  {t("delete")}
                </ButtonV2>
              )}
              <ButtonV2 onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <CareIcon className="care-l-spinner animate-spin text-lg" />
                ) : (
                  <CareIcon className="care-l-save text-lg" />
                )}
                <span>
                  {isUploading ? `${t("uploading")}...` : `${t("save")}`}
                </span>
              </ButtonV2>
            </div>
          </form>
        ) : (
          <div className="flex max-h-screen min-h-[24rem] flex-col overflow-auto">
            <div className="flex flex-col bg-gray-300">
              <span className="text-xl font-medium">
                {t("capture_cover_photo")}
              </span>
              <span className="mt-1 text-gray-700">{facility.name}</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
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
            <div className="m-4 flex justify-evenly sm:hidden ">
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
                        disabled={isUploading}
                      >
                        {t("retake")}
                      </ButtonV2>
                      <ButtonV2 onClick={handleUpload} className="m-2">
                        {isCaptureImgBeingUploaded && (
                          <CareIcon className="care-l-spinner animate-spin text-lg" />
                        )}
                        {t("submit")}
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
                  {t("close")}
                </ButtonV2>
              </div>
            </div>
            {/* buttons for laptop screens */}
            <div className={`${isLaptopScreen ? " " : " hidden "}`}>
              <div className="m-4 flex lg:hidden">
                <ButtonV2 onClick={handleSwitchCamera}>
                  <CareIcon className="care-l-camera-change text-lg" />
                  {`${t("switch")} ${t("camera")}`}
                </ButtonV2>
              </div>

              <div className="flex justify-end  gap-2 p-4">
                <div>
                  {!previewImage ? (
                    <>
                      <div>
                        <ButtonV2
                          onClick={() => {
                            captureImage();
                          }}
                        >
                          <CareIcon className="care-l-capture text-lg" />
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
                        <Submit disabled={isUploading} onClick={handleUpload}>
                          {isCaptureImgBeingUploaded ? (
                            <>
                              <CareIcon className="care-l-spinner animate-spin text-lg" />
                              {`${t("submitting")}...`}
                            </>
                          ) : (
                            <> {t("submit")}</>
                          )}
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
                  {`${t("close")} ${t("camera")}`}
                </ButtonV2>
              </div>
            </div>
          </div>
        )}
      </div>
    </DialogModal>
  );
};

export default CoverImageEditModal;
