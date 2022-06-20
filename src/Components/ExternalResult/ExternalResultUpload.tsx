import loadable from "@loadable/component";
import { navigate } from "raviger";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { externalResultUploadCsv } from "../../Redux/actions";
import CSVReader from "react-csv-reader";
import * as Notification from "../../Utils/Notifications.js";
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function ExternalResultUpload() {
  const dispatch: any = useDispatch();
  // for disabling save button once clicked
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState(new Array<any>());
  const [errors, setErrors] = useState<any>({});
  const handleForce = (data: any) => {
    setCsvData(data);
  };

  const papaparseOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header: string) =>
      header.toLowerCase().replace(/\W/g, "_"),
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setLoading(true);
    const valid = true;
    if (csvData.length !== 0) {
      const data = {
        sample_tests: csvData,
      };

      if (valid) {
        setErrors({});
        dispatch(externalResultUploadCsv(data)).then((resp: any) => {
          if (resp && resp.status === 202) {
            setLoading(false);
            navigate("/external_results");
          } else {
            setErrors(resp.data);
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    } else {
      Notification.Error({
        msg: "Please Upload A CSV file !!!",
      });
      setLoading(false);
    }
  };

  return (
    <div className="px-6">
      <PageTitle
        title="Upload External Results"
        backUrl="/external_results"
        className="mt-4"
      />
      <div className="max-w-3xl mx-auto mt-6">
        <div className="p-4 ">
          <div className="block text-sm leading-5 font-medium text-gray-700 sm:mt-px sm:pt-2">
            <div className="mt-2 sm:mt-0 sm:col-span-2">
              <div className="mx-auto max-w-lg flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="text-center">
                  <span className="flex justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-gray-700 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </span>
                  <CSVReader
                    cssClass="react-csv-input"
                    label="Select a CSV file in the specified format"
                    onFileLoaded={handleForce}
                    parserOptions={papaparseOptions}
                  />
                  <a
                    className="mt-2 text-xs font-light"
                    href="https://docs.google.com/spreadsheets/d/17VfgryA6OYSYgtQZeXU9mp7kNvLySeEawvnLBO_1nuE/edit?usp=sharing"
                    target="blank"
                  >
                    Sample Format
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className=" bg-white rounded shadow">
            {csvData.map((data: any, index: number) => {
              return (
                <div key={index} className="p-2 border-b flex">
                  <div className="p-2 mr-2">{index + 1}</div>
                  <div className="p-2 mr-2 md:w-1/3">{data.name}</div>

                  <div className="p-2 mr-2">
                    {errors && errors[index + 1] && (
                      <div>
                        {Object.keys(errors[index + 1]).map(
                          (data: any, index: number) => {
                            return (
                              <div key={index}>
                                {data} -{" "}
                                {errors[index + 1] && errors[index + 1][data]}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className=""></div>
          <div className="mt-2 text-center">
            <button
              disabled={loading}
              className="btn btn-primary"
              onClick={handleSubmit}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
