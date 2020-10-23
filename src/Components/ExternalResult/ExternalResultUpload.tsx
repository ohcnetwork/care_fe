import loadable from "@loadable/component";
import { navigate } from "raviger";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { externalResultUploadCsv } from "../../Redux/actions";
import CSVReader from "react-csv-reader";
const get = require('lodash.get');
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function ExternalResultUpload() {
  const dispatch: any = useDispatch();
  const [uploadFile, setUploadFile] = useState("");
  const [csvData, setCsvData] = useState(new Array<any>());
  const [errors, setErrors] = useState(new Array<any>());
  // useState<any>({});
  const handleForce = (data: any, fileInfo: any) => {
    setCsvData(data)
    console.log(data, fileInfo)
  };

  const papaparseOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.toLowerCase().replace(/\W/g, "_")
  };





  const handleSubmit = (e: any) => {
    e.preventDefault();
    const valid = true
    const data = {
      sample_tests: csvData,
    }

    if (valid) {
      dispatch(externalResultUploadCsv(data)).then((resp: any) => {

        const res = resp && resp.data;
        if (res && res.status === 'OK') {
          console.log(res.data)
        } else {
          setErrors(Object.values(resp.data))
        }
      });

    }
  };


  return (
    <div className="px-6">
      <PageTitle title="Upload External Results" hideBack className="mt-4" />
      <div className="max-w-3xl mx-auto mt-6">
        <div className="p-4 ">
          <div
            className="block text-sm leading-5 font-medium text-gray-700 sm:mt-px sm:pt-2"
          >
            <div className="mt-2 sm:mt-0 sm:col-span-2">
              <div className="mx-auto max-w-lg flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="text-center">
                  <CSVReader
                    cssClass="react-csv-input"
                    label="Select CSV with secret Death Star statistics"
                    onFileLoaded={handleForce}
                    parserOptions={papaparseOptions}
                  />

                </div>
              </div>
            </div>
          </div>



          <div className=" bg-white rounded shadow">
            {
              csvData.map((data: any, index: number) => {

                return (
                  <div key={index} className="p-2 border-b flex">
                    <div className="p-2 mr-2">
                      {index + 1}
                    </div>
                    <div className="p-2 mr-2 md:w-1/3">
                      {data.name}
                    </div>

                    <div className="p-2 mr-2">
                      {errors && errors[index + 1] && <div>
                        {
                          Object.keys(errors[index + 1]).map((data: any, index: number) => {
                            return (
                              <div key={index}>
                                {data} - {errors[index + 1][data]}


                              </div>);
                          })
                        }
                      </div>
                      }
                    </div>
                  </div>);
              })
            }
          </div>
          <div className="">

          </div>
          <div className="mt-2">
            <button className="btn btn-primary" onClick={handleSubmit}>
              Save
              </button>
          </div>
        </div>
      </div>
    </div >
  );
}
