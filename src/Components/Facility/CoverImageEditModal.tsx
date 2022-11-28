import { Modal } from "@material-ui/core";
import axios from "axios";
import { ChangeEventHandler, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { deleteFacilityCoverImage } from "../../Redux/actions";
import { Success } from "../../Utils/Notifications";
import useDragAndDrop from "../../Utils/useDragAndDrop";
import { sleep } from "../../Utils/utils";
import { FacilityModel } from "./models";

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
    if (!selectedFile) {
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
      Success({ msg: "Cover image updated." });
    }
    await sleep(1000);
    setIsUploading(false);

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
      <div className="h-screen w-full absolute flex items-center justify-center bg-modal">
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
                <i className="fas fa-cloud-upload-alt mr-2"></i>Upload an image
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
      </div>
    </Modal>
  );
};

export default CoverImageEditModal;
