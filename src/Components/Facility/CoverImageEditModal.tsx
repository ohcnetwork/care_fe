import { Modal } from "@material-ui/core";
import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { FacilityModel } from "./models";

interface CoverImageUploadModalProps {
  open: boolean;
  onCloseCB: () => void | undefined;
  facility: FacilityModel;
}

export function CoverImageUploadModal(props: CoverImageUploadModalProps) {
  const { open, onCloseCB, facility } = props;
  const dispatch = useDispatch();
  const [file, setFile] = useState<File | null>();

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post(
      `/api/v1/facility/${facility.id}/cover_image/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    dispatch({ type: "UPDATE_FACILITY", payload: response.data });
    onCloseCB();
  };

  return (
    <Modal
      open={open}
      onClose={onCloseCB}
      aria-labelledby="Notify This Facility"
      aria-describedby="Type a message and notify this facility"
    >
      <div className="h-screen w-full absolute flex items-center justify-center bg-modal">
        <form className="m-4 bg-white rounded-xl w-11/12 max-w-3xl h-96 max-h-full flex flex-col shadow overflow-clip">
          <div className="px-6 py-6 flex flex-col bg-gray-300">
            <span className="text-xl font-medium">Edit Cover Photo</span>
            <span className="mt-1 text-gray-700">{facility.name}</span>
          </div>
          <div className="flex-1 flex m-8 rounded-lg items-center justify-center">
            {facility.read_cover_image_url ? (
              <img
                src={facility.read_cover_image_url}
                alt="Facility"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="mt-10 w-max text-xl text-gray-700 font-medium">
                No cover photo uploaded for this facility
              </span>
            )}
          </div>
          <div className="flex p-4 gap-2">
            <div>
              <label className="rounded-lg bg-white py-2 px-4 text-primary-500 font-medium border border-primary-500 hover:text-primary-400 hover:border-primary-400 text-sm flex gap-1 items-center cursor-pointer transition-all">
                <i className="fas fa-cloud-upload-alt mr-2"></i>Upload an image
                <input
                  title="changeFile"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div className="flex-1" />
            <button
              type="button"
              className="rounded-lg bg-gray-100 hover:bg-gray-300 py-2 px-4 text-slate-600 hover:text-slate-800 font-medium text-sm flex gap-1 items-center transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onCloseCB();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary-500 py-2 px-4 text-white font-medium hover:bg-primary-400 text-sm flex gap-3 items-center transition-all"
              onClick={handleUpload}
            >
              <i className="fa-solid fa-floppy-disk"></i>
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
