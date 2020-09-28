import loadable from "@loadable/component";
import { navigate } from "raviger";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { externalResultUploadCsv } from "../../Redux/actions";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function ExternalResultUpload() {
  const dispatch: any = useDispatch();
  const [uploadFile, setUploadFile] = useState("");
  const [errors, setErrors] = useState<any>({
    name: "",
  });

  const validateForm = () => {
    let formIsValid = true;
    let err = Object.assign({}, errors);
    if (!uploadFile) {
      formIsValid = false;
      err.uploadFile = "Please choose a file to upload";
    }
    setErrors(err);
    return formIsValid;
  };

  const handleFileUpload = (e: any) => {
    const regex = new RegExp("(.*?).(csv)$");
    if (regex.test(e.target.files[0].name)) {
      const err = Object.assign({}, errors);
      if (err.uploadFile) {
        err.uploadFile = null;
      }
      setErrors(err);
      setUploadFile(e.target.files[0]);
    } else {
      console.log("Incompatible File Type :  Please Upload a CSV File");
    }
  };

  const handleSubmit = () => {
    const valid = validateForm();
    if (!valid) {
      return;
    }

    let form = document.getElementById("uploadForm") as HTMLFormElement
    let formData = form ? new FormData(form) : new FormData();

    dispatch(externalResultUploadCsv(formData)).then((resp: any) => {
      const res = resp && resp.data;
      if (res && res.success) {
        console.log(res.message);
      } else {
        console.log(res.message);
      }
    });
  };

  return (
    <div className="px-6">
      <PageTitle title="Upload External Results" hideBack className="mt-4" />
      <form id="uploadForm">
        <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
          <div className="bg-white p-4 shadow rounded-lg">
            <label
              htmlFor="file"
              className="block text-sm leading-5 font-medium text-gray-700 sm:mt-px sm:pt-2"
            >
              <div className="mt-2 sm:mt-0 sm:col-span-2">
                <div className="max-w-lg flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="text-center">
                    <p className="mt-1 text-sm text-gray-600">
                      <button
                        type="button"
                        className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition duration-150 ease-in-out"
                      >
                        Upload a CSV File
                    </button>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">CSV up to 5MB</p>
                  </div>
                </div>
              </div>
              <input
                type="file"
                color="primary"
                className="hidden custom-file-input "
                id="file"
                name="file"
                onChange={handleFileUpload}
              />
            </label>
            <div className="mt-2">
              <button className="btn btn-primary" onClick={handleSubmit}>
                Save
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
